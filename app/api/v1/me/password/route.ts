import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

// This endpoint only adds a password to accounts that currently have no credential login.
export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const parsed = passwordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Use at least 8 characters with a number and a symbol." },
      { status: 400 },
    );
  }
  const passwordAccount = await mongoDb.collection("account").findOne({
    userId: authentication.session.user.id,
    providerId: "credential",
  });
  if (passwordAccount) {
    return NextResponse.json(
      { message: "This account already has a password. Use the change-password form." },
      { status: 409 },
    );
  }
  await auth.api.setPassword({
    headers: request.headers,
    body: { newPassword: parsed.data.newPassword },
  });
  return NextResponse.json({ status: true });
}
