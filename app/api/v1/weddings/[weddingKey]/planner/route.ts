import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { weddingPlanningService } from "@/lib/vendors/services";

type RouteContext = { params: Promise<{ weddingKey: string }> };

async function requireWeddingOwner(request: Request, weddingKey: string) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return { error: authentication.error };
  const wedding = await mongoDb.collection("weddingProfiles").findOne({
    ownerUserId: authentication.session.user.id,
    weddingKey,
  });
  if (!wedding) {
    return {
      error: NextResponse.json({ message: "Wedding not found." }, { status: 404 }),
    };
  }
  return { session: authentication.session };
}

// Only the Couple that owns this wedding can view or revoke its assigned planners.
export async function GET(request: Request, context: RouteContext) {
  const { weddingKey } = await context.params;
  const owner = await requireWeddingOwner(request, weddingKey);
  if ("error" in owner) return owner.error;

  const collaborators = await mongoDb
    .collection("weddingCollaborators")
    .find({
      weddingKey,
      weddingOwnerUserId: owner.session.user.id,
      status: "Active",
      access: "FullManager",
      services: weddingPlanningService,
    })
    .project<{ userId: string }>({ userId: 1 })
    .toArray();
  const profiles = await mongoDb
    .collection("vendorProfiles")
    .find({ ownerUserId: { $in: collaborators.map(({ userId }) => userId) } })
    .project<{ ownerUserId: string; businessName: string; contactName: string }>({
      ownerUserId: 1,
      businessName: 1,
      contactName: 1,
    })
    .toArray();

  return NextResponse.json(
    collaborators.map(({ userId }) => {
      const profile = profiles.find(({ ownerUserId }) => ownerUserId === userId);
      return {
        userId,
        businessName: String(profile?.businessName ?? "Wedding planning business"),
        contactName: String(profile?.contactName ?? ""),
      };
    }),
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const { weddingKey } = await context.params;
  const owner = await requireWeddingOwner(request, weddingKey);
  if ("error" in owner) return owner.error;
  const parsed = z
    .object({ plannerUserId: z.string().min(1).max(200) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "A planner account is required." }, { status: 400 });
  }

  const collaboration = await mongoDb.collection("weddingCollaborators").findOne({
    weddingKey,
    weddingOwnerUserId: owner.session.user.id,
    userId: parsed.data.plannerUserId,
    status: "Active",
    access: "FullManager",
    services: weddingPlanningService,
  });
  if (!collaboration) {
    return NextResponse.json({ message: "Active wedding planner not found." }, { status: 404 });
  }

  const otherServices = Array.isArray(collaboration.services)
    ? collaboration.services.filter(
        (service: unknown) => service !== weddingPlanningService && typeof service === "string",
      )
    : [];
  await mongoDb.collection("weddingCollaborators").updateOne(
    {
      weddingKey,
      weddingOwnerUserId: owner.session.user.id,
      userId: parsed.data.plannerUserId,
      status: "Active",
      access: "FullManager",
      services: weddingPlanningService,
    },
    {
      $set: {
        services: otherServices,
        access: "Vendor",
        status: otherServices.length ? "Active" : "Revoked",
        updatedAt: new Date(),
      },
    },
  );
  await mongoDb.collection("vendorRequests").updateMany(
    {
      coupleUserId: owner.session.user.id,
      vendorUserId: parsed.data.plannerUserId,
      weddingKey,
      service: weddingPlanningService,
      status: "Accepted",
    },
    { $set: { status: "Revoked", updatedAt: new Date() } },
  );
  return NextResponse.json({ status: "Revoked" });
}
