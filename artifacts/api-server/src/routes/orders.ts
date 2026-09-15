import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, inventoryMovementsTable, orderItemsTable, ordersTable, productsTable } from "@workspace/db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { requireAuth, requireManager, requireSales } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";
import { postOrderJournal, postOrderReturnJournal } from "../lib/accounting";

const router: IRouter = Router();
router.use(requireAuth);

async function withItems<T extends { id: number }>(orders: T[]) {
  return Promise.all(orders.map(async (order) => ({
    ...order,
    items: await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id)),
  })));
}

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const orders = await db.select().from(ordersTable)
    .where(query.data.status ? eq(ordersTable.status, query.data.status) : undefined)
    .orderBy(desc(ordersTable.createdAt)).limit(query.data.limit).offset(query.data.offset);
  res.json(ListOrdersResponse.parse(await withItems(orders)));
});

router.post("/orders", requireSales, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const initialStatus = parsed.data.status ?? "pending";
  const result = await db.transaction(async (tx) => {
    const resolved = [];
    for (const item of parsed.data.items) {
      const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId)).for("update");
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      resolved.push({
        product,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor ?? product.salePriceMinor,
      });
    }
    const subtotalMinor = resolved.reduce((sum, item) => sum + item.quantity * item.unitPriceMinor, 0);
    const shippingMinor = parsed.data.shippingMinor;
    const [order] = await tx.insert(ordersTable).values({
      orderNumber: `ELZ-${Date.now().toString(36).toUpperCase()}`,
      status: initialStatus,
      paymentMethod: parsed.data.paymentMethod,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      customerAddress: parsed.data.customerAddress,
      subtotalMinor, shippingMinor, totalMinor: subtotalMinor + shippingMinor,
      createdByStaffId: req.staff?.id,
    }).returning();
    const items = [];
    for (const item of resolved) {
      const [createdItem] = await tx.insert(orderItemsTable).values({
        orderId: order.id, productId: item.product.id, quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor, unitCostMinor: item.product.costMinor,
      }).returning();
      items.push(createdItem);
      if (initialStatus === "confirmed" || initialStatus === "completed") {
        const after = item.product.quantityOnHand - item.quantity;
        if (after < 0) throw new Error("NEGATIVE_STOCK");
        await tx.update(productsTable).set({ quantityOnHand: after }).where(eq(productsTable.id, item.product.id));
        await tx.insert(inventoryMovementsTable).values({
          productId: item.product.id, type: "sale", quantity: -item.quantity,
          quantityBefore: item.product.quantityOnHand, quantityAfter: after,
          orderId: order.id, createdByStaffId: req.staff?.id,
        });
      }
    }
    return { order, items };
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return "missing";
    if (error instanceof Error && error.message === "NEGATIVE_STOCK") return "negative";
    throw error;
  });
  if (result === "missing") { res.status(404).json({ error: "Product not found" }); return; }
  if (result === "negative") { res.status(409).json({ error: "Insufficient stock" }); return; }
  await writeAudit(req.staff?.id, "create", "order", result.order.id, { status: initialStatus });
  if (initialStatus === "confirmed" || initialStatus === "processing" || initialStatus === "completed") {
    await postOrderJournal(result.order.id, req.staff?.id);
  }
  res.status(201).json(CreateOrderResponse.parse({ ...result.order, items: result.items }));
});

router.patch("/orders/:id/status", requireManager, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    const error = !params.success ? params.error.message : "Invalid request body";
    res.status(400).json({ error }); return;
  }
  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).for("update");
    if (!order) return "missing" as const;
    if (order.status === parsed.data.status) {
      const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      return { order, items };
    }
    const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    const wasSold = order.status === "confirmed" || order.status === "processing" || order.status === "completed";
    const willBeSold = parsed.data.status === "confirmed" || parsed.data.status === "processing" || parsed.data.status === "completed";
    if (!wasSold && willBeSold) {
      for (const item of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId)).for("update");
        if (!product || product.quantityOnHand < item.quantity) throw new Error("NEGATIVE_STOCK");
        const after = product.quantityOnHand - item.quantity;
        await tx.update(productsTable).set({ quantityOnHand: after }).where(eq(productsTable.id, product.id));
        await tx.insert(inventoryMovementsTable).values({
          productId: product.id, type: "sale", quantity: -item.quantity,
          quantityBefore: product.quantityOnHand, quantityAfter: after,
          orderId: order.id, createdByStaffId: req.staff?.id,
        });
      }
    } else if (wasSold && !willBeSold && (parsed.data.status === "cancelled" || parsed.data.status === "returned")) {
      for (const item of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId)).for("update");
        if (!product) continue;
        const after = product.quantityOnHand + item.quantity;
        await tx.update(productsTable).set({ quantityOnHand: after }).where(eq(productsTable.id, product.id));
        await tx.insert(inventoryMovementsTable).values({
          productId: product.id, type: "return", quantity: item.quantity,
          quantityBefore: product.quantityOnHand, quantityAfter: after,
          orderId: order.id, createdByStaffId: req.staff?.id, note: parsed.data.status,
        });
      }
    }
    const [updated] = await tx.update(ordersTable).set({ status: parsed.data.status })
      .where(eq(ordersTable.id, order.id)).returning();
    return { order: updated, items };
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "NEGATIVE_STOCK") return "negative" as const;
    throw error;
  });
  if (result === "missing") { res.status(404).json({ error: "Order not found" }); return; }
  if (result === "negative") { res.status(409).json({ error: "Insufficient stock" }); return; }
  await writeAudit(req.staff?.id, "update_status", "order", result.order.id, { status: parsed.data.status });
  const enteredSoldState = parsed.data.status === "confirmed" || parsed.data.status === "processing" || parsed.data.status === "completed";
  if (enteredSoldState) await postOrderJournal(result.order.id, req.staff?.id);
  if (parsed.data.status === "returned") await postOrderReturnJournal(result.order.id, req.staff?.id);
  res.json(UpdateOrderStatusResponse.parse({ ...result.order, items: result.items }));
});

export default router;