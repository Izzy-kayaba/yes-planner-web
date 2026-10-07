"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";

export type WeddingPlanner = {
  userId: string;
  businessName: string;
  contactName: string;
};

export function PlannerAccessManager({
  weddingKey,
  initialPlanners,
}: {
  weddingKey: string;
  initialPlanners: WeddingPlanner[];
}) {
  const { text } = useLanguage();
  const [planners, setPlanners] = useState(initialPlanners);
  const [revoking, setRevoking] = useState("");

  async function revoke(plannerUserId: string) {
    setRevoking(plannerUserId);
    try {
      await apiRequest(`/api/v1/weddings/${encodeURIComponent(weddingKey)}/planner`, {
        method: "DELETE",
        body: JSON.stringify({ plannerUserId }),
      });
      setPlanners((current) => current.filter((planner) => planner.userId !== plannerUserId));
      toast.success(text("Wedding planner access revoked."));
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Planner access could not be changed."),
      );
    } finally {
      setRevoking("");
    }
  }

  if (!planners.length) return null;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text("Access")}</p>
          <h3>{text("Wedding planners")}</h3>
        </div>
      </div>
      <div className="request-list">
        {planners.map((planner) => (
          <div key={planner.userId}>
            <span className="avatar">{planner.businessName.slice(0, 1).toUpperCase()}</span>
            <p>
              <strong>{planner.businessName}</strong>
              <small>{planner.contactName || text("Assigned wedding planner")}</small>
            </p>
            <Button
              disabled={revoking === planner.userId}
              onClick={() => void revoke(planner.userId)}
              type="button"
              variant="secondary"
            >
              {text(revoking === planner.userId ? "Revoking…" : "Revoke access")}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
