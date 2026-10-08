import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { platformStaffRoles } from "@/lib/auth/roles";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const acceptSchema = z.object({
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

type RouteContext = { params: Promise<{ token: string }> };

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function findPendingInvitation(token: string) {
  if (!tokenSchema.safeParse(token).success) return null;
  await ensureMongoIndexes();
  return mongoDb.collection("platformStaffInvitations").findOne({
    tokenHash: tokenHash(token),
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const invitation = await findPendingInvitation(token);
  if (
    !invitation ||
    typeof invitation.email !== "string" ||
    typeof invitation.firstName !== "string" ||
    typeof invitation.lastName !== "string" ||
    typeof invitation.role !== "string" ||
    !platformStaffRoles.includes(invitation.role as (typeof platformStaffRoles)[number])
  ) {
    return NextResponse.json(
      { message: "This platform invitation is invalid or has expired." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    email: invitation.email,
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    role: invitation.role,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const parsed = acceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Choose a password with at least 8 characters, a number, and a symbol." },
      { status: 400 },
    );
  }

  const invitation = await findPendingInvitation(token);
  if (!invitation || typeof invitation.email !== "string") {
    return NextResponse.json(
      { message: "This platform invitation is invalid or has expired." },
      { status: 404 },
    );
  }
  if (
    typeof invitation.firstName !== "string" ||
    typeof invitation.lastName !== "string" ||
    typeof invitation.role !== "string" ||
    !platformStaffRoles.includes(invitation.role as (typeof platformStaffRoles)[number])
  ) {
    return NextResponse.json({ message: "This platform invitation is invalid." }, { status: 400 });
  }

  const invitations = mongoDb.collection("platformStaffInvitations");
  const invitationId = invitation._id as ObjectId;
  const claim = await invitations.updateOne(
    {
      _id: invitationId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    },
    { $set: { status: "redeeming", redeemingAt: new Date() } },
  );
  if (!claim.matchedCount) {
    return NextResponse.json(
      { message: "This platform invitation has already been used." },
      { status: 409 },
    );
  }

  const users = mongoDb.collection("user");
  if (await users.findOne({ email: invitation.email }, { projection: { _id: 1 } })) {
    await invitations.updateOne(
      { _id: invitationId, status: "redeeming" },
      { $set: { status: "pending" }, $unset: { redeemingAt: "" } },
    );
    return NextResponse.json(
      {
        message: "An account already exists with this email. Contact an administrator for access.",
      },
      { status: 409 },
    );
  }

  let signupResponse: Response;
  try {
    signupResponse = await auth.api.signUpEmail({
      body: {
        email: invitation.email,
        password: parsed.data.password,
        name: `${invitation.firstName} ${invitation.lastName}`,
      },
      headers: request.headers,
      asResponse: true,
    });
  } catch (error) {
    await invitations.updateOne(
      { _id: invitationId, status: "redeeming" },
      { $set: { status: "pending" }, $unset: { redeemingAt: "" } },
    );
    console.error("Platform invitation account creation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { message: "Account creation is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }

  if (!signupResponse.ok) {
    await invitations.updateOne(
      { _id: invitationId, status: "redeeming" },
      { $set: { status: "pending" }, $unset: { redeemingAt: "" } },
    );
    return signupResponse;
  }

  const userResult = await users.updateOne(
    { email: invitation.email },
    {
      $set: {
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: "Guest",
        accountType: "Guest",
        platformRoles: [invitation.role],
        updatedAt: new Date(),
      },
    },
  );
  if (!userResult.matchedCount) {
    await invitations.updateOne(
      { _id: invitationId, status: "redeeming" },
      { $set: { status: "failed" } },
    );
    console.error("Platform invitation account role assignment failed", {
      invitationId: String(invitationId),
    });
    return NextResponse.json(
      {
        message:
          "Your account was created, but platform access could not be assigned. Contact an administrator.",
      },
      { status: 500 },
    );
  }

  const acceptedAt = new Date();
  await invitations.updateOne(
    { _id: invitationId, status: "redeeming" },
    { $set: { status: "accepted", acceptedAt }, $unset: { redeemingAt: "" } },
  );
  const user = await users.findOne({ email: invitation.email }, { projection: { _id: 1 } });
  if (!user) {
    return NextResponse.json(
      { message: "Your platform account could not be confirmed. Contact an administrator." },
      { status: 500 },
    );
  }
  await recordAdminAuditEvent({
    actorUserId: String(user._id),
    permission: "platform_staff.invite",
    action: "platform_staff.invitation_accepted",
    resourceType: "platform_staff_invitation",
    resourceId: String(invitationId),
    outcome: "success",
  });
  return NextResponse.json({ status: "created" }, { status: 201 });
}
