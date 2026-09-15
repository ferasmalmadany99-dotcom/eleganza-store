import { Router, type IRouter } from "express";
import { and, count, desc, eq, sql } from "drizzle-orm";
import {
  chartAccountsTable, db, inventoryMovementsTable, journalLinesTable, ordersTable, productsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [ledgerTotals] = await db.select({
    revenueMinor: sql<number>`coalesce(sum(case when ${chartAccountsTable.type} = 'revenue'
      then ${journalLinesTable.creditMinor} - ${journalLinesTable.debitMinor} else 0 end), 0)`,
    cogsMinor: sql<number>`coalesce(sum(case when ${chartAccountsTable.code} = '5000'
      then ${journalLinesTable.debitMinor} - ${journalLinesTable.creditMinor} else 0 end), 0)`,
    expensesMinor: sql<number>`coalesce(sum(case when ${chartAccountsTable.type} = 'expense'
      and ${chartAccountsTable.code} <> '5000'
      then ${journalLinesTable.debitMinor} - ${journalLinesTable.creditMinor} else 0 end), 0)`,
  }).from(journalLinesTable).innerJoin(chartAccountsTable, eq(journalLinesTable.accountId, chartAccountsTable.id));
  const [lowStock] = await db.select({ value: count(productsTable.id) }).from(productsTable)
    .where(and(eq(productsTable.active, true), sql`${productsTable.quantityOnHand} <= ${productsTable.reorderThreshold}`));
  const counts = await db.select({ status: ordersTable.status, value: count(ordersTable.id) })
    .from(ordersTable).groupBy(ordersTable.status);
  const recentMovements = await db.select().from(inventoryMovementsTable)
    .orderBy(desc(inventoryMovementsTable.createdAt)).limit(10);
  const revenueMinor = Number(ledgerTotals?.revenueMinor ?? 0);
  const cogsMinor = Number(ledgerTotals?.cogsMinor ?? 0);
  const expensesMinor = Number(ledgerTotals?.expensesMinor ?? 0);
  res.json(GetDashboardSummaryResponse.parse({
    revenueMinor, cogsMinor, expensesMinor,
    profitMinor: revenueMinor - cogsMinor - expensesMinor,
    lowStockCount: Number(lowStock?.value ?? 0),
    orderCounts: Object.fromEntries(counts.map((entry) => [entry.status, Number(entry.value)])),
    recentMovements,
  }));
});

export default router;