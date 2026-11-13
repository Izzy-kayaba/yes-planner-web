"use client";
// Purpose: provides consistent CSV and print-to-PDF actions for wedding workspace sections.

import { Download, FileText } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const sectionLabels: Record<string, string> = {
  guests: "Guests",
  budget: "Budget",
  tasks: "Tasks",
  vendors: "Vendors",
  timeline: "Timeline",
  seating: "Seating",
  "food-drinks": "Food and drinks",
  documents: "Documents",
  bookings: "Bookings",
};

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function WorkspaceExportActions({ section }: { section: string }) {
  const { text } = useLanguage();
  const label = sectionLabels[section] ?? "Wedding workspace";

  function downloadCsv() {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".data-table .table-head, .data-table .table-row, .budget-row, .timeline-row, .table-card, .vendor-card, .booking-card, .file-list > div, .menu-card",
      ),
    );
    const content = rows
      .map((row) =>
        Array.from(row.children)
          .filter((cell) => !(cell.querySelector("button") && !(cell.textContent ?? "").trim()))
          .map((cell) => csvCell((cell.textContent ?? "").replace(/\s+/g, " ").trim()))
          .join(","),
      )
      .join("\r\n");
    const blob = new Blob([`${content}\r\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${label.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2 max-sm:flex-col">
      <button
        className="button button-secondary max-sm:w-full"
        onClick={() => window.print()}
        type="button"
      >
        <FileText size={15} /> {text("Save as PDF")}
      </button>
      <button className="button button-secondary max-sm:w-full" onClick={downloadCsv} type="button">
        <Download size={15} /> {text("Download CSV")}
      </button>
    </div>
  );
}
