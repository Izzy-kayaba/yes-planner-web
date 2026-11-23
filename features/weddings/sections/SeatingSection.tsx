"use client";
// Purpose: provides the structured and visual seating planner for a wedding workspace.

import { Check, FileUp, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { toast } from "sonner";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MetricGrid, MetricGridSkeleton } from "@/features/weddings/MetricGrid";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { useConfirmation } from "@/hooks/useConfirmation";
import { parseGuestCsv } from "@/lib/guests/csv";
import type { Guest } from "@/types";

type TableShape = "round" | "rectangle" | "head" | "bride";
type SeatingTable = {
  id: string | number;
  name: string;
  label: string;
  capacity: number;
  shape?: TableShape;
  x?: number;
  y?: number;
};
type GuestAssignment = Guest & { seatIndex?: number };

const tableFields = [
  { name: "name", label: "Table name", required: true },
  {
    name: "label",
    label: "Group",
    type: "select" as const,
    options: ["Family", "Friends", "Workmates", "Acquaintance", "Mixed"],
    required: true,
  },
  {
    name: "shape",
    label: "Table shape",
    type: "select" as const,
    options: [
      { value: "round", label: "Round table" },
      { value: "rectangle", label: "Rectangle table" },
      { value: "bride", label: "Bride & groom" },
    ],
    required: true,
  },
  { name: "capacity", label: "Capacity", type: "number" as const, required: true },
];

const defaultPositions = [
  [18, 22],
  [50, 22],
  [80, 22],
  [30, 58],
  [64, 58],
];

function tablePosition(table: SeatingTable, index: number) {
  const fallback = defaultPositions[index % defaultPositions.length];
  return { x: table.x ?? fallback[0], y: table.y ?? fallback[1] };
}

function seatPoint(index: number, capacity: number, shape: TableShape = "round") {
  const angle = (Math.PI * 2 * index) / Math.max(capacity, 1) - Math.PI / 2;
  const radius = shape === "rectangle" ? 54 : shape === "bride" ? 48 : 43;
  return { left: `${50 + Math.cos(angle) * radius}%`, top: `${50 + Math.sin(angle) * radius}%` };
}

