"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { YesSelect } from "@/components/ui/YesSelect";
import { AdminSearch } from "@/features/admin/AdminSearch";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/lib/api/contracts";
import { manageableSupportStatuses, supportCategories } from "@/lib/support/contracts";

function isManageableSupportStatus(
  value: string,
): value is (typeof manageableSupportStatuses)[number] {
  return (manageableSupportStatuses as readonly string[]).includes(value);
}

type SupportItem = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterType: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  relatedWeddingKey: string;
  createdAt: string;
  updatedAt: string;
};

export function AdminSupportPanel({
  initialRequests,
  initialPagination,
  canManageRequests = false,
}: {
  initialRequests: SupportItem[];
  initialPagination: PaginatedResult<SupportItem>["pagination"];
  canManageRequests?: boolean;
}) {
  const { text } = useLanguage();
  const [requests, setRequests] = useState(initialRequests);
  const [pagination, setPagination] = useState(initialPagination);
  const [saving, setSaving] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(false);

  async function loadPage(
    page: number,
    overrides: { status?: string; category?: string; sort?: string; search?: string } = {},
  ) {
    setLoading(true);
    try {
      const nextStatus = overrides.status ?? statusFilter;
      const nextCategory = overrides.category ?? categoryFilter;
      const nextSort = overrides.sort ?? sort;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        search: (overrides.search ?? search).trim(),
      });
      if (nextStatus !== "all") params.set("status", nextStatus);
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (nextSort !== "default") params.set("sort", nextSort);
      const result = await apiRequest<PaginatedResult<SupportItem>>(
        `/api/v1/admin/support-requests?${params}`,
        { cache: "no-store" },
      );
      setRequests(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Support requests could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    requestId: string,
    status: (typeof manageableSupportStatuses)[number],
  ) {
    setSaving(requestId);
    try {
      await apiRequest("/api/v1/admin/support-requests", {
        method: "PATCH",
        body: JSON.stringify({ requestId, status }),
      });
      await loadPage(pagination.page);
      toast.success(text("Support request updated."));
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Support request could not be updated."),
      );
    } finally {
      setSaving("");
    }
  }

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text("Platform support")}</p>
          <h2>{text("Support requests")}</h2>
        </div>
      </div>
      <AdminSearch
        value={search}
        onChange={setSearch}
        onSearch={() => void loadPage(1)}
        filters={[
          {
            label: "Support status",
            value: statusFilter,
            options: [
              { value: "all", label: text("All statuses") },
              ...["New", ...manageableSupportStatuses].map((value) => ({
                value,
                label: text(value),
              })),
            ],
            onChange: (value) => {
              setStatusFilter(value);
              void loadPage(1, { status: value });
            },
          },
          {
            label: "Support category",
            value: categoryFilter,
            options: [
              { value: "all", label: text("All categories") },
              ...supportCategories.map((value) => ({ value, label: text(value) })),
            ],
            onChange: (value) => {
              setCategoryFilter(value);
              void loadPage(1, { category: value });
            },
          },
        ]}
        sortLabel="Sort support requests"
        sortValue={sort}
        sortOptions={[
          { value: "default", label: text("Created (newest first)") },
          { value: "updated", label: text("Updated (newest first)") },
          { value: "subject", label: text("Subject (A-Z)") },
        ]}
        onSortChange={(value) => {
          setSort(value);
          void loadPage(1, { sort: value });
        }}
        onClear={() => {
          setSearch("");
          setStatusFilter("all");
          setCategoryFilter("all");
          setSort("default");
          void loadPage(1, {
            status: "all",
            category: "all",
            sort: "default",
            search: "",
          });
        }}
      />
      {requests.length ? (
        <div className="section-stack">
          {requests.map((request) => (
            <section className="panel panel-soft" key={request.id}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">
                    {text(request.category)} · {text(request.requesterType)}
                  </p>
                  <h3>{request.subject}</h3>
                  <p className="text-sm text-yes-muted">
                    {request.requesterName} ·{" "}
                    <a href={`mailto:${request.requesterEmail}`}>{request.requesterEmail}</a>
                  </p>
                </div>
                {canManageRequests && (
                  <YesSelect
                    ariaLabel={text("Support request status")}
                    className="w-48 shrink-0"
                    disabled={saving === request.id}
                    options={[
                      { value: "New", label: text("New") },
                      ...manageableSupportStatuses.map((status) => ({
                        value: status,
                        label: text(status),
                      })),
                    ]}
                    value={request.status}
                    onChange={(status) => {
                      if (isManageableSupportStatus(status)) {
                        void updateStatus(request.id, status);
                      }
                    }}
                  />
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm">{request.description}</p>
              {request.relatedWeddingKey && (
                <p className="text-sm text-yes-muted">
                  {text("Related wedding")}: {request.relatedWeddingKey}
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm text-yes-muted">
          {text(
            search || statusFilter !== "all" || categoryFilter !== "all"
              ? "No matching support requests were found."
              : "There are no support requests.",
          )}
        </p>
      )}
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
