"use client";

import { Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { SearchField } from "@/components/forms/SearchField";
import { StatusPill } from "@/components/ui/StatusPill";
import { MetricGrid } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { vendors } from "@/lib/demo-data";
import { getInitials } from "@/lib/initials";

type Vendor = (typeof vendors)[number] & { id: string | number; saved: boolean };
const seed = vendors.map((vendor, index) => ({ ...vendor, id: index + 1, saved: false }));
const fields = [
  { name: "name", label: "Vendor name", required: true },
  { name: "category", label: "Category", required: true },
  { name: "rating", label: "Rating", type: "number" as const, required: true },
  { name: "price", label: "Price", required: true },
  {
    name: "status",
    label: "Status",
    type: "select" as const,
    options: ["Confirmed", "Quote received", "Shortlisted"],
    required: true,
  },
];

export function VendorsSection() {
  const { items, create, update, remove } = useWorkspaceCollection<Vendor>("vendors", seed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const shown = items.filter((vendor) =>
    `${vendor.name} ${vendor.category}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function save(values: Record<string, EntityFormValue>) {
    const base = values as unknown as Pick<
      Vendor,
      "name" | "category" | "rating" | "price" | "status"
    >;
    const input = {
      ...base,
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
          <Plus size={15} /> Add vendor
        </button>
      </div>
      <section className="vendor-grid">
        {shown.map((vendor) => (
          <article className="vendor-card" key={vendor.id}>
            <div className={`vendor-cover tone-${vendor.tone}`}>
              <span>{vendor.initials}</span>
              <button
                aria-label={`Save ${vendor.name}`}
                onClick={() => void update({ ...vendor, saved: !vendor.saved })}
              >
                <Heart size={16} fill={vendor.saved ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="vendor-card-copy">
              <div>
                <p>{vendor.category}</p>
                <StatusPill tone={vendor.status === "Confirmed" ? "sage" : "gold"}>
                  {vendor.status}
                </StatusPill>
              </div>
              <h3>{vendor.name}</h3>
              <p>
                <span className="rating">★ {vendor.rating}</span> · Johannesburg
              </p>
              <strong>{vendor.price}</strong>
              <div className="flex gap-2">
                <button
                  className="button button-secondary flex-1"
                  onClick={() => {
                    setEditing(vendor);
                    setOpen(true);
                  }}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="icon-button"
                  onClick={() => {
                    if (window.confirm(`Remove ${vendor.name}?`)) void remove(vendor.id);
                  }}
                  aria-label={`Delete ${vendor.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <EntityDialog
        open={open}
        title={editing ? "Edit vendor" : "Add vendor"}
        fields={fields}
        initialValues={editing ?? { status: "Shortlisted", rating: 5 }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
}
