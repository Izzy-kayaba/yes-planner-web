import type { Metadata } from "next";
import { AuthenticatedDashboardOverview } from "@/features/dashboard/AuthenticatedDashboardOverview";
import { WeddingOverview } from "@/features/weddings/WeddingOverview";
import { requirePageRole } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/dashboard/server";
import { resolveWeddingOwner } from "@/lib/auth/wedding-access";
import { notFound } from "next/navigation";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Wedding overview") };
}

export default async function WeddingPage({ params }: { params: Promise<{ weddingId: string }> }) {
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") return <WeddingOverview />;
  const session = await requirePageRole(["SystemAdmin", "Couple", "Vendor"]);
  const { weddingId } = await params;
  const ownerUserId = await resolveWeddingOwner(session, weddingId);
  if (!ownerUserId) notFound();
  const data = await loadDashboardData(session, ownerUserId);
  return <AuthenticatedDashboardOverview data={data} />;
}
