import type { Metadata } from "next";
import { WeddingOverview } from "@/features/weddings/WeddingOverview";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Wedding overview") };
}

export default function WeddingPage() {
  return <WeddingOverview />;
}
