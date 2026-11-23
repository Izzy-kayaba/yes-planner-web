"use client";
// Purpose: implements features/weddings/sections/GuestsSection.tsx for the Yes Planner web application.

import { FileUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  EntityDialog,
  type EntityField,
  type EntityFormValue,
} from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SearchField } from "@/components/forms/SearchField";
import { YesSelect } from "@/components/ui/YesSelect";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination } from "@/components/ui/Pagination";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";
import { MetricGrid, MetricGridSkeleton } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { guests as guestSeed } from "@/lib/demo-data";
import { getInitials } from "@/lib/initials";
import { parseGuestCsv } from "@/lib/guests/csv";
import type { Guest } from "@/types";
import { useConfirmation } from "@/hooks/useConfirmation";
import { toast } from "sonner";

type MenuOption = { id: string | number; name: string };

export function GuestsSection() {
  const { text } = useLanguage();
  const { items, create, update, remove, page, setPage, pagination, loading } =
    useWorkspaceCollection<Guest>("guests", guestSeed);
  const { items: menus } = useWorkspaceCollection<MenuOption>("food-drinks", []);
  const params = useParams<{ weddingId?: string }>();
  const weddingPath = params.weddingId ? `/weddings/${params.weddingId}` : "/weddings";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmation();
  const fields: EntityField[] = [
    { name: "name", label: "Guest name", required: true },
    { name: "phoneNumber", label: "WhatsApp number", type: "tel", required: true },
    { name: "email", label: "Email", type: "email" },
    {
      name: "group",
      label: "Group",
      type: "select",
      options: ["Family", "Friends", "Workmates", "Acquaintance"],
      required: true,
    },
    { name: "isCouple", label: "This invitation is for a couple", type: "checkbox" },
    { name: "hasChildren", label: "They have children", type: "checkbox" },
    {
      name: "meal",
      label: "Meal preference",
      type: "select",
      options: menus.map((menu) => menu.name),
      emptyMessage: "No meal options exist yet.",
      setupHref: `${weddingPath}/food-drinks`,
      setupLabel: "Set up meal options",
    },
  ];
  const filtered = useMemo(
    () =>
      items.filter(
        (guest) =>
          (status === "All" || guest.status === status) &&
          `${guest.name} ${guest.email ?? ""} ${guest.phoneNumber} ${guest.group}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, status],
  );

  async function save(values: Record<string, EntityFormValue>) {
    // Optional table and meal values stay empty until the couple creates and selects real workspace records.
    const guest = {
      ...(values as unknown as Omit<Guest, "id">),
      status: editing?.status ?? "Pending",
      table: editing?.table && editing.table !== "Unassigned" ? editing.table : "",
      meal: String(values.meal ?? ""),
    } as Omit<Guest, "id">;
    if (editing) await update({ ...guest, id: editing.id });
    else await create(guest);
  }

  async function importGuests(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error(
        "CSV bulk upload is available now. Excel upload will be enabled after the secure reader is installed.",
      );
      return;
    }
    setImporting(true);
    try {
      const guestsToCreate = parseGuestCsv(await file.text());
      for (const guest of guestsToCreate) await create(guest);
      toast.success(`${guestsToCreate.length} guests imported successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The guest CSV could not be imported.");
    } finally {
      setImporting(false);
      if (importInput.current) importInput.current.value = "";
    }
  }

  function downloadGuestTemplate() {
    const content = [
      "name,phoneNumber,email,group,isCouple,hasChildren,status,meal,table",
      '"Ayesha Taylor",+27821234567,ayesha@example.com,Family,false,false,Pending,Vegetarian,',
      '"Jordan Kim",+27829876543,,Friends,false,true,Pending,Standard,',
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([`${content}\r\n`], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "yes-planner-guests-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return loading ? (
    <>
      <MetricGridSkeleton />
      <WorkspaceSkeleton variant="table" columns={6} />
    </>
  ) : (
    <>
      <MetricGrid
        items={[
          {
            label: "Invited",
            value: String(items.length),
            detail: "Across all households",
            tone: "rose",
          },
          {
            label: "Attending",
            value: String(items.filter((item) => item.status === "Attending").length),
            detail: "Confirmed responses",
            tone: "sage",
          },
          {
            label: "Awaiting reply",
            value: String(items.filter((item) => item.status === "Pending").length),
            detail: "Reminder candidates",
            tone: "gold",
          },
          {
            label: "Dietary notes",
            value: String(items.filter((item) => item.meal !== "Standard").length),
            detail: "Review with caterer",
            tone: "blue",
          },
        ]}
      />
      <section className="panel table-panel guest-table-panel">
        <div className="table-toolbar">
          <SearchField value={query} onChange={setQuery} placeholder="Search guests" />
          <div>
            <YesSelect
              ariaLabel={text("Filter guests by RSVP")}
              id="guest-status-filter"
              name="guestStatusFilter"
              className="guest-status-filter"
              options={["All", "Attending", "Pending", "Declined"].map((item) => ({
                value: item,
                label: text(item),
              }))}
              value={status}
              onChange={setStatus}
            />
            <input
              accept=".csv,text/csv"
              className="sr-only"
              ref={importInput}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importGuests(file);
              }}
            />
            <div className="guest-import-help">
              <button
                className="button button-secondary guest-import-button"
                disabled={importing}
                onClick={() => importInput.current?.click()}
                title="Import a CSV using the supported guest columns"
                type="button"
              >
                <FileUp size={15} /> {importing ? text("Importing…") : text("Import CSV")}
                <span aria-hidden="true" className="guest-import-help-icon">
                  ?
                </span>
              </button>
              <div className="guest-import-help-content">
                <strong>Required columns</strong>
                <p>name, phoneNumber, group</p>
                <strong>Optional columns</strong>
                <p>email, isCouple, hasChildren, status, meal, table</p>
                <small>
                  Use international phone numbers such as +27821234567. Accepted headings also
                  include Guest Name, Phone, WhatsApp Number, and Household.
                </small>
                <button
                  className="button button-secondary"
                  onClick={downloadGuestTemplate}
                  type="button"
                >
                  Download template
                </button>
              </div>
            </div>
            <button
              className="button button-primary"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={15} /> {text("Add guest")}
            </button>
          </div>
        </div>
        <div className="table-scroll workspace-table-scroll">
          <div className="data-table">
            <div className="table-head workspace-table-head">
              <span>{text("Guest")}</span>
              <span>{text("Group")}</span>
              <span>{text("RSVP")}</span>
              <span>{text("Meal")}</span>
              <span>{text("Table")}</span>
              <span>{text("Actions")}</span>
            </div>
            {filtered.map((guest) => (
              <div className="table-row workspace-table-row" key={guest.id}>
                <span className="person-cell" data-csv-value={guest.name}>
                  <i>{getInitials(guest.name)}</i>
                  <b>
                    {guest.name}
                    <small>{guest.phoneNumber}</small>
                    {guest.email && <small>{guest.email}</small>}
                  </b>
                </span>
                <span>{text(guest.group)}</span>
                <span>
                  <StatusPill
                    tone={
                      guest.status === "Attending"
                        ? "sage"
                        : guest.status === "Declined"
                          ? "rose"
                          : "gold"
                    }
                  >
                    {guest.status}
                  </StatusPill>
                </span>
                <span>{text(guest.meal || "Unassigned")}</span>
                <span>{text(guest.table || "Unassigned")}</span>
                <span className="flex justify-end gap-2">
                  <button
                    className="icon-button"
                    aria-label={`${text("Edit")} ${guest.name}`}
                    onClick={() => {
                      setEditing(guest);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button icon-button-blush"
                    aria-label={`${text("Delete")} ${guest.name}`}
                    onClick={() =>
                      void confirmation
                        .confirm({
                          description: `${text("Remove")} ${guest.name}?`,
                          confirmLabel: "Remove",
                        })
                        .then((confirmed) => {
                          if (confirmed) void remove(guest.id);
                        })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="table-footer">
          <span>
            {text("Showing")} {filtered.length} {text("of")} {pagination.totalItems}{" "}
            {text("guests")}
          </span>
        </div>
        <Pagination
          page={page}
          pageSize={pagination.pageSize}
          total={pagination.totalItems}
          onChange={setPage}
        />
      </section>
      <EntityDialog
        open={dialogOpen}
        title={editing ? "Edit guest" : "Add guest"}
        fields={fields}
        description="Guests start with a pending RSVP. Add a meal preference when it is known."
        initialValues={editing ?? { status: "Pending", isCouple: false, hasChildren: false }}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
      {confirmation.dialog}
    </>
  );
}
