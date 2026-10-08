import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ClaimReviewPanel } from "@/features/admin/ClaimReviewPanel";
import { AdminUsersPanel } from "@/features/admin/AdminUsersPanel";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { permissionsForPlatformRoles } from "@/lib/auth/platform-permissions";
import type { PlatformPermission } from "@/lib/auth/platform-permissions";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { listPendingVendorClaims } from "@/lib/vendors/claims";
import { getTextTranslator } from "@/lib/i18n-server";

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
  const permissions = demoMode
    ? permissionsForPlatformRoles(["SuperAdmin"])
    : (await requirePlatformPagePermission("admin.dashboard.view")).permissions;
  if (!demoMode) await ensureMongoIndexes();
  const params = await searchParams;
  const claimsPagination =
    parsePagination(new URLSearchParams({ page: params.claimsPage ?? "1", pageSize: "25" })) ??
    parsePagination(new URLSearchParams())!;
  const usersPagination =
    parsePagination(new URLSearchParams({ page: params.usersPage ?? "1", pageSize: "25" })) ??
    parsePagination(new URLSearchParams())!;
  const text = await getTextTranslator();
  const canSeeUsers = permissions.includes("users.view");
  const canSeeBusinesses = permissions.includes("businesses.view");
  const canSeeVerification = permissions.includes("verification.view");
  const [metrics, users, claims] = await Promise.all([
    demoMode ? emptyMetrics() : loadMetrics(permissions),
    canSeeUsers && !demoMode
      ? loadRecentUsers(usersPagination)
      : Promise.resolve(paginatedResult([], 1, 25, 0)),
    canSeeVerification && !demoMode
      ? listPendingVendorClaims(claimsPagination)
      : Promise.resolve(paginatedResult([], 1, 25, 0)),
  ]);
  const statCards = [
    ...(canSeeUsers
      ? [
          {
            label: "Registered users",
            value: metrics.users,
            detail: "Platform accounts",
            tone: "rose" as const,
          },
          {
            label: "Couple accounts",
            value: metrics.couples,
            detail: "Customer accounts",
            tone: "sage" as const,
          },
        ]
      : []),
    ...(canSeeBusinesses
      ? [
          {
            label: "Professional accounts",
            value: metrics.professionals,
            detail: "Venues and vendors",
            tone: "blue" as const,
          },
        ]
      : []),
    ...(permissions.includes("support.view")
      ? [
          {
            label: "Open support requests",
            value: metrics.supportRequests,
            detail: "Requests awaiting resolution",
            tone: "gold" as const,
          },
        ]
      : []),
  ];
  const canSeeUsersPanel = permissions.includes("users.view");
  const canSeeVerificationPanel = permissions.includes("verification.view");
  const hasDashboardContent =
    statCards.length > 0 ||
    canSeeUsersPanel ||
    canSeeVerificationPanel ||
    permissions.includes("integrations.view") ||
    permissions.includes("audit.view");

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="System administration"
        title="Yes Planner operations"
        description="A permission-scoped overview of platform operations."
      />
      {statCards.length > 0 && (
        <section className="stats-grid">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={String(card.value)}
              detail={card.detail}
              tone={card.tone}
            />
          ))}
        </section>
      )}
      <section className="dashboard-grid">
        {canSeeVerificationPanel && (
          <ClaimReviewPanel
            initialClaims={claims.items}
            initialPagination={claims.pagination}
            canManageClaims={permissions.includes("verification.manage")}
          />
        )}
        {canSeeUsersPanel && (
          <AdminUsersPanel initialUsers={users.items} initialPagination={users.pagination} />
        )}
        {permissions.includes("integrations.view") && (
          <article className="panel">
            <p className="eyebrow">{text("System")}</p>
            <h3>{text("Integration testing")}</h3>
            <p className="text-sm text-yes-muted">
              {text("Review configured providers and run safe connectivity checks.")}
            </p>
            <Link className="button button-secondary mt-4 w-fit" href="/admin/system/integrations">
              {text("Open integrations")}
            </Link>
          </article>
        )}
        {permissions.includes("audit.view") && (
          <article className="panel">
            <p className="eyebrow">{text("Platform activity")}</p>
            <h3>{text("Audit log")}</h3>
            <p className="text-sm text-yes-muted">
              {text("Review recorded sensitive platform actions.")}
            </p>
            <Link className="button button-secondary mt-4 w-fit" href="/admin/platform/audit">
              {text("View audit log")}
            </Link>
          </article>
        )}
        {permissions.includes("support.view") && (
          <article className="panel">
            <p className="eyebrow">{text("Support")}</p>
            <h3>{text("Support requests")}</h3>
            <p className="text-sm text-yes-muted">
              {text("Open and update requests submitted by Yes Planner users.")}
            </p>
            <Link className="button button-secondary mt-4 w-fit" href="/admin/support">
              {text("Manage support requests")}
            </Link>
          </article>
        )}
        {!hasDashboardContent && (
          <p className="text-sm text-yes-muted">
            {text("No administration tools are assigned to this platform role yet.")}
          </p>
        )}
      </section>
    </div>
  );
}

async function emptyMetrics() {
  return { users: 0, couples: 0, professionals: 0, supportRequests: 0 };
}

async function loadMetrics(permissions: readonly PlatformPermission[]) {
  const users = mongoDb.collection("user");
  const [userCount, couples, venues, vendors, supportRequests] = await Promise.all([
    permissions.includes("users.view") ? users.countDocuments() : 0,
    permissions.includes("users.view") ? users.countDocuments({ role: "Couple" }) : 0,
    permissions.includes("businesses.view") ? users.countDocuments({ role: "Venue" }) : 0,
    permissions.includes("businesses.view") ? users.countDocuments({ role: "Vendor" }) : 0,
    permissions.includes("support.view")
      ? mongoDb
          .collection("supportRequests")
          .countDocuments({ status: { $nin: ["Resolved", "Closed"] } })
      : 0,
  ]);
  return {
    users: userCount,
    couples,
    professionals: venues + vendors,
    supportRequests,
  };
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
