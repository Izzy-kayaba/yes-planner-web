import type { WeddingAccess } from "@/types";

const operationalManagers: WeddingAccess[] = ["Owner", "FullManager"];

/**
 * The backend always makes the final access decision. These helpers only keep
 * the interface clear by hiding controls a user cannot normally use.
 */
export function canManageWedding(access: WeddingAccess) {
  return operationalManagers.includes(access);
}

export function canPerformOwnerAction(access: WeddingAccess) {
  return access === "Owner";
}

export function canViewFinancials(access: WeddingAccess) {
  return operationalManagers.includes(access) || access === "Vendor";
}
