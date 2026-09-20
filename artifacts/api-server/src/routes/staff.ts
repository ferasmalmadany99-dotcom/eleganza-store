import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, staffTable } from "@workspace/db";
import { InviteStaffBody, InviteStaffResponse, ListStaffResponse, UpdateStaffBody, UpdateStaffParams, UpdateStaffResponse } from "@workspace/api-zod";
import { requireAuth, requireOwner } from "../middlewares/auth";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/staff", requireOwner, async (_req, res): Promise<void> => {
  const staff = await db.select().from(staffTable);
  res.json(ListStaffResponse.parse(staff));
});

router.post("/staff/invitations", requireOwner, async (req, res): Promise<void> => {
  const parsed = InviteStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message }); return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const displayName = parsed.data.displayName.trim();
  const [existingStaff] = await db.select({ id: staffTable.id }).from(staffTable).where(eq(staffTable.email, email)).limit(1);
  if (existingStaff) {
    res.status(409).json({ error: "A staff member with this email already exists" }); return;
  }

  try {
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      notify: true,
      redirectUrl: "/sign-up",
      publicMetadata: { displayName, permissions: parsed.data.permissions },
    });
    const response = InviteStaffResponse.parse({
      id: invitation.id,
      email,
      displayName,
      role: parsed.data.permissions[0],
      permissions: parsed.data.permissions,
      status: "pending",
    });
    await writeAudit(req.staff?.id, "invite", "staff", invitation.id, {
      email,
      displayName,
      permissions: parsed.data.permissions,
    });
    res.status(201).json(response);
  } catch (error) {
    req.log.error({ err: error, email }, "Unable to create staff invitation");
    res.status(400).json({ error: "Unable to send the staff invitation" });
  }
});

router.patch("/staff/:id", requireOwner, async (req, res): Promise<void> => {
  const params = UpdateStaffParams.safeParse(req.params);
  const parsed = UpdateStaffBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    const error = !params.success ? params.error.message : "Invalid request body";
    res.status(400).json({ error }); return;
  }
  const [target] = await db.select().from(staffTable).where(eq(staffTable.id, params.data.id));
  if (!target) { res.status(404).json({ error: "Staff member not found" }); return; }
  const targetPermissions = target.permissions?.length ? target.permissions : [target.role];
  const requestedPermissions = parsed.data.permissions?.length
    ? parsed.data.permissions
    : parsed.data.role
      ? [parsed.data.role]
      : targetPermissions;
  const nextPermissions: typeof targetPermissions = requestedPermissions.includes("owner")
    ? ["owner", ...requestedPermissions.filter((permission) => permission !== "owner")]
    : requestedPermissions;
  if (params.data.id === req.staff?.id && (parsed.data.status === "inactive" || !nextPermissions.includes("owner"))) {
    res.status(400).json({ error: "Owners cannot deactivate themselves" }); return;
  }
  if (targetPermissions.includes("owner") && (!nextPermissions.includes("owner") || parsed.data.status === "inactive")) {
    const [owners] = await db.select({ value: count(staffTable.id) }).from(staffTable)
      .where(and(eq(staffTable.role, "owner"), eq(staffTable.status, "active")));
    if (Number(owners?.value ?? 0) <= 1) {
      res.status(400).json({ error: "At least one active owner is required" }); return;
    }
  }
  const updateData: Partial<typeof staffTable.$inferInsert> = {
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
    ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
    role: nextPermissions[0],
    permissions: nextPermissions,
  };
  const [updated] = await db.update(staffTable).set(updateData)
    .where(eq(staffTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Staff member not found" }); return; }
  await writeAudit(req.staff?.id, "update", "staff", updated.id, updateData);
  res.json(UpdateStaffResponse.parse(updated));
});

export default router;