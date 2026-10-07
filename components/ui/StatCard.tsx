"use client";

import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";
import moment from "moment";

export function StatCard({
  label,
  value,
  detail,
  tone = "rose",
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
  trend?: string;
}) {
  const { text } = useLanguage();
  const toneClasses: Record<string, string> = {
    rose: "bg-yes-blush text-yes-wine",
    sage: "bg-yes-sage-soft text-yes-sage",
    gold: "bg-yes-gold-soft text-yes-gold",
    blue: "bg-yes-blue-soft text-yes-blue",
  };

  return (
    <article className="min-h-36 rounded-2xl border border-yes-line bg-yes-surface p-5 shadow-yes-soft max-sm:min-h-32 max-sm:p-4">
      <div className="flex min-h-7 justify-between">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg",
            toneClasses[tone] ?? toneClasses.rose,
          )}
          aria-hidden="true"
        >
          <TrendingUp size={14} strokeWidth={1.8} />
        </span>
        {trend && <span className="text-[11px] text-yes-sage">{text(trend)}</span>}
      </div>
      <p className="mb-1 mt-3 text-[12px] text-yes-muted">{text(label)}</p>
      <strong className="mb-0.5 block font-display text-2xl font-normal">{value}</strong>
      <small className="text-[11px] text-yes-muted">
        {moment(detail, "YYYY-MM-DD", true).isValid()
          ? moment(detail).format("D MMMM YYYY")
          : text(detail)}
      </small>
    </article>
  );
}
