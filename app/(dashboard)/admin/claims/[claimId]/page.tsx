import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClaimReviewPanel } from "@/features/admin/ClaimReviewPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackButton } from "@/components/navigation/BackButton";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { mongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Business claim details") };
}

export default async function AdminClaimDetailPage({
  params,
}: {
  params: Promise<{ claimId: string }>;
}) {
  const authorization = await requirePlatformPagePermission("verification.view");
  const text = await getTextTranslator();
  const { claimId } = await params;
  if (!ObjectId.isValid(claimId)) notFound();
  const claim = await mongoDb
    .collection("vendorClaims")
    .findOne({ _id: new ObjectId(claimId), status: "Pending" });
  if (!claim) notFound();

  const claimantUserId = String(claim.claimantUserId ?? "");
  const claimant = ObjectId.isValid(claimantUserId)
    ? await mongoDb
        .collection("user")
        .findOne(
          { _id: new ObjectId(claimantUserId) },
          { projection: { name: 1, email: 1, phoneNumber: 1 } },
        )
    : await mongoDb
        .collection("user")
        .findOne({ id: claimantUserId }, { projection: { name: 1, email: 1, phoneNumber: 1 } });
  const profileId = String(claim.profileId ?? "");
  const listing = ObjectId.isValid(profileId)
    ? await mongoDb
        .collection("vendorProfiles")
        .findOne({ _id: new ObjectId(profileId) }, { projection: { businessName: 1, services: 1 } })
    : null;
  const detailClaim = {
    id: claimId,
    businessName: String(claim.businessName ?? listing?.businessName ?? "Business listing"),
    claimantUserId,
    claimantName: String(claimant?.name ?? ""),
    claimantEmail: String(claimant?.email ?? ""),
    claimantPhone: String(claimant?.phoneNumber ?? ""),
    createdAt: String(claim.createdAt ?? ""),
  };

  return (
    <div className="section-stack">
      <BackButton fallback="/admin" />
      <PageHeader
        eyebrow="Business verification"
        title="Claim request details"
        description="Review the claimant and contact them before deciding this business listing claim."
      />
      <article className="panel">
        <h2>{detailClaim.businessName}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-yes-muted">{text("Claimant")}</dt>
            <dd>{detailClaim.claimantName || text("Name not provided")}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Submitted")}</dt>
            <dd>{detailClaim.createdAt || text("Unknown")}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Email")}</dt>
            <dd>
              {detailClaim.claimantEmail ? (
                <a href={`mailto:${detailClaim.claimantEmail}`}>{detailClaim.claimantEmail}</a>
              ) : (
                text("Not provided")
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Phone")}</dt>
            <dd>
              {detailClaim.claimantPhone ? (
                <a href={`tel:${detailClaim.claimantPhone}`}>{detailClaim.claimantPhone}</a>
              ) : (
                text("Not provided")
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Claimed listing")}</dt>
            <dd>{String(listing?.businessName ?? text("Listing unavailable"))}</dd>
          </div>
          <div>
            <dt className="text-sm text-yes-muted">{text("Services")}</dt>
            <dd>
              {Array.isArray(listing?.services) && listing.services.length
                ? listing.services.map(String).join(", ")
                : text("Not listed")}
            </dd>
          </div>
        </dl>
      </article>
      <ClaimReviewPanel
        initialClaims={[detailClaim]}
        showClaimDetails={false}
        canManageClaims={authorization.permissions.includes("verification.manage")}
        initialPagination={{
          page: 1,
          pageSize: 25,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }}
      />
    </div>
  );
}
