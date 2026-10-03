"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { text } = useLanguage();
  const [done, setDone] = useState(false);
  return (
    <button
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        setDone(true);
        toast.success(text(message));
      }}
    >
      {done && doneLabel
        ? text(doneLabel)
        : typeof children === "string"
          ? text(children)
          : children}
    </button>
  );
}

export function DownloadReportButton({
  className = "button button-secondary",
}: {
  className?: string;
}) {
  const { text } = useLanguage();
  function download() {
    const content =
      "Metric,Value\nActive weddings,1284\nOrganisations,438\nMonthly users,8920\nOpen support cases,24";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "yes-planner-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(text("Report downloaded."));
  }
  return (
    <button className={className} onClick={download}>
      {text("Download report")}
    </button>
  );
}
