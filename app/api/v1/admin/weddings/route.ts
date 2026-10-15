// Purpose: implements app/api/v1/admin/weddings/route.ts for the Yes Planner web application.
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { listAdminWeddings } from "@/lib/admin/directories";
import { mongoDb } from "@/lib/mongodb";

const weddingFields = {
  displayName: z.string().trim().min(2).max(100),
  weddingDate: z.iso.date(),
  venue: z.string().trim().min(2).max(180),
  location: z
    .string()
    .trim()
    .length(2)
    .regex(/^[A-Z]{2}$/),
};
const weddingFieldsSchema = z.object(weddingFields);
const weddingCreateSchema = z.object({
  ...weddingFields,
});
const weddingUpdateSchema = z.object({
  weddingId: z.string().regex(/^[a-f\d]{24}$/i),
  ...weddingFieldsSchema.partial().shape,
});
const weddingDeleteSchema = z.object({ weddingId: z.string().regex(/^[a-f\d]{24}$/i) });

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "weddings.view");
  if (authorization.error) return authorization.error;
  const result = await listAdminWeddings(new URL(request.url).searchParams);
  if (!result) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "weddings.manage");
  if (authorization.error) return authorization.error;
  const parsed = weddingCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "Provide valid wedding details." }, { status: 400 });
  const now = new Date();
  const result = await mongoDb.collection("weddingProfiles").insertOne({
    ...parsed.data,
    partnerName: "Partner",
    weddingKey: `wedding-${randomUUID()}`,
    budgetMinor: 0,
    estimatedGuests: 1,
    createdAt: now,
    updatedAt: now,
  });
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "weddings.manage",
    action: "wedding.created",
    resourceType: "wedding",
    resourceId: String(result.insertedId),
    outcome: "success",
  });
  return NextResponse.json({ id: String(result.insertedId), status: "created" }, { status: 201 });
}

export async function PATCH(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "weddings.manage");
  if (authorization.error) return authorization.error;
  const parsed = weddingUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length <= 1) {
    return NextResponse.json(
      { message: "Provide a wedding and at least one changed field." },
      { status: 400 },
    );
  }
  const { weddingId, ...changes } = parsed.data;
  const result = await mongoDb
    .collection("weddingProfiles")
    .updateOne({ _id: new ObjectId(weddingId) }, { $set: { ...changes, updatedAt: new Date() } });
  if (!result.matchedCount)
    return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "weddings.manage",
    action: "wedding.updated",
    resourceType: "wedding",
    resourceId: weddingId,
    outcome: "success",
    changes: Object.fromEntries(
      Object.entries(changes).map(([key, value]) => [key, { before: "unknown", after: value }]),
    ),
  });
  return NextResponse.json({ status: "updated" });
}

export async function DELETE(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "weddings.manage");
  if (authorization.error) return authorization.error;
  const parsed = weddingDeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "Provide a valid wedding." }, { status: 400 });
  const weddingId = new ObjectId(parsed.data.weddingId);
  const wedding = await mongoDb
    .collection("weddingProfiles")
    .findOne({ _id: weddingId }, { projection: { weddingKey: 1 } });
  if (!wedding) return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  if (
    await mongoDb.collection("workspaceItems").findOne({ weddingKey: String(wedding.weddingKey) })
  ) {
    return NextResponse.json(
      { message: "This wedding has workspace data and cannot be deleted." },
      { status: 409 },
    );
  }
  await mongoDb.collection("weddingProfiles").deleteOne({ _id: weddingId });
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "weddings.manage",
    action: "wedding.deleted",
    resourceType: "wedding",
    resourceId: parsed.data.weddingId,
    outcome: "success",
  });
  return NextResponse.json({ status: "deleted" });
}
