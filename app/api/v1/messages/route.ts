import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";

const sendSchema = z.object({
  recipientUserId: z.string().min(1).max(200),
  weddingKey: z.string().min(1).max(160),
  body: z.string().trim().min(1).max(2_000),
});

const readSchema = z.object({
  participantUserId: z.string().min(1).max(200),
  weddingKey: z.string().min(1).max(160),
});

async function acceptedConnection(
  userId: string,
  role: string,
  otherUserId: string,
  weddingKey: string,
) {
  if (role === "Couple") {
    return mongoDb.collection("vendorRequests").findOne({
      coupleUserId: userId,
      vendorUserId: otherUserId,
      weddingKey,
      status: "Accepted",
    });
  }
  if (role === "Vendor") {
    return mongoDb.collection("vendorRequests").findOne({
      coupleUserId: otherUserId,
      vendorUserId: userId,
      weddingKey,
      status: "Accepted",
    });
  }
  return null;
}

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const { id: userId, role } = authentication.session.user;
  if (role !== "Couple" && role !== "Vendor") {
    return NextResponse.json(
      { message: "Messaging is available to couples and vendors." },
      { status: 403 },
    );
  }

  const requestFilter = role === "Couple" ? { coupleUserId: userId } : { vendorUserId: userId };
  const connections = await mongoDb
    .collection("vendorRequests")
    .find({ ...requestFilter, status: "Accepted" })
    .toArray();
  const participantIds = connections.map((connection) =>
    String(role === "Couple" ? connection.vendorUserId : connection.coupleUserId),
  );
  const [vendorProfiles, weddingProfiles, messages] = await Promise.all([
    mongoDb
      .collection("vendorProfiles")
      .find({ ownerUserId: { $in: participantIds } })
      .project({ ownerUserId: 1, businessName: 1, profileImage: 1 })
      .toArray(),
    mongoDb
      .collection("weddingProfiles")
      .find({ ownerUserId: { $in: participantIds } })
      .project({ ownerUserId: 1, displayName: 1 })
      .toArray(),
    mongoDb
      .collection("messages")
      .find({ $or: [{ senderUserId: userId }, { recipientUserId: userId }] })
      .sort({ createdAt: 1 })
      .limit(1_000)
      .toArray(),
  ]);

  const conversations = connections.map((connection) => {
    const participantUserId = String(
      role === "Couple" ? connection.vendorUserId : connection.coupleUserId,
    );
    const weddingKey = String(connection.weddingKey);
    const profile =
      role === "Couple"
        ? vendorProfiles.find((item) => String(item.ownerUserId) === participantUserId)
        : weddingProfiles.find((item) => String(item.ownerUserId) === participantUserId);
    const conversationMessages = messages.filter(
      (message) =>
        String(message.weddingKey) === weddingKey &&
        ((message.senderUserId === userId && message.recipientUserId === participantUserId) ||
          (message.senderUserId === participantUserId && message.recipientUserId === userId)),
    );
    return {
      id: `${weddingKey}:${participantUserId}`,
      participantUserId,
      weddingKey,
      name: String(
        role === "Couple"
          ? (profile?.businessName ?? "Vendor")
          : (profile?.displayName ?? connection.coupleName ?? "Couple"),
      ),
      image: role === "Couple" ? String(profile?.profileImage ?? "") : "",
      service: String(connection.service ?? ""),
      unreadCount: conversationMessages.filter(
        (message) => message.recipientUserId === userId && !message.readAt,
      ).length,
      messages: conversationMessages.map((message) => ({
        id: String(message._id),
        body: String(message.body),
        sentByMe: message.senderUserId === userId,
        createdAt:
          message.createdAt instanceof Date
            ? message.createdAt.toISOString()
            : String(message.createdAt),
      })),
    };
  });
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "Enter a valid message." }, { status: 400 });
  const { id: userId, role } = authentication.session.user;
  const connection = await acceptedConnection(
    userId,
    role,
    parsed.data.recipientUserId,
    parsed.data.weddingKey,
  );
  if (!connection) {
    return NextResponse.json({ message: "An accepted work request is required." }, { status: 403 });
  }
  await ensureMongoIndexes();
  const message = {
    senderUserId: userId,
    recipientUserId: parsed.data.recipientUserId,
    weddingKey: parsed.data.weddingKey,
    body: parsed.data.body,
    createdAt: new Date(),
  };
  const result = await mongoDb.collection("messages").insertOne(message);
  return NextResponse.json({ id: String(result.insertedId) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const parsed = readSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "Invalid conversation." }, { status: 400 });
  const userId = authentication.session.user.id;
  await mongoDb.collection("messages").updateMany(
    {
      senderUserId: parsed.data.participantUserId,
      recipientUserId: userId,
      weddingKey: parsed.data.weddingKey,
      readAt: { $exists: false },
    },
    { $set: { readAt: new Date() } },
  );
  return NextResponse.json({ success: true });
}
