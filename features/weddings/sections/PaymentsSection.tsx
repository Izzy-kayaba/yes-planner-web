"use client";

import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  EntityDialog,
  type EntityField,
  type EntityFormValue,
} from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { StatusPill } from "@/components/ui/StatusPill";
import { MetricGrid } from "@/features/weddings/MetricGrid";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { getInitials } from "@/lib/initials";
import { useConnectedVendors } from "@/hooks/useConnectedVendors";
import { Pagination } from "@/components/ui/Pagination";
import { useConfirmation } from "@/hooks/useConfirmation";

type Payment = {
  id: string | number;
  vendor: string;
  reference: string;
  amountMinor: number;
  due: string;
  status: string;
};
const seed: Payment[] = [
  {
    id: 1,
    vendor: "Shepstone Gardens",
    reference: "INV-1042",
    amountMinor: 6200000,
    due: "24 Sep",
    status: "Due soon",
  },
  {
    id: 2,
    vendor: "Lumen & Lace",
    reference: "INV-0811",
    amountMinor: 1400000,
    due: "01 Oct",
    status: "Scheduled",
  },
  {
    id: 3,
    vendor: "Olive & Oak",
    reference: "INV-003",
    amountMinor: 4825000,
    due: "04 Sep",
    status: "Paid",
  },
];
export function PaymentsSection() {
  const { text } = useLanguage();
  const { displayMoney } = useCurrency();
  const { items, create, update, remove, page, setPage, pagination } =
    useWorkspaceCollection<Payment>("payments", seed);
  const connectedVendors = useConnectedVendors();
  const confirmation = useConfirmation();
  const [editing, setEditing] = useState<Payment | null>(null);
  const [open, setOpen] = useState(false);
  const fields: EntityField[] = [
    {
      name: "vendor",
      label: "Vendor",
      type: "select",
      options: connectedVendors.map((vendor) => ({ value: vendor.name, label: vendor.name })),
      required: true,
    },
    { name: "reference", label: "Invoice reference", required: true },
    { name: "amountUsd", label: "Amount (USD)", type: "number", required: true },
    { name: "due", label: "Due date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["Due soon", "Scheduled", "Paid", "Overdue"],
      required: true,
    },
  ];
  async function save(values: Record<string, EntityFormValue>) {
    const input = {
      vendor: String(values.vendor),
      reference: String(values.reference),
      amountMinor: Math.round(Number(values.amountUsd) * 100),
      due: String(values.due),
      status: String(values.status),
    };
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }
  function exportCsv() {
    const rows = [
      ["Vendor", "Reference", "Amount USD minor units", "Due", "Status"],
      ...items.map((item) => [
        item.vendor,
        item.reference,
        String(item.amountMinor),
        item.due,
        item.status,
      ]),
    ];
    const blob = new Blob(
      [
        rows
          .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
          .join("\n"),
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yes-planner-payments.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  const paid = items
    .filter((item) => item.status === "Paid")
    .reduce((sum, item) => sum + item.amountMinor, 0);
  return (
    <>
      <MetricGrid
        items={[
          {
            label: "Paid",
            value: displayMoney(paid),
            detail: "Recorded payments",
            tone: "sage",
          },
          {
            label: "Due soon",
            value: String(items.filter((item) => item.status === "Due soon").length),
            detail: "Invoices requiring action",
            tone: "gold",
          },
          {
            label: "Upcoming",
            value: String(items.filter((item) => item.status === "Scheduled").length),
            detail: "Scheduled payments",
            tone: "blue",
          },
          {
            label: "Overdue",
            value: String(items.filter((item) => item.status === "Overdue").length),
            detail: "Needs attention",
            tone: "rose",
          },
        ]}
      />
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Payment schedule")}</p>
            <h3>{text("Invoices and balances")}</h3>
          </div>
          <div className="flex gap-2">
            <button className="button button-secondary" onClick={exportCsv}>
              <Download size={14} /> {text("Export")}
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={14} /> {text("Add payment")}
            </button>
          </div>
        </div>
        <div className="invoice-list">
          {items.map((payment) => (
            <div key={payment.id}>
              <span className="invoice-mark">{getInitials(payment.vendor)}</span>
              <p>
                <strong>{payment.vendor}</strong>
                <small>{payment.reference}</small>
              </p>
              <b>
                {displayMoney(payment.amountMinor)}
                <small>
                  {text("Due")} {text(payment.due)}
                </small>
              </b>
              <StatusPill
                tone={
                  payment.status === "Paid"
                    ? "sage"
                    : payment.status === "Overdue"
                      ? "rose"
                      : "gold"
                }
              >
                {payment.status}
              </StatusPill>
              <span className="flex gap-1">
                <button
                  className="icon-button"
                  onClick={() => {
                    setEditing(payment);
                    setOpen(true);
                  }}
                  aria-label={`${text("Edit")} ${payment.reference}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="icon-button"
                  onClick={() =>
                    void confirmation
                      .confirm({
                        description: `${text("Delete")} ${payment.reference}?`,
                        confirmLabel: "Delete",
                      })
                      .then((confirmed) => {
                        if (confirmed) void remove(payment.id);
                      })
                  }
                  aria-label={`${text("Delete")} ${payment.reference}`}
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
      </section>
      <EntityDialog
        open={open}
        title={editing ? "Edit payment" : "Add payment"}
        fields={fields}
        initialValues={
          editing
            ? { ...editing, amountUsd: editing.amountMinor / 100 }
            : { status: "Scheduled", amountUsd: 0 }
        }
        onClose={() => setOpen(false)}
        onSave={save}
      />
      {confirmation.dialog}
    </>
  );
}
