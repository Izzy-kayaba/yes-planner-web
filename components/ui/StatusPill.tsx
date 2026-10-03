"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";

const toneClasses: Record<string, string> = {
  rose: "bg-yes-blush text-yes-wine",
  sage: "bg-yes-sage-soft text-yes-sage",
  gold: "bg-yes-gold-soft text-yes-gold",
  blue: "bg-yes-blue-soft text-yes-blue",
  neutral: "bg-yes-soft text-yes-muted",
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
