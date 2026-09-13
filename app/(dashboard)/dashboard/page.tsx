import type { Metadata } from "next";
import { DashboardOverview } from "@/features/dashboard/DashboardOverview";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Dashboard") };
}

export default function DashboardPage() {
  return <DashboardOverview />;
}
