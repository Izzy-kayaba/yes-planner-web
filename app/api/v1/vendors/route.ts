import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";

// Search results contain only published public profiles and use the shared page envelope.
export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const pagination = parsePagination(new URL(request.url).searchParams);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  await ensureMongoIndexes();
  const filter = { published: true };
  const totalItems = await mongoDb.collection("vendorProfiles").countDocuments(filter);
  const vendors = await mongoDb
    .collection("vendorProfiles")
    .find(filter)
    .project({
      ownerUserId: 1,
      businessName: 1,
      bio: 1,
      services: 1,
      serviceArea: 1,
      countryCode: 1,
      startingPriceMinor: 1,
      startingPriceRangeKey: 1,
      profileImage: 1,
      portfolioImages: 1,
      claimed: 1,
      seeded: 1,
    })
    .sort({ businessName: 1, _id: 1 })
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  const items = vendors.map((vendor) => ({
    id: String(vendor._id),
    businessName: vendor.businessName,
    bio: vendor.bio,
    services: vendor.services,
    serviceArea: vendor.serviceArea,
    countryCode: vendor.countryCode ?? "",
    startingPriceMinor: vendor.startingPriceMinor,
    startingPriceRangeKey: vendor.startingPriceRangeKey ?? "",
    profileImage: vendor.profileImage ?? "",
    portfolioImages: vendor.portfolioImages ?? [],
    claimed: Boolean(vendor.claimed || (vendor.ownerUserId && !vendor.seeded)),
  }));
  return NextResponse.json(
    paginatedResult(items, pagination.page, pagination.pageSize, totalItems),
  );
}
