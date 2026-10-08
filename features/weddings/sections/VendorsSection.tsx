"use client";

import { Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  EntityDialog,
  type EntityField,
  type EntityFormValue,
} from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { SearchField } from "@/components/forms/SearchField";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination } from "@/components/ui/Pagination";
import { MetricGrid } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { vendors } from "@/lib/demo-data";
import { getInitials } from "@/lib/initials";
import { useConnectedVendors } from "@/hooks/useConnectedVendors";
import { useConfirmation } from "@/hooks/useConfirmation";

type Vendor = {
  id: string | number;
  name: string;
  category: string;
  rating: string;
  priceMinor: number;
  status: string;
  initials: string;
  tone: string;
  saved: boolean;
};
const seed: Vendor[] = vendors.map((vendor, index) => ({
  ...vendor,
  id: index + 1,
  priceMinor: 0,
  saved: false,
}));
export function VendorsSection() {
  const { text } = useLanguage();
  const { displayMoney } = useCurrency();
  const { items, create, update, remove, page, setPage, pagination } =
    useWorkspaceCollection<Vendor>("vendors", seed);
  const connectedVendors = useConnectedVendors();
  const confirmation = useConfirmation();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const fields: EntityField[] = [
    {
      name: "name",
      label: "Vendor name",
      type: "select",
      options: connectedVendors.map((vendor) => ({ value: vendor.name, label: vendor.name })),
      required: true,
    },
    { name: "category", label: "Category", required: true },
    { name: "rating", label: "Rating", type: "number", required: true },
    { name: "priceUsd", label: "Price (USD)", type: "number", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["Confirmed", "Quote received", "Shortlisted"],
      required: true,
    },
  ];
  const shown = items.filter((vendor) =>
    `${vendor.name} ${vendor.category}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function save(values: Record<string, EntityFormValue>) {
    const base = values as unknown as Pick<Vendor, "name" | "category" | "rating" | "status"> & {
      priceUsd: number;
    };
    const input = {
      name: base.name,
      category: base.category,
      rating: base.rating,
      status: base.status,
      priceMinor: Math.round(Number(base.priceUsd) * 100),
      initials: getInitials(base.name),
      tone: editing?.tone ?? "rose",
      saved: editing?.saved ?? false,
    } as Omit<Vendor, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }

  return (
    <>
      <MetricGrid
        items={[
          {
            label: "Confirmed",
            value: String(items.filter((item) => item.status === "Confirmed").length),
            detail: "Core team secured",
            tone: "sage",
          },
          {
            label: "Quotes open",
            value: String(items.filter((item) => item.status !== "Confirmed").length),
            detail: "Awaiting decisions",
            tone: "gold",
          },
          {
            label: "Saved",
            value: String(items.filter((item) => item.saved).length),
            detail: "Portfolio shortlist",
            tone: "rose",
          },
          {
            label: "Average rating",
            value: items.length
              ? (items.reduce((sum, item) => sum + Number(item.rating), 0) / items.length).toFixed(
                  1,
                )
              : "—",
            detail: "Across your team",
            tone: "blue",
          },
        ]}
      />
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search vendors" />
        <button
          className="button button-primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={15} /> {text("Add vendor")}
        </button>
      </div>
      <section className="vendor-grid">
        {shown.map((vendor) => (
          <article className="vendor-card" key={vendor.id}>
            <div className={`vendor-cover tone-${vendor.tone}`}>
              <span>{vendor.initials}</span>
              <button
                className="icon-button"
                aria-label={`${text("Save")} ${vendor.name}`}
                onClick={() => void update({ ...vendor, saved: !vendor.saved })}
              >
                <Heart size={16} fill={vendor.saved ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="vendor-card-copy">
              <div>
                <p>{text(vendor.category)}</p>
                <StatusPill tone={vendor.status === "Confirmed" ? "sage" : "gold"}>
                  {vendor.status}
                </StatusPill>
              </div>
              <h3>{vendor.name}</h3>
              <p>
                <span className="rating">★ {vendor.rating}</span> {text("· Johannesburg")}
              </p>
              <strong>
                {vendor.priceMinor ? displayMoney(vendor.priceMinor) : text("Quote required")}
              </strong>
              <div className="flex gap-2">
                <button
                  className="button button-secondary flex-1 min-w-0"
                  onClick={() => {
                    setEditing(vendor);
                    setOpen(true);
                  }}
                >
                  <Pencil size={14} /> {text("Edit")}
                </button>
                <button
                  className="icon-button shrink-0"
                  onClick={() =>
                    void confirmation
                      .confirm({
                        description: `${text("Remove")} ${vendor.name}?`,
                        confirmLabel: "Remove",
                      })
                      .then((confirmed) => {
                        if (confirmed) void remove(vendor.id);
                      })
                  }
                  aria-label={`${text("Delete")} ${vendor.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <Pagination
        page={page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={setPage}
      />
      <EntityDialog
        open={open}
        title={editing ? "Edit vendor" : "Add vendor"}
        fields={fields}
        initialValues={
          editing
            ? { ...editing, priceUsd: editing.priceMinor / 100 }
            : { status: "Shortlisted", rating: 5, priceUsd: 0 }
        }
        onClose={() => setOpen(false)}
        onSave={save}
      />
      {confirmation.dialog}
    </>
  );
}
