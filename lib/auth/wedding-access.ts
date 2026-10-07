import "server-only";

import type { AuthorizedSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export async function resolveWeddingOwner(
  session: AuthorizedSession,
  weddingKey: string,
): Promise<string | null> {
  const owned = await mongoDb
    .collection("weddingProfiles")
    .findOne({ ownerUserId: session.user.id, weddingKey }, { projection: { ownerUserId: 1 } });
  if (owned) return session.user.id;

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
  const owned = await mongoDb
    .collection("weddingProfiles")
    .findOne({ ownerUserId: session.user.id, weddingKey }, { projection: { ownerUserId: 1 } });
  if (owned) return { ownerUserId: session.user.id, access: "Owner" as const };

  const collaboration = await mongoDb
    .collection("weddingCollaborators")
    .findOne(
      { userId: session.user.id, weddingKey, status: "Active" },
      { projection: { weddingOwnerUserId: 1, access: 1 } },
    );
  if (typeof collaboration?.weddingOwnerUserId !== "string") return null;
  return {
    ownerUserId: collaboration.weddingOwnerUserId,
    access: collaboration.access === "FullManager" ? ("FullManager" as const) : ("Vendor" as const),
  };
}
