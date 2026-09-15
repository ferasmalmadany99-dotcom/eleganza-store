import { Router, type IRouter } from "express";
import { and, count, desc, eq, sql } from "drizzle-orm";
import {
  db, expensesTable, inventoryMovementsTable, orderItemsTable, ordersTable, productsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [revenue] = await db.select({ value: sql<number>`coalesce(sum(${ordersTable.totalMinor}), 0)` })
    .from(ordersTable).where(eq(ordersTable.status, "completed"));
  const [cogs] = await db.select({ value: sql<number>`coalesce(sum(${orderItemsTable.quantity} * ${orderItemsTable.unitCostMinor}), 0)` })
    .from(orderItemsTable).innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(eq(ordersTable.status, "completed"));
  const [expenses] = await db.select({ value: sql<number>`coalesce(sum(${expensesTable.amountMinor}), 0)` }).from(expensesTable);
  const [lowStock] = await db.select({ value: count(productsTable.id) }).from(productsTable)
    .where(and(eq(productsTable.active, true), sql`${productsTable.quantityOnHand} <= ${productsTable.reorderThreshold}`));
  const counts = await db.select({ status: ordersTable.status, value: count(ordersTable.id) })
    .from(ordersTable).groupBy(ordersTable.status);
  const recentMovements = await db.select().from(inventoryMovementsTable)
    .orderBy(desc(inventoryMovementsTable.createdAt)).limit(10);
  const revenueMinor = Number(revenue?.value ?? 0);
  const cogsMinor = Number(cogs?.value ?? 0);
  const expensesMinor = Number(expenses?.value ?? 0);
  res.json(GetDashboardSummaryResponse.parse({
    revenueMinor, cogsMinor, expensesMinor,
    profitMinor: revenueMinor - cogsMinor - expensesMinor,
    lowStockCount: Number(lowStock?.value ?? 0),
    orderCounts: Object.fromEntries(counts.map((entry) => [entry.status, Number(entry.value)])),
    recentMovements,
  }));
});

export default router;