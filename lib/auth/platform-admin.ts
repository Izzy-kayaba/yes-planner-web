import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAuthorizedSession, type AuthorizedSession } from "@/lib/auth/session";
import {
  hasPlatformPermission,
  permissionsForPlatformRoles,
  type PlatformPermission,
} from "@/lib/auth/platform-permissions";
import { isPlatformStaffRole, type PlatformStaffRole } from "@/lib/auth/roles";
import { mongoDb } from "@/lib/mongodb";

export type PlatformAccess = {
  roles: PlatformStaffRole[];
  permissions: PlatformPermission[];
};

// Load platform authority from the server-side user record, never from browser input.
export async function getPlatformAccess(session: AuthorizedSession): Promise<PlatformAccess> {
  const user = await mongoDb
    .collection("user")
    .findOne({ email: session.user.email }, { projection: { platformRoles: 1, role: 1 } });

  // Keep existing SystemAdmin accounts working as Super Admin during the role-model transition.
  const storedRoles = Array.isArray(user?.platformRoles)
    ? user.platformRoles.filter(isPlatformStaffRole)
    : [];
  const roles =
    session.user.role === "SystemAdmin" || user?.role === "SystemAdmin"
      ? [...new Set<PlatformStaffRole>(["SuperAdmin", ...storedRoles])]
      : [...new Set(storedRoles)];

  return { roles, permissions: permissionsForPlatformRoles(roles) };
}

export async function requirePlatformPagePermission(permission: PlatformPermission) {
  const session = await getAuthorizedSession();
  if (!session) redirect("/login");
  const access = await getPlatformAccess(session);
  if (!hasPlatformPermission(access.permissions, permission)) redirect("/dashboard");
  return { session, ...access };
}

type PlatformApiAuthorization =
  | { error: NextResponse; session?: never; access?: never }
  | { error?: never; session: AuthorizedSession; access: PlatformAccess };

export async function requirePlatformApiPermission(
  requestHeaders: Headers,
  permission: PlatformPermission,
): Promise<PlatformApiAuthorization> {
  const session = await getAuthorizedSession(requestHeaders);
  if (!session) {
    return {
      error: NextResponse.json({ message: "Authentication required." }, { status: 401 }),
    };
  }
  const access = await getPlatformAccess(session);
  if (!hasPlatformPermission(access.permissions, permission)) {
    return {
      error: NextResponse.json({ message: "Platform permission required." }, { status: 403 }),
    };
  }
  return { session, access };
}
