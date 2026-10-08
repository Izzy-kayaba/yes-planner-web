import "server-only";

import { ObjectId } from "mongodb";
import { mongoDb } from "@/lib/mongodb";
import { paginatedResult, type PaginationParams } from "@/lib/api/pagination";
import { escapedAdminSearch } from "@/lib/admin/search";

export class VendorClaimError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function submitVendorClaim(profileId: string, claimantUserId: string) {
  if (!ObjectId.isValid(profileId)) {
    throw new VendorClaimError("The vendor profile could not be found.", 400);
  }
  const profile = await mongoDb.collection("vendorProfiles").findOne({
    _id: new ObjectId(profileId),
    seeded: true,
    $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }, { ownerUserId: "" }],
  });
  if (!profile) {
    throw new VendorClaimError("This listing is already claimed or unavailable.", 409);
  }

  const claims = mongoDb.collection("vendorClaims");
  const existing = await claims.findOne({ profileId, claimantUserId });
  if (existing?.status === "Pending") {
    return { status: "Pending", claimId: String(existing._id) };
  }
  if (existing?.status === "Approved") {
    throw new VendorClaimError("This business claim has already been approved.", 409);
  }

  const otherPending = await claims.findOne({
    claimantUserId,
    status: "Pending",
    profileId: { $ne: profileId },
  });
  if (otherPending) {
    throw new VendorClaimError("A business claim is already pending. Wait for its review.", 409);
  }

  const now = new Date();
  const claim = await claims.findOneAndUpdate(
    { profileId, claimantUserId },
    {
      $set: { businessName: profile.businessName, status: "Pending", updatedAt: now },
      $setOnInsert: { createdAt: now },
      $unset: { reviewedAt: "" },
    },
    { upsert: true, returnDocument: "after" },
  );
  return { status: "Pending", claimId: String(claim!._id) };
}

export async function listPendingVendorClaims(
  pagination: PaginationParams,
  search = "",
  sortBy = "oldest",
) {
  const term = search.trim();
  const expression = term ? { $regex: escapedAdminSearch(term), $options: "i" } : null;
  let filter: Record<string, unknown> = { status: "Pending" };
  if (expression) {
    const matchingUsers = await mongoDb
      .collection("user")
      .find(
        {
          $or: [
            { name: expression },
            { email: expression },
            ...(ObjectId.isValid(term) ? [{ _id: new ObjectId(term) }] : []),
          ],
        },
        { projection: { _id: 1, id: 1 } },
      )
      .toArray();
    const matchingUserIds = matchingUsers.flatMap((user) =>
      [String(user._id), typeof user.id === "string" ? user.id : ""].filter(Boolean),
    );
    filter = {
      status: "Pending",
      $or: [
        { businessName: expression },
        { claimantUserId: { $in: matchingUserIds } },
        ...(ObjectId.isValid(term) ? [{ _id: new ObjectId(term) }] : []),
      ],
    };
  }
  const totalItems = await mongoDb.collection("vendorClaims").countDocuments(filter);
  const sort: Record<string, 1 | -1> =
    sortBy === "businessName"
      ? { businessName: 1 as const, _id: 1 as const }
      : sortBy === "newest"
        ? { createdAt: -1 as const, _id: -1 as const }
        : { createdAt: 1 as const, _id: 1 as const };
  const claims = await mongoDb
    .collection("vendorClaims")
    .find(filter)
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  const items = await Promise.all(
    claims.map(async (claim) => {
      const userId = String(claim.claimantUserId ?? "");
      const user = ObjectId.isValid(userId)
        ? await mongoDb
            .collection("user")
            .findOne(
              { _id: new ObjectId(userId) },
              { projection: { name: 1, email: 1, phoneNumber: 1 } },
            )
        : await mongoDb
            .collection("user")
            .findOne({ id: userId }, { projection: { name: 1, email: 1, phoneNumber: 1 } });
      return {
        id: String(claim._id),
        businessName: String(claim.businessName ?? ""),
        claimantUserId: userId,
        claimantName: String(user?.name ?? ""),
        claimantEmail: String(user?.email ?? ""),
        claimantPhone: String(user?.phoneNumber ?? ""),
        createdAt: String(claim.createdAt ?? ""),
      };
    }),
  );
  return paginatedResult(items, pagination.page, pagination.pageSize, totalItems);
}
