import { Router, type IRouter } from "express";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { clerkClient, getAuth } from "@clerk/express";
import { db, orderItemsTable, ordersTable, productsTable, staffTable, storeCustomersTable } from "@workspace/db";
import { CreateStorefrontOrderBody, CreateStorefrontOrderResponse } from "@workspace/api-zod";
import { writeAudit } from "../lib/audit";
import { draftOrderNumber, salesInvoiceNumber } from "../lib/invoice";

const router: IRouter = Router();
export const storefrontAccessRouter: IRouter = Router();

const productImageByName: Record<string, string> = {
  "plum elan": "plum-elan-480.jpg",
  "aurelia drops": "aurelia-drops-480.jpg",
  "dawn flush": "dawn-flush-480.jpg",
  "cedar afterglow": "cedar-afterglow-480.jpg",
  "nocturne rouge": "nocturne-rouge-480.jpg",
  "solstice chain": "solstice-chain-480.jpg",
  "silk petal": "silk-petal-480.jpg",
  "amber reverie": "amber-reverie-480.jpg",
};

const categoryProductImage: Record<string, string> = {
  fragrance: "perfume-product-480.jpg",
  perfume: "perfume-product-480.jpg",
  accessories: "jewelry-product-480.jpg",
  makeup: "makeup-product-480.jpg",
  skincare: "makeup-product-480.jpg",
};

const allowedProductImages = new Set([
  ...Object.values(productImageByName),
  ...Object.values(categoryProductImage),
]);

router.get("/images/:filename", (req, res): void => {
  const filename = req.params.filename;
  if (!allowedProductImages.has(filename)) {
    res.sendStatus(404);
    return;
  }

  const imagePath = join(dirname(fileURLToPath(import.meta.url)), "storefront-images", filename);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.sendFile(imagePath, (error) => {
    if (error && !res.headersSent) res.sendStatus(404);
  });
});

storefrontAccessRouter.post("/verify", (req, res): void => {
  const expectedCode = process.env.ELEGANZA_STORE_ACCESS_CODE;
  if (!expectedCode) {
    res.status(503).json({ error: "Store access is not configured" });
    return;
  }
  const submittedCode = typeof req.body?.accessCode === "string" ? req.body.accessCode.trim() : "";
  const expected = Buffer.from(expectedCode.trim(), "utf8");
  const submitted = Buffer.from(submittedCode, "utf8");
  const matches = expected.length > 0 && submitted.length === expected.length && timingSafeEqual(submitted, expected);
  if (!matches) {
    res.json({ verified: false });
    return;
  }
  res.json({ verified: true });
});

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

router.get("/customers/me", async (req, res): Promise<void> => {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to view your customer account" });
    return;
  }

  const user = await clerkClient.users.getUser(userId);
  const emailAddress = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId);
  if (!emailAddress?.emailAddress || emailAddress.verification?.status !== "verified") {
    res.status(403).json({ error: "A verified customer email is required" });
    return;
  }

  const [staffAccount] = await db.select({ id: staffTable.id })
    .from(staffTable)
    .where(eq(staffTable.clerkUserId, userId))
    .limit(1);
  if (staffAccount) {
    res.status(403).json({ error: "Staff accounts do not have a storefront customer account" });
    return;
  }

  const [profile] = await db.select().from(storeCustomersTable)
    .where(eq(storeCustomersTable.clerkUserId, userId))
    .limit(1);
  const verifiedPhone = user.phoneNumbers.find((phone) => phone.verification?.status === "verified")?.phoneNumber;
  const customerPhone = profile?.customerPhone ?? verifiedPhone ?? null;
  const normalizedPhone = customerPhone?.replace(/\D/g, "") ?? "";
  const customerOrders = normalizedPhone
    ? await db.select().from(ordersTable)
      .where(sql`regexp_replace(COALESCE(${ordersTable.customerPhone}, ''), '[^0-9]', '', 'g') = ${normalizedPhone}`)
      .orderBy(desc(ordersTable.createdAt))
      .limit(20)
    : [];
  const orderItems = customerOrders.length
    ? await db.select({
        orderId: orderItemsTable.orderId,
        productNameAr: productsTable.nameAr,
        productNameEn: productsTable.nameEn,
        quantity: orderItemsTable.quantity,
        unitPriceMinor: orderItemsTable.unitPriceMinor,
      }).from(orderItemsTable)
        .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
        .where(inArray(orderItemsTable.orderId, customerOrders.map((order) => order.id)))
    : [];
  const itemsByOrder = new Map<number, typeof orderItems>();
  for (const item of orderItems) {
    const items = itemsByOrder.get(item.orderId) ?? [];
    items.push(item);
    itemsByOrder.set(item.orderId, items);
  }

  const clerkName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const customerName = profile?.customerName || clerkName || user.username || "";
  res.json({
    profile: {
      customerName: customerName || emailAddress.emailAddress,
      customerPhone,
      customerEmail: emailAddress.emailAddress,
      createdAt: profile?.createdAt.toISOString() ?? null,
    },
    orders: customerOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotalMinor: order.subtotalMinor,
      shippingMinor: order.shippingMinor,
      totalMinor: order.totalMinor,
      createdAt: order.createdAt.toISOString(),
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        productName: item.productNameAr || item.productNameEn || "منتج",
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
      })),
    })),
  });
});

router.get("/products", async (req, res): Promise<void> => {
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
  const host = req.get("host");
  const baseUrl = `https://${host}/api/storefront/images/`;
  // The React Native client treats an empty 304 response as successful data,
  // which clears the product list. Always return the catalog body to mobile clients.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json(products.map((product) => {
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) return product;

    const normalizedName = (product.nameEn ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toLowerCase();
    const normalizedCategory = typeof product.category === "string"
      ? product.category.trim().toLowerCase()
      : "";
    const fallback = productImageByName[normalizedName] ?? categoryProductImage[normalizedCategory];
    return fallback ? { ...product, imageUrls: [`${baseUrl}${fallback}`] } : product;
  }));
});

router.post("/orders", async (req, res): Promise<void> => {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in or create a customer account before placing an order" });
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

  // Older signed-in customer accounts may not yet have a row in the customer directory.
  // Backfill only from a verified Clerk email and never convert staff accounts.
  const [customerAccount] = await db.select({ id: storeCustomersTable.id })
    .from(storeCustomersTable)
    .where(eq(storeCustomersTable.clerkUserId, userId))
    .limit(1);
  if (!customerAccount) {
    const [staffAccount] = await db.select({ id: staffTable.id })
      .from(staffTable)
      .where(eq(staffTable.clerkUserId, userId))
      .limit(1);
    if (staffAccount) {
      res.status(403).json({ error: "Staff accounts cannot place storefront orders" });
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    const emailAddress = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId);
    if (!emailAddress?.emailAddress || emailAddress.verification?.status !== "verified") {
      res.status(403).json({ error: "A verified customer email is required to place an order" });
      return;
    }
    await db.insert(storeCustomersTable).values({
      clerkUserId: userId,
      customerName: parsed.data.customerName.trim(),
      customerPhone: parsed.data.customerPhone.trim(),
      customerEmail: emailAddress.emailAddress,
    }).onConflictDoUpdate({
      target: storeCustomersTable.clerkUserId,
      set: {
        customerName: parsed.data.customerName.trim(),
        customerPhone: parsed.data.customerPhone.trim(),
        customerEmail: emailAddress.emailAddress,
        updatedAt: new Date(),
      },
    });
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