"use client";
// Purpose: implements features/weddings/WeddingNav.tsx for the Yes Planner web application.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";
import type { TranslationKey } from "@/lib/i18n";
import type { PlatformRole } from "@/lib/auth/roles";
import { canUseWorkspaceModule, isWorkspaceModule } from "@/lib/auth/permissions";

const sections: ReadonlyArray<[string, string]> = [
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
  ["wedding.reports", "reports"],
  ["Wedding website", "website"],
];

export function WeddingNav({
  access,
  weddingId,
  role,
}: {
  access?: "Owner" | "FullManager" | "Vendor";
  weddingId: string;
  role?: PlatformRole;
}) {
  const pathname = usePathname();
  const { t, text } = useLanguage();
  const base = `/weddings/${weddingId}`;
  const activeLink = useRef<HTMLAnchorElement>(null);
  // The browser may show a country-prefixed URL while the navigation links use internal paths.
  const navigationPathname = normalizeWeddingPath(pathname);

  useEffect(() => {
    activeLink.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [navigationPathname]);

  return (
    <nav
      className="wedding-nav flex w-full min-w-0 max-w-full gap-1 overflow-x-auto rounded-xl border border-yes-line bg-yes-surface p-1.5 [scrollbar-width:none]"
      aria-label={text("Wedding workspace")}
    >
      {sections
        .filter(([, slug]) => {
          if (role === "Venue") return !slug;
          if (slug === "website") return role === "Couple" || access === "FullManager";
          if (role !== "Vendor") return true;
          if (!slug) return true;
          return isWorkspaceModule(slug) && canUseWorkspaceModule(role, slug, "read", access);
        })
        .map(([label, slug]) => {
          const href = slug ? `${base}/${slug}` : base;
          const active = navigationPathname === href;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "min-w-max rounded-lg px-3 py-2.5 text-[12px] font-bold transition-colors",
                active
                  ? "bg-yes-wine text-white"
                  : "text-yes-muted hover:bg-yes-soft hover:text-yes-ink",
              )}
              href={href}
              key={label}
              ref={active ? activeLink : undefined}
            >
              {label.startsWith("wedding.") ? t(label as TranslationKey) : text(label)}
            </Link>
          );
        })}
    </nav>
  );
}

function normalizeWeddingPath(pathname: string) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (/^\/[a-z]{2}$/.test(normalized)) return "/";
  return normalized.replace(/^\/[a-z]{2}(?=\/)/, "");
}
