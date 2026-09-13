import type { Metadata } from "next";
import { SettingsPanel } from "@/features/settings/SettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsPanel />;
}
