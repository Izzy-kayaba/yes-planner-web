import type { Metadata } from "next";
import { WeddingSection } from "@/features/weddings/WeddingSection";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Wedding workspace") };
}

export default async function WeddingSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <WeddingSection section={section} />;
}
