import { createInsertSchema } from "drizzle-zod";
import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { staffTable } from "./staff";
import { z } from "zod/v4";

export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "processing", "completed", "cancelled", "returned"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cod", "shopify", "electronic"]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cod"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  subtotalMinor: integer("subtotal_minor").notNull().default(0),
  shippingMinor: integer("shipping_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull().default(0),
  shopifyOrderId: text("shopify_order_id"),
  createdByStaffId: integer("created_by_staff_id").references(() => staffTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;