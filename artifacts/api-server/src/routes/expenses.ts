import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import { CreateExpenseBody, CreateExpenseResponse, ListExpensesQueryParams, ListExpensesResponse } from "@workspace/api-zod";
import { requireAuth, requireManager } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";
import { postExpenseJournal } from "../lib/accounting";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/expenses", async (req, res): Promise<void> => {
  const query = ListExpensesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const expenses = await db.select().from(expensesTable).orderBy(desc(expensesTable.expenseDate))
    .limit(query.data.limit).offset(query.data.offset);
  res.json(ListExpensesResponse.parse(expenses));
});

router.post("/expenses", requireManager, async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [expense] = await db.insert(expensesTable).values({
    ...parsed.data,
    createdByStaffId: req.staff?.id,
    expenseDate: parsed.data.expenseDate.toISOString().slice(0, 10),
  }).returning();
  await writeAudit(req.staff?.id, "create", "expense", expense.id, { amountMinor: expense.amountMinor });
  await postExpenseJournal(expense, req.staff?.id);
  res.status(201).json(CreateExpenseResponse.parse(expense));
});

export default router;