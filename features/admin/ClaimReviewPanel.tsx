"use client";
import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
type Claim = { id: string; businessName?: string; claimantUserId: string; createdAt: string };
export function ClaimReviewPanel({ initialClaims }: { initialClaims: Claim[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const [saving, setSaving] = useState("");
  async function decide(claimId: string, status: "Approved" | "Declined") {
    setSaving(claimId);
    try {
      await apiRequest("/api/v1/admin/vendor-claims", {
        method: "PATCH",
        body: JSON.stringify({ claimId, status }),
      });
      setClaims((current) => current.filter((claim) => claim.id !== claimId));
      toast.success(status === "Approved" ? "Business verified." : "Claim declined.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Claim decision failed.");
    } finally {
      setSaving("");
    }
  }
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Business verification</p>
          <h3>Pending claims</h3>
        </div>
      </div>
      {claims.length ? (
        claims.map((claim) => (
          <div className="request-list" key={claim.id}>
            <div>
              <p>
                <strong>{claim.businessName ?? "Business listing"}</strong>
                <small>{claim.claimantUserId}</small>
              </p>
              <span className="flex gap-2">
                <button
                  className="button button-primary"
                  disabled={saving === claim.id}
                  onClick={() => void decide(claim.id, "Approved")}
                >
                  Verify
                </button>
                <button
                  className="button button-secondary"
                  disabled={saving === claim.id}
                  onClick={() => void decide(claim.id, "Declined")}
                >
                  Decline
                </button>
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-yes-muted">No pending business claims.</p>
      )}
    </article>
  );
}
