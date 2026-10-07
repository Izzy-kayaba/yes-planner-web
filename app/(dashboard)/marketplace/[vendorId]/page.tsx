import { notFound } from "next/navigation";
import { VendorPublicProfile } from "@/features/marketplace/VendorPublicProfile";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const session = await requirePageRole();
  const { vendorId } = await params;
  if (!ObjectId.isValid(vendorId)) notFound();
  const profile = await mongoDb
    .collection("vendorProfiles")
    .findOne({ _id: new ObjectId(vendorId), published: true });
  if (!profile) notFound();
  const ownerId = typeof profile.ownerUserId === "string" ? profile.ownerUserId : "";
  const vendorUser = ownerId
    ? await mongoDb
        .collection("user")
        .findOne(ObjectId.isValid(ownerId) ? { _id: new ObjectId(ownerId) } : { id: ownerId }, {
          projection: { phoneNumber: 1 },
        })
    : null;
  const existingRequest =
    session.user.role === "Couple" && ownerId
      ? await mongoDb.collection("vendorRequests").findOne({
          coupleUserId: session.user.id,
          vendorUserId: ownerId,
        })
      : null;
  return (
    <VendorPublicProfile
      canRequest={session.user.role === "Couple" && Boolean(ownerId)}
      canClaim={
        ["Vendor", "Venue"].includes(session.user.role) && !ownerId && Boolean(profile.seeded)
      }
      profileId={vendorId}
      claimed={Boolean(profile.claimed || (ownerId && !profile.seeded))}
      requestStatus={existingRequest ? String(existingRequest.status) : undefined}
      vendor={{
        id: ownerId,
        businessName: String(profile.businessName ?? ""),
        contactName: String(profile.contactName ?? ""),
        bio: String(profile.bio ?? ""),
        services: Array.isArray(profile.services) ? profile.services.map(String) : [],
        serviceArea: String(profile.serviceArea ?? ""),
        startingPriceMinor: Number(profile.startingPriceMinor ?? 0),
        startingPriceRangeKey: String(profile.startingPriceRangeKey ?? ""),
        website: String(profile.website ?? ""),
        instagramHandle: String(profile.instagramHandle ?? ""),
        profileImage: String(profile.profileImage ?? ""),
        portfolioImages: Array.isArray(profile.portfolioImages)
          ? profile.portfolioImages.map(String)
          : [],
        phoneNumber: String(vendorUser?.phoneNumber ?? ""),
      }}
    />
  );
}
