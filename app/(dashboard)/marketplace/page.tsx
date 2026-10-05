import type { Metadata } from "next";
import { Marketplace } from "@/features/marketplace/Marketplace";
import { LiveMarketplace, type MarketplaceVendor } from "@/features/marketplace/LiveMarketplace";
import { getTextTranslator } from "@/lib/i18n-server";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Vendor marketplace") };
}
export default async function MarketplacePage() {
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") return <Marketplace />;
  await requirePageRole();
  const profiles = await mongoDb.collection("vendorProfiles").find({ published: true }).toArray();
  const vendors: MarketplaceVendor[] = profiles.map((profile) => ({
    id: String(profile._id),
    businessName: String(profile.businessName ?? ""),
    services: Array.isArray(profile.services) ? profile.services.map(String) : [],
    serviceArea: String(profile.serviceArea ?? ""),
    startingPriceMinor: Number(profile.startingPriceMinor ?? 0),
    startingPriceRangeKey: String(profile.startingPriceRangeKey ?? ""),
    profileImage: String(profile.profileImage ?? ""),
  }));
  return <LiveMarketplace vendors={vendors} />;
}
