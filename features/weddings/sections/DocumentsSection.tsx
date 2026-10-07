"use client";

import { FileText, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SearchField } from "@/components/forms/SearchField";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination } from "@/components/ui/Pagination";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { formatDate } from "@/lib/date-time";

type DocumentItem = {
  id: string | number;
  name: string;
  type: string;
  owner: string;
  date: string;
  access: string;
};
const seed: DocumentItem[] = [
  {
    id: 1,
    name: "Venue agreement.pdf",
    type: "Contract",
    owner: "Ruth",
    date: "10 Sep",
    access: "Private",
  },
  {
    id: 2,
    name: "Photography schedule.pdf",
    type: "Timeline",
    owner: "Lumen & Lace",
    date: "08 Sep",
    access: "Team",
  },
  {
    id: 3,
    name: "Catering invoice 003.pdf",
    type: "Invoice",
    owner: "Izzy",
    date: "04 Sep",
    access: "Team",
  },
];
const fields = [
  { name: "name", label: "Document name", required: true },
  { name: "type", label: "Type", required: true },
  { name: "owner", label: "Owner", required: true },
  { name: "date", label: "Display date", required: true },
  {
    name: "access",
    label: "Access",
    type: "select" as const,
    options: ["Private", "Team"],
    required: true,
  },
];

export function DocumentsSection() {
  const { language, text } = useLanguage();
  const { items, create, update, remove, page, setPage, pagination } =
    useWorkspaceCollection<DocumentItem>("documents", seed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [open, setOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  async function save(values: Record<string, EntityFormValue>) {
    const input = values as unknown as Omit<DocumentItem, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }
  async function receiveFile(file?: File) {
    if (!file) return;
    await create({
      name: file.name,
      type: file.type || "File",
      owner: text("Me"),
      date: formatDate(new Date(), "DD MMM", language),
      access: "Team",
    });
  }
  const shown = items.filter((item) =>
    `${item.name} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search documents" />
        <div>
          <input
            className="hidden"
            id="document-upload"
            name="documentUpload"
            ref={fileInput}
            type="file"
            onChange={(event) => void receiveFile(event.target.files?.[0])}
          />
          <button className="button button-secondary" onClick={() => fileInput.current?.click()}>
            <Upload size={14} /> {text("Upload file")}
          </button>
          <button
            className="button button-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={14} /> {text("Add record")}
          </button>
        </div>
      </div>
      <div className="file-list">
        {shown.map((doc) => (
          <div key={doc.id}>
            <span className="file-icon">
              <FileText size={17} />
            </span>
            <p>
              <strong>{doc.name}</strong>
              <small>
                {text(doc.type)} · {text("Added by")} {doc.owner}
              </small>
            </p>
            <span>{text(doc.date)}</span>
            <StatusPill tone={doc.access === "Private" ? "rose" : "sage"}>{doc.access}</StatusPill>
            <span className="flex gap-1">
              <button
                className="icon-button"
                onClick={() => {
                  setEditing(doc);
                  setOpen(true);
                }}
                aria-label={`${text("Edit")} ${doc.name}`}
              >
                <Pencil size={13} />
              </button>
              <button
                className="icon-button"
                onClick={() => {
                  if (window.confirm(`${text("Delete")} ${doc.name}?`)) void remove(doc.id);
                }}
                aria-label={`${text("Delete")} ${doc.name}`}
              >
                <Trash2 size={13} />
              </button>
            </span>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={setPage}
      />
      <EntityDialog
        open={open}
        title={editing ? "Edit document" : "Add document"}
        fields={fields}
        initialValues={editing ?? { owner: text("Me"), date: "Today", access: "Team" }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </section>
  );
}
