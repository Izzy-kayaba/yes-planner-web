"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { MetricGrid } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { guests as guestSeed } from "@/lib/demo-data";
import { getInitials } from "@/lib/initials";
import type { Guest } from "@/types";

type TableOption = { id: string | number; name: string };
type MenuOption = { id: string | number; name: string };

export function GuestsSection() {
  const { text } = useLanguage();
  const { items, create, update, remove, page, setPage, pagination } =
    useWorkspaceCollection<Guest>("guests", guestSeed);
  const { items: tables } = useWorkspaceCollection<TableOption>("seating", []);
  const { items: menus } = useWorkspaceCollection<MenuOption>("food-drinks", []);
  const params = useParams<{ weddingId?: string }>();
  const weddingPath = params.weddingId ? `/weddings/${params.weddingId}` : "/weddings";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      name: "status",
      label: "RSVP",
      type: "select",
      options: ["Attending", "Pending", "Declined"],
      required: true,
    },
    {
      name: "meal",
      label: "Meal preference",
      type: "select",
      options: menus.map((menu) => menu.name),
      required: true,
      emptyMessage: "No meal options exist yet.",
      setupHref: `${weddingPath}/food-drinks`,
      setupLabel: "Set up meal options",
    },
    {
      name: "table",
      label: "Table",
      type: "select",
      options: tables.map((table) => table.name),
      required: true,
      emptyMessage: "No tables exist yet.",
      setupHref: `${weddingPath}/seating`,
      setupLabel: "Set up tables",
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
    const guest = values as unknown as Omit<Guest, "id">;
    if (editing) await update({ ...guest, id: editing.id });
    else await create(guest);
  }

  return (
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
        <div className="guest-table-scroll">
          <div className="data-table">
            <div className="table-head">
              <span>{text("Guest")}</span>
              <span>{text("Group")}</span>
              <span>{text("RSVP")}</span>
              <span>{text("Meal")}</span>
              <span>{text("Table")}</span>
              <span />
            </div>
            {filtered.map((guest) => (
              <div className="table-row" key={guest.id}>
                <span className="person-cell">
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
                <span>{text(guest.meal)}</span>
                <span>{text(guest.table)}</span>
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
                    className="icon-button"
                    aria-label={`${text("Delete")} ${guest.name}`}
                    onClick={() => {
                      if (window.confirm(`${text("Remove")} ${guest.name}?`)) void remove(guest.id);
                    }}
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
        description="Set up tables and meal options first so they can be selected here."
        initialValues={editing ?? { status: "Pending", isCouple: false, hasChildren: false }}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
    </>
  );
}