export function SeatingSection() {
  const { text } = useLanguage();
  const {
    items,
    create,
    update,
    remove,
    pagination,
    loading: tablesLoading,
  } = useWorkspaceCollection<SeatingTable>("seating", []);
  const {
    items: guests,
    create: createGuest,
    update: updateGuest,
    loading: guestsLoading,
  } = useWorkspaceCollection<GuestAssignment>("guests", []);
  const [editing, setEditing] = useState<SeatingTable | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | number | null>(null);
  const [importing, setImporting] = useState(false);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<{ id: string | number; pointerId: number } | null>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmation();
  const seated = guests.filter((guest) => Boolean(guest.table)).length;
  const capacity = items.reduce((sum, table) => sum + Math.max(0, Number(table.capacity) || 0), 0);
  const unassignedGuests = guests.filter((guest) => !guest.table);
  const tableGuests = useMemo(
    () => (tableName: string) => guests.filter((guest) => guest.table === tableName),
    [guests],
  );

  async function importGuests(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a CSV file using the supported guest columns.");
      return;
    }
    setImporting(true);
    try {
      const guestsToCreate = parseGuestCsv(await file.text());
      for (const guest of guestsToCreate) await createGuest(guest);
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

  async function saveTable(values: Record<string, EntityFormValue>) {
    const input = {
      name: String(values.name ?? "").trim(),
      label: String(values.label ?? "Mixed"),
      shape: String(values.shape ?? "round") as TableShape,
      capacity: Math.max(1, Math.min(50, Number(values.capacity ?? 10))),
      ...(editing ? { x: editing.x, y: editing.y } : {}),
    };
    if (editing) await update({ ...editing, ...input });
    else await create(input);
  }

  function getPosition(table: SeatingTable, index: number) {
    return positions[String(table.id)] ?? tablePosition(table, index);
  }

  async function assignGuest(guest: GuestAssignment, table: SeatingTable, seatIndex: number) {
    const occupied = tableGuests(table.name).find(
      (candidate) => candidate.id !== guest.id && candidate.seatIndex === seatIndex,
    );
    if (occupied) return toast.error("That chair is already occupied.");
    if (
      tableGuests(table.name).filter((candidate) => candidate.id !== guest.id).length >=
        table.capacity &&
      guest.table !== table.name
    ) {
      return toast.error("This table is full.");
    }
    try {
      await updateGuest({ ...guest, table: table.name, seatIndex });
      setSelectedGuestId(null);
      toast.success(`${guest.name} was seated at ${table.name}.`);
    } catch {
      toast.error("The seating change could not be saved.");
    }
  }

  async function unseatGuest(guest: GuestAssignment) {
    await updateGuest({ ...guest, table: "", seatIndex: undefined });
    setSelectedGuestId(null);
  }

  async function deleteTable(table: SeatingTable) {
    for (const guest of tableGuests(table.name)) await unseatGuest(guest);
    await remove(table.id);
  }

  function beginTableMove(
    event: PointerEvent<HTMLButtonElement>,
    table: SeatingTable,
    index: number,
  ) {
    if (!planRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPositions((current) => ({ ...current, [String(table.id)]: getPosition(table, index) }));
    setDragging({ id: table.id, pointerId: event.pointerId });
  }

  function moveTable(event: PointerEvent<HTMLButtonElement>) {
    if (!dragging || dragging.pointerId !== event.pointerId || !planRef.current) return;
    const bounds = planRef.current.getBoundingClientRect();
    setPositions((current) => ({
      ...current,
      [String(dragging.id)]: {
        x: Math.max(8, Math.min(92, ((event.clientX - bounds.left) / bounds.width) * 100)),
        y: Math.max(12, Math.min(88, ((event.clientY - bounds.top) / bounds.height) * 100)),
      },
    }));
  }

  async function finishTableMove(table: SeatingTable, event: PointerEvent<HTMLButtonElement>) {
    if (!dragging || dragging.id !== table.id) return;
    event.currentTarget.releasePointerCapture(dragging.pointerId);
    const next = positions[String(table.id)];
    setDragging(null);
    if (next && (next.x !== table.x || next.y !== table.y)) await update({ ...table, ...next });
  }

  function guestDragStart(event: React.DragEvent<HTMLButtonElement>, guestId: string | number) {
    event.dataTransfer.setData("text/plain", String(guestId));
    event.dataTransfer.effectAllowed = "move";
  }

  function dropGuest(
    event: React.DragEvent<HTMLButtonElement>,
    table: SeatingTable,
    seatIndex: number,
  ) {
    event.preventDefault();
    const guest = guests.find(
      (candidate) => String(candidate.id) === event.dataTransfer.getData("text/plain"),
    );
    if (guest) void assignGuest(guest, table, seatIndex);
  }

  return tablesLoading || guestsLoading ? (
    <>
      <MetricGridSkeleton />
      <WorkspaceSkeleton variant="table" columns={4} />
    </>
  ) : (
    <>
      <div className="seating-actions">
        <p className="text-sm text-yes-muted">
          Drag guests to chairs, or select a guest and tap a chair.
        </p>
        <div className="seating-action-buttons">
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
          <div className="guest-import-help seating-import-button">
            <button
              className="button button-secondary guest-import-button"
              disabled={importing}
              onClick={() => importInput.current?.click()}
              title="Import a CSV using the supported guest columns"
              type="button"
            >
              <FileUp size={15} /> {importing ? "Importing…" : "Import CSV"}
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
                Use international phone numbers such as +27821234567. Accepted headings also include
                Guest Name, Phone, WhatsApp Number, and Household.
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
            type="button"
          >
            <Plus size={15} /> {text("Add table")}
          </button>
        </div>
      </div>
      <MetricGrid
        items={[
          {
            label: "Guests seated",
            value: String(seated),
            detail: "Assigned to chairs",
            tone: "sage",
          },
          {
            label: "Tables",
            value: String(items.length),
            detail: "Current floor plan",
            tone: "rose",
          },
          {
            label: "Unassigned",
            value: String(unassignedGuests.length),
            detail: "Need a seat",
            tone: "gold",
          },
          {
            label: "Capacity",
            value: String(capacity),
            detail: `${Math.max(0, capacity - seated)} seats available`,
            tone: "blue",
          },
        ]}
      />
      <div className="seating-editor">
        <aside className="seating-guest-list panel">
          <div className="seating-panel-heading">
            <div>
              <p className="eyebrow">Guest seating</p>
              <h2>All guests</h2>
            </div>
            <strong>{unassignedGuests.length} left</strong>
          </div>
          <p className="text-sm text-yes-muted">
            Choose a guest, then tap an empty chair. Desktop users can drag.
          </p>
          <div className="seating-guest-items">
            {guests.map((guest) => (
              <button
                className={`seating-guest ${selectedGuestId === guest.id ? "selected" : ""} ${guest.table ? "seated" : ""}`}
                draggable
                key={guest.id}
                onClick={() => setSelectedGuestId(guest.id)}
                onDragStart={(event) => guestDragStart(event, guest.id)}
                type="button"
              >
                {guest.table ? (
                  <span aria-label="Seated" className="seating-guest-check">
                    <Check size={14} />
                  </span>
                ) : (
                  <UserRound size={14} />
                )}
                <span>{guest.name}</span>
              </button>
            ))}
            {!guests.length && <p className="empty-state-text">No guests have been added yet.</p>}
          </div>
        </aside>
        <section className="seating-plan-panel panel">
          <div className="seating-panel-heading">
            <div>
              <p className="eyebrow">Floor plan</p>
              <h2>Arrange your tables</h2>
            </div>
            <span className="text-sm text-yes-muted">
              {items.length} tables · {seated}/{guests.length} seated
            </span>
          </div>
          <div className="seating-plan" ref={planRef}>
            <div className="seating-grid-lines" />
            {!items.length && (
              <div className="seating-plan-empty">
                <Plus size={20} />
                <strong>Start with a table</strong>
                <span>Add a table to begin your layout.</span>
              </div>
            )}
            {items.map((table, tableIndex) => {
              const position = getPosition(table, tableIndex);
              const assigned = tableGuests(table.name);
              const shape = table.shape === "head" ? "rectangle" : (table.shape ?? "round");
              return (
                <div
                  className={`seating-table-node seating-shape-${shape}`}
                  key={table.id}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                  <div className="seating-chairs">
                    {Array.from({ length: Math.max(1, table.capacity) }, (_, seatIndex) => {
                      const occupant = assigned.find((guest) => guest.seatIndex === seatIndex);
                      const point = seatPoint(seatIndex, table.capacity, shape);
                      return (
                        <button
                          aria-label={
                            occupant
                              ? `${occupant.name}, chair ${seatIndex + 1}`
                              : `Empty chair ${seatIndex + 1} at ${table.name}`
                          }
                          className={`seating-chair ${occupant ? "occupied" : ""}`}
                          key={seatIndex}
                          onClick={() => {
                            const selected = guests.find((guest) => guest.id === selectedGuestId);
                            if (selected && !occupant) void assignGuest(selected, table, seatIndex);
                            else if (occupant) void unseatGuest(occupant);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => dropGuest(event, table, seatIndex)}
                          style={point}
                          title={occupant?.name}
                          type="button"
                        >
                          {occupant ? occupant.name.slice(0, 2).toUpperCase() : seatIndex + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="seating-table-surface">
                    <button
                      className="seating-table-move"
                      onPointerDown={(event) => beginTableMove(event, table, tableIndex)}
                      onPointerMove={moveTable}
                      onPointerUp={(event) => void finishTableMove(table, event)}
                      type="button"
                      aria-label={`Move ${table.name}`}
                    >
                      <strong>{table.name}</strong>
                      <span>
                        {assigned.length}/{table.capacity}
                      </span>
                    </button>
                  </div>
                  <div className="seating-table-actions">
                    <button
                      className="seating-action seating-action-edit"
                      aria-label={`Edit ${table.name}`}
                      onClick={() => {
                        setEditing(table);
                        setDialogOpen(true);
                      }}
                      type="button"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="seating-action seating-action-delete"
                      aria-label={`Delete ${table.name}`}
                      onClick={() =>
                        void confirmation
                          .confirm({
                            description: `Remove ${table.name} and unseat its guests?`,
                            confirmLabel: "Remove",
                          })
                          .then((confirmed) => {
                            if (confirmed) void deleteTable(table);
                          })
                      }
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <section className="panel seating-table-list">
        <div className="seating-panel-heading">
          <div>
            <p className="eyebrow">Table list</p>
            <h2>Every seat in one view</h2>
          </div>
          <span className="text-sm text-yes-muted">{pagination.totalItems} tables</span>
        </div>
        <div className="seating-list-rows">
          {items.map((table) => (
            <div className="seating-list-row" key={table.id}>
              <div>
                <strong>{table.name}</strong>
                <span>
                  {table.label} · {table.shape ?? "round"}
                </span>
              </div>
              <div className="seating-list-guests">
                {tableGuests(table.name).map((guest) => (
                  <span key={guest.id}>{guest.name}</span>
                ))}
                {!tableGuests(table.name).length && <em>Empty</em>}
              </div>
              <strong>
                {tableGuests(table.name).length}/{table.capacity}
              </strong>
              <button
                aria-label={`Unseat a guest from ${table.name}`}
                disabled={!tableGuests(table.name).length}
                onClick={() => void unseatGuest(tableGuests(table.name)[0])}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
      <EntityDialog
        open={dialogOpen}
        title={editing ? "Edit table" : "Add table"}
        fields={tableFields}
        initialValues={editing ?? { capacity: 10, label: "Mixed", shape: "round" }}
        onClose={() => setDialogOpen(false)}
        onSave={saveTable}
      />
      {confirmation.dialog}
    </>
  );
}
