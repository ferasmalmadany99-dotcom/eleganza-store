import { Router, type IRouter } from "express";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  CreateProductResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import { requireAuth, requireManager } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/products", async (req, res): Promise<void> => {
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

router.post("/products", requireManager, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  await writeAudit(req.staff?.id, "create", "product", product.id, { sku: product.sku });
  res.status(201).json(CreateProductResponse.parse(product));
});

router.patch("/products/:id", requireManager, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    const error = !params.success ? params.error.message : "Invalid request body";
    res.status(400).json({ error }); return;
  }
  const [product] = await db.update(productsTable).set(parsed.data)
    .where(eq(productsTable.id, params.data.id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  await writeAudit(req.staff?.id, "update", "product", product.id, { changes: parsed.data });
  res.json(UpdateProductResponse.parse(product));
});

export default router;