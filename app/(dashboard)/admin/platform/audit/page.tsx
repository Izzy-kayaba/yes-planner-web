// Purpose: implements app/(dashboard)/admin/platform/audit/page.tsx for the Yes Planner web application.
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminAuditPanel } from "@/features/admin/AdminAuditPanel";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";

export const metadata: Metadata = { title: "Platform audit log" };

export default async function AdminAuditPage() {
  await requirePlatformPagePermission("audit.view");
  await ensureMongoIndexes();
  const pagination = parsePagination(new URLSearchParams(), 25, 100)!;
  const collection = mongoDb.collection("adminAuditLog");
  const totalItems = await collection.countDocuments();
  const events = await collection
    .find({})
    .project({
      event_id: 1,
      schema_version: 1,
      occurred_at: 1,
      changes: 1,
      event_type: 1,
      actor: 1,
      actorUserId: 1,
      permission: 1,
      action: 1,
      resource: 1,
      resourceType: 1,
      resourceId: 1,
      outcome: 1,
      reason_code: 1,
      request_id: 1,
      source_ip: 1,
      service: 1,
      recorded_at: 1,
      createdAt: 1,
    })
    .sort({ createdAt: -1, _id: -1 })
    .limit(pagination.pageSize)
    .toArray();
  const actorIds = events
    .map((event) => String(event.actor?.id ?? event.actorUserId ?? ""))
    .filter(Boolean);
  const actorRecords = actorIds.length
    ? await mongoDb
        .collection("user")
        .find({ id: { $in: actorIds } }, { projection: { id: 1, name: 1, email: 1 } })
        .toArray()
    : [];
  const actors = new Map(
    actorRecords.map((actor) => [
      String(actor.id),
      { name: String(actor.name ?? ""), email: String(actor.email ?? "") },
    ]),
  );
  const items = events.map((event) => ({
    id: String(event._id),
    eventId: String(event.event_id ?? event._id),
    schemaVersion: String(event.schema_version ?? "1.0"),
    occurredAt: String(event.occurred_at ?? event.recorded_at ?? event.createdAt ?? ""),
    recordedAt: String(event.recorded_at ?? event.createdAt ?? ""),
    eventType: String(event.event_type ?? "legacy.audit_event"),
    actorUserId: String(event.actor?.id ?? event.actorUserId ?? ""),
    actorType: String(event.actor?.type ?? "human"),
    actorRole: String(event.actor?.role ?? ""),
    actorName: String(
      event.actor?.name ??
        actors.get(String(event.actor?.id ?? event.actorUserId ?? ""))?.name ??
        "",
    ),
    actorEmail: String(
      event.actor?.email ??
        actors.get(String(event.actor?.id ?? event.actorUserId ?? ""))?.email ??
        "",
    ),
    permission: String(event.permission ?? ""),
    action: String(event.action ?? ""),
    resourceType: String(event.resource?.type ?? event.resourceType ?? ""),
    resourceId: String(event.resource?.id ?? event.resourceId ?? ""),
    changes: (event.changes ?? {}) as Record<string, { before: unknown; after: unknown }>,
    outcome: String(event.outcome ?? "").toLowerCase(),
    reasonCode: String(event.reason_code ?? ""),
    requestId: String(event.request_id ?? ""),
    sourceIp: String(event.source_ip ?? ""),
    service: String(event.service ?? ""),
  }));
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Platform"
        title="Audit log"
        description="Review metadata for sensitive administrative actions."
      />
      <AdminAuditPanel
        initialEvents={items}
        initialPagination={paginatedResult(items, 1, pagination.pageSize, totalItems).pagination}
      />
    </div>
  );
}
