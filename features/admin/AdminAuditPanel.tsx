"use client";
// Purpose: implements features/admin/AdminAuditPanel.tsx for the Yes Planner web application.

import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminSearch } from "@/features/admin/AdminSearch";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/lib/api/contracts";

type AuditItem = {
  id: string;
  eventId: string;
  schemaVersion: string;
  occurredAt: string;
  recordedAt: string;
  eventType: string;
  actorUserId: string;
  actorType: string;
  actorRole: string;
  actorName: string;
  actorEmail: string;
  permission: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, { before: unknown; after: unknown }>;
  outcome: string;
  reasonCode: string;
  requestId: string;
  sourceIp: string;
  service: string;
};

export function AdminAuditPanel({
  initialEvents,
  initialPagination,
}: {
  initialEvents: AuditItem[];
  initialPagination: PaginatedResult<AuditItem>["pagination"];
}) {
  const { text } = useLanguage();
  const [events, setEvents] = useState(initialEvents);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(false);

  async function loadPage(
    page: number,
    overrides: { outcome?: string; sort?: string; search?: string } = {},
  ) {
    setLoading(true);
    try {
      const nextOutcome = overrides.outcome ?? outcome;
      const nextSort = overrides.sort ?? sort;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        search: (overrides.search ?? search).trim(),
      });
      if (nextOutcome !== "all") params.set("outcome", nextOutcome);
      if (nextSort !== "default") params.set("sort", nextSort);
      const result = await apiRequest<PaginatedResult<AuditItem>>(`/api/v1/admin/audit?${params}`, {
        cache: "no-store",
      });
      setEvents(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Audit events could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="panel">
      <AdminSearch
        value={search}
        onChange={setSearch}
        onSearch={() => void loadPage(1)}
        filters={[
          {
            label: "Audit outcome",
            value: outcome,
            options: [
              { value: "all", label: text("All outcomes") },
              { value: "success", label: text("Success") },
              { value: "failure", label: text("Failure") },
            ],
            onChange: (value) => {
              setOutcome(value);
              void loadPage(1, { outcome: value });
            },
          },
        ]}
        sortLabel="Sort audit events"
        sortValue={sort}
        sortOptions={[
          { value: "default", label: text("Created (newest first)") },
          { value: "oldest", label: text("Created (oldest first)") },
          { value: "action", label: text("Action (A-Z)") },
        ]}
        onSortChange={(value) => {
          setSort(value);
          void loadPage(1, { sort: value });
        }}
      />
      <div className="grid">
        {events.length ? (
          events.map((event) => (
            <div className="grid gap-4 border-b border-yes-line py-5 last:border-0" key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid min-w-0 gap-1">
                  <strong className="break-words text-sm">{text(event.eventType)}</strong>
                  <span className="break-words text-sm text-yes-muted">
                    {text(event.action)} · {event.resourceType}
                    {event.resourceId ? ` · ${event.resourceId}` : ""}
                  </span>
                </div>
                <StatusPill tone={event.outcome === "success" ? "sage" : "rose"}>
                  {text(event.outcome)}
                </StatusPill>
              </div>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <AuditField label="Event ID" value={event.eventId} />
                <AuditField label="Schema version" value={event.schemaVersion} />
                <AuditField label="Event type" value={event.eventType} />
                <AuditField label="Occurred at" value={formatAuditDate(event.occurredAt)} />
                <AuditField label="Recorded at" value={formatAuditDate(event.recordedAt)} />
                <AuditField label="Actor ID" value={event.actorUserId} />
                <AuditField label="Actor type" value={event.actorType} />
                <AuditField label="Actor role" value={event.actorRole} />
                <AuditField label="Actor name" value={event.actorName} />
                <AuditField label="Actor email" value={event.actorEmail} />
                <AuditField label="Permission" value={event.permission} />
                <AuditField label="Action" value={event.action} />
                <AuditField label="Resource type" value={event.resourceType} />
                <AuditField label="Resource ID" value={event.resourceId} />
                <AuditField label="Outcome" value={event.outcome} />
                <AuditField label="Reason code" value={event.reasonCode} />
                <AuditField label="Request ID" value={event.requestId} />
                <AuditField label="Source IP" value={event.sourceIp} />
                <AuditField label="Service" value={event.service} />
                <AuditField
                  className="sm:col-span-2 lg:col-span-3"
                  label="Changes"
                  value={
                    Object.keys(event.changes).length
                      ? JSON.stringify(event.changes)
                      : text("No changes recorded.")
                  }
                />
              </dl>
            </div>
          ))
        ) : (
          <p className="py-2 text-sm text-yes-muted">
            {text(
              search || outcome !== "all"
                ? "No records match the current search or filters."
                : "No audit events have been recorded.",
            )}
          </p>
        )}
      </div>
      {loading && (
        <p aria-live="polite" className="mt-3 text-sm text-yes-muted">
          {text("Loading…")}
        </p>
      )}
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={(page) => void loadPage(page)}
      />
    </article>
  );
}

function AuditField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  const { text } = useLanguage();
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="font-bold text-yes-ink">{text(label)}</dt>
      <dd className="mt-1 break-words text-yes-muted">{value || "—"}</dd>
    </div>
  );
}

function formatAuditDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
