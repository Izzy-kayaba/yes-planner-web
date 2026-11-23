import { MongoServerError } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import {
  defaultPublicSlug,
  publicationFromProfile,
  publicationStatuses,
} from "@/lib/wedding-publication";

type RouteContext = { params: Promise<{ weddingKey: string }> };

const publicationSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  partnerName: z.string().trim().max(120).optional(),
  weddingDate: z.iso.date().optional(),
  hashtag: z.string().trim().max(80).default(""),
  story: z.string().trim().max(5_000).default(""),
  venue: z.string().trim().max(180).optional(),
  venueAddress: z.string().trim().max(300).default(""),
  directionsUrl: z.string().trim().url().or(z.literal("")).default(""),
  mapUrl: z.string().trim().url().or(z.literal("")).default(""),
  theme: z
    .enum(["rose", "blush", "terracotta", "sage", "ocean", "lavender", "night"])
    .default("rose"),
  action: z.enum(["save", "publish", "unpublish"]).default("save"),
});

async function authorize(request: Request, weddingKey: string) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return { error: authentication.error };
  const access = await resolveWeddingAccess(authentication.session, weddingKey);
  if (!access || !["Owner", "FullManager"].includes(access.access)) {
    return {
      error: NextResponse.json(
        { message: "You cannot manage this wedding website." },
        { status: 403 },
      ),
    };
  }
  return { session: authentication.session, access };
}

export async function GET(request: Request, context: RouteContext) {
  const { weddingKey } = await context.params;
  const authorization = await authorize(request, weddingKey);
  if (authorization.error) return authorization.error;
  const profile = await mongoDb.collection("weddingProfiles").findOne({
    ownerUserId: authorization.access.ownerUserId,
    weddingKey,
  });
  if (!profile) return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  const publication = publicationFromProfile(profile);
  publication.publicSlug ||= defaultPublicSlug(publication.displayName, publication.weddingDate);
  return NextResponse.json(publication);
}

export async function PUT(request: Request, context: RouteContext) {
  const { weddingKey } = await context.params;
  const authorization = await authorize(request, weddingKey);
  if (authorization.error) return authorization.error;
  const parsed = publicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Complete the required wedding website details." },
      { status: 400 },
    );
  }
  const profileFilter = { ownerUserId: authorization.access.ownerUserId, weddingKey };
  const current = await mongoDb.collection("weddingProfiles").findOne(profileFilter);
  if (!current) return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  const displayName = parsed.data.displayName ?? String(current.displayName ?? "");
  const partnerName = parsed.data.partnerName ?? String(current.partnerName ?? "");
  const weddingDate = parsed.data.weddingDate ?? String(current.weddingDate ?? "");
  const hashtag = parsed.data.hashtag;
  const story = parsed.data.story;
  const venue = parsed.data.venue ?? String(current.venue ?? "");
  const venueAddress = parsed.data.venueAddress || String(current.venueAddress ?? "");
  const requestedSlug =
    String(current.publicSlug ?? "") || defaultPublicSlug(displayName, weddingDate);
  if (!requestedSlug)
    return NextResponse.json({ message: "Choose a valid public address." }, { status: 400 });
  const status =
    parsed.data.action === "publish"
      ? "Published"
      : parsed.data.action === "unpublish"
        ? "Unpublished"
        : publicationStatuses.includes(
              current.publicationStatus as (typeof publicationStatuses)[number],
            )
          ? current.publicationStatus
          : "Draft";
  if (
    parsed.data.action === "publish" &&
    (!displayName || !weddingDate || !venue || !venueAddress)
  ) {
    return NextResponse.json(
      { message: "Add the venue and full address before publishing." },
      { status: 400 },
    );
  }
  try {
    await ensureMongoIndexes();
    const updated = await mongoDb.collection("weddingProfiles").findOneAndUpdate(
      profileFilter,
      {
        $set: {
          displayName,
          partnerName,
          weddingDate,
          hashtag,
          story,
          venue,
          venueAddress,
          directionsUrl: parsed.data.directionsUrl,
          mapUrl: parsed.data.mapUrl,
          publicTheme: parsed.data.theme,
          publicSlug: requestedSlug,
          publicationStatus: status,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    return NextResponse.json(publicationFromProfile(updated!));
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { message: "That public address is already in use." },
        { status: 409 },
      );
    }
    throw error;
  }
}
