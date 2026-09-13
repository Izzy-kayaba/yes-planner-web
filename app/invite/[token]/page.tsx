import type { Metadata } from "next";
import { RsvpExperience } from "@/features/guests/RsvpExperience";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Ruth & Izzy's invitation") };
}
export default function InvitationPage() {
  return <RsvpExperience />;
}
