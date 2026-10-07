import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { sendEventEmail } from "@/lib/email";
import { mongoDb } from "@/lib/mongodb";

// Send a test message only to the authenticated user's own verified account address.
export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const user = await mongoDb
    .collection("user")
    .findOne({ email: authentication.session.user.email }, { projection: { email: 1 } });
  if (!user || typeof user.email !== "string") {
    return NextResponse.json(
      { message: "Your account email could not be found." },
      { status: 404 },
    );
  }
  try {
    await sendEventEmail(
      user.email,
      "Your Yes Planner email test",
      "Email delivery is connected. You can customize this message's layout in lib/email.ts.",
    );
  } catch (error) {
    console.error("Email test delivery failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown email delivery error",
    });
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Email delivery failed. Check server logs.",
      },
      { status: 502 },
    );
  }
  return NextResponse.json({ status: "sent" });
}
