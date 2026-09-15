import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, auditLogTable } from "@workspace/db";
import { ListAuditLogsQueryParams, ListAuditLogsResponse } from "@workspace/api-zod";
import { requireAuth, requireManager } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/audit", requireManager, async (req, res): Promise<void> => {
  const query = ListAuditLogsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const logs = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt))
    .limit(query.data.limit).offset(query.data.offset);
  res.json(ListAuditLogsResponse.parse(logs));
});

export default router;