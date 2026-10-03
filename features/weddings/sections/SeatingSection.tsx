"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MetricGrid } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";

type SeatingTable = {
  id: string | number;
  name: string;
  label: string;
  count: number;
  capacity: number;
  guests: string;
};
const seed: SeatingTable[] = [
  { id: 1, name: "Table 01", label: "Family", count: 10, capacity: 10, guests: "Mokoena family" },
  { id: 2, name: "Table 02", label: "Family", count: 9, capacity: 10, guests: "Dlamini family" },
  {
    id: 3,
    name: "Table 03",
    label: "Friends",
    count: 8,
    capacity: 10,
    guests: "University friends",
  },
];
const fields = [
  { name: "name", label: "Table name", required: true },
  { name: "label", label: "Group", required: true },
  { name: "count", label: "Guests seated", type: "number" as const, required: true },
  { name: "capacity", label: "Capacity", type: "number" as const, required: true },
  { name: "guests", label: "Guest names or group", type: "textarea" as const, required: true },
];

export function SeatingSection() {
  const { text } = useLanguage();
  const { items, create, update, remove } = useWorkspaceCollection<SeatingTable>("seating", seed);
  const [editing, setEditing] = useState<SeatingTable | null>(null);
  const [open, setOpen] = useState(false);
  const seated = items.reduce((sum, table) => sum + table.count, 0);
  const capacity = items.reduce((sum, table) => sum + table.capacity, 0);

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
            value: String(Math.max(0, 118 - seated)),
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
      <section className="seating-grid">
        {items.map((table) => (
          <article className="table-card" key={table.id}>
            <div className="round-table">
              <span>
                {table.count}/{table.capacity}
              </span>
              {Array.from({ length: 6 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <h3>{text(table.name)}</h3>
            <p>
              {text(table.label)} · {table.guests}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                className="text-link inline-flex items-center gap-1"
                onClick={() => {
                  setEditing(table);
                  setOpen(true);
                }}
              >
                <Pencil size={13} />
                {text("Arrange")}
              </button>

              <button
                className="text-link inline-flex items-center"
                onClick={() => {
                  if (window.confirm(`${text("Delete")} ${text(table.name)}?`)) {
                    void remove(table.id);
                  }
                }}
                aria-label={`${text("Delete")} ${text(table.name)}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </article>
        ))}
      </section>
      <EntityDialog
        open={open}
        title={editing ? "Arrange table" : "Add table"}
        fields={fields}
        initialValues={editing ?? { count: 0, capacity: 10 }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
}
