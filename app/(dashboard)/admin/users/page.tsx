import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminUsersPanel } from "@/features/admin/AdminUsersPanel";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Platform users") };
}

export default async function AdminUsersPage() {
  await requirePlatformPagePermission("users.view");
  await ensureMongoIndexes();
  const text = await getTextTranslator();
  const pagination = parsePagination(new URLSearchParams(), 25, 100)!;
  const totalItems = await mongoDb.collection("user").countDocuments();
  const users = await mongoDb
    .collection("user")
    .find({}, { projection: { name: 1, email: 1, role: 1, accountType: 1 } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(pagination.pageSize)
    .toArray();
  const items = users.map((user) => ({
    id: String(user._id),
    name: String(user.name ?? user.email ?? "User"),
    email: String(user.email ?? ""),
    role: String(
      user.accountType ?? (user.role === "Planner" ? "Vendor" : (user.role ?? "Couple")),
    ),
  }));
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Users"
        title="Platform users"
        description="Review customer account metadata."
      />
      <AdminUsersPanel
        initialUsers={items}
        initialPagination={paginatedResult(items, 1, pagination.pageSize, totalItems).pagination}
      />
      <p className="text-sm text-yes-muted">
        {text("Private wedding content is not included in user administration.")}
      </p>
    </div>
  );
}
