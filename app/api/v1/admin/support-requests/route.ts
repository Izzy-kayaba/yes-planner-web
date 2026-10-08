import { ObjectId, type Document, type Filter } from "mongodb";
import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { supportStatusSchema, supportStatuses } from "@/lib/support/contracts";
import { escapedAdminSearch, parseAdminSearch } from "@/lib/admin/search";
import { supportCategories } from "@/lib/support/contracts";

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "support.view");
  if (authorization.error) return authorization.error;
  const searchParams = new URL(request.url).searchParams;
  const pagination = parsePagination(searchParams, 25, 100);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  const search = parseAdminSearch(searchParams);
  if (search === null) {
    return NextResponse.json(
      { message: "Search must be 100 characters or fewer." },
      { status: 400 },
    );
  }
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sort");
  await ensureMongoIndexes();
  const filter: Filter<Document> = search
    ? {
        $or: [
          { requesterName: { $regex: escapedAdminSearch(search), $options: "i" } },
          { requesterEmail: { $regex: escapedAdminSearch(search), $options: "i" } },
          { requesterType: { $regex: escapedAdminSearch(search), $options: "i" } },
          { category: { $regex: escapedAdminSearch(search), $options: "i" } },
          { subject: { $regex: escapedAdminSearch(search), $options: "i" } },
          { description: { $regex: escapedAdminSearch(search), $options: "i" } },
          { status: { $regex: escapedAdminSearch(search), $options: "i" } },
          { relatedWeddingKey: { $regex: escapedAdminSearch(search), $options: "i" } },
        ],
      }
    : {};
  if (
    status &&
    status !== "all" &&
    supportStatuses.includes(status as (typeof supportStatuses)[number])
  ) {
    filter.status = status;
  }
  if (
    category &&
    category !== "all" &&
    supportCategories.includes(category as (typeof supportCategories)[number])
  ) {
    filter.category = category;
  }
  const totalItems = await mongoDb.collection("supportRequests").countDocuments(filter);
  const requests = await mongoDb
    .collection("supportRequests")
    .find(filter, { projection: { history: 0 } })
    .sort(
      sortBy === "updated"
        ? { updatedAt: -1, _id: -1 }
        : sortBy === "subject"
          ? { subject: 1, _id: 1 }
          : { createdAt: -1, _id: -1 },
    )
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return NextResponse.json(
    paginatedResult(
      requests.map((item) => ({
        id: String(item._id),
        requesterName: String(item.requesterName ?? ""),
        requesterEmail: String(item.requesterEmail ?? ""),
        requesterType: String(item.requesterType ?? ""),
        category: String(item.category),
        subject: String(item.subject),
        description: String(item.description),
        status: String(item.status),
        relatedWeddingKey: String(item.relatedWeddingKey ?? ""),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination.page,
      pagination.pageSize,
      totalItems,
    ),
  );
}

export async function PATCH(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "support.manage");
  if (authorization.error) return authorization.error;
  const parsed = supportStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Provide a valid request and status." }, { status: 400 });
  }
  const now = new Date();
  const result = await mongoDb
    .collection<{
      history?: {
        status: (typeof supportStatuses)[number];
        actorUserId: string;
        createdAt: Date;
      }[];
      status: (typeof supportStatuses)[number];
    }>("supportRequests")
    .updateOne(
      { _id: new ObjectId(parsed.data.requestId) },
      {
        $set: { status: parsed.data.status, updatedAt: now },
        $push: {
          history: {
            status: parsed.data.status,
            actorUserId: authorization.session.user.id,
            createdAt: now,
          },
        },
      },
    );
  if (!result.matchedCount) {
    return NextResponse.json({ message: "Support request not found." }, { status: 404 });
  }
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "support.manage",
    action: "support_request.status_changed",
    resourceType: "support_request",
    resourceId: parsed.data.requestId,
    outcome: "success",
  });
  return NextResponse.json({ status: parsed.data.status });
}
