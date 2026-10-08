import type { ObjectId } from "mongodb";

export type AdminMetadataRow = { id: string; values: string[] };

// Expose only operational wedding metadata; workspace content stays private to its wedding users.
export function weddingMetadataRow(document: {
  _id: ObjectId;
  displayName?: unknown;
  weddingDate?: unknown;
  venue?: unknown;
  location?: unknown;
}): AdminMetadataRow {
  return {
    id: String(document._id),
    values: [
      String(document.displayName ?? "Wedding"),
      String(document.weddingDate ?? ""),
      String(document.venue ?? ""),
      String(document.location ?? ""),
    ],
  };
}

// Admin business directories use public business details without exposing account credentials.
export function businessMetadataRow(document: {
  _id: ObjectId;
  businessName?: unknown;
  services?: unknown;
  serviceArea?: unknown;
  published?: unknown;
  claimed?: unknown;
  ownerUserId?: unknown;
  seeded?: unknown;
}): AdminMetadataRow {
  const services = Array.isArray(document.services)
    ? document.services.filter((service): service is string => typeof service === "string")
    : [];
  return {
    id: String(document._id),
    values: [
      String(document.businessName ?? ""),
      services.join(", "),
      String(document.serviceArea ?? ""),
      document.published === true ? "Published" : "Draft",
      document.claimed === true || (Boolean(document.ownerUserId) && document.seeded !== true)
        ? "Claimed"
        : "Unclaimed",
    ],
  };
}
