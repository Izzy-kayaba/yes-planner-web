import type { Metadata } from "next";
import { Marketplace } from "@/features/marketplace/Marketplace";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Vendor marketplace") };
}
export default function MarketplacePage() {
  return <Marketplace />;
}
