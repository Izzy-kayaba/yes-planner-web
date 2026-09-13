"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";

const toneClasses: Record<string, string> = {
  rose: "bg-vow-blush text-vow-wine",
  sage: "bg-vow-sage-soft text-vow-sage",
  gold: "bg-vow-gold-soft text-vow-gold",
  blue: "bg-vow-blue-soft text-vow-blue",
  neutral: "bg-vow-soft text-vow-muted",
};

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  const { text } = useLanguage();
  return (
    <span
      className={cn(
        "status-pill inline-flex w-max items-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] font-extrabold tracking-[.04em]",
        toneClasses[tone] ?? toneClasses.neutral,
      )}
    >
      {typeof children === "string" ? text(children) : children}
    </span>
  );
}
