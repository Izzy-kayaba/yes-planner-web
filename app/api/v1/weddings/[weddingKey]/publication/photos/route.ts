import { GridFSBucket } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { publicationFromProfile } from "@/lib/wedding-publication";
import { z } from "zod";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ weddingKey: string }> };
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumImageBytes = 8_000_000;

function matchesImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg")
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png")
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

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

export async function POST(request: Request, context: RouteContext) {
  const { weddingKey } = await context.params;
  const authorization = await authorize(request, weddingKey);
  if (authorization.error) return authorization.error;
  const profileFilter = { ownerUserId: authorization.access.ownerUserId, weddingKey };
  const profile = await mongoDb.collection("weddingProfiles").findOne(profileFilter);
  if (!profile) return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  const existing = publicationFromProfile(profile).photos;
  if (existing.length >= 30)
    return NextResponse.json({ message: "You can add up to 30 photos." }, { status: 400 });
  const file = (await request.formData()).get("file");
  if (
    !(file instanceof File) ||
    !allowedImageTypes.has(file.type) ||
    file.size <= 0 ||
    file.size > maximumImageBytes
  ) {
    return NextResponse.json(
      { message: "Use a JPG, PNG or WebP image smaller than 8 MB." },
      { status: 400 },
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(buffer, file.type))
    return NextResponse.json(
      { message: "The uploaded file is not a valid image." },
      { status: 400 },
    );
  const bucket = new GridFSBucket(mongoDb, { bucketName: "weddingMedia" });
  const id = crypto.randomUUID();
  const upload = bucket.openUploadStream(`${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, {
    contentType: file.type,
    metadata: {
      ownerUserId: authorization.access.ownerUserId,
      weddingKey,
      visibility: "public-wedding",
      uploadedAt: new Date(),
    },
  });
  await new Promise<void>((resolve, reject) => {
    upload.once("error", reject);
    upload.once("finish", resolve);
    upload.end(buffer);
  });
  const photo = {
    id: upload.id.toString(),
    url: `/api/v1/public/wedding-media/${upload.id.toString()}`,
    alt:
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim() || "Wedding photograph",
    sortOrder: existing.length,
    isCover: existing.length === 0,
  };
  await mongoDb.collection("weddingProfiles").updateOne(profileFilter, {
    $set: { publicPhotos: [...existing, photo], updatedAt: new Date() },
  });
  return NextResponse.json(photo, { status: 201 });
}

export async function PUT(request: Request, context: RouteContext) {
  const { weddingKey } = await context.params;
  const authorization = await authorize(request, weddingKey);
  if (authorization.error) return authorization.error;
  const parsed = z
    .object({
      photos: z
        .array(z.object({ id: z.string(), alt: z.string().max(200), isCover: z.boolean() }))
        .max(30),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "The photo arrangement is invalid." }, { status: 400 });
  const filter = { ownerUserId: authorization.access.ownerUserId, weddingKey };
  const profile = await mongoDb.collection("weddingProfiles").findOne(filter);
  if (!profile) return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  const existing = publicationFromProfile(profile).photos;
  const existingIds = new Set(existing.map((photo) => photo.id));
  if (
    parsed.data.photos.length !== existing.length ||
    parsed.data.photos.some((photo) => !existingIds.has(photo.id))
  ) {
    return NextResponse.json({ message: "The photo arrangement is out of date." }, { status: 409 });
  }
  const coverId =
    parsed.data.photos.find((photo) => photo.isCover)?.id ?? parsed.data.photos[0]?.id;
  const photos = parsed.data.photos.map((photo, index) => ({
    ...photo,
    sortOrder: index,
    isCover: photo.id === coverId,
    url: existing.find((item) => item.id === photo.id)?.url ?? "",
  }));
  await mongoDb
    .collection("weddingProfiles")
    .updateOne(filter, { $set: { publicPhotos: photos, updatedAt: new Date() } });
  return NextResponse.json(photos);
}
