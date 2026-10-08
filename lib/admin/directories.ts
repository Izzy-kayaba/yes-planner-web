import "server-only";

import type { ObjectId } from "mongodb";
import { mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { businessMetadataRow, weddingMetadataRow } from "@/lib/admin/metadata";
import { escapedAdminSearch, parseAdminSearch } from "@/lib/admin/search";

export async function listAdminWeddings(searchParams: URLSearchParams) {
  const pagination = parsePagination(searchParams, 25, 100);
  if (!pagination) return null;
  const search = parseAdminSearch(searchParams);
  if (search === null) return null;
  const expression = search ? { $regex: escapedAdminSearch(search), $options: "i" } : null;
  const filter = expression
    ? { $or: [{ displayName: expression }, { venue: expression }, { location: expression }] }
    : {};
  const sortBy = searchParams.get("sort");
  const sort: Record<string, 1 | -1> =
    sortBy === "name"
      ? { displayName: 1, _id: 1 }
      : sortBy === "country"
        ? { location: 1, _id: 1 }
        : { weddingDate: -1, _id: -1 };
  const collection = mongoDb.collection("weddingProfiles");
  const totalItems = await collection.countDocuments(filter);
  const documents = await collection
    .find(filter)
    .project<{
      _id: ObjectId;
      displayName?: unknown;
      weddingDate?: unknown;
      venue?: unknown;
      location?: unknown;
    }>({ displayName: 1, weddingDate: 1, venue: 1, location: 1 })
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return paginatedResult(
    documents.map(weddingMetadataRow),
    pagination.page,
    pagination.pageSize,
    totalItems,
  );
}

export async function listAdminBusinesses(searchParams: URLSearchParams, venuesOnly = false) {
  const pagination = parsePagination(searchParams, 25, 100);
  if (!pagination) return null;
  const search = parseAdminSearch(searchParams);
  if (search === null) return null;
  const expression = search ? { $regex: escapedAdminSearch(search), $options: "i" } : null;
  const clauses: Record<string, unknown>[] = [
    venuesOnly ? { services: "Venue" } : { services: { $exists: true, $ne: [] } },
  ];
  if (expression) {
    clauses.push({
      $or: [{ businessName: expression }, { services: expression }, { serviceArea: expression }],
    });
  }
  const publication = searchParams.get("publication");
  if (publication === "published") clauses.push({ published: true });
  if (publication === "draft") clauses.push({ published: { $ne: true } });
  const claim = searchParams.get("claim");
  if (claim === "claimed") {
    clauses.push({
      $or: [
        { claimed: true },
        { ownerUserId: { $exists: true, $nin: [null, ""] }, seeded: { $ne: true } },
      ],
    });
  } else if (claim === "unclaimed") {
    clauses.push({
      claimed: { $ne: true },
      $or: [
        { ownerUserId: { $exists: false } },
        { ownerUserId: null },
        { ownerUserId: "" },
        { seeded: true },
      ],
    });
  }
  const filter = { $and: clauses };
  const sortBy = searchParams.get("sort");
  const sort: Record<string, 1 | -1> =
    sortBy === "serviceArea"
      ? { serviceArea: 1, _id: 1 }
      : sortBy === "publication"
        ? { published: -1, businessName: 1, _id: 1 }
        : sortBy === "claim"
          ? { claimed: -1, businessName: 1, _id: 1 }
          : { businessName: 1, _id: 1 };
  const collection = mongoDb.collection("vendorProfiles");
  const totalItems = await collection.countDocuments(filter);
  const documents = await collection
    .find(filter)
    .project<{
      _id: ObjectId;
      businessName?: unknown;
      services?: unknown;
      serviceArea?: unknown;
      published?: unknown;
      claimed?: unknown;
      ownerUserId?: unknown;
      seeded?: unknown;
    }>({
      businessName: 1,
      services: 1,
      serviceArea: 1,
      published: 1,
      claimed: 1,
      ownerUserId: 1,
      seeded: 1,
    })
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return paginatedResult(
    documents.map(businessMetadataRow),
    pagination.page,
    pagination.pageSize,
    totalItems,
  );
}
