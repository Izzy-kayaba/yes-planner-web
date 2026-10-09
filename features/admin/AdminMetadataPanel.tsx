"use client";

import { BadgeCheck, CircleDashed, CircleCheck } from "lucide-react";
import { useState } from "react";
import { AdminSearch } from "@/features/admin/AdminSearch";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult, Pagination as PaginationMetadata } from "@/lib/api/contracts";
import type { AdminMetadataRow } from "@/lib/admin/metadata";

export function AdminMetadataPanel({
  endpoint,
  initialItems,
  initialPagination,
  columns,
  emptyMessage,
}: {
  endpoint: string;
  initialItems: AdminMetadataRow[];
  initialPagination: PaginationMetadata;
  columns: string[];
  emptyMessage: string;
}) {
  const { text } = useLanguage();
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const isBusinessDirectory = columns.includes("Claim status");
  const [search, setSearch] = useState("");
  const [publication, setPublication] = useState("all");
  const [claim, setClaim] = useState("all");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(false);

  async function loadPage(
    page: number,
    overrides: { publication?: string; claim?: string; sort?: string; search?: string } = {},
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        search: (overrides.search ?? search).trim(),
      });
      const nextPublication = overrides.publication ?? publication;
      const nextClaim = overrides.claim ?? claim;
      const nextSort = overrides.sort ?? sort;
      if (nextPublication !== "all") params.set("publication", nextPublication);
      if (nextClaim !== "all") params.set("claim", nextClaim);
      if (nextSort !== "default") params.set("sort", nextSort);
      const result = await apiRequest<PaginatedResult<AdminMetadataRow>>(`${endpoint}?${params}`, {
        cache: "no-store",
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "The list could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="panel overflow-hidden">
      <AdminSearch
        value={search}
        onChange={setSearch}
        onSearch={() => void loadPage(1)}
        filters={
          isBusinessDirectory
            ? [
                {
                  label: "Publication status",
                  value: publication,
                  options: [
                    { value: "all", label: text("All publication states") },
                    { value: "published", label: text("Published") },
                    { value: "draft", label: text("Draft") },
                  ],
                  onChange: (value) => {
                    setPublication(value);
                    void loadPage(1, { publication: value });
                  },
                },
                {
                  label: "Claim status",
                  value: claim,
                  options: [
                    { value: "all", label: text("All claim states") },
                    { value: "claimed", label: text("Claimed") },
                    { value: "unclaimed", label: text("Unclaimed") },
                  ],
                  onChange: (value) => {
                    setClaim(value);
                    void loadPage(1, { claim: value });
                  },
                },
              ]
            : []
        }
        sortLabel="Sort records"
        sortValue={sort}
        sortOptions={
          isBusinessDirectory
            ? [
                { value: "default", label: text("Business name (A-Z)") },
                { value: "serviceArea", label: text("Service area (A-Z)") },
                { value: "publication", label: text("Published first") },
                { value: "claim", label: text("Claimed first") },
              ]
            : [
                { value: "default", label: text("Wedding date (latest first)") },
                { value: "name", label: text("Wedding name (A-Z)") },
                { value: "country", label: text("Country (A-Z)") },
              ]
        }
        onSortChange={(value) => {
          setSort(value);
          void loadPage(1, { sort: value });
        }}
      />
      {items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th className="border-b border-yes-line px-4 py-3 font-bold" key={column}>
                    {text(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b border-yes-line last:border-0" key={item.id}>
                  {item.values.map((value, index) => (
                    <td className="px-4 py-3 text-yes-muted" key={`${item.id}-${index}`}>
                      {columnIsClaimStatus(columns[index]) ? (
                        <StatusPill tone={value === "Claimed" ? "sage" : "neutral"}>
                          {value === "Claimed" ? (
                            <BadgeCheck aria-hidden="true" className="mr-1.5" size={14} />
                          ) : (
                            <CircleDashed aria-hidden="true" className="mr-1.5" size={14} />
                          )}
                          {text(value)}
                        </StatusPill>
                      ) : value === "Published" || value === "Draft" ? (
                        <StatusPill tone={value === "Published" ? "sage" : "neutral"}>
                          {value === "Published" ? (
                            <CircleCheck aria-hidden="true" className="mr-1.5" size={14} />
                          ) : (
                            <CircleDashed aria-hidden="true" className="mr-1.5" size={14} />
                          )}
                          {text(value)}
                        </StatusPill>
                      ) : (
                        text(value) || "—"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-yes-muted">
          {text(
            search || publication !== "all" || claim !== "all"
              ? "No records match the current search or filters."
              : emptyMessage,
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

function columnIsClaimStatus(column: string | undefined) {
  return column === "Claim status";
}
