import { GridFSBucket } from "mongodb";
import { NextResponse } from "next/server";
import { canUseWorkspaceModule } from "@/lib/auth/permissions";
import { requireApiSession } from "@/lib/auth/session";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { mongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

const allowedTypes = new Set([
  "application/pdf",
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maximumBytes = 10_000_000;
type RouteContext = { params: Promise<{ weddingKey: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const { weddingKey } = await context.params;
  const weddingAccess = await resolveWeddingAccess(authentication.session, weddingKey);
  if (!weddingAccess) return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  if (
    !canUseWorkspaceModule(
      authentication.session.user.role,
      "documents",
      "create",
      weddingAccess.access,
    )
  ) {
    return NextResponse.json(
      { message: "You do not have permission to upload documents." },
      { status: 403 },
    );
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Select a PDF or image to upload." }, { status: 400 });
  }
  if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > maximumBytes) {
    return NextResponse.json(
      { message: "Use a PDF or image smaller than 10 MB." },
      { status: 400 },
    );
  }

  const bucket = new GridFSBucket(mongoDb, { bucketName: "workspaceMedia" });
  const upload = bucket.openUploadStream(file.name.replace(/[^a-zA-Z0-9._-]/g, "-"), {
    contentType: file.type,
    metadata: {
      ownerUserId: weddingAccess.ownerUserId,
      weddingKey,
      visibility: "private-workspace-document",
    },
  });
  await new Promise<void>((resolve, reject) => {
    upload.once("error", reject);
    upload.once("finish", resolve);
    file
      .arrayBuffer()
      .then((bytes) => upload.end(Buffer.from(bytes)))
      .catch(reject);
  });

  return NextResponse.json(
    {
      url: `/api/v1/weddings/${encodeURIComponent(weddingKey)}/workspace/documents/media/${upload.id.toString()}`,
    },
    { status: 201 },
  );
}
