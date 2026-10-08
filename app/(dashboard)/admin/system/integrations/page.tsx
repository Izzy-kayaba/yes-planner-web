import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmailIntegrationTest } from "@/features/admin/EmailIntegrationTest";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { isEmailConfigured } from "@/lib/email";
import { mongoDb } from "@/lib/mongodb";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("System integrations") };
}

export default async function AdminIntegrationsPage() {
  await requirePlatformPagePermission("integrations.view");
  const text = await getTextTranslator();
  const lastTest = await mongoDb
    .collection("adminAuditLog")
    .find({ action: "integration.email_test", permission: "integrations.test" })
    .sort({ createdAt: -1, _id: -1 })
    .project({ outcome: 1, createdAt: 1 })
    .limit(1)
    .next();
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="System"
        title="Integrations"
        description="Check configured service connectivity without exposing provider secrets."
      />
      <EmailIntegrationTest
        initialStatus={{
          configured: isEmailConfigured(),
          lastTest: lastTest
            ? {
                status: lastTest.outcome === "success" ? "success" : "failure",
                createdAt: new Date(lastTest.createdAt).toISOString(),
              }
            : null,
        }}
      />
      <p className="text-sm text-yes-muted">
        {text(
          "Only configured integrations are listed here. Additional service tests will appear when those integrations are implemented.",
        )}
      </p>
    </div>
  );
}
