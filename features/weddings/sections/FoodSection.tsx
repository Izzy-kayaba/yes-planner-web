"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusPill } from "@/components/ui/StatusPill";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";

type Menu = { id: string | number; name: string; starter: string; main: string; dessert: string };
const seed: Menu[] = [
  {
    id: 1,
    name: "Modern South African",
    starter: "Charred peach, burrata & rooibos glaze",
    main: "Braised beef short rib or wild mushroom parcel",
    dessert: "Amarula crème brûlée with almond tuile",
  },
];
const meals = [
  { name: "Standard menu", count: 84, percent: 71, color: "rose" },
  { name: "Vegetarian", count: 18, percent: 15, color: "sage" },
  { name: "Halaal", count: 12, percent: 10, color: "gold" },
  { name: "Children's menu", count: 4, percent: 4, color: "blue" },
];
const fields = [
  { name: "name", label: "Menu name", required: true },
  { name: "starter", label: "Starter", type: "textarea" as const, required: true },
  { name: "main", label: "Main course", type: "textarea" as const, required: true },
  { name: "dessert", label: "Dessert", type: "textarea" as const, required: true },
];

export function FoodSection() {
  const { text } = useLanguage();
  const { items, update } = useWorkspaceCollection<Menu>("food-drinks", seed);
  const [open, setOpen] = useState(false);
  const menu = items[0] ?? seed[0];
  async function save(values: Record<string, EntityFormValue>) {
    await update({ ...(values as unknown as Omit<Menu, "id">), id: menu.id });
  }
  return (
    <section className="dashboard-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Meal selections")}</p>
            <h3>{text("118 confirmed meals")}</h3>
          </div>
          <StatusPill tone="sage">72% complete</StatusPill>
        </div>
        <div className="meal-list">
          {meals.map((meal) => (
            <div key={meal.name}>
              <span className={`meal-swatch tone-${meal.color}`} />
              <p>
                <strong>{text(meal.name)}</strong>
                <small>
                  {meal.percent}% {text("of responses")}
                </small>
              </p>
              <b>{meal.count}</b>
            </div>
          ))}
        </div>
      </article>
      <article className="panel menu-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Selected menu")}</p>
            <h3>{text(menu.name)}</h3>
          </div>
          <button className="button button-secondary" onClick={() => setOpen(true)}>
            <Pencil size={14} /> {text("Edit menu")}
          </button>
        </div>
        <div className="menu-course">
          <span>{text("Starter")}</span>
          <strong>{text(menu.starter)}</strong>
        </div>
        <div className="menu-course">
          <span>{text("Main")}</span>
          <strong>{text(menu.main)}</strong>
        </div>
        <div className="menu-course">
          <span>{text("Dessert")}</span>
          <strong>{text(menu.dessert)}</strong>
        </div>
        <div className="dietary-alert">
          <strong>{text("14 dietary notes")}</strong>
          <span>{text("3 guests require caterer confirmation")}</span>
        </div>
      </article>
      <EntityDialog
        open={open}
        title="Edit menu"
        fields={fields}
        initialValues={menu}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </section>
  );
}
