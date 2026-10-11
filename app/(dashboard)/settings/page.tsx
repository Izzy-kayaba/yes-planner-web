// Purpose: implements app/(dashboard)/settings/page.tsx for the Yes Planner web application.
import type { Metadata } from "next";
import { SettingsPanel } from "@/features/settings/SettingsPanel";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Settings") };
}

export default function SettingsPage() {
  return <SettingsPanel />;
}
