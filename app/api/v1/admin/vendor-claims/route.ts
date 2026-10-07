import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

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
  const claims = await mongoDb
    .collection("vendorClaims")
    .find({ status: "Pending" })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json(claims.map((claim) => ({ ...claim, id: String(claim._id) })));
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
    const profile = await mongoDb.collection("vendorProfiles").findOneAndUpdate(
      {
        _id: new ObjectId(String(claim.profileId)),
        seeded: true,
        $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }, { ownerUserId: "" }],
      },
      {
        $set: {
          ownerUserId: claim.claimantUserId,
          claimed: true,
          seeded: false,
          published: true,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    if (!profile)
      return NextResponse.json(
        { message: "The listing has already been claimed." },
        { status: 409 },
      );
  }
  await mongoDb
    .collection("vendorClaims")
    .updateOne(
      { _id: new ObjectId(claimId) },
      { $set: { status, reviewedAt: new Date(), updatedAt: new Date() } },
    );
  return NextResponse.json({ status });
}
