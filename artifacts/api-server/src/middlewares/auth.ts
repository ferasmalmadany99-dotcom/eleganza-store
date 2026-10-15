import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, staffTable, storeCustomersTable } from "@workspace/db";
import type { StaffRole } from "@workspace/api-zod";
import { getAuthenticatedUserId, hasStaffPermission, isStaffActive, staffRolePolicies } from "./authorization";

const staffRoles: StaffRole[] = ["owner", "manager", "inventory", "sales", "viewer"];

function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && staffRoles.includes(value as StaffRole);
}

function readStaffPermissions(value: unknown): StaffRole[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isStaffRole);
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      staff?: typeof staffTable.$inferSelect;
    }
  }
}

export async function ensureStaffProfile(userId: string, req: Request) {
  const existing = await db.select().from(staffTable).where(eq(staffTable.clerkUserId, userId)).limit(1);
  if (existing[0]) return existing[0];

  const count = await db.select({ id: staffTable.id }).from(staffTable).limit(1);
  const first = count.length === 0;
  let displayName = userId;
  let email: string | undefined;
  let invitedRole: StaffRole | undefined;
  let invitedPermissions: StaffRole[] = [];
  try {
    const user = await clerkClient.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, unknown>;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    displayName = typeof metadata.displayName === "string" && metadata.displayName.trim()
      ? metadata.displayName.trim()
      : fullName || user.username || userId;
    email = user.primaryEmailAddress?.emailAddress
      ?? user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress;
    invitedPermissions = readStaffPermissions(metadata.permissions);
    invitedRole = isStaffRole(metadata.role) ? metadata.role : invitedPermissions[0];
  } catch (error) {
    req.log.warn({ err: error, userId }, "Unable to load Clerk user details");
  }
  const permissions = first ? ["owner" as StaffRole] : (invitedPermissions.length > 0 ? invitedPermissions : [invitedRole ?? "viewer"]);
  try {
    const [created] = await db.insert(staffTable).values({
      clerkUserId: userId,
      displayName,
      email,
      role: first ? "owner" : (invitedRole ?? "viewer"),
      permissions,
      status: first ? "active" : "inactive",
    }).onConflictDoNothing({ target: staffTable.clerkUserId }).returning();
    if (created) return created;
  } catch (error) {
    req.log.warn({ err: error }, "Unable to provision staff profile");
  }
  const [profile] = await db.select().from(staffTable).where(eq(staffTable.clerkUserId, userId)).limit(1);
  if (profile) return profile;
  const [retry] = await db.insert(staffTable).values({
    clerkUserId: userId,
    displayName: userId,
    role: "viewer",
    status: "inactive",
  }).onConflictDoNothing({ target: staffTable.clerkUserId }).returning();
  if (retry) return retry;
  const [retrieved] = await db.select().from(staffTable).where(eq(staffTable.clerkUserId, userId)).limit(1);
  return retrieved;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = getAuthenticatedUserId(auth);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  try {
    const [customerAccount] = await db.select({ id: storeCustomersTable.id })
      .from(storeCustomersTable)
      .where(eq(storeCustomersTable.clerkUserId, userId))
      .limit(1);
    if (customerAccount) {
      res.status(403).json({ error: "Customer accounts cannot access staff operations" });
      return;
    }
    req.staff = await ensureStaffProfile(userId, req);
    if (!req.staff) {
      res.status(503).json({ error: "Staff profile could not be provisioned" });
      return;
    }
    if (!isStaffActive(req.staff.status)) {
      res.status(403).json({ error: "Staff access is pending activation" });
      return;
    }
    next();
  } catch (error) {
    req.log.error({ err: error }, "Authentication profile lookup failed");
    res.status(500).json({ error: "Unable to load staff profile" });
  }
}

export function requireRole(...roles: StaffRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.staff || !hasStaffPermission(req.staff.permissions, req.staff.role, roles)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const requireOwner = requireRole(...staffRolePolicies.owner);
export const requireManager = requireRole(...staffRolePolicies.manager);
export const requireInventory = requireRole(...staffRolePolicies.inventory);
export const requireSales = requireRole(...staffRolePolicies.sales);
export const requireAdmin = requireRole("owner", "manager", "inventory", "sales");