import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { weddingPlanningService } from "@/lib/vendors/services";

const schema = z.object({
  organisationName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(30).max(2_000),
  serviceArea: z.string().trim().min(2).max(180),
  teamSize: z.coerce.number().int().positive().max(10_000),
  yearsExperience: z.coerce.number().int().nonnegative().max(100),
  website: z.union([z.url(), z.literal("")]),
});

// Compatibility endpoint: save legacy planner fields into the Vendor profile model.
export async function PUT(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (authentication.session.user.role !== "Vendor") {
    return NextResponse.json({ message: "A vendor account is required." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Complete all required planner details." },
      { status: 400 },
    );
  }
  await ensureMongoIndexes();
  const now = new Date();
  const profile = await mongoDb.collection("vendorProfiles").findOneAndUpdate(
    { ownerUserId: authentication.session.user.id },
    {
      $set: {
        businessName: parsed.data.organisationName,
        contactName: parsed.data.contactName,
        bio: parsed.data.bio,
        serviceArea: parsed.data.serviceArea,
        website: parsed.data.website,
        published: true,
        updatedAt: now,
      },
      $addToSet: { services: weddingPlanningService },
      $setOnInsert: {
        ownerUserId: authentication.session.user.id,
        startingPriceMinor: 0,
        startingPriceRangeKey: "under-500",
        instagramHandle: "",
        profileImage: "",
        portfolioImages: [],
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  return NextResponse.json({
    id: String(profile!.ownerUserId),
    ...parsed.data,
    accountType: "Vendor",
    services: profile!.services,
  });
}
