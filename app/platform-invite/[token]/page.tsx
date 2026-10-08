import type { Metadata } from "next";
import { PlatformInvitationAcceptance } from "@/features/admin/PlatformInvitationAcceptance";

export const metadata: Metadata = { title: "Accept platform invitation" };

export default async function PlatformInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PlatformInvitationAcceptance token={token} />;
}
