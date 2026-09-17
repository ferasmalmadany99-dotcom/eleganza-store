import { and, eq } from "drizzle-orm";
import {
  chartAccountsTable,
  db,
  journalEntriesTable,
  journalLinesTable,
  ordersTable,
  orderItemsTable,
  productsTable,
  type AccountType,
} from "@workspace/db";

export const DEFAULT_ACCOUNTS = [
  { code: "1000", nameEn: "Cash", nameAr: "النقدية", type: "asset" as AccountType },
  { code: "1010", nameEn: "Shopify receivable", nameAr: "ذمم Shopify", type: "asset" as AccountType },
  { code: "1200", nameEn: "Inventory", nameAr: "المخزون", type: "asset" as AccountType },
  { code: "2000", nameEn: "Accounts payable", nameAr: "ذمم دائنة", type: "liability" as AccountType },
  { code: "3000", nameEn: "Owner equity", nameAr: "حقوق الملكية", type: "equity" as AccountType },
  { code: "4000", nameEn: "Sales revenue", nameAr: "إيرادات المبيعات", type: "revenue" as AccountType },
  { code: "4010", nameEn: "Sales returns", nameAr: "مرتجعات المبيعات", type: "revenue" as AccountType },
  { code: "5000", nameEn: "Cost of goods sold", nameAr: "تكلفة البضاعة المباعة", type: "expense" as AccountType },
  { code: "6000", nameEn: "Operating expenses", nameAr: "المصروفات التشغيلية", type: "expense" as AccountType },
  { code: "6100", nameEn: "Inventory adjustments", nameAr: "تسويات المخزون", type: "expense" as AccountType },
];

const PRIMARY_CASH_ACCOUNT_CODE = "1001";

export async function ensureDefaultAccounts() {
  await db.insert(chartAccountsTable).values(DEFAULT_ACCOUNTS).onConflictDoNothing({ target: chartAccountsTable.code });
  return db.select().from(chartAccountsTable).where(eq(chartAccountsTable.active, true)).orderBy(chartAccountsTable.code);
}

async function accountId(code: string) {
  const [account] = await db.select({ id: chartAccountsTable.id }).from(chartAccountsTable).where(eq(chartAccountsTable.code, code)).limit(1);
  if (!account) throw new Error(`ACCOUNT_NOT_FOUND:${code}`);
  return account.id;
}

