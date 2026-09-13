"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { SearchField } from "@/components/forms/SearchField";
import { StatusPill } from "@/components/ui/StatusPill";
import { MetricGrid } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { guests as guestSeed } from "@/lib/demo-data";
import { getInitials } from "@/lib/initials";
import type { Guest } from "@/types";

const fields = [
  { name: "name", label: "Guest name", required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
  { name: "group", label: "Group", required: true },
  {
    name: "status",
    label: "RSVP",
    type: "select" as const,
    options: ["Attending", "Pending", "Declined"],
    required: true,
  },
  { name: "meal", label: "Meal preference", required: true },
  { name: "table", label: "Table", required: true },
];

export function GuestsSection() {
  const { items, create, update, remove } = useWorkspaceCollection<Guest>("guests", guestSeed);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const filtered = useMemo(
    () =>
      items.filter(
        (guest) =>
          (status === "All" || guest.status === status) &&
          `${guest.name} ${guest.email} ${guest.group}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query, status],
  );

  async function save(values: Record<string, EntityFormValue>) {
    const guest = values as unknown as Omit<Guest, "id">;
    if (editing) await update({ ...guest, id: editing.id });
    else await create(guest);
  }

  return (
    <>
      <MetricGrid
        items={[
          {
            label: "Invited",
            value: String(items.length),
            detail: "Across all households",
            tone: "rose",
          },
          {
            label: "Attending",
            value: String(items.filter((item) => item.status === "Attending").length),
            detail: "Confirmed responses",
            tone: "sage",
          },
          {
            label: "Awaiting reply",
            value: String(items.filter((item) => item.status === "Pending").length),
            detail: "Reminder candidates",
            tone: "gold",
          },
          {
            label: "Dietary notes",
            value: String(items.filter((item) => item.meal !== "Standard").length),
            detail: "Review with caterer",
            tone: "blue",
          },
        ]}
      />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <SearchField value={query} onChange={setQuery} placeholder="Search guests" />
          <div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter guests by RSVP"
            >
              <option>All</option>
              <option>Attending</option>
              <option>Pending</option>
              <option>Declined</option>
            </select>
            <button
              className="button button-primary"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={15} /> Add guest
            </button>
          </div>
        </div>
        <div className="data-table">
          <div className="table-head">
            <span>Guest</span>
            <span>Group</span>
            <span>RSVP</span>
            <span>Meal</span>
            <span>Table</span>
            <span />
          </div>
          {filtered.map((guest) => (
            <div className="table-row" key={guest.id}>
              <span className="person-cell">
                <i>{getInitials(guest.name)}</i>
                <b>
                  {guest.name}
                  <small>{guest.email}</small>
                </b>
              </span>
              <span>{guest.group}</span>
              <span>
                <StatusPill
                  tone={
                    guest.status === "Attending"
                      ? "sage"
                      : guest.status === "Declined"
                        ? "rose"
                        : "gold"
                  }
                >
                  {guest.status}
                </StatusPill>
              </span>
              <span>{guest.meal}</span>
              <span>{guest.table}</span>
              <span className="flex justify-end gap-1">
                <button
                  className="icon-button"
                  aria-label={`Edit ${guest.name}`}
                  onClick={() => {
                    setEditing(guest);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${guest.name}`}
                  onClick={() => {
                    if (window.confirm(`Remove ${guest.name}?`)) void remove(guest.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="table-footer">
          <span>
            Showing {filtered.length} of {items.length} guests
          </span>
        </div>
      </section>
      <EntityDialog
        open={dialogOpen}
        title={editing ? "Edit guest" : "Add guest"}
        fields={fields}
        initialValues={editing ?? { status: "Pending", meal: "Not selected", table: "Unassigned" }}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
    </>
  );
}
