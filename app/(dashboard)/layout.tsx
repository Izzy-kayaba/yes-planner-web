import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requirePageRole } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/dashboard/server";
import { redirect } from "next/navigation";
import { mongoDb } from "@/lib/mongodb";

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
  return <AppShell shellData={shellData}>{children}</AppShell>;
}
