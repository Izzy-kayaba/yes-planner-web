import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminMetadataPanel } from "@/features/admin/AdminMetadataPanel";
import { listAdminBusinesses } from "@/lib/admin/directories";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";

export const metadata: Metadata = { title: "Venues" };

export default async function AdminVenuesPage() {
  await requirePlatformPagePermission("venues.view");
  const result = await listAdminBusinesses(new URLSearchParams(), true);
  if (!result) throw new Error("Could not load venue metadata.");
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Organisations"
        title="Venues"
        description="Review venue business profiles. Organisation workspaces remain a separate product domain."
      />
      <AdminMetadataPanel
        endpoint="/api/v1/admin/venues"
        initialItems={result.items}
        initialPagination={result.pagination}
        columns={["Business", "Services", "Service area", "Publication", "Claim status"]}
        emptyMessage="No venue profiles are available yet."
      />
    </div>
  );
}
