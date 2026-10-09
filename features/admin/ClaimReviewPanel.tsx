"use client";
import { ArrowUpRight, Building2, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/lib/api/contracts";
import { Pagination as PaginationControls } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AdminSearch } from "@/features/admin/AdminSearch";
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
  canManageClaims = true,
}: {
  initialClaims: Claim[];
  initialPagination: PaginatedResult<Claim>["pagination"];
  showClaimDetails?: boolean;
  canManageClaims?: boolean;
}) {
  const { language, text } = useLanguage();
  const [claims, setClaims] = useState(initialClaims);
  const [pagination, setPagination] = useState(initialPagination);
  const [saving, setSaving] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("oldest");

  async function loadPage(page: number, overrides: { sort?: string; search?: string } = {}) {
    setLoading(true);
    try {
      const nextSort = overrides.sort ?? sort;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        search: (overrides.search ?? search).trim(),
        sort: nextSort,
      });
      const result = await apiRequest<PaginatedResult<Claim>>(
        `/api/v1/admin/vendor-claims?${params}`,
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
      <AdminSearch
        value={search}
        onChange={setSearch}
        onSearch={() => void loadPage(1)}
        sortLabel="Sort claims"
        sortValue={sort}
        defaultSortValue="oldest"
        sortOptions={[
          { value: "oldest", label: text("Submitted (oldest first)") },
          { value: "newest", label: text("Submitted (newest first)") },
          { value: "businessName", label: text("Business name (A-Z)") },
        ]}
        onSortChange={(value) => {
          setSort(value);
          void loadPage(1, { sort: value });
        }}
      />
      {claims.length ? (
        <div className="request-list claim-review-list">
          {claims.map((claim) => {
            return (
              <div
                key={claim.id}
                className={
                  showClaimDetails ? "claim-review-item-clickable" : "claim-review-item-static"
                }
              >
                {showClaimDetails ? (
                  <Link className="claim-review-row-link" href={`/admin/claims/${claim.id}`}>
                    <span className="claim-review-mark" aria-hidden="true">
                      <Building2 size={18} strokeWidth={1.7} />
                    </span>
                    <span className="claim-review-copy">
                      <strong>{claim.businessName ?? text("Business listing")}</strong>
                      <small>
                        {claim.claimantName || claim.claimantEmail
                          ? `${claim.claimantName}${claim.claimantName && claim.claimantEmail ? " · " : ""}${claim.claimantEmail}`
                          : claim.claimantUserId}
                      </small>
                      <small className="claim-review-date">
                        <CalendarDays aria-hidden="true" size={13} />
                        {text("Submitted")} ·{" "}
                        {new Date(claim.createdAt).toLocaleDateString(language)}
                      </small>
                    </span>
                    <StatusPill tone="gold">Pending</StatusPill>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="claim-review-open"
                      size={17}
                      strokeWidth={1.8}
                    />
                  </Link>
                ) : (
                  <div className="claim-review-row-link claim-review-row-static">
                    <span className="claim-review-mark" aria-hidden="true">
                      <Building2 size={18} strokeWidth={1.7} />
                    </span>
                    <span className="claim-review-copy">
                      <strong>{claim.businessName ?? text("Business listing")}</strong>
                      <small>
                        {claim.claimantName || claim.claimantEmail
                          ? `${claim.claimantName}${claim.claimantName && claim.claimantEmail ? " · " : ""}${claim.claimantEmail}`
                          : claim.claimantUserId}
                      </small>
                      <small className="claim-review-date">
                        <CalendarDays aria-hidden="true" size={13} />
                        {text("Submitted")} ·{" "}
                        {new Date(claim.createdAt).toLocaleDateString(language)}
                      </small>
                    </span>
                    <StatusPill tone="gold">Pending</StatusPill>
                  </div>
                )}
                {canManageClaims && (
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
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-yes-muted">
          {text(search ? "No matching business claims were found." : "No pending business claims.")}
        </p>
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
