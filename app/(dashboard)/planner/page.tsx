import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { getTextTranslator } from "@/lib/i18n-server";
import { offersWeddingPlanning } from "@/lib/vendors/services";

export default async function PlannerPage() {
  const text = await getTextTranslator();
  const session = await requirePageRole(["Vendor"]);
  const profile = await mongoDb
    .collection("vendorProfiles")
    .findOne({ ownerUserId: session.user.id });
  if (!profile) redirect("/onboarding");
  if (!offersWeddingPlanning(profile.services)) redirect("/vendor");
  const collaborations = await mongoDb
    .collection("weddingCollaborators")
    .countDocuments({ userId: session.user.id, access: "FullManager", status: "Active" });
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow={String(profile.businessName)}
        title={`${text("Welcome")}, ${String(profile.contactName).split(" ")[0]}`}
        description="Manage your organisation profile and the weddings shared with your planning team."
        action={
          <Link className="button button-primary" href="/onboarding">
            {text("Edit planner profile")}
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
          value={String(Array.isArray(profile.services) ? profile.services.length : 0)}
          detail="Business services"
          tone="sage"
        />
        <StatCard label="Experience" value="Planning" detail="Management eligibility" tone="gold" />
      </section>
      <section className="panel">
        <p className="eyebrow">{text("Service area")}</p>
        <h2>{String(profile.serviceArea)}</h2>
        <p className="mt-3 max-w-3xl text-yes-muted">{String(profile.bio)}</p>
      </section>
    </div>
  );
}
