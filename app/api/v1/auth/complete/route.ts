import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { isSelfServiceRole } from "@/lib/auth/roles";
import { mongoDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers, { allowIncompleteProfile: true });
  if ("error" in authentication) return NextResponse.redirect(new URL("/login", request.url));

  const cookieStore = await cookies();
  const requestedRole = cookieStore.get("vow-pending-role")?.value;

  if (isSelfServiceRole(requestedRole)) {
    await mongoDb.collection("user").updateOne(
      { email: authentication.session.user.email },
      {
        $set: {
          role: requestedRole,
          updatedAt: new Date(),
        },
      },
    );
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("vow-pending-role");
  return response;
}
