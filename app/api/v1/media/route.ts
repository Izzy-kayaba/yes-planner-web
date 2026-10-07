import { GridFSBucket } from "mongodb";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumImageBytes = 5_000_000;

// Check file bytes, not only the browser-provided MIME type, before storing an image.
function matchesImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg")
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png")
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp")
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  return false;
}

export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (
    authentication.session.user.role !== "Vendor" &&
    authentication.session.user.role !== "Venue"
  ) {
    return NextResponse.json({ message: "A business account is required." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Select an image to upload." }, { status: 400 });
  }
  if (!allowedImageTypes.has(file.type) || file.size <= 0 || file.size > maximumImageBytes) {
    return NextResponse.json(
      { message: "Use a JPG, PNG or WebP image smaller than 5 MB." },
      { status: 400 },
    );
  }

  const recentUploads = await mongoDb.collection("vendorMedia.files").countDocuments({
    "metadata.ownerUserId": authentication.session.user.id,
    "metadata.uploadedAt": { $gte: new Date(Date.now() - 60 * 60 * 1_000) },
  });
  if (recentUploads >= 30) {
    return NextResponse.json(
      { message: "Upload limit reached. Try again later." },
      { status: 429 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(buffer, file.type)) {
    return NextResponse.json(
      { message: "The uploaded file is not a valid image." },
      { status: 400 },
    );
  }

  const bucket = new GridFSBucket(mongoDb, { bucketName: "vendorMedia" });
  const upload = bucket.openUploadStream(file.name.replace(/[^a-zA-Z0-9._-]/g, "-"), {
    contentType: file.type,
    metadata: {
      ownerUserId: authentication.session.user.id,
      visibility: "public-vendor-profile",
      uploadedAt: new Date(),
    },
  });
  await new Promise<void>((resolve, reject) => {
    upload.once("error", reject);
    upload.once("finish", () => resolve());
    upload.end(buffer);
  });

  return NextResponse.json(
    { id: upload.id.toString(), url: `/api/v1/media/${upload.id.toString()}` },
    { status: 201 },
  );
}
