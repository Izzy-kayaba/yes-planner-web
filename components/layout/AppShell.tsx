"use client";

import {
  Building2,
  CalendarHeart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Sun,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { Brand } from "@/components/ui/Brand";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import type { PlatformRole } from "@/lib/auth/roles";
import type { DashboardData } from "@/lib/dashboard/types";
import type { TranslationKey } from "@/lib/i18n";
import { getInitials } from "@/lib/initials";
import { formatDate } from "@/lib/date-time";

type NavigationItem = {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: readonly PlatformRole[];
  plannerOnly?: boolean;
};

const navigation: NavigationItem[] = [
  {
    labelKey: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SystemAdmin", "Couple"],
  },
  {
    labelKey: "nav.wedding",
    href: "/weddings/ruth-izzy",
    icon: CalendarHeart,
    roles: ["SystemAdmin", "Couple", "Vendor"],
  },
  {
    labelKey: "nav.vendor",
    href: "/vendor",
    icon: UsersRound,
    roles: ["SystemAdmin", "Vendor", "Venue"],
  },
  { labelKey: "nav.marketplace", href: "/marketplace", icon: Store },
  {
    labelKey: "nav.messages",
    href: "/messages",
    icon: MessageSquareText,
    roles: ["Couple", "Vendor", "Venue"],
  },
  {
    labelKey: "nav.planner",
    href: "/planner",
    icon: CalendarHeart,
    roles: ["Vendor"],
    plannerOnly: true,
  },
  { labelKey: "common.settings", href: "/settings", icon: Settings },
  { labelKey: "nav.admin", href: "/admin", icon: ShieldCheck, roles: ["SystemAdmin"] },
];

function matchesNavigation(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  if (href.startsWith("/weddings/") && href.split("/").length === 3)
    return pathname.startsWith(href);
  return pathname.startsWith(href);
}

export function AppShell({
  children,
  shellData,
  plannerEligible = false,
}: {
  children: ReactNode;
  shellData?: DashboardData;
  plannerEligible?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t, text } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [search, setSearch] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const { data: session } = authClient.useSession();
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  const role = shellData?.user.role ?? (session?.user.role as PlatformRole | undefined);
  const profileName = demoMode
    ? "Demo Couple"
    : (shellData?.user.name ?? session?.user.name ?? session?.user.email ?? "");
  const profileLabel = role ?? "Guest";
  const weddingKey = demoMode ? "ruth-izzy" : shellData?.wedding?.weddingKey;
  const showWeddingSummary = demoMode || Boolean(shellData?.wedding);
  const resolvedNavigation = navigation
    .map((item) => ({
      ...item,
      href: item.href.replace("ruth-izzy", weddingKey ?? "wedding-not-configured"),
      badge:
        item.href === "/messages" && shellData?.counts.unreadMessages
          ? String(shellData.counts.unreadMessages)
          : undefined,
    }))
    .filter(
      (item) =>
        !item.href.startsWith("/weddings/wedding-not-configured") &&
        (!item.plannerOnly || (!demoMode && plannerEligible)) &&
        (demoMode || !item.roles || (role && item.roles.includes(role))),
    );

  useEffect(() => setThemeReady(true), []);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("claimSubmission") !== "failed") return;
    toast.error(
      text(
        "Your account is ready, but the listing claim could not be submitted. Please submit it from your business profile.",
      ),
    );
    query.delete("claimSubmission");
    const suffix = query.size ? `?${query.toString()}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${suffix}`);
  }, [text]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim().toLowerCase();
    const section = [
      "guests",
      "budget",
      "tasks",
      "vendors",
      "timeline",
      "seating",
      "documents",
      "bookings",
      "payments",
      "notes",
      "reports",
    ].find((item) => item.includes(term) || term.includes(item));
    router.push(
      section && weddingKey
        ? `/weddings/${weddingKey}/${section}`
        : `/marketplace?query=${encodeURIComponent(term)}`,
    );
  }

  const darkMode = themeReady && resolvedTheme === "dark";

  async function signOut() {
    if (!demoMode) await authClient.signOut();
    setLogoutOpen(false);
    setMenuOpen(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", menuOpen && "sidebar-open")}>
        <div className="sidebar-brand-row">
          <Brand />
          <button
            className="icon-button sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label={t("shell.closeNav")}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label={text("Main navigation")}>
          <p className="nav-label">{t("nav.workspace")}</p>
          {resolvedNavigation.map((item) => {
            const active = matchesNavigation(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                className={cn("nav-item", active && "active")}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <span>{t(item.labelKey)}</span>
                {item.badge && <small>{item.badge}</small>}
              </Link>
            );
          })}
        </nav>

        {showWeddingSummary && (
          <div className="sidebar-wedding-card">
            {demoMode && (
              <div className="mini-ring" style={{ "--progress": "68%" } as CSSProperties}>
                <span>68%</span>
              </div>
            )}
            <div>
              <strong>{demoMode ? "Ruth & Izzy" : shellData?.wedding?.displayName}</strong>
              <span>
                {demoMode
                  ? `35 ${t("shell.daysToGo")}`
                  : formatDate(shellData?.wedding?.weddingDate, "D MMM YYYY", language)}
              </span>
            </div>
          </div>
        )}

        <div className="sidebar-profile">
          <div className="avatar">{getInitials(profileName)}</div>
          <div>
            <strong>{profileName}</strong>
            <span>{demoMode ? t("shell.weddingOwner") : text(profileLabel)}</span>
          </div>
          <div className="sidebar-profile-actions">
            <Link
              className="profile-menu"
              href="/settings"
              aria-label={text("Open profile settings")}
            >
              <MoreHorizontal size={18} />
            </Link>
            <button
              className="profile-menu"
              onClick={() => setLogoutOpen(true)}
              type="button"
              aria-label={text("Log out")}
              title={text("Log out")}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-scrim"
          aria-label={t("shell.closeNav")}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("shell.openNav")}
          >
            <Menu size={19} />
          </button>
          <div className="topbar-context">
            <span className="topbar-dot" />
            <span>{t("shell.planningMode")}</span>
          </div>
          <div className="topbar-actions">
            <form className="quick-search" onSubmit={submitSearch}>
              <Search size={16} aria-hidden="true" />
              <input
                id="global-search"
                name="globalSearch"
                ref={searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label={t("shell.search")}
                placeholder={t("common.search")}
              />
              <kbd>⌘ K</kbd>
            </form>
            <LanguageSwitcher compact />
            <button
              className="icon-button"
              onClick={() => setTheme(darkMode ? "light" : "dark")}
              aria-label={text(darkMode ? "Use light theme" : "Use dark theme")}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
      <Modal
        description="Are you sure you want to log out?"
        onClose={() => setLogoutOpen(false)}
        open={logoutOpen}
        title={text("Log out")}
      >
        <div className="flex justify-end gap-3">
          <button
            className="button button-secondary"
            onClick={() => setLogoutOpen(false)}
            type="button"
          >
            {text("Cancel")}
          </button>
          <button className="button button-primary" onClick={() => void signOut()} type="button">
            <LogOut size={16} /> {text("Log out")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
