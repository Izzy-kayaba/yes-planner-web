import type { WorkspaceModule } from "@/lib/api/contracts";
import { mongoDb } from "@/lib/mongodb";

const vendorRestrictedModules: WorkspaceModule[] = ["vendors", "bookings", "payments"];

export async function getConnectedVendors(ownerUserId: string, weddingKey: string) {
  const collaborators = await mongoDb
    .collection("weddingCollaborators")
    .find({ weddingKey, weddingOwnerUserId: ownerUserId, role: "Vendor", status: "Active" })
    .project({ userId: 1 })
    .toArray();
  const userIds = collaborators.map((item) => String(item.userId));
  if (!userIds.length) return [];

  return mongoDb
    .collection("vendorProfiles")
    .find({ ownerUserId: { $in: userIds }, published: true })
    .project({ ownerUserId: 1, businessName: 1, services: 1 })
    .sort({ businessName: 1 })
    .toArray();
}

export async function validateConnectedVendor(
  ownerUserId: string,
  weddingKey: string,
  module: WorkspaceModule,
  data: Record<string, unknown>,
) {
  if (!vendorRestrictedModules.includes(module)) return null;
  const vendorName = module === "vendors" ? data.name : data.vendor;
  if (typeof vendorName !== "string" || !vendorName.trim()) {
    return "A connected vendor is required.";
  }

  const vendors = await getConnectedVendors(ownerUserId, weddingKey);
  return vendors.some((vendor) => vendor.businessName === vendorName.trim())
    ? null
    : "Select a vendor who is connected to this wedding.";
}
