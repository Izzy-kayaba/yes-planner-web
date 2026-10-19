import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { isEmailConfigured, sendEventEmail } from "@/lib/email";
import { mongoDb } from "@/lib/mongodb";

const testSchema = z.object({ recipient: z.string().trim().email().max(254) });

// Email delivery should not be reported as failed only because the separate audit write is unavailable.
async function recordEmailTestAudit(actorUserId: string, outcome: "success" | "failure") {
  try {
    await recordAdminAuditEvent({
      actorUserId,
      permission: "integrations.test",
      action: "integration.email_test",
      resourceType: "integration",
      resourceId: "email",
      outcome,
    });
  } catch (error) {
    console.error("Admin email integration audit failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown audit error",
    });
  }
}

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "integrations.view");
  if (authorization.error) return authorization.error;
  const lastTest = await mongoDb
    .collection("adminAuditLog")
    .find({ action: "integration.email_test", permission: "integrations.test" })
    .sort({ createdAt: -1, _id: -1 })
    .project({ outcome: 1, createdAt: 1 })
    .limit(1)
    .next();
  return NextResponse.json({
    configured: isEmailConfigured(),
    lastTest: lastTest
      ? {
          status: lastTest.outcome,
          createdAt: lastTest.createdAt,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "integrations.test");
  if (authorization.error) return authorization.error;
  const parsed = testSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid test recipient email." }, { status: 400 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { message: "Email is not configured on this server." },
      { status: 503 },
    );
  }

  try {
    await sendEventEmail(
      parsed.data.recipient,
      "Yes Planner system email test",
      "This is a test message sent from the Yes Planner administration system.",
    );
  } catch (error) {
    // Keep provider details in server logs, not the browser response or audit metadata.
    console.error("Admin email integration test failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown email delivery error",
    });
    await recordEmailTestAudit(authorization.session.user.id, "failure");
    return NextResponse.json(
      { message: "Email test failed. Check the server logs for a safe operational summary." },
      { status: 502 },
    );
  }

  await recordEmailTestAudit(authorization.session.user.id, "success");
  return NextResponse.json({ status: "sent" });
}
