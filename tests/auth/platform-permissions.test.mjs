import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPlatformPermission,
  canInvitePlatformStaffRole,
  permissionsForPlatformRoles,
  platformStaffRoleFromStoredValue,
} from "../../lib/auth/platform-permissions.ts";
import { visiblePlatformAdminNavigation } from "../../lib/admin-navigation.ts";

test("Super Admin sees every implemented administration navigation item", () => {
  const permissions = permissionsForPlatformRoles(["SuperAdmin"]);
  const links = visiblePlatformAdminNavigation(permissions).map((item) => item.href);
  assert.deepEqual(links, [
    "/admin",
    "/admin/users",
    "/admin/weddings",
    "/admin/businesses",
    "/admin/venues",
    "/admin/verification",
    "/admin/support",
    "/admin/platform/staff",
    "/admin/system/integrations",
    "/admin/platform/audit",
  ]);
});

test("Support navigation excludes staff, verification, and integrations", () => {
  const permissions = permissionsForPlatformRoles(["Support"]);
  const links = visiblePlatformAdminNavigation(permissions).map((item) => item.href);
  assert.deepEqual(links, ["/admin", "/admin/users", "/admin/support"]);
  assert.equal(hasPlatformPermission(permissions, "platform_staff.manage"), false);
  assert.equal(hasPlatformPermission(permissions, "integrations.test"), false);
});

test("Platform Admin can invite staff but cannot manage roles or invite a Super Admin", () => {
  const permissions = permissionsForPlatformRoles(["PlatformAdmin"]);
  const links = visiblePlatformAdminNavigation(permissions).map((item) => item.href);
  assert.equal(links.includes("/admin/platform/staff"), true);
  assert.equal(hasPlatformPermission(permissions, "platform_staff.invite"), true);
  assert.equal(hasPlatformPermission(permissions, "platform_staff.manage"), false);
  assert.equal(canInvitePlatformStaffRole(["PlatformAdmin"], "Support"), true);
  assert.equal(canInvitePlatformStaffRole(["PlatformAdmin"], "SuperAdmin"), false);
  assert.equal(canInvitePlatformStaffRole(["SuperAdmin"], "SuperAdmin"), true);
});

test("Verification navigation contains only its dashboard and review queue", () => {
  const permissions = permissionsForPlatformRoles(["Verification"]);
  const links = visiblePlatformAdminNavigation(permissions).map((item) => item.href);
  assert.deepEqual(links, ["/admin", "/admin/businesses", "/admin/venues", "/admin/verification"]);
  assert.equal(hasPlatformPermission(permissions, "support.view"), false);
});

test("Operations can test integrations and see audit but cannot inspect customer accounts", () => {
  const permissions = permissionsForPlatformRoles(["Operations"]);
  const links = visiblePlatformAdminNavigation(permissions).map((item) => item.href);
  assert.deepEqual(links, ["/admin", "/admin/system/integrations", "/admin/platform/audit"]);
  assert.equal(hasPlatformPermission(permissions, "users.view"), false);
});

test("customer roles do not grant any platform permissions and Finance has no unfinished links", () => {
  assert.deepEqual(permissionsForPlatformRoles([]), []);
  assert.deepEqual(permissionsForPlatformRoles(["Finance"]), []);
  assert.equal(platformStaffRoleFromStoredValue("Couple"), null);
  assert.equal(platformStaffRoleFromStoredValue("SuperAdmin"), "SuperAdmin");
});
