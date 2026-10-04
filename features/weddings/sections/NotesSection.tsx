"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SearchField } from "@/components/forms/SearchField";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";

type Note = { id: string | number; title: string; body: string; color: string; date: string };
const seed: Note[] = [
  {
    id: 1,
    title: "Ceremony readings",
    body: "Ask Gogo about the family blessing and send Lerato the final English translation.",
    color: "rose",
    date: "Updated today",
  },
  {
    id: 2,
    title: "Photo ideas",
    body: "Golden-hour portraits near the stone arches.",
    color: "gold",
    date: "Updated yesterday",
  },
  {
    id: 3,
    title: "Things to ask the venue",
    body: "Wet-weather plan, candles and vendor load-in entrance.",
    color: "sage",
    date: "Updated 10 Sep",
  },
];
const fields = [
  { name: "title", label: "Title", required: true },
  { name: "body", label: "Note", type: "textarea" as const, required: true },
  {
    name: "color",
    label: "Colour",
    type: "select" as const,
    options: ["rose", "sage", "gold", "blue"],
    required: true,
  },
];

export function NotesSection() {
  const { text } = useLanguage();
  const { items, create, update, remove } = useWorkspaceCollection<Note>("notes", seed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);
  async function save(values: Record<string, EntityFormValue>) {
    const input = { ...(values as unknown as Omit<Note, "id" | "date">), date: "Updated just now" };
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }
  const shown = items.filter((note) =>
    `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search notes" />
        <button
          className="button button-primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={14} /> {text("New note")}
        </button>
      </div>
      <section className="notes-grid">
        {shown.map((note) => (
          <article className={`note-card tone-${note.color}`} key={note.id}>
            <div className="flex justify-end gap-2">
              <button
                className="icon-button"
                onClick={() => {
                  setEditing(note);
                  setOpen(true);
                }}
                aria-label={`${text("Edit")} ${note.title}`}
              >
                <Pencil size={14} />
              </button>
              <button
                className="icon-button"
                onClick={() => {
                  if (window.confirm(`${text("Delete")} ${note.title}?`)) void remove(note.id);
                }}
                aria-label={`${text("Delete")} ${note.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <span>✦</span>
            <h3>{text(note.title)}</h3>
            <p>{text(note.body)}</p>
            <small>{text(note.date)}</small>
          </article>
        ))}
      </section>
      <EntityDialog
        open={open}
        title={editing ? "Edit note" : "New note"}
        fields={fields}
        initialValues={editing ?? { color: "rose" }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
}
