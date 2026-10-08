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
      actorUserId: 1,
      action: 1,
      resourceType: 1,
      resourceId: 1,
      outcome: 1,
      createdAt: 1,
    })
    .sort({ createdAt: -1, _id: -1 })
    .limit(pagination.pageSize)
    .toArray();
  const items = events.map((event) => ({
    id: String(event._id),
    actorUserId: String(event.actorUserId ?? ""),
    action: String(event.action ?? ""),
    resourceType: String(event.resourceType ?? ""),
    resourceId: String(event.resourceId ?? ""),
    outcome: String(event.outcome ?? ""),
    createdAt: event.createdAt,
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
