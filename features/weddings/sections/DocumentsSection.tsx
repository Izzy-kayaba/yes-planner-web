"use client";
// Purpose: implements features/weddings/sections/DocumentsSection.tsx for the Yes Planner web application.

import { FileText, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SearchField } from "@/components/forms/SearchField";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { formatDate } from "@/lib/date-time";
import { useConfirmation } from "@/hooks/useConfirmation";

type DocumentItem = {
  id: string | number;
  name: string;
  type: string;
  owner: string;
  date: string;
  access: string;
  url?: string;
};
const seed: DocumentItem[] = [
  {
    id: 1,
    name: "Venue agreement.pdf",
    type: "Contract",
    owner: "Ruth",
    date: "10 Sep 2026",
    access: "Private",
  },
  {
    id: 2,
    name: "Photography schedule.pdf",
    type: "Timeline",
    owner: "Lumen & Lace",
    date: "08 Sep 2026",
    access: "Team",
  },
  {
    id: 3,
    name: "Catering invoice 003.pdf",
    type: "Invoice",
    owner: "Izzy",
    date: "04 Sep 2026",
    access: "Team",
  },
];
const fields = [
  { name: "name", label: "Document name", required: true },
  { name: "type", label: "Type" },
  { name: "owner", label: "Owner" },
  { name: "date", label: "Display date" },
  {
    name: "access",
    label: "Access",
    type: "select" as const,
    options: ["Private", "Team"],
  },
];

export function DocumentsSection() {
  const { language, text } = useLanguage();
  const { items, create, update, remove, page, setPage, pagination, loading } =
    useWorkspaceCollection<DocumentItem>("documents", seed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [previewing, setPreviewing] = useState<DocumentItem | null>(null);
  const params = useParams<{ weddingId?: string }>();
  const [open, setOpen] = useState(false);
  const confirmation = useConfirmation();
  const fileInput = useRef<HTMLInputElement>(null);
  async function save(values: Record<string, EntityFormValue>) {
    const input = values as unknown as Omit<DocumentItem, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }
  async function receiveFile(file?: File) {
    if (!file) return;
    if (!params.weddingId) return toast.error("The wedding could not be identified.");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(
        `/api/v1/weddings/${encodeURIComponent(params.weddingId)}/workspace/documents/upload`,
        { method: "POST", body: form },
      );
      const result = (await response.json().catch(() => null)) as {
        url?: string;
        message?: string;
      } | null;
      if (!response.ok || !result?.url) {
        throw new Error(result?.message || "The document could not be uploaded.");
      }
      await create({
        name: file.name,
        type: file.type || "File",
        owner: text("Me"),
        date: formatDate(new Date(), "DD MMM YYYY", language),
        access: "Team",
        url: result.url,
      });
      toast.success("Document uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be uploaded.");
    }
  }
  const shown = items.filter((item) =>
    `${item.name} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  return loading ? (
    <WorkspaceSkeleton variant="table" columns={6} />
  ) : (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search documents" />
        <div>
          <input
            accept=".pdf,image/avif,image/gif,image/jpeg,image/png,image/webp"
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
            <Plus size={14} /> {text("Add document")}
          </button>
        </div>
      </div>
      <div className="table-scroll workspace-table-scroll">
        <div className="file-list">
          <div className="table-head file-table-head workspace-table-head">
            <span className="document-column-heading">{text("Document")}</span>
            <span className="added-column-heading">{text("Added")}</span>
            <span className="access-column-heading">{text("Access")}</span>
            <span className="actions-column-heading">{text("Actions")}</span>
          </div>
          {shown.map((doc) => (
            <div
              className="workspace-table-row document-preview-row"
              key={doc.id}
              onClick={() => setPreviewing(doc)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setPreviewing(doc);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className="file-icon">
                <FileText size={17} />
              </span>
              <p>
                <strong>{doc.name}</strong>
                <small>
                  {text(doc.type)} · {text("Added by")} {doc.owner}
                </small>
              </p>
              <span>{formatDocumentDate(doc.date)}</span>
              <StatusPill tone={doc.access === "Private" ? "rose" : "sage"}>
                {doc.access}
              </StatusPill>
              <span className="flex justify-end gap-1">
                {doc.url ? (
                  <a
                    className="button button-secondary min-h-9 px-3"
                    href={doc.url}
                    onClick={(event) => event.stopPropagation()}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {text("Open")}
                  </a>
                ) : null}
                <button
                  className="icon-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditing(doc);
                    setOpen(true);
                  }}
                  aria-label={`${text("Edit")} ${doc.name}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="icon-button icon-button-blush"
                  onClick={(event) => {
                    event.stopPropagation();
                    void confirmation
                      .confirm({
                        description: `${text("Delete")} ${doc.name}?`,
                        confirmLabel: "Delete",
                      })
                      .then((confirmed) => {
                        if (confirmed) void remove(doc.id);
                      });
                  }}
                  aria-label={`${text("Delete")} ${doc.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="table-footer document-table-footer">
        <span>
          {text("Showing")} {shown.length} {text("of")} {pagination.totalItems} {text("documents")}
        </span>
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
      <Modal
        open={Boolean(previewing)}
        title={previewing?.name ?? "Document preview"}
        onClose={() => setPreviewing(null)}
      >
        {previewing && <DocumentPreview document={previewing} />}
      </Modal>
      {confirmation.dialog}
    </section>
  );
}

function formatDocumentDate(value: string) {
  return /^\d{1,2}\s+[A-Za-z]{3}$/.test(value) ? `${value} ${new Date().getFullYear()}` : value;
}

function DocumentPreview({ document }: { document: DocumentItem }) {
  const lowerName = document.name.toLowerCase();
  const lowerType = document.type.toLowerCase();
  const isImage = lowerType.startsWith("image/") || /\.(avif|gif|jpe?g|png|webp)$/i.test(lowerName);
  const isPdf = lowerType === "application/pdf" || lowerName.endsWith(".pdf");

  if (!document.url) {
    return (
      <div className="grid min-h-40 place-items-center gap-2 rounded-xl border border-yes-line bg-yes-surface-soft p-6 text-center">
        <FileText size={28} className="text-yes-muted" />
        <p className="text-sm text-yes-muted">
          This document has details recorded, but no preview file is attached yet.
        </p>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="document-preview-frame">
        <img
          alt={document.name}
          className="max-h-[68vh] w-full object-contain"
          src={document.url}
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <iframe
        className="h-[68vh] w-full rounded-xl border border-yes-line"
        src={document.url}
        title={document.name}
      />
    );
  }

  return (
    <div className="grid min-h-40 place-items-center gap-3 rounded-xl border border-yes-line bg-yes-surface-soft p-6 text-center">
      <FileText size={28} className="text-yes-muted" />
      <p className="text-sm text-yes-muted">
        This file type cannot be previewed here. Use Open to view it in a new tab.
      </p>
      <a className="button button-secondary" href={document.url} rel="noreferrer" target="_blank">
        Open document
      </a>
    </div>
  );
}
