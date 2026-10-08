import "server-only";

import type { PlatformPermission } from "@/lib/auth/platform-permissions";
import { mongoDb } from "@/lib/mongodb";

type AuditEvent = {
  actorUserId: string;
  permission: PlatformPermission;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: "success" | "failure";
};

// Store only operational metadata; never include request bodies, email content, or credentials.
export async function recordAdminAuditEvent(event: AuditEvent) {
  await mongoDb.collection("adminAuditLog").insertOne({
    ...event,
    createdAt: new Date(),
  });
}
