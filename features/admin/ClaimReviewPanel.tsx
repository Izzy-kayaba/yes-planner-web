"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/lib/api/contracts";
import { Pagination as PaginationControls } from "@/components/ui/Pagination";
import { useLanguage } from "@/components/providers/LanguageProvider";
type Claim = {
  id: string;
  businessName?: string;
  claimantUserId: string;
  claimantName?: string;
  claimantEmail?: string;
  claimantPhone?: string;
  createdAt: string;
};
export function ClaimReviewPanel({
  initialClaims,
  initialPagination,
  showClaimDetails = true,
}: {
  initialClaims: Claim[];
  initialPagination: PaginatedResult<Claim>["pagination"];
  showClaimDetails?: boolean;
}) {
  const { text } = useLanguage();
  const [claims, setClaims] = useState(initialClaims);
  const [pagination, setPagination] = useState(initialPagination);
  const [saving, setSaving] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPage(page: number) {
    setLoading(true);
    try {
      const result = await apiRequest<PaginatedResult<Claim>>(
        `/api/v1/admin/vendor-claims?page=${page}&pageSize=${pagination.pageSize}`,
        { cache: "no-store" },
      );
      setClaims(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Claims could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  async function decide(claimId: string, status: "Approved" | "Declined") {
    setSaving(claimId);
    try {
      await apiRequest("/api/v1/admin/vendor-claims", {
        method: "PATCH",
        body: JSON.stringify({ claimId, status }),
      });
      const nextPage =
        claims.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      await loadPage(nextPage);
      toast.success(text(status === "Approved" ? "Business verified." : "Claim declined."));
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Claim decision failed."));
    } finally {
      setSaving("");
    }
  }
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text("Business verification")}</p>
          <h3>{text("Pending claims")}</h3>
        </div>
      </div>
      {claims.length ? (
        <div className="request-list claim-review-list">
          {claims.map((claim) => {
            const identity = (
              <p>
                <strong>{claim.businessName ?? text("Business listing")}</strong>
                <small>
                  {claim.claimantName || claim.claimantEmail
                    ? `${claim.claimantName}${claim.claimantName && claim.claimantEmail ? " · " : ""}${claim.claimantEmail}`
                    : claim.claimantUserId}
                </small>
              </p>
            );

            return (
              <div
                key={claim.id}
                className={
                  showClaimDetails ? "claim-review-item-clickable" : "claim-review-item-static"
                }
              >
                {showClaimDetails ? (
                  <Link className="claim-review-row-link" href={`/admin/claims/${claim.id}`}>
                    {identity}
                  </Link>
                ) : (
                  identity
                )}
                <span className="flex flex-wrap justify-end gap-2">
                  <button
                    className="button button-primary"
                    disabled={saving === claim.id}
                    onClick={() => void decide(claim.id, "Approved")}
                  >
                    {text("Verify")}
                  </button>
                  <button
                    className="button button-secondary"
                    disabled={saving === claim.id}
                    onClick={() => void decide(claim.id, "Declined")}
                  >
                    {text("Decline")}
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-yes-muted">{text("No pending business claims.")}</p>
      )}
      <PaginationControls
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={(page) => void loadPage(page)}
      />
      {loading && <p className="text-sm text-yes-muted">{text("Loading claims…")}</p>}
    </article>
  );
}
