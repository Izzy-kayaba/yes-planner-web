import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminMetadataPanel } from "@/features/admin/AdminMetadataPanel";
import { listAdminBusinesses } from "@/lib/admin/directories";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";

export const metadata: Metadata = { title: "Businesses" };

export default async function AdminBusinessesPage() {
  await requirePlatformPagePermission("businesses.view");
  const result = await listAdminBusinesses(new URLSearchParams());
  if (!result) throw new Error("Could not load business metadata.");
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Marketplace"
        title="Businesses"
        description="Review business profile metadata across vendors and venues."
      />
      <AdminMetadataPanel
        endpoint="/api/v1/admin/businesses"
        initialItems={result.items}
        initialPagination={result.pagination}
        columns={["Business", "Services", "Service area", "Publication", "Claim status"]}
        emptyMessage="No business profiles are available yet."
      />
    </div>
  );
}
