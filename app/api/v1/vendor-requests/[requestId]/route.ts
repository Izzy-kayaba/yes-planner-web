import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { after } from "next/server";
import { notifyUserEvent } from "@/lib/whatsapp";
import { weddingPlanningService } from "@/lib/vendors/services";

type RouteContext = { params: Promise<{ requestId: string }> };
const decisionSchema = z.object({ status: z.enum(["Accepted", "Declined"]) });

// A business can decide only requests addressed to its own user account.
export async function PATCH(request: Request, context: RouteContext) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (
    authentication.session.user.role !== "Vendor" &&
    authentication.session.user.role !== "Venue"
  ) {
    return NextResponse.json({ message: "A business account is required." }, { status: 403 });
  }
  const { requestId } = await context.params;
  if (!ObjectId.isValid(requestId)) {
    return NextResponse.json({ message: "Request not found." }, { status: 404 });
  }
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid decision." }, { status: 400 });
  const existingRequest = await mongoDb.collection("vendorRequests").findOne({
    _id: new ObjectId(requestId),
    vendorUserId: authentication.session.user.id,
  });
  if (!existingRequest)
    return NextResponse.json({ message: "Request not found." }, { status: 404 });
  if (
    authentication.session.user.role === "Venue" &&
    parsed.data.status === "Accepted" &&
    existingRequest.service === weddingPlanningService
  ) {
    return NextResponse.json(
      { message: "Venue accounts cannot accept wedding-planner assignments." },
      { status: 403 },
    );
  }
  const vendorRequest = await mongoDb
    .collection("vendorRequests")
    .findOneAndUpdate(
      { _id: new ObjectId(requestId), vendorUserId: authentication.session.user.id },
      { $set: { status: parsed.data.status, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  if (!vendorRequest) return NextResponse.json({ message: "Request not found." }, { status: 404 });
  if (parsed.data.status === "Accepted") {
    await ensureMongoIndexes();
    const existingCollaboration = await mongoDb.collection("weddingCollaborators").findOne(
      {
        weddingKey: vendorRequest.weddingKey,
        userId: authentication.session.user.id,
      },
      { projection: { access: 1 } },
    );
    await mongoDb.collection("weddingCollaborators").updateOne(
      {
        weddingKey: vendorRequest.weddingKey,
        userId: authentication.session.user.id,
      },
      {
        $set: {
          weddingOwnerUserId: vendorRequest.coupleUserId,
          role: "Vendor",
          access:
            authentication.session.user.role === "Vendor" &&
            (existingCollaboration?.access === "FullManager" ||
              vendorRequest.service === weddingPlanningService)
              ? "FullManager"
              : "Vendor",
          status: "Active",
          updatedAt: new Date(),
        },
        $addToSet: { services: vendorRequest.service },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  } else {
    await mongoDb.collection("weddingCollaborators").updateOne(
      {
        weddingKey: vendorRequest.weddingKey,
        userId: authentication.session.user.id,
      },
      {
        $pull: { services: vendorRequest.service },
        ...(vendorRequest.service === weddingPlanningService
          ? { $set: { access: "Vendor", updatedAt: new Date() } }
          : {}),
      },
    );
    await mongoDb.collection("weddingCollaborators").deleteOne({
      weddingKey: vendorRequest.weddingKey,
      userId: authentication.session.user.id,
      services: { $size: 0 },
    });
  }
  after(() =>
    notifyUserEvent(
      String(vendorRequest.coupleUserId),
      `${String(vendorRequest.service)} request was ${parsed.data.status.toLowerCase()} by the vendor.`,
    ),
  );
  return NextResponse.json({ id: requestId, status: parsed.data.status });
}
