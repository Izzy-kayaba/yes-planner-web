import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { after } from "next/server";
import { notifyUserEvent } from "@/lib/whatsapp";
import { weddingPlanningService } from "@/lib/vendors/services";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";

const requestSchema = z.object({
  vendorUserId: z.string().min(1),
  service: z.string().trim().min(2).max(120),
  message: z.string().trim().max(1_000).default(""),
});

function publicRequest(document: Record<string, unknown>) {
  return {
    id: String(document._id),
    vendorUserId: document.vendorUserId,
    coupleUserId: document.coupleUserId,
    weddingKey: document.weddingKey,
    coupleName: document.coupleName,
    weddingDate: document.weddingDate,
    venue: document.venue,
    location: document.location,
    service: document.service,
    message: document.message,
    status: document.status,
    createdAt: document.createdAt,
  };
}

// Couples see requests they sent; businesses see only requests sent to their own account.
export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const role = authentication.session.user.role;
  if (role !== "Vendor" && role !== "Venue" && role !== "Couple") {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }
  const pagination = parsePagination(new URL(request.url).searchParams);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  await ensureMongoIndexes();
  const filter =
    role === "Vendor" || role === "Venue"
      ? { vendorUserId: authentication.session.user.id }
      : { coupleUserId: authentication.session.user.id };
  const totalItems = await mongoDb.collection("vendorRequests").countDocuments(filter);
  const requests = await mongoDb
    .collection("vendorRequests")
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return NextResponse.json(
    paginatedResult(requests.map(publicRequest), pagination.page, pagination.pageSize, totalItems),
  );
}

export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (authentication.session.user.role !== "Couple") {
    return NextResponse.json({ message: "A couple account is required." }, { status: 403 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Provide a service and valid message." }, { status: 400 });
  }
  const [wedding, vendor] = await Promise.all([
    mongoDb.collection("weddingProfiles").findOne({ ownerUserId: authentication.session.user.id }),
    mongoDb
      .collection("vendorProfiles")
      .findOne({ ownerUserId: parsed.data.vendorUserId, published: true }),
  ]);
  if (!wedding) {
    return NextResponse.json({ message: "Complete your wedding profile first." }, { status: 409 });
  }
  if (!vendor) return NextResponse.json({ message: "Vendor not found." }, { status: 404 });
  if (!Array.isArray(vendor.services) || !vendor.services.includes(parsed.data.service)) {
    return NextResponse.json(
      { message: "That vendor does not offer this service." },
      { status: 400 },
    );
  }
  if (parsed.data.service === weddingPlanningService) {
    const vendorUserId = parsed.data.vendorUserId;
    const vendorAccount = ObjectId.isValid(vendorUserId)
      ? await mongoDb
          .collection("user")
          .findOne({ _id: new ObjectId(vendorUserId) }, { projection: { accountType: 1, role: 1 } })
      : await mongoDb
          .collection("user")
          .findOne({ id: vendorUserId }, { projection: { accountType: 1, role: 1 } });
    if (vendorAccount?.accountType === "Venue" || vendorAccount?.role === "Venue") {
      return NextResponse.json(
        { message: "Wedding-planner assignments are available to Vendor accounts only." },
        { status: 400 },
      );
    }
  }
  const existing = await mongoDb.collection("vendorRequests").findOne({
    coupleUserId: authentication.session.user.id,
    vendorUserId: parsed.data.vendorUserId,
    weddingKey: wedding.weddingKey,
  });
  if (existing?.status === "Accepted") {
    return NextResponse.json(
      { message: "This vendor is already connected to your wedding." },
      { status: 409 },
    );
  }
  await ensureMongoIndexes();
  const now = new Date();
  const result = await mongoDb.collection("vendorRequests").findOneAndUpdate(
    {
      coupleUserId: authentication.session.user.id,
      vendorUserId: parsed.data.vendorUserId,
      weddingKey: wedding.weddingKey,
    },
    {
      $set: {
        coupleName: wedding.displayName,
        weddingDate: wedding.weddingDate,
        venue: wedding.venue,
        location: wedding.location,
        service: parsed.data.service,
        message: parsed.data.message,
        status: "Pending",
        updatedAt: now,
      },
      $setOnInsert: {
        coupleUserId: authentication.session.user.id,
        vendorUserId: parsed.data.vendorUserId,
        weddingKey: wedding.weddingKey,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  after(() =>
    notifyUserEvent(
      parsed.data.vendorUserId,
      `${wedding.displayName} sent a ${parsed.data.service} work request in Yes Planner.`,
    ),
  );
  return NextResponse.json(publicRequest(result!), { status: 201 });
}
