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
  const profile = await mongoDb
    .collection("vendorProfiles")
    .findOne({ ownerUserId: decodeURIComponent(vendorId), published: true });
  if (!profile) notFound();
  const ownerId = String(profile.ownerUserId);
  const vendorUser = await mongoDb
    .collection("user")
    .findOne(ObjectId.isValid(ownerId) ? { _id: new ObjectId(ownerId) } : { id: ownerId }, {
      projection: { phoneNumber: 1 },
    });
  const existingRequest =
    session.user.role === "Couple"
      ? await mongoDb.collection("vendorRequests").findOne({
          coupleUserId: session.user.id,
          vendorUserId: String(profile.ownerUserId),
        })
      : null;
  return (
    <VendorPublicProfile
      canRequest={session.user.role === "Couple"}
      requestStatus={existingRequest ? String(existingRequest.status) : undefined}
      vendor={{
        id: String(profile.ownerUserId),
        businessName: String(profile.businessName ?? ""),
        contactName: String(profile.contactName ?? ""),
        bio: String(profile.bio ?? ""),
        services: Array.isArray(profile.services) ? profile.services.map(String) : [],
        serviceArea: String(profile.serviceArea ?? ""),
        startingPriceMinor: Number(profile.startingPriceMinor ?? 0),
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
