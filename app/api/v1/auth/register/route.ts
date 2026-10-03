import { parsePhoneNumberFromString } from "libphonenumber-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isSelfServiceRole } from "@/lib/auth/roles";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  phoneNumber: z.string().trim(),
  password: z.string().min(8).max(128),
  role: z.string(),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isSelfServiceRole(parsed.data.role)) {
    return NextResponse.json(
      { message: "Please provide valid registration details." },
      { status: 400 },
    );
  }

  const phone = parsePhoneNumberFromString(parsed.data.phoneNumber);
  if (!phone?.isValid()) {
    return NextResponse.json({ message: "Enter a valid phone number." }, { status: 400 });
  }

  await ensureMongoIndexes();
  const phoneNumber = phone.number;
  const users = mongoDb.collection("user");
  if (await users.findOne({ phoneNumber }, { projection: { _id: 1 } })) {
    return NextResponse.json({ message: "Phone number already exists." }, { status: 409 });
  }

  const email = parsed.data.email.toLowerCase();
  const response = await auth.api.signUpEmail({
    body: {
      email,
      password: parsed.data.password,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
    },
    headers: request.headers,
    asResponse: true,
  });

  if (!response.ok) return response;

  await users.updateOne(
    { email },
    {
      $set: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phoneNumber,
        role: parsed.data.role,
        updatedAt: new Date(),
      },
    },
  );

  return response;
}
