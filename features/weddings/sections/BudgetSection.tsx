"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { budgetCategories } from "@/lib/demo-data";

type BudgetCategory = {
  id: string | number;
  name: string;
  amount: number;
  budget: number;
  color: string;
};
const seed = budgetCategories.map((category, index) => ({ ...category, id: index + 1 }));
const fields = [
  { name: "name", label: "Category", required: true },
  { name: "amount", label: "Committed amount", type: "number" as const, required: true },
  { name: "budget", label: "Planned budget", type: "number" as const, required: true },
  {
    name: "color",
    label: "Colour",
    type: "select" as const,
    options: ["#8d4656", "#71826b", "#b99052", "#74859d"],
    required: true,
  },
];

export function BudgetSection() {
  const { text } = useLanguage();
  const { items, create, update, remove } = useWorkspaceCollection<BudgetCategory>("budget", seed);
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.budget, 0);
  const committed = items.reduce((sum, item) => sum + item.amount, 0);
  const allocated = total ? Math.round((committed / total) * 100) : 0;

  async function save(values: Record<string, EntityFormValue>) {
    const input = values as unknown as Omit<BudgetCategory, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }

  return (
    <>
      <section className="budget-summary-card">
        <div>
          <p className="eyebrow light">{text("Total wedding budget")}</p>
          <strong>R {total.toLocaleString()}</strong>
          <span>
            R {committed.toLocaleString()} {text("committed")} · R{" "}
            {(total - committed).toLocaleString()} {text("remaining")}
          </span>
        </div>
        <div className="budget-donut">
          <span>
            <b>{allocated}%</b>
            {text("allocated")}
          </span>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Categories")}</p>
            <h3>{text("Planned versus committed")}</h3>
          </div>
          <button
            className="button button-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={15} /> {text("Add category")}
          </button>
        </div>
        <div className="budget-bars">
          {items.map((item) => (
            <div key={item.id}>
              <span>
                <b>{text(item.name)}</b>
                <small>
                  R {item.amount.toLocaleString()} / R {item.budget.toLocaleString()}{" "}
                  <button
                    className="ml-2"
                    aria-label={`${text("Edit")} ${text(item.name)}`}
                    onClick={() => {
                      setEditing(item);
                      setOpen(true);
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="ml-1"
                    aria-label={`${text("Delete")} ${text(item.name)}`}
                    onClick={() => {
                      if (window.confirm(`${text("Delete")} ${text(item.name)}?`))
                        void remove(item.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </small>
              </span>
              <div>
                <i
                  style={{
                    width: `${Math.min(100, (item.amount / item.budget) * 100)}%`,
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <EntityDialog
        open={open}
        title={editing ? "Edit budget category" : "Add budget category"}
        fields={fields}
        initialValues={editing ?? { color: "#8d4656", amount: 0, budget: 0 }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
}
