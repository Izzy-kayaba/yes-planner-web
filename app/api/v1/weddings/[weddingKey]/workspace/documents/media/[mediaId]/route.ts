import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { mongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ weddingKey: string; mediaId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const { weddingKey, mediaId } = await context.params;
  const weddingAccess = await resolveWeddingAccess(authentication.session, weddingKey);
  if (!weddingAccess || !ObjectId.isValid(mediaId)) return new NextResponse(null, { status: 404 });
  const id = new ObjectId(mediaId);
  const file = await mongoDb.collection("workspaceMedia.files").findOne({
    _id: id,
    "metadata.ownerUserId": weddingAccess.ownerUserId,
    "metadata.weddingKey": weddingKey,
    "metadata.visibility": "private-workspace-document",
  });
  if (!file) return new NextResponse(null, { status: 404 });
  const stream = Readable.toWeb(
    new GridFSBucket(mongoDb, { bucketName: "workspaceMedia" }).openDownloadStream(id),
  ) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": String(file.contentType ?? "application/octet-stream"),
      "Content-Length": String(file.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
