import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const vendors = await mongoDb
    .collection("vendorProfiles")
    .find({ published: true })
    .project({
      ownerUserId: 1,
      businessName: 1,
      bio: 1,
      services: 1,
      serviceArea: 1,
      startingPriceMinor: 1,
      profileImage: 1,
      portfolioImages: 1,
    })
    .sort({ businessName: 1 })
    .toArray();
  return NextResponse.json(
    vendors.map((vendor) => ({
      id: String(vendor.ownerUserId),
      businessName: vendor.businessName,
      bio: vendor.bio,
      services: vendor.services,
      serviceArea: vendor.serviceArea,
      startingPriceMinor: vendor.startingPriceMinor,
      profileImage: vendor.profileImage ?? "",
      portfolioImages: vendor.portfolioImages ?? [],
    })),
  );
}
