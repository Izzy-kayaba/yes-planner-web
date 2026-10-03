"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { text } = useLanguage();

  return (
    <Link
      className="inline-flex items-center gap-2.5"
      href="/"
      aria-label={text("Yes Planner home")}
    >
      <span
        className="grid size-10 -rotate-3 place-items-center rounded-[50%_50%_46%_54%] bg-yes-wine text-white shadow-[inset_-5px_-5px_0_rgba(255,255,255,.08)]"
        aria-hidden="true"
      >
        <span className="rotate-3 font-display text-2xl">V</span>
      </span>
      {!compact && (
        <span className="brand-wordmark flex items-baseline gap-1 font-display text-[21px] max-[424px]:hidden">
          <strong className="font-bold">Yes</strong>
          <span className="brand-planner italic text-yes-wine">Planner</span>
        </span>
      )}
    </Link>
  );
}
