import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { mongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await context.params;
  if (!ObjectId.isValid(mediaId)) return new NextResponse(null, { status: 404 });
  const id = new ObjectId(mediaId);
  const file = await mongoDb
    .collection("weddingMedia.files")
    .findOne({ _id: id, "metadata.visibility": "public-wedding" });
  if (!file) return new NextResponse(null, { status: 404 });
  const stream = Readable.toWeb(
    new GridFSBucket(mongoDb, { bucketName: "weddingMedia" }).openDownloadStream(id),
  ) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": String(file.contentType ?? "application/octet-stream"),
      "Content-Length": String(file.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
