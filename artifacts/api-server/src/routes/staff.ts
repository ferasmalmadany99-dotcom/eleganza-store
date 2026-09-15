import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, staffTable } from "@workspace/db";
import { ListStaffResponse, UpdateStaffBody, UpdateStaffParams, UpdateStaffResponse } from "@workspace/api-zod";
import { requireAuth, requireOwner } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/staff", requireOwner, async (_req, res): Promise<void> => {
  const staff = await db.select().from(staffTable);
  res.json(ListStaffResponse.parse(staff));
});

router.patch("/staff/:id", requireOwner, async (req, res): Promise<void> => {
  const params = UpdateStaffParams.safeParse(req.params);
  const parsed = UpdateStaffBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    const error = !params.success ? params.error.message : "Invalid request body";
    res.status(400).json({ error }); return;
  }
  if (params.data.id === req.staff?.id && parsed.data.status === "inactive") {
    res.status(400).json({ error: "Owners cannot deactivate themselves" }); return;
  }
  const [target] = await db.select().from(staffTable).where(eq(staffTable.id, params.data.id));
  if (!target) { res.status(404).json({ error: "Staff member not found" }); return; }
  if (target.id === req.staff?.id && parsed.data.role && parsed.data.role !== "owner") {
    res.status(400).json({ error: "Owners cannot demote themselves" }); return;
  }
  if (target.role === "owner" && (parsed.data.role && parsed.data.role !== "owner" || parsed.data.status === "inactive")) {
    const [owners] = await db.select({ value: count(staffTable.id) }).from(staffTable)
      .where(and(eq(staffTable.role, "owner"), eq(staffTable.status, "active")));
    if (Number(owners?.value ?? 0) <= 1) {
      res.status(400).json({ error: "At least one active owner is required" }); return;
    }
  }
  const [updated] = await db.update(staffTable).set(parsed.data)
    .where(eq(staffTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Staff member not found" }); return; }
  await writeAudit(req.staff?.id, "update", "staff", updated.id, parsed.data);
  res.json(UpdateStaffResponse.parse(updated));
});

export default router;