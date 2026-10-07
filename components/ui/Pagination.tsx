"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const LIST_PAGE_SIZE = 48;

export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange(page: number): void;
}) {
  const { text } = useLanguage();
  const pages = Math.ceil(total / LIST_PAGE_SIZE);
  if (pages <= 1) return null;
  function changePage(nextPage: number) {
    onChange(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <nav className="flex items-center justify-center gap-3" aria-label={text("Pagination")}>
      <button
        className="button button-secondary"
        disabled={page === 1}
        onClick={() => changePage(page - 1)}
      >
        <ChevronLeft size={16} /> {text("Previous")}
      </button>
      <span className="text-sm font-bold text-yes-muted">
        {text("Page")} {page} / {pages}
      </span>
      <button
        className="button button-secondary"
        disabled={page === pages}
        onClick={() => changePage(page + 1)}
      >
        {text("Next")} <ChevronRight size={16} />
      </button>
    </nav>
  );
}
