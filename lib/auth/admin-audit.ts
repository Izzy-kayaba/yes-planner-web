import "server-only";

import { randomUUID } from "node:crypto";
import type { PlatformPermission } from "@/lib/auth/platform-permissions";
import { mongoDb } from "@/lib/mongodb";

type AuditEvent = {
  actorUserId: string;
  permission: PlatformPermission;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: "success" | "failure";
  eventType?: string;
  reasonCode?: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  requestId?: string;
  sourceIp?: string;
  service?: string;
};

function auditAction(action: string) {
  if (action.includes("created")) return "CREATE";
  if (action.includes("deleted") || action.includes("removed")) return "DELETE";
  if (action.includes("test")) return "TEST";
  return "UPDATE";
}

// Store only operational metadata; never include request bodies, email content, or credentials.
export async function recordAdminAuditEvent(event: AuditEvent) {
  const occurredAt = new Date();
  const recordedAt = new Date();
  const actor = await mongoDb
    .collection("user")
    .findOne(
      { id: event.actorUserId },
      { projection: { name: 1, email: 1, platformRoles: 1, role: 1, accountType: 1 } },
    );
  const actorRole = Array.isArray(actor?.platformRoles)
    ? String(actor.platformRoles[0] ?? "platform_staff")
    : String(actor?.role ?? actor?.accountType ?? "platform_staff");
  const action = auditAction(event.action);
  const eventType = event.eventType ?? event.action.replace(/[^a-zA-Z0-9]+/g, ".").toLowerCase();
  const reasonCode = event.reasonCode ?? event.action.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  await mongoDb.collection("adminAuditLog").insertOne({
    event_id: `evt_${randomUUID()}`,
    schema_version: "1.0",
    occurred_at: occurredAt,
    recorded_at: recordedAt,
    event_type: eventType,
    actor: {
      id: event.actorUserId,
      type: "human",
      role: actorRole,
      name: String(actor?.name ?? ""),
      email: String(actor?.email ?? ""),
    },
    action,
    resource: { type: event.resourceType, id: event.resourceId ?? "" },
    changes: event.changes ?? {},
    outcome: event.outcome.toUpperCase(),
    reason_code: reasonCode,
    request_id: event.requestId ?? null,
    source_ip: event.sourceIp ?? null,
    service: event.service ?? "platform-administration",
    // Keep aliases so older records and admin screens remain readable during migration.
    actorUserId: event.actorUserId,
    permission: event.permission,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    createdAt: recordedAt,
  });
}
