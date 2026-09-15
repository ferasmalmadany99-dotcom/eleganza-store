import { createInsertSchema } from "drizzle-zod";
import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { productsTable } from "./products";
import { staffTable } from "./staff";
import { z } from "zod/v4";

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", ["purchase", "sale", "return", "damage", "adjustment"]);

export const inventoryMovementsTable = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  type: inventoryMovementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  unitCostMinor: integer("unit_cost_minor"),
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  note: text("note"),
  orderId: integer("order_id"),
  createdByStaffId: integer("created_by_staff_id").references(() => staffTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovementsTable).omit({ id: true, createdAt: true });
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type InventoryMovement = typeof inventoryMovementsTable.$inferSelect;