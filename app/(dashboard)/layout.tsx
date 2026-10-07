import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requirePageRole } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/dashboard/server";
import { redirect } from "next/navigation";
import { mongoDb } from "@/lib/mongodb";
import { offersWeddingPlanning } from "@/lib/vendors/services";

export const metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  const session = demoMode ? undefined : await requirePageRole();
  if (session) {
    const user = await mongoDb
      .collection("user")
      .findOne({ email: session.user.email }, { projection: { phoneNumber: 1 } });
    if (!user?.phoneNumber) redirect("/complete-profile");
  }
  const shellData = session ? await loadDashboardData(session) : undefined;
  const businessProfile =
    session && session.user.role === "Vendor"
      ? await mongoDb
          .collection("vendorProfiles")
          .findOne({ ownerUserId: session.user.id }, { projection: { services: 1 } })
      : null;
  const plannerEligible =
    session?.user.role === "Vendor" && offersWeddingPlanning(businessProfile?.services);
  return (
    <AppShell plannerEligible={plannerEligible} shellData={shellData}>
      {children}
    </AppShell>
  );
}
