import type { PlatformRole } from "@/lib/auth/roles";

export type WeddingCollaborationAccess = {
  userId: string;
  weddingKey: string;
  weddingOwnerUserId: string;
  status: string;
  access?: string;
};

// Resolve one user's access without trusting role or ownership claims from a request body.
export function resolveWeddingAccessPolicy(
  user: { id: string; role: PlatformRole },
  weddingKey: string,
  ownedWedding: { ownerUserId: string; weddingKey: string } | null,
  collaboration: WeddingCollaborationAccess | null,
) {
  // The owner record is authoritative and takes precedence over collaborator entries.
  if (ownedWedding?.ownerUserId === user.id && ownedWedding.weddingKey === weddingKey) {
    return { ownerUserId: user.id, access: "Owner" as const };
  }
  if (
    !collaboration ||
    collaboration.userId !== user.id ||
    collaboration.weddingKey !== weddingKey ||
    collaboration.status !== "Active"
  ) {
    // Inactive, mismatched, or absent collaboration records grant no access.
    return null;
  }
  return {
    ownerUserId: collaboration.weddingOwnerUserId,
    // Only eligible Vendors with explicit FullManager access can edit; other collaborators stay limited.
    access:
      user.role === "Vendor" && collaboration.access === "FullManager"
        ? ("FullManager" as const)
        : ("Vendor" as const),
  };
}
