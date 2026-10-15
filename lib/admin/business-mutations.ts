// Purpose: implements safe platform CRUD for public business and venue profiles.
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { isVendorService, weddingPlanningService } from "@/lib/vendors/services";
import { mongoDb } from "@/lib/mongodb";

const businessFields = {
  businessName: z.string().trim().min(2).max(160),
  services: z.array(z.string()).min(1).max(10),
  serviceArea: z.string().trim().min(2).max(180),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .regex(/^[A-Z]{2}$/),
  published: z.boolean().default(false),
};
const businessFieldsSchema = z.object(businessFields);

const businessCreateSchema = z.object({
  ...businessFields,
  ownerUserId: z.string().trim().min(1).max(128).optional(),
});
const businessUpdateSchema = z.object({
  businessId: z.string().regex(/^[a-f\d]{24}$/i),
  ...businessFieldsSchema.partial().shape,
});
const businessDeleteSchema = z.object({
  businessId: z.string().regex(/^[a-f\d]{24}$/i),
});

function validateServices(services: string[], venuesOnly: boolean) {
  return (
    services.every(isVendorService) &&
    (!venuesOnly || services.includes("Venue")) &&
    !(venuesOnly && services.includes(weddingPlanningService))
  );
}

export async function handleAdminBusinessMutation(
  request: Request,
  venuesOnly: boolean,
  method: "POST" | "PATCH" | "DELETE",
) {
  const permission = venuesOnly ? "venues.manage" : "businesses.manage";
  const authorization = await requirePlatformApiPermission(request.headers, permission);
  if (authorization.error) return authorization.error;

  if (method === "POST") {
    const parsed = businessCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !validateServices(parsed.data.services, venuesOnly)) {
      return NextResponse.json(
        { message: "Provide valid business details and services." },
        { status: 400 },
      );
    }
    const now = new Date();
    const result = await mongoDb.collection("vendorProfiles").insertOne({
      ...parsed.data,
      claimed: Boolean(parsed.data.ownerUserId),
      seeded: false,
      createdAt: now,
      updatedAt: now,
    });
    await recordAdminAuditEvent({
      actorUserId: authorization.session.user.id,
      permission,
      action: venuesOnly ? "venue.created" : "business.created",
      resourceType: venuesOnly ? "venue" : "business",
      resourceId: String(result.insertedId),
      outcome: "success",
    });
    return NextResponse.json({ id: String(result.insertedId), status: "created" }, { status: 201 });
  }

  const input = await request.json().catch(() => null);
  const parsed =
    method === "PATCH"
      ? businessUpdateSchema.safeParse(input)
      : businessDeleteSchema.safeParse(input);
  if (!parsed.success)
    return NextResponse.json({ message: "Provide valid business details." }, { status: 400 });
  const businessId = new ObjectId(String(parsed.data.businessId));
  const collection = mongoDb.collection("vendorProfiles");
  const existing = await collection.findOne({ _id: businessId });
  if (!existing) return NextResponse.json({ message: "Business not found." }, { status: 404 });

  if (method === "PATCH") {
    const { businessId: ignored, ...changes } = parsed.data as z.infer<typeof businessUpdateSchema>;
    if (
      !Object.keys(changes).length ||
      (changes.services && !validateServices(changes.services, venuesOnly))
    ) {
      return NextResponse.json(
        { message: "Provide at least one valid changed field." },
        { status: 400 },
      );
    }
    await collection.updateOne(
      { _id: businessId },
      { $set: { ...changes, updatedAt: new Date() } },
    );
    await recordAdminAuditEvent({
      actorUserId: authorization.session.user.id,
      permission,
      action: venuesOnly ? "venue.updated" : "business.updated",
      resourceType: venuesOnly ? "venue" : "business",
      resourceId: String(parsed.data.businessId),
      outcome: "success",
      changes: Object.fromEntries(
        Object.entries(changes).map(([key, value]) => [
          key,
          { before: existing[key], after: value },
        ]),
      ),
    });
    return NextResponse.json({ status: "updated" });
  }

  if (existing.ownerUserId || existing.claimed === true) {
    return NextResponse.json({ message: "Claimed businesses cannot be deleted." }, { status: 409 });
  }
  await collection.deleteOne({ _id: businessId });
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission,
    action: venuesOnly ? "venue.deleted" : "business.deleted",
    resourceType: venuesOnly ? "venue" : "business",
    resourceId: String(parsed.data.businessId),
    outcome: "success",
  });
  return NextResponse.json({ status: "deleted" });
}
