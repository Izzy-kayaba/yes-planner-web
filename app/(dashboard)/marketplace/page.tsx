import type { Metadata } from "next";
import { Marketplace } from "@/features/marketplace/Marketplace";

export const metadata: Metadata = { title: "Vendor marketplace" };
export default function MarketplacePage() {
  return <Marketplace />;
}
