import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { weddingPlanningService } from "@/lib/vendors/services";
import { parsePagination } from "@/lib/api/pagination";
import { listPendingVendorClaims } from "@/lib/vendors/claims";

// Both claim listing and decisions are restricted to System Admin accounts.
async function admin(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  return authentication.session.user.role === "SystemAdmin"
    ? null
    : NextResponse.json({ message: "System administrator access is required." }, { status: 403 });
}

export async function GET(request: Request) {
  const error = await admin(request);
  if (error) return error;
  const pagination = parsePagination(new URL(request.url).searchParams);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  await ensureMongoIndexes();
  return NextResponse.json(await listPendingVendorClaims(pagination));
}

export async function PATCH(request: Request) {
  const error = await admin(request);
  if (error) return error;
  const body = await request.json().catch(() => null);
  const claimId = typeof body?.claimId === "string" ? body.claimId : "";
  const status = body?.status === "Approved" || body?.status === "Declined" ? body.status : null;
  if (!ObjectId.isValid(claimId) || !status)
    return NextResponse.json(
      { message: "A claim and valid decision are required." },
      { status: 400 },
    );
  const claim = await mongoDb
    .collection("vendorClaims")
    .findOne({ _id: new ObjectId(claimId), status: "Pending" });
  if (!claim) return NextResponse.json({ message: "Pending claim not found." }, { status: 404 });
  if (status === "Approved") {
    const profileId = String(claim.profileId ?? "");
    if (!ObjectId.isValid(profileId))
      return NextResponse.json({ message: "The claimed listing is unavailable." }, { status: 409 });
    const seededListing = await mongoDb.collection("vendorProfiles").findOne({
      _id: new ObjectId(profileId),
      seeded: true,
      $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }, { ownerUserId: "" }],
    });
    if (!seededListing)
      return NextResponse.json(
        { message: "The listing has already been claimed." },
        { status: 409 },
      );
    const claimantUserId = String(claim.claimantUserId ?? "");
    const claimantAccount = ObjectId.isValid(claimantUserId)
      ? await mongoDb
          .collection("user")
          .findOne(
            { _id: new ObjectId(claimantUserId) },
            { projection: { accountType: 1, role: 1 } },
          )
      : await mongoDb
          .collection("user")
          .findOne({ id: claimantUserId }, { projection: { accountType: 1, role: 1 } });
    const isVenueAccount =
      claimantAccount?.accountType === "Venue" || claimantAccount?.role === "Venue";
    const seededServices = Array.isArray(seededListing.services)
      ? seededListing.services.filter(
          (service: unknown) => !isVenueAccount || service !== weddingPlanningService,
        )
      : [];
    if (isVenueAccount && !seededServices.includes("Venue")) seededServices.push("Venue");
    const existingProfile = await mongoDb
      .collection("vendorProfiles")
      .findOne({ ownerUserId: claimantUserId });
    if (existingProfile) {
      const profileFields = [
        "businessName",
        "contactName",
        "bio",
        "serviceArea",
        "website",
        "instagramHandle",
        "startingPriceMinor",
        "startingPriceRangeKey",
      ] as const;
      const missingFields = Object.fromEntries(
        profileFields.flatMap((field) => {
          const existingValue = existingProfile[field];
          const seededValue = seededListing[field];
          return (existingValue === undefined || existingValue === null || existingValue === "") &&
            seededValue !== undefined &&
            seededValue !== null &&
            seededValue !== ""
            ? [[field, seededValue]]
            : [];
        }),
      );
      const services = [
        ...new Set([
          ...(Array.isArray(existingProfile.services) ? existingProfile.services : []),
          ...seededServices,
        ]),
      ].filter((service) => !isVenueAccount || service !== weddingPlanningService);
      const merged = await mongoDb.collection("vendorProfiles").updateOne(
        { _id: existingProfile._id, ownerUserId: claimantUserId },
        {
          $addToSet: {
            portfolioImages: {
              $each: Array.isArray(seededListing.portfolioImages)
                ? seededListing.portfolioImages
                : [],
            },
          },
          $set: {
            ...missingFields,
            services,
            claimed: true,
            published: true,
            updatedAt: new Date(),
          },
        },
      );
      if (!merged.matchedCount)
        return NextResponse.json(
          { message: "The claimant profile changed during review. Refresh and retry." },
          { status: 409 },
        );
      await mongoDb.collection("vendorProfiles").deleteOne({
        _id: seededListing._id,
        seeded: true,
        $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }, { ownerUserId: "" }],
      });
    } else {
      const attached = await mongoDb.collection("vendorProfiles").updateOne(
        {
          _id: seededListing._id,
          seeded: true,
          $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }, { ownerUserId: "" }],
        },
        {
          $set: {
            ownerUserId: claimantUserId,
            claimed: true,
            seeded: false,
            published: true,
            ...(isVenueAccount ? { services: seededServices } : {}),
            updatedAt: new Date(),
          },
        },
      );
      if (!attached.matchedCount)
        return NextResponse.json(
          { message: "The listing has already been claimed." },
          { status: 409 },
        );
    }
  }
  await mongoDb
    .collection("vendorClaims")
    .updateOne(
      { _id: new ObjectId(claimId) },
      { $set: { status, reviewedAt: new Date(), updatedAt: new Date() } },
    );
  return NextResponse.json({ status });
}
