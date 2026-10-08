import type { PlatformStaffRole } from "@/lib/auth/roles";

export const platformPermissions = [
  "admin.dashboard.view",
  "users.view",
  "weddings.view",
  "businesses.view",
  "venues.view",
  "verification.view",
  "verification.manage",
  "platform_staff.manage",
  "platform_staff.invite",
  "support.view",
  "support.manage",
  "integrations.view",
  "integrations.test",
  "audit.view",
] as const;

export type PlatformPermission = (typeof platformPermissions)[number];

const allPermissions: readonly PlatformPermission[] = platformPermissions;

const permissionsByRole: Record<PlatformStaffRole, readonly PlatformPermission[]> = {
  SuperAdmin: allPermissions,
  PlatformAdmin: [
    "admin.dashboard.view",
    "users.view",
    "weddings.view",
    "businesses.view",
    "venues.view",
    "verification.view",
    "verification.manage",
    "support.view",
    "support.manage",
    "platform_staff.invite",
  ],
  Support: ["admin.dashboard.view", "users.view", "support.view", "support.manage"],
  Verification: [
    "admin.dashboard.view",
    "businesses.view",
    "venues.view",
    "verification.view",
    "verification.manage",
  ],
  Operations: ["admin.dashboard.view", "integrations.view", "integrations.test", "audit.view"],
  // Finance is recognized but has no navigation until billing features are implemented.
  Finance: [],
};

// Combine roles without granting permissions that are not explicitly mapped to a role.
export function permissionsForPlatformRoles(
  roles: readonly PlatformStaffRole[],
): PlatformPermission[] {
  return [...new Set(roles.flatMap((role) => permissionsByRole[role]))];
}

export function hasPlatformPermission(
  permissions: readonly PlatformPermission[],
  permission: PlatformPermission,
) {
  return permissions.includes(permission);
}

export function platformStaffRoleFromStoredValue(value: unknown): PlatformStaffRole | null {
  return typeof value === "string" &&
    (Object.keys(permissionsByRole) as PlatformStaffRole[]).includes(value as PlatformStaffRole)
    ? (value as PlatformStaffRole)
    : null;
}

export function canInvitePlatformStaffRole(
  inviterRoles: readonly PlatformStaffRole[],
  invitedRole: PlatformStaffRole,
) {
  if (inviterRoles.includes("SuperAdmin")) return true;
  return inviterRoles.includes("PlatformAdmin") && invitedRole !== "SuperAdmin";
}
