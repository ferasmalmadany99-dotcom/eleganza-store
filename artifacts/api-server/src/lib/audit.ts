import { db, auditLogTable } from "@workspace/db";

export async function writeAudit(
  actorStaffId: number | undefined,
  action: string,
  entityType: string,
  entityId: string | number | undefined,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(auditLogTable).values({
    actorStaffId,
    action,
    entityType,
    entityId: entityId === undefined ? undefined : String(entityId),
    metadata,
  });
}