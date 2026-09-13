"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";

export function ActionButton({
  children,
  message,
  doneLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  message: string;
  doneLabel?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        setDone(true);
        toast.success(message);
      }}
    >
      {done && doneLabel ? doneLabel : children}
    </button>
  );
}

export function DownloadReportButton({
  className = "button button-secondary",
}: {
  className?: string;
}) {
  function download() {
    const content =
      "Metric,Value\nActive weddings,1284\nOrganisations,438\nMonthly users,8920\nOpen support cases,24";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vow-planner-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded.");
  }
  return (
    <button className={className} onClick={download}>
      Download report
    </button>
  );
}
