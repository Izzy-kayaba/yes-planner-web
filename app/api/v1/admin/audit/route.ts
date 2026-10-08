import { NextResponse } from "next/server";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { escapedAdminSearch, parseAdminSearch } from "@/lib/admin/search";

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "audit.view");
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
  await ensureMongoIndexes();
  const collection = mongoDb.collection("adminAuditLog");
  const expression = search ? { $regex: escapedAdminSearch(search), $options: "i" } : null;
  const filter = expression
    ? {
        $or: [
          { action: expression },
          { resourceType: expression },
          { resourceId: expression },
          { actorUserId: expression },
          { outcome: expression },
        ],
      }
    : {};
  const outcome = searchParams.get("outcome");
  const appliedFilter =
    outcome === "success" || outcome === "failure" ? { ...filter, outcome } : filter;
  const totalItems = await collection.countDocuments(appliedFilter);
  const sortBy = searchParams.get("sort");
  const events = await collection
    .find(appliedFilter)
    .project({
      actorUserId: 1,
      action: 1,
      resourceType: 1,
      resourceId: 1,
      outcome: 1,
      createdAt: 1,
    })
    .sort(
      sortBy === "action"
        ? { action: 1, _id: 1 }
        : sortBy === "oldest"
          ? { createdAt: 1, _id: 1 }
          : { createdAt: -1, _id: -1 },
    )
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return NextResponse.json(
    paginatedResult(
      events.map((event) => ({
        id: String(event._id),
        actorUserId: String(event.actorUserId ?? ""),
        action: String(event.action ?? ""),
        resourceType: String(event.resourceType ?? ""),
        resourceId: String(event.resourceId ?? ""),
        outcome: String(event.outcome ?? ""),
        createdAt: event.createdAt,
      })),
      pagination.page,
      pagination.pageSize,
      totalItems,
    ),
  );
}
