"use client";

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
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: string;
  createdAt: string;
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
            <div
              className="grid gap-2 border-b border-yes-line py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={event.id}
            >
              <div className="grid min-w-0 gap-1">
                <strong className="break-words text-sm">{text(event.action)}</strong>
                <span className="break-words text-sm text-yes-muted">
                  {event.resourceType}
                  {event.resourceId ? ` · ${event.resourceId}` : ""} · {event.actorUserId}
                </span>
              </div>
              <StatusPill tone={event.outcome === "success" ? "sage" : "rose"}>
                {text(event.outcome)}
              </StatusPill>
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
