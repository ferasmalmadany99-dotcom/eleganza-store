import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, orderItemsTable, ordersTable, productsTable } from "@workspace/db";
import { CreateStorefrontOrderBody, CreateStorefrontOrderResponse } from "@workspace/api-zod";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/products", async (_req, res): Promise<void> => {
  const products = await db.select({
    id: productsTable.id,
    sku: productsTable.sku,
    nameEn: productsTable.nameEn,
    nameAr: productsTable.nameAr,
    salePriceMinor: productsTable.salePriceMinor,
    quantityOnHand: productsTable.quantityOnHand,
  }).from(productsTable)
    .where(eq(productsTable.active, true))
    .orderBy(desc(productsTable.createdAt));
  res.json(products);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateStorefrontOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const requestedItems = new Map<number, number>();
  for (const item of parsed.data.items) {
    requestedItems.set(item.productId, (requestedItems.get(item.productId) ?? 0) + item.quantity);
  }

  const result = await db.transaction(async (tx) => {
    const resolved: Array<{ product: typeof productsTable.$inferSelect; quantity: number }> = [];
    for (const [productId, quantity] of requestedItems) {
      const [product] = await tx.select().from(productsTable)
        .where(eq(productsTable.id, productId))
        .for("update");
      if (!product || !product.active) throw new Error("PRODUCT_NOT_FOUND");
      if (product.quantityOnHand < quantity) throw new Error("NEGATIVE_STOCK");
      resolved.push({ product, quantity });
    }

    const subtotalMinor = resolved.reduce((sum, item) => sum + item.quantity * item.product.salePriceMinor, 0);
    const [order] = await tx.insert(ordersTable).values({
      orderNumber: `ELZ-${Date.now().toString(36).toUpperCase()}`,
      status: "pending",
      paymentMethod: "cod",
      customerName: parsed.data.customerName.trim(),
      customerPhone: parsed.data.customerPhone.trim(),
      customerAddress: `${parsed.data.customerAddress.trim()}\nGoogle Maps: ${parsed.data.customerLocationUrl.trim()}`,
      subtotalMinor,
      shippingMinor: 0,
      totalMinor: subtotalMinor,
    }).returning();

    const items = [];
    for (const item of resolved) {
      const [createdItem] = await tx.insert(orderItemsTable).values({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        unitPriceMinor: item.product.salePriceMinor,
        unitCostMinor: item.product.costMinor,
      }).returning();
      items.push(createdItem);
    }
    return { order, items };
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return "missing" as const;
    if (error instanceof Error && error.message === "NEGATIVE_STOCK") return "negative" as const;
    throw error;
  });

  if (result === "missing") {
    res.status(404).json({ error: "One or more products were not found" });
    return;
  }
  if (result === "negative") {
    res.status(409).json({ error: "One or more products are no longer available in the requested quantity" });
    return;
  }

  await writeAudit(undefined, "create", "storefront_order", result.order.id, {
    status: result.order.status,
    itemCount: result.items.length,
    paymentMethod: result.order.paymentMethod,
  });
  res.status(201).json(CreateStorefrontOrderResponse.parse({ ...result.order, items: result.items }));
});

export default router;