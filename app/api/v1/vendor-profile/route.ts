import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { isVendorService } from "@/lib/vendors/services";
import { vendorPriceRanges } from "@/lib/estimate-ranges";

const imageSchema = z
  .string()
  .max(120)
  .regex(/^\/api\/v1\/media\/[a-f0-9]{24}$/, "Invalid image reference.");

const profileSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(30).max(2_000),
  services: z.array(z.string()).min(1).max(10),
  serviceArea: z.string().trim().min(2).max(180),
  startingPriceMinor: z.coerce.number().int().nonnegative().max(100_000_000_000),
  startingPriceRangeKey: z
    .string()
    .refine((value) => vendorPriceRanges.some((range) => range.id === value)),
  website: z.union([z.url(), z.literal("")]),
  instagramHandle: z.string().trim().max(80),
  profileImage: z.union([imageSchema, z.literal("")]),
  portfolioImages: z.array(imageSchema).max(6),
});

function publicProfile(document: Record<string, unknown>) {
  return {
    id: String(document.ownerUserId),
    businessName: document.businessName,
    contactName: document.contactName,
    bio: document.bio,
    services: document.services,
    serviceArea: document.serviceArea,
    startingPriceMinor: document.startingPriceMinor,
    startingPriceRangeKey: document.startingPriceRangeKey ?? "",
    website: document.website ?? "",
    instagramHandle: document.instagramHandle ?? "",
    profileImage: document.profileImage ?? "",
    portfolioImages: document.portfolioImages ?? [],
  };
}

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const profile = await mongoDb
    .collection("vendorProfiles")
    .findOne({ ownerUserId: authentication.session.user.id });
  return NextResponse.json(profile ? publicProfile(profile) : null);
}

export async function PUT(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (
    !(["Vendor", "Venue"] as const).includes(authentication.session.user.role as "Vendor" | "Venue")
  ) {
    return NextResponse.json({ message: "A business account is required." }, { status: 403 });
  }
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.services.some((service) => !isVendorService(service))) {
    return NextResponse.json(
      { message: "Please complete all required vendor profile details." },
      { status: 400 },
    );
  }
  if (authentication.session.user.role === "Venue" && !parsed.data.services.includes("Venue")) {
    return NextResponse.json(
      { message: "A venue account must include the Venue service." },
      { status: 400 },
    );
  }
  const mediaUrls = [parsed.data.profileImage, ...parsed.data.portfolioImages].filter(Boolean);
  const mediaIds = mediaUrls.map((url) => new ObjectId(url.split("/").at(-1)!));
  const ownedMediaCount = await mongoDb.collection("vendorMedia.files").countDocuments({
    _id: { $in: mediaIds },
    "metadata.ownerUserId": authentication.session.user.id,
  });
  if (ownedMediaCount !== mediaIds.length) {
    return NextResponse.json({ message: "One or more images are not available." }, { status: 400 });
  }
  await ensureMongoIndexes();
  const now = new Date();
  const profile = await mongoDb.collection("vendorProfiles").findOneAndUpdate(
    { ownerUserId: authentication.session.user.id },
    {
      $set: { ...parsed.data, published: true, updatedAt: now },
      $setOnInsert: { ownerUserId: authentication.session.user.id, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  return NextResponse.json(publicProfile(profile!));
}
