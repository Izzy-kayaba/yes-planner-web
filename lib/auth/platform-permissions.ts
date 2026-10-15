import type { PlatformStaffRole } from "@/lib/auth/roles";

export const platformPermissions = [
  "admin.dashboard.view",
  "users.view",
  "users.manage",
  "weddings.view",
  "weddings.manage",
  "businesses.view",
  "businesses.manage",
  "venues.view",
  "venues.manage",
  "verification.view",
  "verification.manage",
  "platform_staff.manage",
  "platform_staff.invite",
  "platform_staff.view",
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
    "users.manage",
    "weddings.view",
    "weddings.manage",
    "businesses.view",
    "businesses.manage",
    "venues.view",
    "venues.manage",
    "verification.view",
    "verification.manage",
    "support.view",
    "support.manage",
    "platform_staff.manage",
    "platform_staff.invite",
    "platform_staff.view",
  ],
  Support: [
    "admin.dashboard.view",
    "users.view",
    "support.view",
    "support.manage",
    "platform_staff.view",
  ],
  Verification: [
    "admin.dashboard.view",
    "businesses.view",
    "venues.view",
    "verification.view",
    "verification.manage",
    "platform_staff.view",
  ],
  Operations: [
    "admin.dashboard.view",
    "integrations.view",
    "integrations.test",
    "audit.view",
    "platform_staff.view",
  ],
  Finance: ["platform_staff.view"],
};

// Expose the policy for the platform access page without duplicating role rules in the UI.
export const platformPermissionsByRole = permissionsByRole;

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

// Higher platform roles cannot be changed or removed by an equal or lower role.
export function canManagePlatformStaffTarget(
  actorRoles: readonly PlatformStaffRole[],
  targetRoles: readonly PlatformStaffRole[],
  action: "update" | "delete",
) {
  const targetIsSuperAdmin = targetRoles.includes("SuperAdmin");
  const targetIsPlatformAdmin = targetRoles.includes("PlatformAdmin");
  const actorIsSuperAdmin = actorRoles.includes("SuperAdmin");
  const actorIsPlatformAdmin = actorRoles.includes("PlatformAdmin");

  if (action === "delete" && targetIsSuperAdmin) return false;
  if (targetIsSuperAdmin) return actorIsSuperAdmin;
  if (targetIsPlatformAdmin) return actorIsSuperAdmin;
  return actorIsSuperAdmin || actorIsPlatformAdmin;
}
