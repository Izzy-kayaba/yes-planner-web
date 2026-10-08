import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { supportRequestSchema } from "@/lib/support/contracts";

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const pagination = parsePagination(new URL(request.url).searchParams, 10, 50);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  await ensureMongoIndexes();
  const filter = { requesterUserId: authentication.session.user.id };
  const totalItems = await mongoDb.collection("supportRequests").countDocuments(filter);
  const requests = await mongoDb
    .collection("supportRequests")
    .find(filter, { projection: { history: 0, requesterEmail: 0 } })
    .sort({ createdAt: -1, _id: -1 })
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return NextResponse.json(
    paginatedResult(
      requests.map((item) => ({
        id: String(item._id),
        category: String(item.category),
        subject: String(item.subject),
        description: String(item.description),
        status: String(item.status),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination.page,
      pagination.pageSize,
      totalItems,
    ),
  );
}

export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const body = await request.json().catch(() => null);
  const parsed = supportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide a category, subject, and detailed description." },
      { status: 400 },
    );
  }

  let relatedWeddingKey: string | undefined;
  if (parsed.data.relatedWeddingKey) {
    const access = await resolveWeddingAccess(
      authentication.session,
      parsed.data.relatedWeddingKey,
    );
    if (!access) {
      return NextResponse.json(
        { message: "You cannot attach this wedding to the request." },
        { status: 403 },
      );
    }
    relatedWeddingKey = parsed.data.relatedWeddingKey;
  }

  await ensureMongoIndexes();
  const now = new Date();
  const result = await mongoDb.collection("supportRequests").insertOne({
    requesterUserId: authentication.session.user.id,
    requesterName: authentication.session.user.name,
    requesterEmail: authentication.session.user.email,
    requesterType:
      authentication.session.user.role === "SystemAdmin"
        ? "Platform Staff"
        : authentication.session.user.role,
    category: parsed.data.category,
    subject: parsed.data.subject,
    description: parsed.data.description,
    ...(relatedWeddingKey ? { relatedWeddingKey } : {}),
    status: "New",
    history: [{ status: "New", actorUserId: authentication.session.user.id, createdAt: now }],
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ id: String(result.insertedId), status: "New" }, { status: 201 });
}
