import { notFound } from "next/navigation";
import { PublicWeddingPage } from "@/features/public-wedding/PublicWeddingPage";
import { requirePageRole } from "@/lib/auth/session";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { mongoDb } from "@/lib/mongodb";
import { publicationFromProfile } from "@/lib/wedding-publication";

export default async function WeddingWebsitePreview({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const session = await requirePageRole(["Couple", "Vendor"]);
  const { weddingId } = await params;
  const access = await resolveWeddingAccess(session, weddingId);
  if (!access || !["Owner", "FullManager"].includes(access.access)) notFound();
  const profile = await mongoDb
    .collection("weddingProfiles")
    .findOne({ ownerUserId: access.ownerUserId, weddingKey: weddingId });
  if (!profile) notFound();
  const wedding = publicationFromProfile(profile);
  const timeline = await mongoDb
    .collection("workspaceItems")
    .find<{ data?: Record<string, unknown> }>({
      ownerUserId: access.ownerUserId,
      weddingKey: weddingId,
      module: "timeline",
      deletedAt: { $exists: false },
    })
    .sort({ createdAt: 1 })
    .toArray();
  return <PublicWeddingPage wedding={wedding} timeline={timeline} />;
}
