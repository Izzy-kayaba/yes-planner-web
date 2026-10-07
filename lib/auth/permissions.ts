import type { WorkspaceModule } from "@/lib/api/contracts";
import type { PlatformRole } from "@/lib/auth/roles";

export type WorkspaceAction = "read" | "create" | "update" | "delete";

const allModules: readonly WorkspaceModule[] = [
  "guests",
  "budget",
  "tasks",
  "vendors",
  "timeline",
  "seating",
  "food-drinks",
  "documents",
  "bookings",
  "payments",
  "notes",
];

const vendorModules: readonly WorkspaceModule[] = [
  "tasks",
  "vendors",
  "timeline",
  "documents",
  "bookings",
  "payments",
  "notes",
];

export function isWorkspaceModule(value: string): value is WorkspaceModule {
  // Check against the declared module list so URL input cannot select arbitrary collections.
  return allModules.includes(value as WorkspaceModule);
}

export function canUseWorkspaceModule(
  role: PlatformRole,
  module: WorkspaceModule,
  action: WorkspaceAction,
  weddingAccess?: "Owner" | "FullManager" | "Vendor",
) {
  // Administrators and couples manage their workspaces; only full-manager vendors can write.
  if (role === "SystemAdmin" || role === "Couple") return true;
  if (role === "Vendor" && weddingAccess === "FullManager") return true;
  // Limited vendor collaborators can read selected operational modules but cannot edit them.
  if (role === "Vendor" && action === "read") return vendorModules.includes(module);
  return false;
}

export function canAccessRoute(role: PlatformRole, pathname: string) {
  // Route checks mirror account boundaries; venues only receive the top-level wedding brief.
  if (pathname === "/planner" || pathname.startsWith("/planner/")) return role === "Vendor";
  if (pathname.startsWith("/admin")) return role === "SystemAdmin";
  if (pathname.startsWith("/organisations")) return role === "SystemAdmin" || role === "Venue";
  if (pathname.startsWith("/vendor"))
    return role === "SystemAdmin" || role === "Vendor" || role === "Venue";
  if (pathname.startsWith("/weddings")) {
    if (role === "Venue" && pathname.split("/").filter(Boolean).length !== 2) return false;
    return role === "SystemAdmin" || role === "Couple" || role === "Vendor" || role === "Venue";
  }
  return role !== "Guest" || pathname.startsWith("/settings");
}
