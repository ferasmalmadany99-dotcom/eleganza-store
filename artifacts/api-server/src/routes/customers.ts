import { count, desc, max, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { ListCustomersResponse } from "@workspace/api-zod";
import { requireAuth, requireSales } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/customers", requireSales, async (_req, res): Promise<void> => {
  const customerKey = sql<string>`COALESCE(NULLIF(regexp_replace(COALESCE(${ordersTable.customerPhone}, ''), '[^0-9]', '', 'g'), ''), LOWER(BTRIM(${ordersTable.customerName})) || '|' || LOWER(BTRIM(COALESCE(${ordersTable.customerAddress}, ''))))`;
  const latestOrder = max(ordersTable.createdAt);
  const rows = await db.select({
    id: customerKey,
    customerName: sql<string>`(ARRAY_AGG(${ordersTable.customerName} ORDER BY ${ordersTable.createdAt} DESC))[1]`,
    customerPhone: sql<string | null>`(ARRAY_AGG(${ordersTable.customerPhone} ORDER BY ${ordersTable.createdAt} DESC))[1]`,
    customerAddress: sql<string | null>`(ARRAY_AGG(${ordersTable.customerAddress} ORDER BY ${ordersTable.createdAt} DESC))[1]`,
    orderCount: count(ordersTable.id),
    totalSpentMinor: sql<number>`COALESCE(SUM(${ordersTable.totalMinor}), 0)`,
    lastOrderAt: latestOrder,
  }).from(ordersTable).groupBy(customerKey).orderBy(desc(latestOrder));

  res.json(ListCustomersResponse.parse(rows.map((customer) => ({
    ...customer,
    totalSpentMinor: Number(customer.totalSpentMinor),
    lastOrderAt: customer.lastOrderAt?.toISOString() ?? new Date(0).toISOString(),
  }))));
});

export default router;
