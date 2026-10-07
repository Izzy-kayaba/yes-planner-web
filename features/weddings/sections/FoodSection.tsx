"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";

type Menu = { id: string | number; name: string; starter: string; main: string; dessert: string };
const fields = [
  { name: "name", label: "Meal option name", required: true },
  { name: "starter", label: "Starter", type: "textarea" as const, required: true },
  { name: "main", label: "Main course", type: "textarea" as const, required: true },
  { name: "dessert", label: "Dessert", type: "textarea" as const, required: true },
];

export function FoodSection() {
  const { text } = useLanguage();
  const { items, create, update, remove } = useWorkspaceCollection<Menu>("food-drinks", []);
  const { items: guests } = useWorkspaceCollection<{ id: string | number; meal: string }>(
    "guests",
    [],
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);

  async function save(values: Record<string, EntityFormValue>) {
    const input = values as unknown as Omit<Menu, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }

  return (
    <section className="section-stack">
      <div className="flex justify-end">
        <button
          className="button button-primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={14} /> {text("Add meal option")}
        </button>
      </div>
      {items.length ? (
        items.map((menu) => (
          <article className="panel menu-card" key={menu.id}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">{text("Meal option")}</p>
                <h3>{text(menu.name)}</h3>
                <small>
                  {guests.filter((guest) => guest.meal === menu.name).length} {text("guests")}
                </small>
              </div>
              <span className="flex gap-2">
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setEditing(menu);
                    setOpen(true);
                  }}
                >
                  <Pencil size={14} /> {text("Edit")}
                </button>
                <button
                  className="icon-button"
                  aria-label={`${text("Delete")} ${menu.name}`}
                  onClick={() => void remove(menu.id)}
                >
                  <Trash2 size={14} />
                </button>
              </span>
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
          </article>
        ))
      ) : (
        <article className="panel empty-state">
          <h3>{text("No meal options yet")}</h3>
          <p>{text("Add the meal choices guests can select from their invitation.")}</p>
        </article>
      )}
      <EntityDialog
        open={open}
        title={editing ? "Edit meal option" : "Add meal option"}
        fields={fields}
        initialValues={editing ?? {}}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </section>
  );
}