export async function createJournalEntry(input: {
  entryDate: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdByStaffId?: number;
  lines: Array<{ accountId: number; debitMinor?: number; creditMinor?: number; memo?: string }>;
}) {
  const debit = input.lines.reduce((sum, line) => sum + (line.debitMinor ?? 0), 0);
  const credit = input.lines.reduce((sum, line) => sum + (line.creditMinor ?? 0), 0);
  if (debit <= 0 || debit !== credit) throw new Error("UNBALANCED_JOURNAL");

  return db.transaction(async (tx) => {
    const [entry] = await tx.insert(journalEntriesTable).values({
      entryNumber: `JE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      entryDate: input.entryDate,
      description: input.description,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      createdByStaffId: input.createdByStaffId,
    }).returning();
    const lines = await tx.insert(journalLinesTable).values(input.lines.map((line) => ({
      journalEntryId: entry.id,
      accountId: line.accountId,
      debitMinor: line.debitMinor ?? 0,
      creditMinor: line.creditMinor ?? 0,
      memo: line.memo,
    }))).returning();
    return { ...entry, lines };
  });
}

export async function postExpenseJournal(expense: { id: number; description: string; amountMinor: number; expenseDate: string }, staffId?: number) {
  const existing = await db.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.referenceType, "expense"), eq(journalEntriesTable.referenceId, String(expense.id)))).limit(1);
  if (existing[0] || expense.amountMinor <= 0) return;
  await ensureDefaultAccounts();
  await createJournalEntry({
    entryDate: expense.expenseDate,
    description: expense.description,
    referenceType: "expense",
    referenceId: String(expense.id),
    createdByStaffId: staffId,
    lines: [
      { accountId: await accountId("6000"), debitMinor: expense.amountMinor },
      { accountId: await accountId(PRIMARY_CASH_ACCOUNT_CODE), creditMinor: expense.amountMinor },
    ],
  });
}

export async function postOrderJournal(orderId: number, staffId?: number) {
  const existing = await db.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.referenceType, "order"), eq(journalEntriesTable.referenceId, String(orderId)))).limit(1);
  if (existing[0]) return;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) return;
  const items = await db.select({
    quantity: orderItemsTable.quantity,
    unitCostMinor: orderItemsTable.unitCostMinor,
  }).from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const cogsMinor = items.reduce((sum, item) => sum + item.quantity * item.unitCostMinor, 0);
  await ensureDefaultAccounts();
  const paymentAccount = order.paymentMethod === "shopify" ? "1010" : PRIMARY_CASH_ACCOUNT_CODE;
  const lines = [
    { accountId: await accountId(paymentAccount), debitMinor: order.totalMinor },
    { accountId: await accountId("4000"), creditMinor: order.subtotalMinor + order.shippingMinor },
  ];
  if (cogsMinor > 0) {
    lines.push({ accountId: await accountId("5000"), debitMinor: cogsMinor });
    lines.push({ accountId: await accountId("1200"), creditMinor: cogsMinor });
  }
  await createJournalEntry({
    entryDate: order.createdAt.toISOString().slice(0, 10),
    description: `Sale ${order.orderNumber}`,
    referenceType: "order",
    referenceId: String(order.id),
    createdByStaffId: staffId,
    lines,
  });
}

export async function postOrderReturnJournal(orderId: number, staffId?: number) {
  const originalSale = await db.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.referenceType, "order"), eq(journalEntriesTable.referenceId, String(orderId)))).limit(1);
  if (!originalSale[0]) return;
  const existing = await db.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.referenceType, "order_return"), eq(journalEntriesTable.referenceId, String(orderId)))).limit(1);
  if (existing[0]) return;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) return;
  const items = await db.select({ quantity: orderItemsTable.quantity, unitCostMinor: orderItemsTable.unitCostMinor })
    .from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const cogsMinor = items.reduce((sum, item) => sum + item.quantity * item.unitCostMinor, 0);
  await ensureDefaultAccounts();
  const paymentAccount = order.paymentMethod === "shopify" ? "1010" : PRIMARY_CASH_ACCOUNT_CODE;
  const lines = [
    { accountId: await accountId("4010"), debitMinor: order.subtotalMinor + order.shippingMinor },
    { accountId: await accountId(paymentAccount), creditMinor: order.totalMinor },
  ];
  if (cogsMinor > 0) {
    lines.push({ accountId: await accountId("1200"), debitMinor: cogsMinor });
    lines.push({ accountId: await accountId("5000"), creditMinor: cogsMinor });
  }
  await createJournalEntry({
    entryDate: new Date().toISOString().slice(0, 10),
    description: `Return ${order.orderNumber}`,
    referenceType: "order_return",
    referenceId: String(order.id),
    createdByStaffId: staffId,
    lines,
  });
}

export async function postInventoryJournal(input: {
  id: number;
  type: "purchase" | "sale" | "return" | "damage" | "adjustment";
  quantity: number;
  unitCostMinor?: number | null;
  productId: number;
  createdAt: Date;
}, staffId?: number) {
  if (input.type === "sale" || input.quantity === 0) return;
  const existing = await db.select({ id: journalEntriesTable.id }).from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.referenceType, "inventory_movement"), eq(journalEntriesTable.referenceId, String(input.id)))).limit(1);
  if (existing[0]) return;
  const [product] = await db.select({ costMinor: productsTable.costMinor, nameEn: productsTable.nameEn })
    .from(productsTable).where(eq(productsTable.id, input.productId)).limit(1);
  if (!product || product.costMinor <= 0) return;
   const amount = Math.abs(input.quantity) * (input.unitCostMinor ?? product.costMinor);
  await ensureDefaultAccounts();
  const inventory = await accountId("1200");
  const cash = await accountId(PRIMARY_CASH_ACCOUNT_CODE);
  const adjustment = await accountId("6100");
  const lines = input.type === "damage" || input.type === "adjustment"
    ? [{ accountId: adjustment, debitMinor: amount }, { accountId: inventory, creditMinor: amount }]
    : [{ accountId: inventory, debitMinor: amount }, { accountId: cash, creditMinor: amount }];
  await createJournalEntry({
    entryDate: input.createdAt.toISOString().slice(0, 10),
    description: `${input.type} · ${product.nameEn}`,
    referenceType: "inventory_movement",
    referenceId: String(input.id),
    createdByStaffId: staffId,
    lines,
  });
}