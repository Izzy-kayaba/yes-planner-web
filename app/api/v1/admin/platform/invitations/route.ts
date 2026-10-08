import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { canInvitePlatformStaffRole } from "@/lib/auth/platform-permissions";
import { platformStaffRoles } from "@/lib/auth/roles";
import { sendPlatformStaffInvitationEmail } from "@/lib/email";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";

const invitationSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  role: z.enum(platformStaffRoles),
});

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1_000;

export async function POST(request: Request) {
  const authorization = await requirePlatformApiPermission(
    request.headers,
    "platform_staff.invite",
  );
  if (authorization.error) return authorization.error;

  const parsed = invitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide a valid name, email address, and platform role." },
      { status: 400 },
    );
  }
  if (!canInvitePlatformStaffRole(authorization.access.roles, parsed.data.role)) {
    return NextResponse.json(
      { message: "Only a Super Admin can invite another Super Admin." },
      { status: 403 },
    );
  }

  await ensureMongoIndexes();
  const email = parsed.data.email.toLowerCase();
  const users = mongoDb.collection("user");
  if (await users.findOne({ email }, { projection: { _id: 1 } })) {
    return NextResponse.json(
      { message: "An account already exists with this email. Assign its platform role instead." },
      { status: 409 },
    );
  }

  const invitations = mongoDb.collection("platformStaffInvitations");
  const now = new Date();
  const existingInvitation = await invitations.findOne({
    email,
    status: "pending",
    expiresAt: { $gt: now },
  });
  if (existingInvitation) {
    return NextResponse.json(
      { message: "A platform invitation is already pending for this email." },
      { status: 409 },
    );
  }

  const token = randomBytes(32).toString("base64url");
  const result = await invitations.insertOne({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email,
    role: parsed.data.role,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    status: "pending",
    invitedBy: authorization.session.user.id,
    createdAt: now,
    expiresAt: new Date(now.getTime() + invitationLifetimeMs),
  });

  const baseUrl = process.env.BETTER_AUTH_URL ?? new URL(request.url).origin;
  const invitationUrl = new URL(`/platform-invite/${token}`, baseUrl).toString();
  try {
    await sendPlatformStaffInvitationEmail(
      email,
      authorization.session.user.name || "A Yes Planner administrator",
      parsed.data.role,
      invitationUrl,
    );
  } catch (error) {
    await invitations.deleteOne({ _id: result.insertedId, status: "pending" });
    await recordAdminAuditEvent({
      actorUserId: authorization.session.user.id,
      permission: "platform_staff.invite",
      action: "platform_staff.invitation_email_failed",
      resourceType: "platform_staff_invitation",
      resourceId: String(result.insertedId),
      outcome: "failure",
    });
    console.error("Platform staff invitation email delivery failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      {
        message: "The invitation email could not be sent. Check email configuration and try again.",
      },
      { status: 502 },
    );
  }

  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "platform_staff.invite",
    action: "platform_staff.invitation_created",
    resourceType: "platform_staff_invitation",
    resourceId: String(result.insertedId),
    outcome: "success",
  });
  return NextResponse.json({ status: "sent" }, { status: 201 });
}
