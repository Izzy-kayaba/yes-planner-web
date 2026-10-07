import type { Metadata } from "next";
import { WeddingSection } from "@/features/weddings/WeddingSection";
import { getTextTranslator } from "@/lib/i18n-server";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Wedding workspace") };
}

export default async function WeddingSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") !== "demo") {
    const session = await requirePageRole(["SystemAdmin", "Couple", "Vendor", "Venue"]);
    if (session.user.role === "Venue") notFound();
  }
  const { section } = await params;
  return <WeddingSection section={section} />;
}
