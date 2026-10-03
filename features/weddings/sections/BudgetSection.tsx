"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { budgetCategories } from "@/lib/demo-data";

type BudgetCategory = {
  id: string | number;
  name: string;
  amountMinor: number;
  budgetMinor: number;
  color: string;
};
const seed = budgetCategories.map((category, index) => ({
  id: index + 1,
  name: category.name,
  amountMinor: category.amount * 100,
  budgetMinor: category.budget * 100,
  color: category.color,
}));
const fields = [
  { name: "name", label: "Category", required: true },
  { name: "amountUsd", label: "Committed amount (USD)", type: "number" as const, required: true },
  { name: "budgetUsd", label: "Planned budget (USD)", type: "number" as const, required: true },
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
  const { displayMoney } = useCurrency();
  const { items, create, update, remove } = useWorkspaceCollection<BudgetCategory>("budget", seed);
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.budgetMinor, 0);
  const committed = items.reduce((sum, item) => sum + item.amountMinor, 0);
  const allocated = total ? Math.round((committed / total) * 100) : 0;

  async function save(values: Record<string, EntityFormValue>) {
    const input = {
      name: String(values.name),
      amountMinor: Math.round(Number(values.amountUsd) * 100),
      budgetMinor: Math.round(Number(values.budgetUsd) * 100),
      color: String(values.color),
    };
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }

  return (
    <>
      <section className="budget-summary-card">
        <div>
          <p className="eyebrow light">{text("Total wedding budget")}</p>
          <strong>{displayMoney(total)}</strong>
          <span>
            {displayMoney(committed)} {text("committed")} · {displayMoney(total - committed)}{" "}
            {text("remaining")}
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
                  {displayMoney(item.amountMinor)} / {displayMoney(item.budgetMinor)}{" "}
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
                    width: `${Math.min(100, (item.amountMinor / item.budgetMinor) * 100)}%`,
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
        initialValues={
          editing
            ? {
                ...editing,
                amountUsd: editing.amountMinor / 100,
                budgetUsd: editing.budgetMinor / 100,
              }
            : { color: "#8d4656", amountUsd: 0, budgetUsd: 0 }
        }
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
}
