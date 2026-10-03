import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ mediaId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  if (!ObjectId.isValid(mediaId)) return new NextResponse(null, { status: 404 });
  const id = new ObjectId(mediaId);
  const file = await mongoDb.collection("vendorMedia.files").findOne({
    _id: id,
    "metadata.visibility": "public-vendor-profile",
  });
  if (!file) return new NextResponse(null, { status: 404 });
  const bucket = new GridFSBucket(mongoDb, { bucketName: "vendorMedia" });
  const stream = Readable.toWeb(bucket.openDownloadStream(id)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": String(file.contentType ?? "application/octet-stream"),
      "Content-Length": String(file.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const { mediaId } = await context.params;
  if (!ObjectId.isValid(mediaId))
    return NextResponse.json({ message: "Image not found." }, { status: 404 });
  const id = new ObjectId(mediaId);
  const file = await mongoDb.collection("vendorMedia.files").findOne({
    _id: id,
    "metadata.ownerUserId": authentication.session.user.id,
  });
  if (!file) return NextResponse.json({ message: "Image not found." }, { status: 404 });
  await new GridFSBucket(mongoDb, { bucketName: "vendorMedia" }).delete(id);
  return new NextResponse(null, { status: 204 });
}
