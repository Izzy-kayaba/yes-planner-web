"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";
import type { TranslationKey } from "@/lib/i18n";
import type { PlatformRole } from "@/lib/auth/roles";
import { canUseWorkspaceModule, isWorkspaceModule } from "@/lib/auth/permissions";

const sections: ReadonlyArray<[TranslationKey, string]> = [
  ["wedding.overview", ""],
  ["wedding.guests", "guests"],
  ["wedding.budget", "budget"],
  ["wedding.tasks", "tasks"],
  ["wedding.vendors", "vendors"],
  ["wedding.timeline", "timeline"],
  ["wedding.seating", "seating"],
  ["wedding.food", "food-drinks"],
  ["wedding.documents", "documents"],
  ["wedding.bookings", "bookings"],
  ["wedding.payments", "payments"],
  ["wedding.notes", "notes"],
  ["wedding.reports", "reports"],
];

export function WeddingNav({ weddingId, role }: { weddingId: string; role?: PlatformRole }) {
  const pathname = usePathname();
  const { t, text } = useLanguage();
  const base = `/weddings/${weddingId}`;

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-xl border border-vow-line bg-vow-surface p-1.5 [scrollbar-width:none]"
      aria-label={text("Wedding workspace")}
    >
      {sections
        .filter(([, slug]) => {
          if (!role || role !== "Vendor") return true;
          if (!slug) return true;
          return isWorkspaceModule(slug) && canUseWorkspaceModule(role, slug, "read");
        })
        .map(([label, slug]) => {
          const href = slug ? `${base}/${slug}` : base;
          const active = pathname === href;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "min-w-max rounded-lg px-3 py-2.5 text-[12px] font-bold transition-colors",
                active
                  ? "bg-vow-wine text-white"
                  : "text-vow-muted hover:bg-vow-soft hover:text-vow-ink",
              )}
              href={href}
              key={label}
            >
              {t(label)}
            </Link>
          );
        })}
    </nav>
  );
}
