"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { apiRequest } from "@/lib/api/client";
import { getInitials } from "@/lib/initials";
import { formatDate } from "@/lib/date-time";

export type VendorRequestValue = {
  id: string;
  coupleName: string;
  weddingDate: string;
  venue: string;
  location: string;
  service: string;
  message: string;
  status: "Pending" | "Accepted" | "Declined";
  weddingKey: string;
};

export function VendorWorkspace({
  businessName,
  contactName,
  services,
  portfolioCount,
  requests,
}: {
  businessName: string;
  contactName: string;
  services: string[];
  portfolioCount: number;
  requests: VendorRequestValue[];
}) {
  const router = useRouter();
  const { language, text } = useLanguage();
  const pending = requests.filter((request) => request.status === "Pending");
  const accepted = requests.filter((request) => request.status === "Accepted");

  async function decide(id: string, status: "Accepted" | "Declined") {
    try {
      await apiRequest(`/api/v1/vendor-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(text(status === "Accepted" ? "Request accepted." : "Request declined."));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text("Request could not be updated."));
    }
  }

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow={businessName}
        title={`${text("Welcome")}, ${contactName.split(" ")[0]}`}
        description={text("Manage your public profile, enquiries and active wedding workspaces.")}
        action={
          <Link className="button button-primary" href="/vendor/account">
            {text("Edit public profile")}
          </Link>
        }
      />
      <section className="stats-grid">
        <StatCard
          label={text("Services offered")}
          value={String(services.length)}
          detail={services.slice(0, 2).join(" · ")}
          tone="rose"
        />
        <StatCard
          label={text("Open requests")}
          value={String(pending.length)}
          detail={text("Awaiting your response")}
          tone="gold"
        />
        <StatCard
          label={text("Active couples")}
          value={String(accepted.length)}
          detail={text("Accepted collaborations")}
          tone="sage"
        />
        <StatCard
          label={text("Portfolio images")}
          value={String(portfolioCount)}
          detail={text("Visible to couples")}
          tone="blue"
        />
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("Booking requests")}</p>
              <h3>{text("Ready for your response")}</h3>
            </div>
          </div>
          <div className="request-list">
            {pending.length ? (
              pending.map((request) => (
                <div key={request.id}>
                  <span className="avatar">{getInitials(request.coupleName)}</span>
                  <p>
                    <strong>{request.coupleName}</strong>
                    <small>
                      {formatDate(request.weddingDate, "D MMM YYYY", language)} · {request.service}
                    </small>
                    {request.message && <small>{request.message}</small>}
                  </p>
                  <span className="inline-flex gap-2">
                    <button
                      className="button button-primary"
                      onClick={() => void decide(request.id, "Accepted")}
                    >
                      {text("Accept")}
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={() => void decide(request.id, "Declined")}
                    >
                      {text("Decline")}
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-yes-muted">{text("No pending requests.")}</p>
            )}
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("Active work")}</p>
              <h3>{text("Couple workspaces")}</h3>
            </div>
          </div>
          <div className="request-list">
            {accepted.length ? (
              accepted.map((request) => (
                <div key={request.id}>
                  <span className="avatar">{getInitials(request.coupleName)}</span>
                  <p>
                    <strong>{request.coupleName}</strong>
                    <small>
                      {request.venue}, {request.location}
                    </small>
                  </p>
                  <Link
                    className="button button-secondary"
                    href={`/weddings/${request.weddingKey}`}
                  >
                    {text("Open brief")}
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-yes-muted">
                {text("Accepted requests will appear here.")}
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
