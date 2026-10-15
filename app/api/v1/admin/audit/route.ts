// Purpose: implements app/api/v1/admin/audit/route.ts for the Yes Planner web application.
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
          { event_type: expression },
          { action: expression },
          { reason_code: expression },
          { resourceType: expression },
          { resourceId: expression },
          { "resource.type": expression },
          { "resource.id": expression },
          { actorUserId: expression },
          { "actor.id": expression },
          { outcome: expression },
        ],
      }
    : {};
  const outcome = searchParams.get("outcome");
  const appliedFilter =
    outcome === "success" || outcome === "failure"
      ? { ...filter, outcome: { $in: [outcome, outcome.toUpperCase()] } }
      : filter;
  const totalItems = await collection.countDocuments(appliedFilter);
  const sortBy = searchParams.get("sort");
  const events = await collection
    .find(appliedFilter)
    .project({
      event_id: 1,
      event_type: 1,
      actor: 1,
      actorUserId: 1,
      action: 1,
      resource: 1,
      resourceType: 1,
      resourceId: 1,
      outcome: 1,
      reason_code: 1,
      recorded_at: 1,
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
        eventId: String(event.event_id ?? event._id),
        eventType: String(event.event_type ?? "legacy.audit_event"),
        actorUserId: String(event.actor?.id ?? event.actorUserId ?? ""),
        actorRole: String(event.actor?.role ?? ""),
        action: String(event.action ?? ""),
        resourceType: String(event.resource?.type ?? event.resourceType ?? ""),
        resourceId: String(event.resource?.id ?? event.resourceId ?? ""),
        outcome: String(event.outcome ?? "").toLowerCase(),
        reasonCode: String(event.reason_code ?? ""),
        createdAt: event.recorded_at ?? event.createdAt,
      })),
      pagination.page,
      pagination.pageSize,
      totalItems,
    ),
  );
}
