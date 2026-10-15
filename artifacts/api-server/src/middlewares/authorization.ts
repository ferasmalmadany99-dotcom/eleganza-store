import type { StaffRole } from "@workspace/api-zod";

export const staffRolePolicies = {
  owner: ["owner"],
  manager: ["owner", "manager"],
  inventory: ["owner", "manager", "inventory"],
  sales: ["owner", "manager", "sales"],
} as const satisfies Record<string, readonly StaffRole[]>;

export function hasStaffPermission(
  permissions: readonly StaffRole[] | null | undefined,
  role: StaffRole | null | undefined,
  requiredRoles: readonly StaffRole[],
): boolean {
  const effectivePermissions = permissions?.length ? permissions : role ? [role] : [];
  return requiredRoles.some(
    (requiredRole) =>
      effectivePermissions.includes(requiredRole) || effectivePermissions.includes("owner"),
  );
}

export function isStaffActive(status: string | null | undefined): boolean {
  return status === "active";
}

export function getAuthenticatedUserId(auth: unknown): string | undefined {
  if (!auth || typeof auth !== "object") return undefined;
  const context = auth as {
    userId?: unknown;
    sessionClaims?: { userId?: unknown } | null;
  };
  const candidate = context.sessionClaims?.userId || context.userId;
  return typeof candidate === "string" ? candidate : undefined;
}
