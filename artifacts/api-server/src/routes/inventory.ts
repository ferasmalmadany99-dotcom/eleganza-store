import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, inventoryMovementsTable, productsTable } from "@workspace/db";
import {
  CreateInventoryMovementBody,
  CreateInventoryMovementResponse,
  ListInventoryMovementsQueryParams,
  ListInventoryMovementsResponse,
} from "@workspace/api-zod";
import { requireAuth, requireInventory } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/inventory/movements", async (req, res): Promise<void> => {
  const query = ListInventoryMovementsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const movements = await db.select().from(inventoryMovementsTable)
    .where(query.data.productId ? eq(inventoryMovementsTable.productId, query.data.productId) : undefined)
    .orderBy(desc(inventoryMovementsTable.createdAt)).limit(query.data.limit).offset(query.data.offset);
  res.json(ListInventoryMovementsResponse.parse(movements));
});

router.post("/inventory/movements", requireInventory, async (req, res): Promise<void> => {
  const parsed = CreateInventoryMovementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
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
  res.status(201).json(CreateInventoryMovementResponse.parse(movement.created));
});

export default router;