import "server-only";

import type { AuthorizedSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { resolveWeddingAccessPolicy } from "@/lib/auth/wedding-access-policy";

export async function resolveWeddingOwner(
  session: AuthorizedSession,
  weddingKey: string,
): Promise<string | null> {
  // Check ownership first so couples do not need a redundant collaborator record.
  const owned = await mongoDb
    .collection("weddingProfiles")
    .findOne({ ownerUserId: session.user.id, weddingKey }, { projection: { ownerUserId: 1 } });
  if (owned) return session.user.id;

  // Only active collaborations can resolve the owner of somebody else's wedding.
  const collaboration = await mongoDb
    .collection("weddingCollaborators")
    .findOne(
      { userId: session.user.id, weddingKey, status: "Active" },
      { projection: { weddingOwnerUserId: 1 } },
    );
  return typeof collaboration?.weddingOwnerUserId === "string"
    ? collaboration.weddingOwnerUserId
    : null;
}

export async function resolveWeddingAccess(session: AuthorizedSession, weddingKey: string) {
  // Build access from the owner record when this user owns the requested wedding.
  const owned = await mongoDb
    .collection("weddingProfiles")
    .findOne({ ownerUserId: session.user.id, weddingKey }, { projection: { ownerUserId: 1 } });
  if (owned) {
    return resolveWeddingAccessPolicy(
      session.user,
      weddingKey,
      { ownerUserId: String(owned.ownerUserId), weddingKey },
      null,
    );
  }

  // Non-owners need an active, wedding-specific collaboration before any workspace data is queried.
  const collaboration = await mongoDb
    .collection("weddingCollaborators")
    .findOne(
      { userId: session.user.id, weddingKey, status: "Active" },
      { projection: { weddingOwnerUserId: 1, access: 1 } },
    );
  // Reject stale or malformed collaborator rows instead of guessing an owner ID.
  if (typeof collaboration?.weddingOwnerUserId !== "string") return null;
  return resolveWeddingAccessPolicy(session.user, weddingKey, null, {
    userId: session.user.id,
    weddingKey,
    weddingOwnerUserId: collaboration.weddingOwnerUserId,
    status: "Active",
    access: String(collaboration.access ?? ""),
  });
}
