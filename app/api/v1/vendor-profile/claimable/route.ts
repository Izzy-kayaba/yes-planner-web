import { NextResponse } from "next/server";
import { mongoDb } from "@/lib/mongodb";

// Only expose public, unclaimed listing fields needed by the optional sign-up claim picker.
export async function GET() {
  const profiles = await mongoDb
    .collection("vendorProfiles")
    .find({
      published: true,
      seeded: true,
      $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }, { ownerUserId: "" }],
    })
    .project({ businessName: 1, services: 1, serviceArea: 1 })
    .sort({ businessName: 1 })
    .limit(100)
    .toArray();
  return NextResponse.json(
    profiles.map((profile) => ({
      id: String(profile._id),
      businessName: String(profile.businessName ?? "Business listing"),
      services: Array.isArray(profile.services) ? profile.services.map(String) : [],
      serviceArea: String(profile.serviceArea ?? ""),
    })),
  );
}
