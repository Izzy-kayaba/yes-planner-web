"use client";

import {
  Bell,
  Building2,
  CalendarHeart,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Search,
  Settings,
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
import { toast } from "sonner";
import { Brand } from "@/components/ui/Brand";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";
import type { TranslationKey } from "@/lib/i18n";

type NavigationItem = {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const navigation: NavigationItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.wedding", href: "/weddings/amara-sipho", icon: CalendarHeart },
  { labelKey: "nav.marketplace", href: "/marketplace", icon: Store },
  { labelKey: "nav.organisation", href: "/organisations/beautiful-day", icon: Building2 },
  { labelKey: "nav.vendor", href: "/vendor", icon: UsersRound },
  {
    labelKey: "nav.messages",
    href: "/weddings/amara-sipho/messages",
    icon: MessageCircle,
    badge: "3",
  },
  { labelKey: "common.settings", href: "/settings", icon: Settings },
];

function matchesNavigation(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  const messagesPath = "/weddings/amara-sipho/messages";
  if (href === messagesPath) return pathname.startsWith(messagesPath);
  if (href === "/weddings/amara-sipho")
    return pathname.startsWith(href) && !pathname.startsWith(messagesPath);
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, text } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => setThemeReady(true), []);
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
      "messages",
      "notes",
      "reports",
    ].find((item) => item.includes(term) || term.includes(item));
    router.push(
      section
        ? `/weddings/amara-sipho/${section}`
        : `/marketplace?query=${encodeURIComponent(term)}`,
    );
  }

  const darkMode = themeReady && resolvedTheme === "dark";

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
          {navigation.map((item) => {
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

        <div className="sidebar-wedding-card">
          <div className="mini-ring" style={{ "--progress": "68%" } as CSSProperties}>
            <span>68%</span>
          </div>
          <div>
            <strong>Amara & Sipho</strong>
            <span>35 {t("shell.daysToGo")}</span>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="avatar">AM</div>
          <div>
            <strong>Amara Mokoena</strong>
            <span>{t("shell.weddingOwner")}</span>
          </div>
          <Link
            className="profile-menu"
            href="/settings"
            aria-label={text("Open profile settings")}
          >
            <MoreHorizontal size={18} />
          </Link>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
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
            <button
              className="icon-button notification-button"
              aria-label={t("shell.notifications")}
              onClick={() => toast.info(text("You have 3 unread messages."))}
            >
              <Bell size={17} />
              <span />
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
