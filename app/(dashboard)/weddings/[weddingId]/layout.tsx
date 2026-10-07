import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { WeddingNav } from "@/features/weddings/WeddingNav";
import { WeddingWorkspaceHeader } from "@/features/weddings/WeddingWorkspaceHeader";
import { requirePageRole } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/dashboard/server";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  const session = demoMode ? undefined : await requirePageRole(["SystemAdmin", "Couple", "Vendor"]);
  const weddingAccess = session ? await resolveWeddingAccess(session, weddingId) : undefined;
  const resourceOwnerId = weddingAccess?.ownerUserId;
  const dashboardData =
    session && resourceOwnerId ? await loadDashboardData(session, resourceOwnerId) : undefined;
  if (!demoMode && (!resourceOwnerId || dashboardData?.wedding?.weddingKey !== weddingId))
    notFound();
  return (
    <div className="grid gap-5">
      <WeddingWorkspaceHeader
        access={weddingAccess?.access}
        role={session?.user.role}
        wedding={dashboardData?.wedding}
      />
      <WeddingNav access={weddingAccess?.access} weddingId={weddingId} role={session?.user.role} />
      {children}
    </div>
  );
}
