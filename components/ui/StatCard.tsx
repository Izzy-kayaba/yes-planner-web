"use client";

import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";

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
    rose: "bg-vow-blush text-vow-wine",
    sage: "bg-vow-sage-soft text-vow-sage",
    gold: "bg-vow-gold-soft text-vow-gold",
    blue: "bg-vow-blue-soft text-vow-blue",
  };

  return (
    <article className="min-h-36 rounded-2xl border border-vow-line bg-vow-surface p-5 shadow-vow-soft max-sm:min-h-32 max-sm:p-4">
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
        {trend && <span className="text-[11px] text-vow-sage">{text(trend)}</span>}
      </div>
      <p className="mb-1 mt-3 text-[12px] text-vow-muted">{text(label)}</p>
      <strong className="mb-0.5 block font-display text-2xl font-normal">{value}</strong>
      <small className="text-[11px] text-vow-muted">{text(detail)}</small>
    </article>
  );
}
