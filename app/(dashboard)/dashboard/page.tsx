import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthenticatedDashboardOverview } from "@/features/dashboard/AuthenticatedDashboardOverview";
import { DemoDashboardOverview } from "@/features/dashboard/DashboardOverview";
import { requirePageRole } from "@/lib/auth/session";
import { isWeddingProfileComplete, loadDashboardData } from "@/lib/dashboard/server";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Dashboard") };
}

export default async function DashboardPage() {
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") {
    return <DemoDashboardOverview />;
  }

  const session = await requirePageRole(["SystemAdmin", "Couple", "Planner", "Vendor"]);
  if (session.user.role === "Vendor") redirect("/vendor");
  if (session.user.role === "Planner") redirect("/planner");
  if (session.user.role === "SystemAdmin") redirect("/admin");
  const data = await loadDashboardData(session);
  if (session.user.role === "Couple" && !isWeddingProfileComplete(data.wedding)) {
    redirect("/onboarding");
  }
  return <AuthenticatedDashboardOverview data={data} />;
}
