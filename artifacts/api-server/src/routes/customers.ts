import { count, desc, eq, max, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, orderItemsTable, ordersTable } from "@workspace/db";
import { ListCustomersResponse, ListOrdersResponse } from "@workspace/api-zod";
import { requireAuth, requireSales } from "../middlewares/auth";
import { salesInvoiceNumber } from "../lib/invoice";

const router: IRouter = Router();
router.use(requireAuth);

const customerKeyExpression = () => sql<string>`COALESCE(NULLIF(regexp_replace(COALESCE(${ordersTable.customerPhone}, ''), '[^0-9]', '', 'g'), ''), LOWER(BTRIM(${ordersTable.customerName})) || '|' || LOWER(BTRIM(COALESCE(${ordersTable.customerAddress}, ''))))`;

router.get("/customers", requireSales, async (_req, res): Promise<void> => {
  const customerKey = customerKeyExpression();
  const latestOrder = max(ordersTable.createdAt);
  const rows = await db.select({
    id: customerKey,
    customerName: sql<string>`(ARRAY_AGG(${ordersTable.customerName} ORDER BY ${ordersTable.createdAt} DESC))[1]`,
    customerPhone: sql<string | null>`(ARRAY_AGG(${ordersTable.customerPhone} ORDER BY ${ordersTable.createdAt} DESC))[1]`,
    customerAddress: sql<string | null>`(ARRAY_AGG(${ordersTable.customerAddress} ORDER BY ${ordersTable.createdAt} DESC))[1]`,
    orderCount: count(ordersTable.id),
    totalSpentMinor: sql<number>`COALESCE(SUM(${ordersTable.totalMinor}) FILTER (WHERE ${ordersTable.status} NOT IN ('cancelled', 'returned')), 0)`,
    lastOrderAt: latestOrder,
  }).from(ordersTable).groupBy(customerKey).orderBy(desc(latestOrder));

  res.json(ListCustomersResponse.parse(rows.map((customer) => ({
    ...customer,
    totalSpentMinor: Number(customer.totalSpentMinor),
    lastOrderAt: customer.lastOrderAt?.toISOString() ?? new Date(0).toISOString(),
  }))));
});

router.get("/customers/:customerId/orders", requireSales, async (req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable)
    .where(eq(customerKeyExpression(), req.params.customerId))
    .orderBy(desc(ordersTable.createdAt));
  const ordersWithItems = await Promise.all(orders.map(async (order) => ({
    ...order,
    orderNumber: salesInvoiceNumber(order.id),
    items: await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id)),
  })));
  res.json(ListOrdersResponse.parse(ordersWithItems));
});

export default router;
