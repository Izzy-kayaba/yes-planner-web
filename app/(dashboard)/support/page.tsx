// Purpose: implements app/(dashboard)/support/page.tsx for the Yes Planner web application.
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupportCenter } from "@/features/support/SupportCenter";
import { getTextTranslator } from "@/lib/i18n-server";
import { requirePageRole } from "@/lib/auth/session";
import { getPlatformAccess } from "@/lib/auth/platform-admin";
import { redirect } from "next/navigation";

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
  if (!demoMode) {
    const session = await requirePageRole();
    if ((await getPlatformAccess(session)).permissions.length > 0) {
      redirect("/admin/platform/staff");
    }
  }
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
