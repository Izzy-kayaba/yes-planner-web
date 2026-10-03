import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export default async function PlannerPage() {
  const session = await requirePageRole(["Planner"]);
  const profile = await mongoDb
    .collection("plannerProfiles")
    .findOne({ ownerUserId: session.user.id });
  if (!profile) redirect("/onboarding");
  const collaborations = await mongoDb
    .collection("weddingCollaborators")
    .countDocuments({ userId: session.user.id, role: "Planner", status: "Active" });
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow={String(profile.organisationName)}
        title={`Welcome, ${String(profile.contactName).split(" ")[0]}`}
        description="Manage your organisation profile and the weddings shared with your planning team."
        action={
          <Link className="button button-primary" href="/onboarding">
            Edit planner profile
          </Link>
        }
      />
      <section className="stats-grid">
        <StatCard
          label="Active weddings"
          value={String(collaborations)}
          detail="Shared client workspaces"
          tone="rose"
        />
        <StatCard
          label="Team size"
          value={String(profile.teamSize)}
          detail="Organisation members"
          tone="sage"
        />
        <StatCard
          label="Experience"
          value={String(profile.yearsExperience)}
          detail="Years in wedding planning"
          tone="gold"
        />
      </section>
      <section className="panel">
        <p className="eyebrow">Service area</p>
        <h2>{String(profile.serviceArea)}</h2>
        <p className="mt-3 max-w-3xl text-yes-muted">{String(profile.bio)}</p>
      </section>
    </div>
  );
}
