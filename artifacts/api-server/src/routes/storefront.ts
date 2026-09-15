import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/products", async (_req, res): Promise<void> => {
  const products = await db.select({
    id: productsTable.id,
    nameEn: productsTable.nameEn,
    nameAr: productsTable.nameAr,
    quantityOnHand: productsTable.quantityOnHand,
  }).from(productsTable)
    .where(eq(productsTable.active, true))
    .orderBy(desc(productsTable.createdAt));
  res.json(products);
});

export default router;