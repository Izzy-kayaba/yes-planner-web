"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { Pagination } from "@/components/ui/Pagination";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { useConfirmation } from "@/hooks/useConfirmation";
import { budgetCategories } from "@/lib/demo-data";

type BudgetCategory = {
  id: string | number;
  name: string;
  amountMinor: number;
  budgetMinor: number;
  currency?: "USD" | "ZAR";
  color: string;
};
const seed = budgetCategories.map((category, index) => ({
  id: index + 1,
  name: category.name,
  amountMinor: category.amount * 100,
  budgetMinor: category.budget * 100,
  color: category.color,
}));
export function BudgetSection() {
  const { text } = useLanguage();
  const { currency, displayMoney, displayStoredMoney } = useCurrency();
  const { items, create, update, remove, page, setPage, pagination } =
    useWorkspaceCollection<BudgetCategory>("budget", seed);
  const confirmation = useConfirmation();
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.budgetMinor, 0);
  const committed = items.reduce((sum, item) => sum + item.amountMinor, 0);
  const allocated = total ? Math.round((committed / total) * 100) : 0;
  const fields = [
    { name: "name", label: "Budget item", required: true },
    {
      name: "amount",
      label: `Committed amount (${currency})`,
      type: "number" as const,
      required: true,
    },
    {
      name: "budget",
      label: `Planned budget (${currency})`,
      type: "number" as const,
      required: true,
    },
    {
      name: "color",
      label: "Colour",
      type: "select" as const,
      options: [
        { value: "#8d4656", label: "Burgundy" },
        { value: "#71826b", label: "Sage Green" },
        { value: "#b99052", label: "Gold" },
        { value: "#74859d", label: "Dusty Blue" },
      ],
    },
  ];

  async function save(values: Record<string, EntityFormValue>) {
    const input = {
      name: String(values.name),
      amountMinor: Math.round(Number(values.amount) * 100),
      budgetMinor: Math.round(Number(values.budget) * 100),
      currency,
      color: String(values.color || "#8d4656"),
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
            <p className="eyebrow">{text("Budget items")}</p>
            <h3>{text("Planned versus committed")}</h3>
          </div>
          <button
            className="button button-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={15} /> {text("Add budget item")}
          </button>
        </div>
        <div className="budget-bars">
          {items.map((item) => (
            <div className="budget-row" key={item.id}>
              <b>{text(item.name)}</b>
              <small>
                {displayStoredMoney(item.amountMinor, item.currency ?? "USD")} /{" "}
                {displayStoredMoney(item.budgetMinor, item.currency ?? "USD")}
              </small>
              <span className="budget-row-actions">
                <button
                  className="icon-button"
                  aria-label={`${text("Edit")} ${text(item.name)}`}
                  onClick={() => {
                    setEditing(item);
                    setOpen(true);
                  }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="icon-button icon-button-blush"
                  aria-label={`${text("Delete")} ${text(item.name)}`}
                  onClick={() =>
                    void confirmation
                      .confirm({
                        description: `${text("Delete")} ${text(item.name)}?`,
                        confirmLabel: "Delete",
                      })
                      .then((confirmed) => {
                        if (confirmed) void remove(item.id);
                      })
                  }
                >
                  <Trash2 size={12} />
                </button>
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
        <Pagination
          page={page}
          pageSize={pagination.pageSize}
          total={pagination.totalItems}
          onChange={setPage}
        />
      </section>
      <EntityDialog
        open={open}
        title={editing ? "Edit budget item" : "Add budget item"}
        fields={fields}
        initialValues={
          editing
            ? {
                ...editing,
                amount: editing.amountMinor / 100,
                budget: editing.budgetMinor / 100,
              }
            : { color: "#8d4656", amount: 0, budget: 0 }
        }
        onClose={() => setOpen(false)}
        onSave={save}
      />
      {confirmation.dialog}
    </>
  );
}
