import type { Metadata } from "next";
import { WeddingSection } from "@/features/weddings/WeddingSection";

export const metadata: Metadata = { title: "Wedding workspace" };

export default async function WeddingSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <WeddingSection section={section} />;
}
