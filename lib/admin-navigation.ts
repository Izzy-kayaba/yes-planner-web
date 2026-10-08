import type { PlatformPermission } from "@/lib/auth/platform-permissions";
import type { TranslationKey } from "@/lib/i18n";

export const platformAdminNavigation = [
  { labelKey: "nav.admin", href: "/admin", permission: "admin.dashboard.view" },
  { labelKey: "nav.users", href: "/admin/users", permission: "users.view" },
  { labelKey: "nav.weddings", href: "/admin/weddings", permission: "weddings.view" },
  { labelKey: "nav.businesses", href: "/admin/businesses", permission: "businesses.view" },
  { labelKey: "nav.venues", href: "/admin/venues", permission: "venues.view" },
  {
    labelKey: "nav.verification",
    href: "/admin/verification",
    permission: "verification.view",
  },
  {
    labelKey: "nav.supportRequests",
    href: "/admin/support",
    permission: "support.view",
  },
  {
    labelKey: "nav.platformStaff",
    href: "/admin/platform/staff",
    permission: "platform_staff.invite",
  },
  {
    labelKey: "nav.integrations",
    href: "/admin/system/integrations",
    permission: "integrations.view",
  },
  { labelKey: "nav.audit", href: "/admin/platform/audit", permission: "audit.view" },
] as const satisfies readonly {
  labelKey: TranslationKey;
  href: string;
  permission: PlatformPermission;
}[];

// Use one permission filter for desktop and mobile shells to keep navigation consistent.
export function visiblePlatformAdminNavigation(permissions: readonly PlatformPermission[]) {
  return platformAdminNavigation.filter((item) => permissions.includes(item.permission));
}

export function platformPermissionForAdminPath(pathname: string): PlatformPermission | null {
  if (pathname === "/admin/claims" || pathname.startsWith("/admin/claims/")) {
    return "verification.view";
  }
  const item = [...platformAdminNavigation]
    .sort((left, right) => right.href.length - left.href.length)
    .find((candidate) => pathname === candidate.href || pathname.startsWith(`${candidate.href}/`));
  return item?.permission ?? null;
}
