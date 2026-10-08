import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClaimReviewPanel } from "@/features/admin/ClaimReviewPanel";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { ensureMongoIndexes } from "@/lib/mongodb";
import { parsePagination } from "@/lib/api/pagination";
import { listPendingVendorClaims } from "@/lib/vendors/claims";

export const metadata: Metadata = { title: "Business verification" };

export default async function AdminVerificationPage() {
  const authorization = await requirePlatformPagePermission("verification.view");
  await ensureMongoIndexes();
  const pagination = parsePagination(new URLSearchParams(), 25, 100)!;
  const claims = await listPendingVendorClaims(pagination);
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Marketplace"
        title="Business verification"
        description="Review business ownership claims and contact the claimant before deciding."
      />
      <ClaimReviewPanel
        initialClaims={claims.items}
        initialPagination={claims.pagination}
        canManageClaims={authorization.permissions.includes("verification.manage")}
      />
    </div>
  );
}
