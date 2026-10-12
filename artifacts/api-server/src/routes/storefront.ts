import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import { db, orderItemsTable, ordersTable, productsTable, staffTable, storeCustomersTable } from "@workspace/db";
import { CreateStorefrontOrderBody, CreateStorefrontOrderResponse } from "@workspace/api-zod";
import { writeAudit } from "../lib/audit";
import { draftOrderNumber, salesInvoiceNumber } from "../lib/invoice";

const router: IRouter = Router();

router.post("/customers/profile", async (req, res): Promise<void> => {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to create a customer profile" });
    return;
  }
  const customerName = typeof req.body?.customerName === "string" ? req.body.customerName.trim() : "";
  const customerPhone = typeof req.body?.customerPhone === "string" ? req.body.customerPhone.trim() : "";
  if (customerName.length < 2 || customerName.length > 120 || customerPhone.length < 5 || customerPhone.length > 40) {
    res.status(400).json({ error: "A valid name and phone number are required" });
    return;
  }
  const user = await clerkClient.users.getUser(userId);
  const emailAddress = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId);
  const email = emailAddress?.emailAddress;
  if (!email || emailAddress?.verification?.status !== "verified") {
    res.status(403).json({ error: "A verified email address is required" });
    return;
  }
  const [staffAccount] = await db.select({ id: staffTable.id }).from(staffTable).where(eq(staffTable.clerkUserId, userId)).limit(1);
  if (staffAccount) {
    res.status(409).json({ error: "Staff accounts cannot be registered as customer accounts" });
    return;
  }
  const [customer] = await db.insert(storeCustomersTable).values({
    clerkUserId: userId,
    customerName,
    customerPhone,
    customerEmail: email,
  }).onConflictDoUpdate({
    target: storeCustomersTable.clerkUserId,
    set: { customerName, customerPhone, customerEmail: email, updatedAt: new Date() },
  }).returning();
  res.status(201).json({ id: customer.id, customerName: customer.customerName });
});

router.get("/products", async (_req, res): Promise<void> => {
  const products = await db.select({
    id: productsTable.id,
    sku: productsTable.sku,
    nameEn: productsTable.nameEn,
    nameAr: productsTable.nameAr,
    category: productsTable.category,
    descriptionEn: productsTable.descriptionEn,
    descriptionAr: productsTable.descriptionAr,
    imageUrls: productsTable.imageUrls,
    audience: productsTable.audience,
    salePriceMinor: productsTable.salePriceMinor,
    quantityOnHand: productsTable.quantityOnHand,
  }).from(productsTable)
    .where(eq(productsTable.active, true))
    .orderBy(desc(productsTable.createdAt));
  res.json(products);
});

router.post("/orders", async (req, res): Promise<void> => {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in or create a customer account before placing an order" });
    return;
  }
  const [customerAccount] = await db.select({ id: storeCustomersTable.id })
    .from(storeCustomersTable)
    .where(eq(storeCustomersTable.clerkUserId, userId))
    .limit(1);
  if (!customerAccount) {
    res.status(403).json({ error: "A registered customer account is required to place an order" });
    return;
  }
  const parsed = CreateStorefrontOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const requiredFields = [
    parsed.data.customerName,
    parsed.data.customerPhone,
    parsed.data.customerAddress,
    parsed.data.customerLocationUrl,
  ];
  if (requiredFields.some((value) => !value.trim())) {
    res.status(400).json({ error: "All delivery details are required" });
    return;
  }
  try {
    const locationUrl = new URL(parsed.data.customerLocationUrl);
    if (!["http:", "https:"].includes(locationUrl.protocol)) throw new Error("Invalid location URL");
  } catch {
    res.status(400).json({ error: "A valid Google Maps location link is required" });
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
    const [draftOrder] = await tx.insert(ordersTable).values({
      orderNumber: draftOrderNumber(),
      status: "pending",
      paymentMethod: "cod",
      customerName: parsed.data.customerName.trim(),
      customerPhone: parsed.data.customerPhone.trim(),
      customerAddress: `${parsed.data.customerAddress.trim()}\nGoogle Maps: ${parsed.data.customerLocationUrl.trim()}`,
      subtotalMinor,
      shippingMinor: 0,
      totalMinor: subtotalMinor,
    }).returning();
    const [order] = await tx.update(ordersTable)
      .set({ orderNumber: salesInvoiceNumber(draftOrder.id) })
      .where(eq(ordersTable.id, draftOrder.id))
      .returning();

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