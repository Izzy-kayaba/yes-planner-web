import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminMetadataPanel } from "@/features/admin/AdminMetadataPanel";
import { listAdminWeddings } from "@/lib/admin/directories";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";

export const metadata: Metadata = { title: "Weddings" };

export default async function AdminWeddingsPage() {
  await requirePlatformPagePermission("weddings.view");
  const result = await listAdminWeddings(new URLSearchParams());
  if (!result) throw new Error("Could not load wedding metadata.");
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Administration"
        title="Weddings"
        description="Review wedding metadata without opening private planning content."
      />
      <AdminMetadataPanel
        endpoint="/api/v1/admin/weddings"
        initialItems={result.items}
        initialPagination={result.pagination}
        columns={["Wedding", "Date", "Venue", "Country"]}
        emptyMessage="No wedding profiles are available yet."
      />
    </div>
  );
}
