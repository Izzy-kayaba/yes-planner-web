import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { isSelfServiceRole } from "@/lib/auth/roles";
import { isExistingGoogleRegistration } from "@/lib/auth/social-registration";
import { mongoDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers, { allowIncompleteProfile: true });
  if ("error" in authentication) return NextResponse.redirect(new URL("/login", request.url));

  const cookieStore = await cookies();
  const requestedAccountType =
    cookieStore.get("yes-pending-account-type")?.value ??
    cookieStore.get("yes-pending-role")?.value;
  const authIntent = cookieStore.get("yes-auth-intent")?.value;
  const user = await mongoDb
    .collection("user")
    .findOne(
      { email: authentication.session.user.email.toLowerCase() },
      { projection: { createdAt: 1 } },
    );
  const existingGoogleAccount = isExistingGoogleRegistration(authIntent, user?.createdAt);

  if (existingGoogleAccount) {
    const response = NextResponse.redirect(new URL("/register?notice=account-exists", request.url));
    response.cookies.delete("yes-pending-account-type");
    response.cookies.delete("yes-pending-role");
    response.cookies.delete("yes-auth-intent");
    return response;
  }

  if (isSelfServiceRole(requestedAccountType)) {
    await mongoDb.collection("user").updateOne(
      { email: authentication.session.user.email },
      {
        $set: {
          accountType: requestedAccountType,
          role: requestedAccountType,
          updatedAt: new Date(),
        },
      },
    );
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("yes-pending-account-type");
  response.cookies.delete("yes-pending-role");
  response.cookies.delete("yes-auth-intent");
  return response;
}
