import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { after } from "next/server";
import { sendWhatsAppEvent } from "@/lib/whatsapp";

type RouteContext = { params: Promise<{ requestId: string }> };
const decisionSchema = z.object({ status: z.enum(["Accepted", "Declined"]) });

export async function PATCH(request: Request, context: RouteContext) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (authentication.session.user.role !== "Vendor") {
    return NextResponse.json({ message: "Vendor access is required." }, { status: 403 });
  }
  const { requestId } = await context.params;
  if (!ObjectId.isValid(requestId)) {
    return NextResponse.json({ message: "Request not found." }, { status: 404 });
  }
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid decision." }, { status: 400 });
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
    await mongoDb.collection("weddingCollaborators").updateOne(
      {
        weddingKey: vendorRequest.weddingKey,
        userId: authentication.session.user.id,
      },
      {
        $set: {
          weddingOwnerUserId: vendorRequest.coupleUserId,
          role: "Vendor",
          service: vendorRequest.service,
          status: "Active",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  } else {
    await mongoDb.collection("weddingCollaborators").deleteOne({
      weddingKey: vendorRequest.weddingKey,
      userId: authentication.session.user.id,
    });
  }
  after(() =>
    sendWhatsAppEvent(
      String(vendorRequest.coupleUserId),
      `${String(vendorRequest.service)} request was ${parsed.data.status.toLowerCase()} by the vendor.`,
    ),
  );
  return NextResponse.json({ id: requestId, status: parsed.data.status });
}
