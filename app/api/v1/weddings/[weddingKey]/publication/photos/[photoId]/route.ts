import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";

type RouteContext = { params: Promise<{ weddingKey: string; photoId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { weddingKey, photoId } = await context.params;
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const access = await resolveWeddingAccess(authentication.session, weddingKey);
  if (!access || !["Owner", "FullManager"].includes(access.access))
    return NextResponse.json(
      { message: "You cannot manage this wedding website." },
      { status: 403 },
    );
  if (!ObjectId.isValid(photoId))
    return NextResponse.json({ message: "Photo not found." }, { status: 404 });
  const filter = { ownerUserId: access.ownerUserId, weddingKey };
  const profile = await mongoDb.collection("weddingProfiles").findOne(filter);
  const photos = Array.isArray(profile?.publicPhotos) ? profile.publicPhotos : [];
  const remaining = photos.filter(
    (photo) => String((photo as Record<string, unknown>).id) !== photoId,
  );
  if (remaining.length === photos.length)
    return NextResponse.json({ message: "Photo not found." }, { status: 404 });
  await mongoDb.collection("weddingProfiles").updateOne(filter, {
    $set: {
      publicPhotos: remaining.map((photo, index) => ({
        ...photo,
        sortOrder: index,
        isCover: index === 0,
      })),
      updatedAt: new Date(),
    },
  });
  await new GridFSBucket(mongoDb, { bucketName: "weddingMedia" })
    .delete(new ObjectId(photoId))
    .catch(() => undefined);
  return new NextResponse(null, { status: 204 });
}
