"use client";
// Purpose: implements features/admin/AdminMetadataPanel.tsx for the Yes Planner web application.

import { BadgeCheck, CircleDashed, CircleCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AdminSearch } from "@/features/admin/AdminSearch";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import {
  EntityDialog,
  type EntityField,
  type EntityFormValue,
} from "@/components/forms/EntityDialog";
import { StatusPill } from "@/components/ui/StatusPill";
import { apiRequest } from "@/lib/api/client";
import { useConfirmation } from "@/hooks/useConfirmation";
import { countryOptions } from "@/lib/countries";
import type { PaginatedResult, Pagination as PaginationMetadata } from "@/lib/api/contracts";
import type { AdminMetadataRow } from "@/lib/admin/metadata";

export function AdminMetadataPanel({
  endpoint,
  initialItems,
  initialPagination,
  columns,
  emptyMessage,
  resource,
  canManage,
}: {
  endpoint: string;
  initialItems: AdminMetadataRow[];
  initialPagination: PaginationMetadata;
  columns: string[];
  emptyMessage: string;
  resource: "weddings" | "businesses" | "venues";
  canManage: boolean;
}) {
  const { language, text } = useLanguage();
  const confirmation = useConfirmation();
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const isBusinessDirectory = columns.includes("Claim status");
  const [search, setSearch] = useState("");
  const [publication, setPublication] = useState("all");
  const [claim, setClaim] = useState("all");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<AdminMetadataRow | null>(null);

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

  function openEditor(mode: "create" | "edit", item?: AdminMetadataRow) {
    setEditor(mode);
    setSelected(item ?? null);
  }

  async function submitEditor(values: Record<string, EntityFormValue>) {
    try {
      const payload =
        resource === "weddings"
          ? { ...(editor === "edit" ? { weddingId: selected?.id } : {}), ...values }
          : {
              ...(editor === "edit" ? { businessId: selected?.id } : {}),
              ...values,
              services: String(values.services ?? "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
              published: values.published === true,
            };
      await apiRequest(endpoint, {
        method: editor === "create" ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success(text(editor === "create" ? "Record created." : "Record updated."));
      setEditor(null);
      await loadPage(pagination.page);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "The record could not be saved."));
    }
  }

  async function deleteItem(item: AdminMetadataRow) {
    const confirmed = await confirmation.confirm({
      title: "Delete record",
      description: "Delete this record? This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    try {
      await apiRequest(endpoint, {
        method: "DELETE",
        body: JSON.stringify(
          resource === "weddings" ? { weddingId: item.id } : { businessId: item.id },
        ),
      });
      toast.success(text("Record deleted."));
      await loadPage(
        Math.min(
          pagination.page,
          Math.max(1, Math.ceil((pagination.totalItems - 1) / pagination.pageSize)),
        ),
      );
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "The record could not be deleted."),
      );
    }
  }

  return (
    <article className="panel overflow-hidden">
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button className="w-full sm:w-auto" type="button" onClick={() => openEditor("create")}>
            <Plus size={16} />
            {text("Add record")}
          </Button>
        </div>
      )}
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
                {canManage && (
                  <th className="border-b border-yes-line px-4 py-3 font-bold">
                    {text("Actions")}
                  </th>
                )}
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
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          aria-label={text("Edit record")}
                          className="px-3"
                          type="button"
                          variant="secondary"
                          onClick={() => openEditor("edit", item)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          aria-label={text("Delete record")}
                          className="px-3"
                          type="button"
                          variant="blush"
                          onClick={() => void deleteItem(item)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  )}
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
      <EntityDialog
        open={editor !== null}
        title={editor === "create" ? "Add record" : "Edit record"}
        fields={metadataEditorFields(resource, language)}
        initialValues={metadataInitialValues(resource, selected)}
        onClose={() => setEditor(null)}
        onSave={submitEditor}
      />
      {confirmation.dialog}
    </article>
  );
}

function metadataEditorFields(
  resource: "weddings" | "businesses" | "venues",
  language: string,
): EntityField[] {
  if (resource === "weddings") {
    return [
      { name: "displayName", label: "Wedding name", required: true },
      { name: "weddingDate", label: "Wedding date", type: "date", required: true },
      { name: "venue", label: "Venue" },
      {
        name: "location",
        label: "Country",
        type: "select",
        options: countryOptions(language),
        placeholder: "Select a country",
        required: true,
      },
    ];
  }
  return [
    {
      name: "businessName",
      label: resource === "venues" ? "Venue name" : "Business name",
      required: true,
    },
    { name: "services", label: "Services (comma-separated)", required: true },
    { name: "serviceArea", label: "Service area" },
    {
      name: "countryCode",
      label: "Country",
      type: "select",
      options: countryOptions(language),
      placeholder: "Select a country",
      required: true,
    },
    { name: "published", label: "Published", type: "checkbox" },
  ];
}

function metadataInitialValues(
  resource: "weddings" | "businesses" | "venues",
  item: AdminMetadataRow | null,
) {
  const values = item?.values ?? [];
  return resource === "weddings"
    ? {
        displayName: values[0] ?? "",
        weddingDate: values[1] ?? "",
        venue: values[2] ?? "",
        location: values[3] ?? "",
      }
    : {
        businessName: values[0] ?? "",
        services: values[1] ?? "",
        serviceArea: values[2] ?? "",
        countryCode: values[3] ?? "",
        published: values[4] === "Published",
      };
}

function columnIsClaimStatus(column: string | undefined) {
  return column === "Claim status";
}
