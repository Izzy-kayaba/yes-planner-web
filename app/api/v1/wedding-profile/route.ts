import { randomUUID } from "node:crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { MongoServerError } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { budgetRanges, guestRanges } from "@/lib/estimate-ranges";

const weddingProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  partnerName: z.string().trim().min(2).max(120),
  displayName: z.string().trim().max(100).optional(),
  weddingDate: z.iso.date(),
  venue: z.string().trim().min(2).max(180),
  location: z
    .string()
    .trim()
    .length(2)
    .regex(/^[A-Z]{2}$/, "Select a valid wedding country."),
  budgetMinor: z.coerce.number().int().positive().max(100_000_000_000),
  budgetRangeKey: z.string().refine((value) => budgetRanges.some((range) => range.id === value)),
  estimatedGuests: z.coerce.number().int().positive().max(100_000),
  guestRangeKey: z.string().refine((value) => guestRanges.some((range) => range.id === value)),
  weddingStyle: z.string().trim().max(120).default(""),
  planningNotes: z.string().trim().max(2_000).default(""),
  phoneNumber: z.string().trim().optional(),
});

function publicProfile(document: Record<string, unknown>, user: Record<string, unknown>) {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phoneNumber: user.phoneNumber ?? "",
    weddingKey: document.weddingKey,
    partnerName: document.partnerName,
    displayName: document.displayName,
    weddingDate: document.weddingDate,
    venue: document.venue,
    location: document.location,
    budgetMinor: document.budgetMinor,
    budgetRangeKey: document.budgetRangeKey ?? "",
    estimatedGuests: document.estimatedGuests,
    guestRangeKey: document.guestRangeKey ?? "",
    weddingStyle: document.weddingStyle ?? "",
    planningNotes: document.planningNotes ?? "",
  };
}

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const [user, wedding] = await Promise.all([
    mongoDb.collection("user").findOne({ email: authentication.session.user.email }),
    mongoDb.collection("weddingProfiles").findOne({ ownerUserId: authentication.session.user.id }),
  ]);
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });
  return NextResponse.json(wedding ? publicProfile(wedding, user) : null);
}

export async function PUT(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (authentication.session.user.role !== "Couple") {
    return NextResponse.json(
      { message: "Only couple accounts can maintain a wedding profile." },
      { status: 403 },
    );
  }

  const parsed = weddingProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please complete all required wedding details." },
      { status: 400 },
    );
  }

  const current = await mongoDb
    .collection("weddingProfiles")
    .findOne({ ownerUserId: authentication.session.user.id });
  const phone = parsed.data.phoneNumber
    ? parsePhoneNumberFromString(parsed.data.phoneNumber)
    : undefined;
  if (parsed.data.phoneNumber && !phone?.isValid()) {
    return NextResponse.json({ message: "Enter a valid phone number." }, { status: 400 });
  }

  await ensureMongoIndexes();
  const now = new Date();
  const weddingKey = String(current?.weddingKey ?? `wedding-${randomUUID()}`);
  const displayName = (
    parsed.data.displayName || `${parsed.data.firstName} & ${parsed.data.partnerName}`
  ).slice(0, 100);
  const userUpdate: Record<string, unknown> = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    name: `${parsed.data.firstName} ${parsed.data.lastName}`,
    updatedAt: now,
  };
  if (phone) userUpdate.phoneNumber = phone.number;

  try {
    await mongoDb
      .collection("user")
      .updateOne({ email: authentication.session.user.email }, { $set: userUpdate });
    const wedding = await mongoDb.collection("weddingProfiles").findOneAndUpdate(
      { ownerUserId: authentication.session.user.id },
      {
        $set: {
          partnerName: parsed.data.partnerName,
          displayName,
          weddingDate: parsed.data.weddingDate,
          venue: parsed.data.venue,
          location: parsed.data.location,
          budgetMinor: parsed.data.budgetMinor,
          budgetRangeKey: parsed.data.budgetRangeKey,
          estimatedGuests: parsed.data.estimatedGuests,
          guestRangeKey: parsed.data.guestRangeKey,
          weddingStyle: parsed.data.weddingStyle,
          planningNotes: parsed.data.planningNotes,
          updatedAt: now,
        },
        $setOnInsert: {
          ownerUserId: authentication.session.user.id,
          weddingKey,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    return NextResponse.json(
      publicProfile(wedding!, { ...userUpdate, phoneNumber: phone?.number }),
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { message: "That phone number is already linked to another account." },
        { status: 409 },
      );
    }
    throw error;
  }
}
