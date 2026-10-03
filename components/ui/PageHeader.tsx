"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { text } = useLanguage();

  return (
    <header className="flex items-end justify-between gap-6 max-sm:flex-col max-sm:items-start">
      <div>
        {eyebrow && (
          <p className="mb-2.5 text-[14px] font-extrabold uppercase tracking-[.18em] text-yes-wine">
            {text(eyebrow)}
          </p>
        )}
        <h1 className="mb-2 font-display text-[clamp(2.125rem,4vw,2.875rem)] leading-none tracking-[-.04em]">
          {text(title)}
        </h1>
        {description && (
          <p className="m-0 max-w-2xl text-[14px] leading-relaxed text-yes-muted">
            {text(description)}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 max-sm:w-full max-sm:[&>*]:w-full">{action}</div>}
    </header>
  );
}
