import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { WeddingNav } from "@/features/weddings/WeddingNav";
import { WeddingWorkspaceHeader } from "@/features/weddings/WeddingWorkspaceHeader";
import { requirePageRole } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/dashboard/server";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { mongoDb } from "@/lib/mongodb";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  const session = demoMode
    ? undefined
    : await requirePageRole(["SystemAdmin", "Couple", "Vendor", "Venue"]);
  const weddingAccess = session ? await resolveWeddingAccess(session, weddingId) : undefined;
  const resourceOwnerId = weddingAccess?.ownerUserId;
  const dashboardData =
    session && resourceOwnerId && session.user.role !== "Venue"
      ? await loadDashboardData(session, resourceOwnerId)
      : undefined;
  const venueWedding =
    session?.user.role === "Venue" && resourceOwnerId
      ? await mongoDb
          .collection("weddingProfiles")
          .findOne(
            { ownerUserId: resourceOwnerId, weddingKey: weddingId },
            { projection: { displayName: 1, weddingDate: 1 } },
          )
      : null;
  if (!demoMode && !resourceOwnerId) notFound();
  if (
    !demoMode &&
    session?.user.role !== "Venue" &&
    dashboardData?.wedding?.weddingKey !== weddingId
  )
    notFound();
  if (session?.user.role === "Venue" && !venueWedding) notFound();
  const wedding =
    dashboardData?.wedding ??
    (venueWedding
      ? {
          displayName: String(venueWedding.displayName ?? ""),
          weddingDate: String(venueWedding.weddingDate ?? ""),
        }
      : null);
  return (
    <div className="grid gap-5">
      <WeddingWorkspaceHeader
        access={weddingAccess?.access}
        role={session?.user.role}
        wedding={wedding}
      />
      <WeddingNav access={weddingAccess?.access} weddingId={weddingId} role={session?.user.role} />
      {children}
    </div>
  );
}
