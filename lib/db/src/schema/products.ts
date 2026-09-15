import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull().default(""),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  category: text("category").notNull(),
  salePriceMinor: integer("sale_price_minor").notNull(),
  costMinor: integer("cost_minor").notNull().default(0),
  quantityOnHand: integer("quantity_on_hand").notNull().default(0),
  reorderThreshold: integer("reorder_threshold").notNull().default(0),
  imageUrls: text("image_urls").array().notNull().default([]),
  shopifyProductId: text("shopify_product_id"),
  shopifyVariantId: text("shopify_variant_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;