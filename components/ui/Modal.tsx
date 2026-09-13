"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { text } = useLanguage();
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-vow-line bg-vow-surface p-6 shadow-vow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="mb-5 flex items-start justify-between gap-5">
          <div>
            <h2 id="modal-title" className="text-2xl">
              {text(title)}
            </h2>
            {description && <p className="mt-1 text-sm text-vow-muted">{text(description)}</p>}
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={text("Close dialog")}
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
