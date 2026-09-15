import { createInsertSchema } from "drizzle-zod";
import { boolean, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const staffRoleEnum = pgEnum("staff_role", ["owner", "manager", "inventory", "sales", "viewer"]);
export const staffStatusEnum = pgEnum("staff_status", ["active", "inactive"]);

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  role: staffRoleEnum("role").notNull().default("viewer"),
  status: staffStatusEnum("status").notNull().default("inactive"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStaffSchema = createInsertSchema(staffTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staffTable.$inferSelect;