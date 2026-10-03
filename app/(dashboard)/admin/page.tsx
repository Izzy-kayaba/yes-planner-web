import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { requirePageRole } from "@/lib/auth/session";
import { getInitials } from "@/lib/initials";
import { getTextTranslator } from "@/lib/i18n-server";
import { mongoDb } from "@/lib/mongodb";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("System administration") };
}

export default async function AdminPage() {
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  if (!demoMode) await requirePageRole(["SystemAdmin"]);
  const text = await getTextTranslator();
  const metrics = demoMode
    ? { users: 0, couples: 0, professionals: 0, records: 0 }
    : await loadMetrics();
  const users = demoMode ? [] : await loadRecentUsers();

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
          detail="Planners and vendors"
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
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("User access")}</p>
              <h3>{text("Recent accounts")}</h3>
            </div>
            <StatusPill tone="sage">{text("Server protected")}</StatusPill>
          </div>
          <div className="request-list">
            {users.length ? (
              users.map((user: AdminUser) => (
                <div key={user.id}>
                  <span className="avatar">{getInitials(user.name)}</span>
                  <p>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </p>
                  <StatusPill tone={user.role === "SystemAdmin" ? "rose" : "neutral"}>
                    {user.role}
                  </StatusPill>
                </div>
              ))
            ) : (
              <p className="text-sm text-yes-muted">
                {text("No database users are available yet.")}
              </p>
            )}
          </div>
        </article>
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

async function loadMetrics() {
  const users = mongoDb.collection("user");
  const [userCount, couples, planners, vendors, records] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ role: "Couple" }),
    users.countDocuments({ role: "Planner" }),
    users.countDocuments({ role: "Vendor" }),
    mongoDb.collection("workspaceItems").countDocuments({ deletedAt: { $exists: false } }),
  ]);
  return { users: userCount, couples, professionals: planners + vendors, records };
}

async function loadRecentUsers() {
  const users = await mongoDb
    .collection("user")
    .find({}, { projection: { name: 1, email: 1, role: 1 } })
    .sort({ createdAt: -1 })
    .limit(8)
    .toArray();
  return users.map((user: Record<string, unknown>) => ({
    id: String(user._id),
    name: String(user.name ?? user.email ?? "User"),
    email: String(user.email ?? ""),
    role: String(user.role ?? "Couple"),
  }));
}

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};
