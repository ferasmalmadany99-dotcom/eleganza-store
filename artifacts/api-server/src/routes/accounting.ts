import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateAccountBody,
  CreateAccountResponse,
  UpdateAccountBody,
  UpdateAccountParams,
  UpdateAccountResponse,
  CreateJournalEntryBody,
  CreateJournalEntryResponse,
  ListAccountsResponse,
  ListJournalEntriesQueryParams,
  ListJournalEntriesResponse,
} from "@workspace/api-zod";
import { chartAccountsTable, db, journalEntriesTable, journalLinesTable } from "@workspace/db";
import { requireManager } from "../middlewares/auth";
import { ensureDefaultAccounts, createJournalEntry } from "../lib/accounting";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireManager);

router.get("/accounts", async (_req, res): Promise<void> => {
  const accounts = await ensureDefaultAccounts();
  res.json(ListAccountsResponse.parse(accounts));
});

router.post("/accounts", async (req, res): Promise<void> => {
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [account] = await db.insert(chartAccountsTable).values(parsed.data).returning();
    await writeAudit(req.staff?.id, "create", "account", account.id, { code: account.code });
    res.status(201).json(CreateAccountResponse.parse(account));
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique")) { res.status(409).json({ error: "Account code already exists" }); return; }
    throw error;
  }
});

router.patch("/accounts/:id", async (req, res): Promise<void> => {
  const params = UpdateAccountParams.safeParse(req.params);
  const parsed = UpdateAccountBody.safeParse(req.body);
  if (!params.success || !parsed.success) { res.status(400).json({ error: "Invalid account update" }); return; }
  const [account] = await db.update(chartAccountsTable).set(parsed.data)
    .where(eq(chartAccountsTable.id, params.data.id)).returning();
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  await writeAudit(req.staff?.id, "update", "account", account.id, parsed.data);
  res.json(UpdateAccountResponse.parse(account));
});

router.get("/journal", async (req, res): Promise<void> => {
  const query = ListJournalEntriesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const entries = await db.select().from(journalEntriesTable)
    .orderBy(desc(journalEntriesTable.entryDate), desc(journalEntriesTable.id))
    .limit(query.data.limit).offset(query.data.offset);
  const withLines = await Promise.all(entries.map(async (entry) => ({
    ...entry,
    lines: await db.select({
      id: journalLinesTable.id,
      accountId: journalLinesTable.accountId,
      debitMinor: journalLinesTable.debitMinor,
      creditMinor: journalLinesTable.creditMinor,
      memo: journalLinesTable.memo,
    }).from(journalLinesTable).where(eq(journalLinesTable.journalEntryId, entry.id)),
  })));
  res.json(ListJournalEntriesResponse.parse(withLines));
});

router.post("/journal", async (req, res): Promise<void> => {
  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const entry = await createJournalEntry({
      ...parsed.data,
      entryDate: new Date(parsed.data.entryDate).toISOString().slice(0, 10),
      createdByStaffId: req.staff?.id,
    });
    await writeAudit(req.staff?.id, "create", "journal_entry", entry.id, { description: entry.description });
    res.status(201).json(CreateJournalEntryResponse.parse(entry));
  } catch (error) {
    if (error instanceof Error && error.message === "UNBALANCED_JOURNAL") { res.status(400).json({ error: "Journal entry must be balanced" }); return; }
    throw error;
  }
});

export default router;