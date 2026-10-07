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
  return allModules.includes(value as WorkspaceModule);
}

export function canUseWorkspaceModule(
  role: PlatformRole,
  module: WorkspaceModule,
  action: WorkspaceAction,
  weddingAccess?: "Owner" | "FullManager" | "Vendor",
) {
  if (role === "SystemAdmin" || role === "Couple") return true;
  if (role === "Vendor") {
    if (weddingAccess === "FullManager") return true;
    if (action === "read") return vendorModules.includes(module);
    return false;
  }
  return false;
}

export function canAccessRoute(role: PlatformRole, pathname: string) {
  if (pathname.startsWith("/admin")) return role === "SystemAdmin";
  if (pathname.startsWith("/organisations")) return role === "SystemAdmin" || role === "Venue";
  if (pathname.startsWith("/vendor"))
    return role === "SystemAdmin" || role === "Vendor" || role === "Venue";
  if (pathname.startsWith("/weddings")) return role === "SystemAdmin" || role === "Couple";
  return role !== "Guest" || pathname.startsWith("/settings");
}
