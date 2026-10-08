import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminSupportPanel } from "@/features/admin/AdminSupportPanel";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Support requests") };
}

export default async function AdminSupportPage() {
  const authorization = await requirePlatformPagePermission("support.view");
  await ensureMongoIndexes();
  const text = await getTextTranslator();
  const pagination = parsePagination(new URLSearchParams(), 25, 100)!;
  const totalItems = await mongoDb.collection("supportRequests").countDocuments();
  const requests = await mongoDb
    .collection("supportRequests")
    .find({}, { projection: { history: 0 } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(pagination.pageSize)
    .toArray();
  const items = requests.map((item) => ({
    id: String(item._id),
    requesterName: String(item.requesterName ?? ""),
    requesterEmail: String(item.requesterEmail ?? ""),
    requesterType: String(item.requesterType ?? ""),
    category: String(item.category),
    subject: String(item.subject),
    description: String(item.description),
    status: String(item.status),
    relatedWeddingKey: String(item.relatedWeddingKey ?? ""),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Support"
        title="Support requests"
        description="Review user requests and update their operational status."
      />
      <AdminSupportPanel
        canManageRequests={authorization.permissions.includes("support.manage")}
        initialRequests={items}
        initialPagination={paginatedResult(items, 1, pagination.pageSize, totalItems).pagination}
      />
    </div>
  );
}
