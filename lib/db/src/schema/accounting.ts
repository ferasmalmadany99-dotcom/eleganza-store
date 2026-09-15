import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, date } from "drizzle-orm/pg-core";
import { staffTable } from "./staff";
import { z } from "zod/v4";

export const accountTypeEnum = pgEnum("account_type", ["asset", "liability", "equity", "revenue", "expense"]);
export type AccountType = (typeof accountTypeEnum.enumValues)[number];

export const chartAccountsTable = pgTable("chart_accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull().default(""),
  type: accountTypeEnum("type").notNull(),
  parentId: integer("parent_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChartAccountSchema = createInsertSchema(chartAccountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChartAccount = z.infer<typeof insertChartAccountSchema>;
export type ChartAccount = typeof chartAccountsTable.$inferSelect;

export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  entryNumber: text("entry_number").notNull().unique(),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  createdByStaffId: integer("created_by_staff_id").references(() => staffTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journalLinesTable = pgTable("journal_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntriesTable.id),
  accountId: integer("account_id").notNull().references(() => chartAccountsTable.id),
  debitMinor: integer("debit_minor").notNull().default(0),
  creditMinor: integer("credit_minor").notNull().default(0),
  memo: text("memo"),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({ id: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;
export type JournalLine = typeof journalLinesTable.$inferSelect;