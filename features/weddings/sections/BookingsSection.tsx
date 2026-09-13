"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SearchField } from "@/components/forms/SearchField";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";

type Booking = {
  id: string | number;
  vendor: string;
  service: string;
  amount: string;
  status: string;
  next: string;
};
const seed: Booking[] = [
  {
    id: 1,
    vendor: "Lumen & Lace",
    service: "Photography",
    amount: "R 28,000",
    status: "Confirmed",
    next: "Balance due 01 Oct",
  },
  {
    id: 2,
    vendor: "Petal Theory",
    service: "Florals & décor",
    amount: "R 44,000",
    status: "Quote received",
    next: "Respond by 16 Sep",
  },
  {
    id: 3,
    vendor: "City Classic Cars",
    service: "Transport",
    amount: "R 9,800",
    status: "Pending",
    next: "Awaiting vendor reply",
  },
];
const fields = [
  { name: "vendor", label: "Vendor", required: true },
  { name: "service", label: "Service", required: true },
  { name: "amount", label: "Amount", required: true },
  {
    name: "status",
    label: "Status",
    type: "select" as const,
    options: ["Pending", "Quote received", "Confirmed"],
    required: true,
  },
  { name: "next", label: "Next action", required: true },
];

export function BookingsSection() {
  const { text } = useLanguage();
  const { items, create, update, remove } = useWorkspaceCollection<Booking>("bookings", seed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);
  async function save(values: Record<string, EntityFormValue>) {
    const input = values as unknown as Omit<Booking, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }
  const shown = items.filter((booking) =>
    `${booking.vendor} ${booking.service}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search bookings" />
        <button
          className="button button-primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={15} /> {text("Add request")}
        </button>
      </div>
      <section className="booking-board">
        {["Pending", "Quote received", "Confirmed"].map((column) => (
          <div className="booking-column" key={column}>
            <div className="booking-column-title">
              <h3>{text(column)}</h3>
              <span>{shown.filter((item) => item.status === column).length}</span>
            </div>
            {shown
              .filter((item) => item.status === column)
              .map((booking) => (
                <article className="booking-card" key={booking.id}>
                  <p>{text(booking.service)}</p>
                  <h4>{booking.vendor}</h4>
                  <strong>{booking.amount}</strong>
                  <span>{text(booking.next)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(booking);
                        setOpen(true);
                      }}
                    >
                      <Pencil size={13} /> {text("Edit")}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`${text("Delete booking with")} ${booking.vendor}?`))
                          void remove(booking.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        ))}
      </section>
      <EntityDialog
        open={open}
        title={editing ? "Edit booking" : "Add booking request"}
        fields={fields}
        initialValues={editing ?? { status: "Pending" }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
}
