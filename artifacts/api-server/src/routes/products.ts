import { Router, type IRouter } from "express";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db, inventoryMovementsTable, ordersTable, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  CreateProductResponse,
  GetProductReportParams,
  GetProductReportResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import { requireAuth, requireManager } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/products", requireAuth, async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const filters = [];
  if (query.data.search) filters.push(ilike(productsTable.nameEn, `%${query.data.search}%`));
  if (query.data.category) filters.push(eq(productsTable.category, query.data.category));
  const products = await db.select().from(productsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(productsTable.createdAt))
    .limit(query.data.limit).offset(query.data.offset);
  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:id/report", requireAuth, async (req, res): Promise<void> => {
  const params = GetProductReportParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const movementRows = await db.select({
    movement: inventoryMovementsTable,
    orderNumber: ordersTable.orderNumber,
  }).from(inventoryMovementsTable)
    .leftJoin(ordersTable, eq(inventoryMovementsTable.orderId, ordersTable.id))
    .where(eq(inventoryMovementsTable.productId, product.id))
    .orderBy(desc(inventoryMovementsTable.createdAt), desc(inventoryMovementsTable.id));
  const movements = movementRows.map(({ movement, orderNumber }) => ({
    ...movement,
    invoiceReference: movement.invoiceReference ?? orderNumber,
    productNameEn: product.nameEn,
    productNameAr: product.nameAr,
    totalValueMinor: Math.abs(movement.quantity) * (movement.unitCostMinor ?? product.costMinor),
  }));

  let purchaseQuantity = 0;
  let purchaseCostMinor = 0;
  let returnQuantity = 0;
  let saleQuantity = 0;
  let damageQuantity = 0;
  let adjustmentQuantity = 0;
  let inboundQuantity = 0;
  let outboundQuantity = 0;
  let weightedCostTotalMinor = 0;
  let weightedCostQuantity = 0;

  for (const { movement } of movementRows) {
    const quantity = Math.abs(movement.quantity);
    if (movement.type === "purchase") {
      purchaseQuantity += quantity;
      purchaseCostMinor += quantity * (movement.unitCostMinor ?? product.costMinor);
      inboundQuantity += quantity;
      weightedCostTotalMinor += quantity * (movement.unitCostMinor ?? product.costMinor);
      weightedCostQuantity += quantity;
    } else if (movement.type === "return") {
      returnQuantity += quantity;
      inboundQuantity += quantity;
      weightedCostTotalMinor += quantity * (movement.unitCostMinor ?? product.costMinor);
      weightedCostQuantity += quantity;
    } else if (movement.type === "sale") {
      saleQuantity += quantity;
      outboundQuantity += quantity;
    } else if (movement.type === "damage") {
      damageQuantity += quantity;
      outboundQuantity += quantity;
    } else if (movement.type === "adjustment") {
      adjustmentQuantity += movement.quantity;
      if (movement.quantity > 0) inboundQuantity += movement.quantity;
      else outboundQuantity += Math.abs(movement.quantity);
    }
  }

  const report = {
    product,
    summary: {
      movementCount: movementRows.length,
      purchaseQuantity,
      purchaseCostMinor,
      returnQuantity,
      saleQuantity,
      damageQuantity,
      adjustmentQuantity,
      inboundQuantity,
      outboundQuantity,
      weightedAverageCostMinor: weightedCostQuantity > 0
        ? Math.round(weightedCostTotalMinor / weightedCostQuantity)
        : product.costMinor,
      currentInventoryValueMinor: product.quantityOnHand * product.costMinor,
    },
    movements,
  };
  res.json(GetProductReportResponse.parse(report));
});

router.post("/products", requireAuth, requireManager, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`).join("; ") }); return; }
  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  await writeAudit(req.staff?.id, "create", "product", product.id, { sku: product.sku });
  res.status(201).json(CreateProductResponse.parse(product));
});

router.patch("/products/:id", requireAuth, requireManager, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    const validationError = !parsed.success
      ? parsed.error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`).join("; ")
      : undefined;
    const error = !params.success ? params.error.message : validationError ?? "Invalid request body";
    res.status(400).json({ error }); return;
  }
  const [product] = await db.update(productsTable).set(parsed.data)
    .where(eq(productsTable.id, params.data.id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  await writeAudit(req.staff?.id, "update", "product", product.id, { changes: parsed.data });
  res.json(UpdateProductResponse.parse(product));
});

export default router;