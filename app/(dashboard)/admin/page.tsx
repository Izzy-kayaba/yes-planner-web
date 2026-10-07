import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { requirePageRole } from "@/lib/auth/session";
import { getTextTranslator } from "@/lib/i18n-server";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { ClaimReviewPanel } from "@/features/admin/ClaimReviewPanel";
import { AdminUsersPanel } from "@/features/admin/AdminUsersPanel";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { listPendingVendorClaims } from "@/lib/vendors/claims";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("System administration") };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ claimsPage?: string; usersPage?: string }>;
}) {
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  if (!demoMode) {
    await requirePageRole(["SystemAdmin"]);
    await ensureMongoIndexes();
  }
  const params = await searchParams;
  const claimsPagination =
    parsePagination(new URLSearchParams({ page: params.claimsPage ?? "1", pageSize: "25" })) ??
    parsePagination(new URLSearchParams());
  const usersPagination =
    parsePagination(new URLSearchParams({ page: params.usersPage ?? "1", pageSize: "25" })) ??
    parsePagination(new URLSearchParams());
  const text = await getTextTranslator();
  const metrics = demoMode
    ? { users: 0, couples: 0, professionals: 0, records: 0 }
    : await loadMetrics();
  const users = demoMode ? paginatedResult([], 1, 25, 0) : await loadRecentUsers(usersPagination!);
  const claims = demoMode
    ? { items: [], pagination: claimsPagination && paginatedResult([], 1, 25, 0).pagination }
    : await loadClaims(claimsPagination!);

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="System administration"
        title="Yes Planner operations"
        description="Protected platform oversight for users, roles and application activity."
      />
      <section className="stats-grid">
        <StatCard
          label="Registered users"
          value={String(metrics.users)}
          detail="MongoDB users"
          tone="rose"
        />
        <StatCard
          label="Couple accounts"
          value={String(metrics.couples)}
          detail="Active identities"
          tone="sage"
        />
        <StatCard
          label="Professional accounts"
          value={String(metrics.professionals)}
          detail="Venues and vendors"
          tone="blue"
        />
        <StatCard
          label="Workspace records"
          value={String(metrics.records)}
          detail="Database-backed records"
          tone="gold"
        />
      </section>
      <section className="dashboard-grid">
        <ClaimReviewPanel
          initialClaims={claims.items}
          initialPagination={claims.pagination ?? paginatedResult([], 1, 25, 0).pagination}
        />
        <AdminUsersPanel initialUsers={users.items} initialPagination={users.pagination} />
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("Security controls")}</p>
              <h3>{text("Enforced on the server")}</h3>
            </div>
            <span className="health-dot" />
          </div>
          <div className="health-list">
            {[
              ["Session validation", "Active"],
              ["Role checks", "Active"],
              ["Resource ownership", "Active"],
              ["Admin route restriction", "SystemAdmin only"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{text(label)}</span>
                <strong>{text(value)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

async function loadClaims(pagination: NonNullable<ReturnType<typeof parsePagination>>) {
  return listPendingVendorClaims(pagination);
}

async function loadMetrics() {
  const users = mongoDb.collection("user");
  const [userCount, couples, venues, vendors, records] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ role: "Couple" }),
    users.countDocuments({ role: "Venue" }),
    users.countDocuments({ role: "Vendor" }),
    mongoDb.collection("workspaceItems").countDocuments({ deletedAt: { $exists: false } }),
  ]);
  return { users: userCount, couples, professionals: venues + vendors, records };
}

async function loadRecentUsers(pagination: NonNullable<ReturnType<typeof parsePagination>>) {
  const totalItems = await mongoDb.collection("user").countDocuments();
  const users = await mongoDb
    .collection("user")
    .find({}, { projection: { name: 1, email: 1, role: 1, accountType: 1 } })
    .sort({ createdAt: -1, _id: -1 })
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  const items = users.map((user: Record<string, unknown>) => ({
    id: String(user._id),
    name: String(user.name ?? user.email ?? "User"),
    email: String(user.email ?? ""),
    role: String(
      user.accountType ?? (user.role === "Planner" ? "Vendor" : (user.role ?? "Couple")),
    ),
  }));
  return paginatedResult(items, pagination.page, pagination.pageSize, totalItems);
}
