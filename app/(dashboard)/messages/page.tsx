import { PageHeader } from "@/components/ui/PageHeader";
import { MessagesWorkspace } from "@/features/messages/MessagesWorkspace";
import { requirePageRole } from "@/lib/auth/session";
import { getTextTranslator } from "@/lib/i18n-server";

export default async function MessagesPage() {
  await requirePageRole(["Couple", "Vendor", "Venue"]);
  const text = await getTextTranslator();
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow={text("Private workspace")}
        title={text("Messages")}
        description={text(
          "Keep conversations with your connected wedding professionals in one place.",
        )}
      />
      <MessagesWorkspace />
    </div>
  );
}
