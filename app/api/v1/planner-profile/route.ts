import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";

const schema = z.object({
  organisationName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(30).max(2_000),
  serviceArea: z.string().trim().min(2).max(180),
  teamSize: z.coerce.number().int().positive().max(10_000),
  yearsExperience: z.coerce.number().int().nonnegative().max(100),
  website: z.union([z.url(), z.literal("")]),
});

export async function PUT(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (authentication.session.user.role !== "Planner") {
    return NextResponse.json({ message: "Planner access is required." }, { status: 403 });
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
  const profile = await mongoDb.collection("plannerProfiles").findOneAndUpdate(
    { ownerUserId: authentication.session.user.id },
    {
      $set: { ...parsed.data, updatedAt: now },
      $setOnInsert: { ownerUserId: authentication.session.user.id, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  return NextResponse.json({ id: String(profile!.ownerUserId), ...parsed.data });
}
