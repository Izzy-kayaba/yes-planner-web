import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupportCenter } from "@/features/support/SupportCenter";
import { getTextTranslator } from "@/lib/i18n-server";
import { requirePageRole } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Help & support") };
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingKey?: string }>;
}) {
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  if (!demoMode) await requirePageRole();
  const text = await getTextTranslator();
  const { weddingKey } = await searchParams;
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Help"
        title="Help & support"
        description="Send a request to the Yes Planner team and follow its status here."
      />
      <SupportCenter relatedWeddingKey={weddingKey} demoMode={demoMode} />
    </div>
  );
}
