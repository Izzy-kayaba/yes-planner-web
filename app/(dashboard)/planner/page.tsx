import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { getTextTranslator } from "@/lib/i18n-server";
import { getInitials } from "@/lib/initials";
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
    .find({ userId: session.user.id, access: "FullManager", status: "Active" })
    .project<{ weddingKey: string; weddingOwnerUserId: string }>({
      weddingKey: 1,
      weddingOwnerUserId: 1,
    })
    .toArray();
  const weddings = collaborations.length
    ? await mongoDb
        .collection("weddingProfiles")
        .find({
          $or: collaborations.map(({ weddingKey, weddingOwnerUserId }) => ({
            weddingKey,
            ownerUserId: weddingOwnerUserId,
          })),
        })
        .project<{
          ownerUserId: string;
          weddingKey: string;
          displayName: string;
          weddingDate: string;
        }>({
          ownerUserId: 1,
          weddingKey: 1,
          displayName: 1,
          weddingDate: 1,
        })
        .toArray()
    : [];
  const weddingByKey = new Map(
    weddings.map((wedding) => [`${wedding.ownerUserId}:${wedding.weddingKey}`, wedding]),
  );
  const activeWeddings = collaborations.flatMap(({ weddingKey, weddingOwnerUserId }) => {
    const wedding = weddingByKey.get(`${weddingOwnerUserId}:${weddingKey}`);
    return wedding ? [{ ...wedding, weddingOwnerUserId }] : [];
  });
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
          value={String(activeWeddings.length)}
          detail="Shared client workspaces"
          tone="rose"
        />
        <StatCard
          label="Business services"
          value={String(Array.isArray(profile.services) ? profile.services.length : 0)}
          detail="Services offered"
          tone="sage"
        />
        <StatCard label="Experience" value="Planning" detail="Management eligibility" tone="gold" />
      </section>
      <section className="panel">
        <p className="eyebrow">{text("Service area")}</p>
        <h2>{String(profile.serviceArea)}</h2>
        <p className="mt-3 max-w-3xl text-yes-muted">{String(profile.bio)}</p>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Client workspaces")}</p>
            <h3>{text("Your active weddings")}</h3>
          </div>
        </div>
        <div className="request-list">
          {activeWeddings.length ? (
            activeWeddings.map((wedding) => (
              <div key={`${wedding.weddingOwnerUserId}:${wedding.weddingKey}`}>
                <span className="avatar">
                  {getInitials(wedding.displayName || text("Wedding"))}
                </span>
                <p>
                  <strong>{String(wedding.displayName || text("Wedding"))}</strong>
                  <small>{String(wedding.weddingDate ?? "")}</small>
                </p>
                <Link
                  className="button button-secondary"
                  href={`/weddings/${encodeURIComponent(wedding.weddingKey)}`}
                >
                  {text("Open brief")}
                </Link>
              </div>
            ))
          ) : (
            <p className="text-sm text-yes-muted">
              {text("Accepted wedding-planning requests will appear here.")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
