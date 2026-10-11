import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  auditLogTable,
  expensesTable,
  inventoryMovementsTable,
  journalEntriesTable,
  journalLinesTable,
  ordersTable,
  productsTable,
} from "@workspace/db";
import { ResetSystemDataBody, ResetSystemDataResponse } from "@workspace/api-zod";
import { requireAuth, requireOwner } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.post("/system/reset", requireOwner, async (req, res): Promise<void> => {
  const parsed = ResetSystemDataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const selected = new Set(parsed.data.groups);
  if (selected.has("products") && (!selected.has("inventory") || !selected.has("orders"))) {
    res.status(400).json({ error: "Deleting products also requires selecting inventory and orders because they reference products." });
    return;
  }
  const deleted = await db.transaction(async (tx) => {
    const counts = { orders: 0, inventoryMovements: 0, products: 0, expenses: 0, journalEntries: 0 };
    const removeEntries = async (entryIds: number[]) => {
      if (!entryIds.length) return;
      await tx.delete(journalLinesTable).where(inArray(journalLinesTable.journalEntryId, entryIds));
      const removed = await tx.delete(journalEntriesTable).where(inArray(journalEntriesTable.id, entryIds)).returning({ id: journalEntriesTable.id });
      counts.journalEntries += removed.length;
    };

    if (selected.has("orders")) {
      const orderEntries = await tx.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
        .where(inArray(journalEntriesTable.referenceType, ["order", "order_return"]));
      await removeEntries(orderEntries.map(({ id }) => id));
      const linkedMovements = await tx.select({ id: inventoryMovementsTable.id }).from(inventoryMovementsTable)
        .where(isNotNull(inventoryMovementsTable.orderId));
      const movementIds = linkedMovements.map(({ id }) => id);
      if (movementIds.length) {
        const movementEntries = await tx.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
          .where(and(eq(journalEntriesTable.referenceType, "inventory_movement"), inArray(journalEntriesTable.referenceId, movementIds.map(String))));
        await removeEntries(movementEntries.map(({ id }) => id));
      }
      const movements = await tx.delete(inventoryMovementsTable).where(isNotNull(inventoryMovementsTable.orderId)).returning({ id: inventoryMovementsTable.id });
      counts.inventoryMovements += movements.length;
      const orders = await tx.delete(ordersTable).returning({ id: ordersTable.id });
      counts.orders = orders.length;
    }

    if (selected.has("inventory")) {
      const movementEntries = await tx.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
        .where(eq(journalEntriesTable.referenceType, "inventory_movement"));
      await removeEntries(movementEntries.map(({ id }) => id));
      const movements = await tx.delete(inventoryMovementsTable).returning({ id: inventoryMovementsTable.id });
      counts.inventoryMovements += movements.length;
    }

    if (selected.has("products")) {
      const products = await tx.delete(productsTable).returning({ id: productsTable.id });
      counts.products = products.length;
    }

    if (selected.has("expenses")) {
      const expenses = await tx.select({ id: expensesTable.id }).from(expensesTable);
      if (expenses.length) {
        const expenseIds = expenses.map(({ id }) => String(id));
        const linkedEntries = await tx.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
          .where(and(eq(journalEntriesTable.referenceType, "expense"), inArray(journalEntriesTable.referenceId, expenseIds)));
        await removeEntries(linkedEntries.map(({ id }) => id));
        const removed = await tx.delete(expensesTable).returning({ id: expensesTable.id });
        counts.expenses = removed.length;
      }
    }

    if (selected.has("accounting")) {
      const entries = await tx.select({ id: journalEntriesTable.id }).from(journalEntriesTable);
      await removeEntries(entries.map(({ id }) => id));
    }

    await tx.insert(auditLogTable).values({
      actorStaffId: req.staff?.id,
      action: "system_reset",
      entityType: "system",
      metadata: { selectedGroups: parsed.data.groups, deleted: counts },
    });
    return counts;
  });

  res.json(ResetSystemDataResponse.parse({ deleted }));
});

export default router;
