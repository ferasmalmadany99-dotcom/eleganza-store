import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, inventoryMovementsTable, productsTable, journalEntriesTable, journalLinesTable } from "@workspace/db";
import {
  CreateInventoryMovementBody,
  CreateInventoryMovementResponse,
  ListInventoryMovementsQueryParams,
  ListInventoryMovementsResponse,
} from "@workspace/api-zod";
import { requireAuth, requireInventory, requireManager } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/inventory/movements", async (req, res): Promise<void> => {
  const query = ListInventoryMovementsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const movements = await db.select({
    movement: inventoryMovementsTable,
    productNameEn: productsTable.nameEn,
    productNameAr: productsTable.nameAr,
  }).from(inventoryMovementsTable)
    .leftJoin(productsTable, eq(inventoryMovementsTable.productId, productsTable.id))
    .where(query.data.productId ? eq(inventoryMovementsTable.productId, query.data.productId) : undefined)
    .orderBy(desc(inventoryMovementsTable.createdAt)).limit(query.data.limit).offset(query.data.offset);
  res.json(ListInventoryMovementsResponse.parse(movements.map(({ movement, productNameEn, productNameAr }) => ({ ...movement, productNameEn, productNameAr }))));
});

router.post("/inventory/movements", requireInventory, async (req, res): Promise<void> => {
  const parsed = CreateInventoryMovementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (parsed.data.type === "adjustment" && parsed.data.quantity === 0) {
    res.status(400).json({ error: "Reconciliation target must change the stock balance" }); return;
  }
  if (parsed.data.type === "adjustment" && req.staff?.role !== "owner") {
    res.status(403).json({ error: "Only owners may perform adjustments" }); return;
  }
  const movement = await db.transaction(async (tx) => {
    const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, parsed.data.productId)).for("update");
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    const delta = parsed.data.type === "purchase" || parsed.data.type === "return"
      ? Math.abs(parsed.data.quantity)
      : parsed.data.type === "adjustment" ? parsed.data.quantity : -Math.abs(parsed.data.quantity);
    const after = product.quantityOnHand + delta;
    if (after < 0 && parsed.data.type !== "adjustment") throw new Error("NEGATIVE_STOCK");
    const [updated] = await tx.update(productsTable).set({ quantityOnHand: after })
      .where(eq(productsTable.id, product.id)).returning();
    const [created] = await tx.insert(inventoryMovementsTable).values({
      productId: product.id, type: parsed.data.type, quantity: delta,
      quantityBefore: product.quantityOnHand, quantityAfter: after,
      note: parsed.data.note, orderId: parsed.data.orderId, createdByStaffId: req.staff?.id,
    }).returning();
    return { created, updated };
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return null;
    if (error instanceof Error && error.message === "NEGATIVE_STOCK") return "negative";
    throw error;
  });
  if (movement === null) { res.status(404).json({ error: "Product not found" }); return; }
  if (movement === "negative") { res.status(409).json({ error: "Insufficient stock" }); return; }
  await writeAudit(req.staff?.id, "create", "inventory_movement", movement.created.id, parsed.data);
  const { postInventoryJournal } = await import("../lib/accounting");
  await postInventoryJournal(movement.created, req.staff?.id);
  res.status(201).json(CreateInventoryMovementResponse.parse(movement.created));
});

router.delete("/inventory/movements/:id", requireManager, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid movement id" }); return; }
  const result = await db.transaction(async (tx) => {
    const [movement] = await tx.select().from(inventoryMovementsTable).where(eq(inventoryMovementsTable.id, id)).for("update");
    if (!movement) return "missing" as const;
    const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, movement.productId)).for("update");
    if (!product) return "missing" as const;
    if (product.quantityOnHand !== movement.quantityAfter) return "not_latest" as const;
    await tx.update(productsTable).set({ quantityOnHand: movement.quantityBefore }).where(eq(productsTable.id, product.id));
    const [journal] = await tx.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
      .where(eq(journalEntriesTable.referenceId, String(id))).limit(1);
    if (journal) {
      await tx.delete(journalLinesTable).where(eq(journalLinesTable.journalEntryId, journal.id));
      await tx.delete(journalEntriesTable).where(eq(journalEntriesTable.id, journal.id));
    }
    await tx.delete(inventoryMovementsTable).where(eq(inventoryMovementsTable.id, id));
    return { movement, product };
  });
  if (result === "missing") { res.status(404).json({ error: "Movement or product not found" }); return; }
  if (result === "not_latest") { res.status(409).json({ error: "Only the latest movement can be deleted; use a reconciliation instead" }); return; }
  await writeAudit(req.staff?.id, "delete", "inventory_movement", id, { productId: result.movement.productId });
  res.status(204).send();
});

export default router;