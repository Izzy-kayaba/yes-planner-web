import type { Metadata } from "next";
import { RsvpExperience } from "@/features/guests/RsvpExperience";

export const metadata: Metadata = { title: "Amara & Sipho’s invitation" };
export default function InvitationPage() {
  return <RsvpExperience />;
}
