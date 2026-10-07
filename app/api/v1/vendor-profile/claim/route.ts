import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (!["Vendor", "Venue"].includes(authentication.session.user.role)) {
    return NextResponse.json({ message: "A business account is required." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const profileId = typeof body?.profileId === "string" ? body.profileId : "";
  if (!ObjectId.isValid(profileId))
    return NextResponse.json(
      { message: "The vendor profile could not be found." },
      { status: 400 },
    );
  const profile = await mongoDb.collection("vendorProfiles").findOne({
    _id: new ObjectId(profileId),
    seeded: true,
    $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }, { ownerUserId: "" }],
  });
  if (!profile)
    return NextResponse.json(
      { message: "This listing is already claimed or unavailable." },
      { status: 409 },
    );
  const existing = await mongoDb
    .collection("vendorClaims")
    .findOne({ profileId, claimantUserId: authentication.session.user.id, status: "Pending" });
  if (existing) return NextResponse.json({ status: "Pending" });
  await mongoDb.collection("vendorClaims").insertOne({
    profileId,
    claimantUserId: authentication.session.user.id,
    businessName: profile.businessName,
    status: "Pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return NextResponse.json({ status: "Pending" }, { status: 201 });
}
