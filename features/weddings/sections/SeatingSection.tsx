"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MetricGrid } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";

type SeatingTable = { id: string | number; name: string; label: string; capacity: number };
type GuestAssignment = { id: string | number; name: string; table: string; status: string };

const fields = [
  { name: "name", label: "Table name", required: true },
  {
    name: "label",
    label: "Group",
    type: "select" as const,
    options: ["Family", "Friends", "Workmates", "Acquaintance", "Mixed"],
    required: true,
  },
  { name: "capacity", label: "Capacity", type: "number" as const, required: true },
];

export function SeatingSection() {
  const { text } = useLanguage();
  const { items, create, update, remove } = useWorkspaceCollection<SeatingTable>("seating", []);
  const { items: guests } = useWorkspaceCollection<GuestAssignment>("guests", []);
  const [editing, setEditing] = useState<SeatingTable | null>(null);
  const [open, setOpen] = useState(false);
  const guestCount = (tableName: string) =>
    guests.filter((guest) => guest.status !== "Declined" && guest.table === tableName).length;
  const seated = items.reduce((sum, table) => sum + guestCount(table.name), 0);
  const capacity = items.reduce((sum, table) => sum + table.capacity, 0);
  const unassigned = guests.filter(
    (guest) => guest.status !== "Declined" && !items.some((table) => table.name === guest.table),
  ).length;

  async function save(values: Record<string, EntityFormValue>) {
    const input = values as unknown as Omit<SeatingTable, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          className="button button-primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={15} /> {text("Add table")}
        </button>
      </div>
      <MetricGrid
        items={[
          {
            label: "Guests seated",
            value: String(seated),
            detail: "Assigned to tables",
            tone: "sage",
          },
          { label: "Tables", value: String(items.length), detail: "Current layout", tone: "rose" },
          {
            label: "Unassigned",
            value: String(unassigned),
            detail: "Need table placement",
            tone: "gold",
          },
          {
            label: "Capacity",
            value: String(capacity),
            detail: `${Math.max(0, capacity - seated)} seats available`,
            tone: "blue",
          },
        ]}
      />
      {items.length ? (
        <section className="seating-grid">
          {items.map((table) => (
            <article className="table-card" key={table.id}>
              <div className="round-table">
                <span>
                  {guestCount(table.name)}/{table.capacity}
                </span>
                {Array.from({ length: 6 }, (_, index) => (
                  <i key={index} />
                ))}
              </div>
              <h3>{text(table.name)}</h3>
              <p>
                {text(table.label)} · {guestCount(table.name)} {text("guests")}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  className="text-link inline-flex items-center gap-1"
                  onClick={() => {
                    setEditing(table);
                    setOpen(true);
                  }}
                >
                  <Pencil size={13} /> {text("Arrange")}
                </button>
                <button
                  className="text-link inline-flex items-center"
                  onClick={() => void remove(table.id)}
                  aria-label={`${text("Delete")} ${text(table.name)}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="panel empty-state">
          <h3>{text("No tables yet")}</h3>
          <p>{text("Add tables before assigning guests to the seating plan.")}</p>
        </section>
      )}
      <EntityDialog
        open={open}
        title={editing ? "Arrange table" : "Add table"}
        fields={fields}
        initialValues={editing ?? { capacity: 10, label: "Mixed" }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
}
