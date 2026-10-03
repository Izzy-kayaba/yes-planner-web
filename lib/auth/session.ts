import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth, type AuthSession } from "@/lib/auth";
import { isPlatformRole, type PlatformRole } from "@/lib/auth/roles";
import { mongoDb } from "@/lib/mongodb";

export type AuthorizedSession = AuthSession & {
  user: AuthSession["user"] & { role: PlatformRole };
};

type ApiSessionResult =
  { error: NextResponse; session?: never } | { error?: never; session: AuthorizedSession };

export async function getAuthorizedSession(requestHeaders?: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
  if (!session || !isPlatformRole(session.user.role)) return null;
  return session as AuthorizedSession;
}

export async function requireApiSession(
  requestHeaders: Headers,
  options: { allowIncompleteProfile?: boolean } = {},
): Promise<ApiSessionResult> {
  const session = await getAuthorizedSession(requestHeaders);
  if (!session) {
    return { error: NextResponse.json({ message: "Authentication required." }, { status: 401 }) };
  }
  if (!options.allowIncompleteProfile) {
    const user = await mongoDb
      .collection("user")
      .findOne({ email: session.user.email }, { projection: { phoneNumber: 1 } });
    if (!user?.phoneNumber) {
      return {
        error: NextResponse.json(
          { message: "Complete your profile and phone number before continuing." },
          { status: 403 },
        ),
      };
    }
  }
  return { session };
}

export async function requirePageRole(allowedRoles?: readonly PlatformRole[]) {
  const session = await getAuthorizedSession();
  if (!session) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(session.user.role)) redirect("/settings");
  return session;
}
