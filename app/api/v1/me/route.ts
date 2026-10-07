import { parsePhoneNumberFromString } from "libphonenumber-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phoneNumber: z.string().trim(),
  whatsappNotifications: z.boolean().default(false),
});

function profile(document: Record<string, unknown>) {
  return {
    id: String(document._id),
    name: document.name,
    firstName: document.firstName ?? "",
    lastName: document.lastName ?? "",
    email: document.email,
    phoneNumber: document.phoneNumber ?? "",
    whatsappNotifications: document.whatsappNotifications === true,
    role: document.role,
    accountType: document.accountType ?? (document.role === "Planner" ? "Vendor" : document.role),
    image: document.image ?? null,
  };
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers, { allowIncompleteProfile: true });
  if ("error" in authentication) return authentication.error;
  const user = await mongoDb
    .collection("user")
    .findOne({ email: authentication.session.user.email });
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });
  return NextResponse.json(profile(user));
}

export async function PATCH(request: Request) {
  const authentication = await requireApiSession(request.headers, { allowIncompleteProfile: true });
  if ("error" in authentication) return authentication.error;
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Please provide valid profile details." }, { status: 400 });
  }
  const phone = parsePhoneNumberFromString(parsed.data.phoneNumber);
  if (!phone?.isValid()) {
    return NextResponse.json({ message: "Enter a valid phone number." }, { status: 400 });
  }
  const update = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    name: `${parsed.data.firstName} ${parsed.data.lastName}`,
    phoneNumber: phone.number,
    whatsappNotifications: parsed.data.whatsappNotifications,
    updatedAt: new Date(),
  };
  let user;
  try {
    user = await mongoDb
      .collection("user")
      .findOneAndUpdate(
        { email: authentication.session.user.email },
        { $set: update },
        { returnDocument: "after" },
      );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { message: "That phone number is already in use." },
        { status: 409 },
      );
    }
    throw error;
  }
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });
  return NextResponse.json(profile(user));
}
