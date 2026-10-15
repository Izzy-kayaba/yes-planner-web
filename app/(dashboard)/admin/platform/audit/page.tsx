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
      event_type: 1,
      actor: 1,
      actorUserId: 1,
      action: 1,
      resource: 1,
      resourceType: 1,
      resourceId: 1,
      outcome: 1,
      reason_code: 1,
      recorded_at: 1,
      createdAt: 1,
    })
    .sort({ createdAt: -1, _id: -1 })
    .limit(pagination.pageSize)
    .toArray();
  const items = events.map((event) => ({
    id: String(event._id),
    eventId: String(event.event_id ?? event._id),
    eventType: String(event.event_type ?? "legacy.audit_event"),
    actorUserId: String(event.actor?.id ?? event.actorUserId ?? ""),
    actorRole: String(event.actor?.role ?? ""),
    action: String(event.action ?? ""),
    resourceType: String(event.resource?.type ?? event.resourceType ?? ""),
    resourceId: String(event.resource?.id ?? event.resourceId ?? ""),
    outcome: String(event.outcome ?? "").toLowerCase(),
    reasonCode: String(event.reason_code ?? ""),
    createdAt: event.recorded_at ?? event.createdAt,
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
