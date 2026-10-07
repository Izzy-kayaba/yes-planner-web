import type { Metadata } from "next";
import { AuthenticatedDashboardOverview } from "@/features/dashboard/AuthenticatedDashboardOverview";
import { WeddingOverview } from "@/features/weddings/WeddingOverview";
import { requirePageRole } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/dashboard/server";
import { resolveWeddingOwner } from "@/lib/auth/wedding-access";
import { notFound } from "next/navigation";
import { getTextTranslator } from "@/lib/i18n-server";
import { PlannerAccessManager } from "@/features/weddings/PlannerAccessManager";
import { mongoDb } from "@/lib/mongodb";
import { weddingPlanningService } from "@/lib/vendors/services";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Wedding overview") };
}

export default async function WeddingPage({ params }: { params: Promise<{ weddingId: string }> }) {
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") return <WeddingOverview />;
  const session = await requirePageRole(["SystemAdmin", "Couple", "Vendor", "Venue"]);
  const { weddingId } = await params;
  const ownerUserId = await resolveWeddingOwner(session, weddingId);
  if (!ownerUserId) notFound();
  if (session.user.role === "Venue") {
    const text = await getTextTranslator();
    const wedding = await mongoDb.collection("weddingProfiles").findOne(
      { ownerUserId, weddingKey: weddingId },
      {
        projection: {
          displayName: 1,
          partnerName: 1,
          weddingDate: 1,
          venue: 1,
          location: 1,
          estimatedGuests: 1,
          weddingStyle: 1,
        },
      },
    );
    if (!wedding) notFound();
    return (
      <section className="panel">
        <p className="eyebrow">{text("Wedding details shared with your venue")}</p>
        <h1 className="font-display text-3xl">{String(wedding.displayName ?? "")}</h1>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-yes-muted">{text("Couple")}</dt>
            <dd>{String(wedding.partnerName ?? text("Not provided"))}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Wedding date")}</dt>
            <dd>{String(wedding.weddingDate ?? text("Not provided"))}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Venue")}</dt>
            <dd>{String(wedding.venue ?? text("Not provided"))}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Location")}</dt>
            <dd>{String(wedding.location ?? text("Not provided"))}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Estimated guests")}</dt>
            <dd>{Number(wedding.estimatedGuests ?? 0) || text("Not provided")}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Wedding style")}</dt>
            <dd>{String(wedding.weddingStyle ?? text("Not provided"))}</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-yes-muted">
          {text(
            "Your venue access is view-only. The couple and their assigned planner manage the wedding.",
          )}
        </p>
      </section>
    );
  }
  const data = await loadDashboardData(session, ownerUserId);
  if (session.user.role !== "Couple") return <AuthenticatedDashboardOverview data={data} />;
  const collaborators = await mongoDb
    .collection("weddingCollaborators")
    .find({
      weddingKey: weddingId,
      weddingOwnerUserId: session.user.id,
      status: "Active",
      access: "FullManager",
      services: weddingPlanningService,
    })
    .project<{ userId: string }>({ userId: 1 })
    .toArray();
  const profiles = await mongoDb
    .collection("vendorProfiles")
    .find({ ownerUserId: { $in: collaborators.map(({ userId }) => userId) } })
    .project<{ ownerUserId: string; businessName: string; contactName: string }>({
      ownerUserId: 1,
      businessName: 1,
      contactName: 1,
    })
    .toArray();
  const planners = collaborators.map(({ userId }) => {
    const profile = profiles.find(({ ownerUserId }) => ownerUserId === userId);
    return {
      userId,
      businessName: String(profile?.businessName ?? "Wedding planning business"),
      contactName: String(profile?.contactName ?? ""),
    };
  });
  return (
    <div className="grid gap-5">
      <AuthenticatedDashboardOverview data={data} />
      <PlannerAccessManager weddingKey={weddingId} initialPlanners={planners} />
    </div>
  );
}
