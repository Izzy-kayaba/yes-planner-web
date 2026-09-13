"use client";

import {
  BellRing,
  CalendarDays,
  Cloud,
  CreditCard,
  KeyRound,
  Mail,
  MessageSquareText,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";

const tabs = [
  ["profile", "settings.profile"],
  ["notifications", "settings.notifications"],
  ["language", "settings.language"],
  ["security", "settings.security"],
  ["connections", "settings.connections"],
] as const;

type Preference = {
  description: string;
  icon: LucideIcon;
  id: string;
  label: string;
};

const notificationPreferences: Preference[] = [
  {
    id: "task-reminders",
    label: "Task reminders",
    description: "Weekly planning tasks and approaching due dates",
    icon: BellRing,
  },
  {
    id: "rsvp-updates",
    label: "RSVP updates",
    description: "Guest replies and dietary changes",
    icon: Mail,
  },
  {
    id: "vendor-messages",
    label: "Vendor messages",
    description: "New messages from your booked vendors",
    icon: MessageSquareText,
  },
  {
    id: "payment-reminders",
    label: "Payment reminders",
    description: "Upcoming deposits and final balances",
    icon: CreditCard,
  },
];

const securityPreferences: Preference[] = [
  {
    id: "sign-in-alerts",
    label: "Sign-in alerts",
    description: "Get an email when a new device signs in",
    icon: Smartphone,
  },
  {
    id: "two-step-verification",
    label: "Two-step verification",
    description: "Require a second check when signing in",
    icon: KeyRound,
  },
  {
    id: "remember-device",
    label: "Remember this device",
    description: "Skip extra checks on this trusted browser",
    icon: ShieldCheck,
  },
];

const connectionPreferences: Preference[] = [
  {
    id: "google-calendar",
    label: "Google Calendar",
    description: "Sync appointments and planning milestones",
    icon: CalendarDays,
  },
  {
    id: "apple-calendar",
    label: "Apple Calendar",
    description: "Keep wedding dates on your Apple devices",
    icon: CalendarDays,
  },
  {
    id: "google-drive",
    label: "Google Drive",
    description: "Attach contracts and inspiration files",
    icon: Cloud,
  },
];

export function SettingsPanel() {
  const { t } = useLanguage();
  const [active, setActive] = useState<(typeof tabs)[number][0]>("profile");
  const [profile, setProfile] = useState({
    firstName: "Amara",
    lastName: "Mokoena",
    email: "amara@example.com",
    phone: "+27 82 123 4567",
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("vow-planner-profile");
      if (stored) setProfile(JSON.parse(stored));
    } catch {
      toast.error("Saved profile settings could not be loaded.");
    }
  }, []);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("vow-planner-profile", JSON.stringify(profile));
    toast.success("Profile settings saved.");
  }

  function updateProfile(field: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="section-stack settings-page">
      <PageHeader
        eyebrow={t("settings.account")}
        title={t("settings.title")}
        description={t("settings.intro")}
      />
      <section className="settings-layout">
        <nav aria-label={t("settings.title")}>
          {tabs.map(([id, key]) => (
            <button
              className={cn(active === id && "active")}
              onClick={() => setActive(id)}
              type="button"
              key={id}
            >
              {t(key)}
            </button>
          ))}
        </nav>
        <article className="panel settings-form">
          {active === "profile" && (
            <form className="grid gap-4" onSubmit={saveProfile}>
              <div className="settings-heading">
                <div className="avatar avatar-large">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </div>
                <div>
                  <h3>Profile information</h3>
                  <p>This information is visible to people sharing a workspace with you.</p>
                </div>
              </div>
              <div className="form-row">
                <label>
                  {t("auth.firstName")}
                  <input
                    name="firstName"
                    onChange={(event) => updateProfile("firstName", event.target.value)}
                    required
                    value={profile.firstName}
                  />
                </label>
                <label>
                  {t("auth.lastName")}
                  <input
                    name="lastName"
                    onChange={(event) => updateProfile("lastName", event.target.value)}
                    required
                    value={profile.lastName}
                  />
                </label>
              </div>
              <label>
                {t("auth.email")}
                <input
                  name="email"
                  onChange={(event) => updateProfile("email", event.target.value)}
                  required
                  type="email"
                  value={profile.email}
                />
              </label>
              <label>
                {t("auth.phone")}
                <input
                  name="phone"
                  onChange={(event) => updateProfile("phone", event.target.value)}
                  required
                  type="tel"
                  value={profile.phone}
                />
              </label>
              <div className="settings-actions">
                <button className="button button-primary" type="submit">
                  {t("common.save")}
                </button>
              </div>
            </form>
          )}

          {active === "language" && (
            <div className="grid gap-5">
              <div>
                <h3>{t("settings.language")}</h3>
                <p className="mt-2 text-sm text-vow-muted">
                  Your choice updates the shared navigation and dashboard language and is remembered
                  on this device.
                </p>
              </div>
              <LanguageSwitcher />
            </div>
          )}

          {active === "notifications" && (
            <PreferenceList items={notificationPreferences} storageKey="notifications" />
          )}
          {active === "security" && (
            <PreferenceList items={securityPreferences} storageKey="security" />
          )}
          {active === "connections" && (
            <PreferenceList items={connectionPreferences} storageKey="connections" />
          )}
        </article>
      </section>
    </div>
  );
}

function PreferenceList({ items, storageKey }: { items: Preference[]; storageKey: string }) {
  const key = `vow-planner-settings-${storageKey}`;
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setEnabled(JSON.parse(stored));
    } catch {
      toast.error("Saved preferences could not be loaded.");
    }
  }, [key]);

  function updatePreference(item: Preference, value: boolean) {
    setEnabled((current) => {
      const next = { ...current, [item.id]: value };
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
    toast.success(`${item.label} ${value ? "enabled" : "disabled"}.`);
  }

  return (
    <div className="settings-preference-list">
      {items.map((item) => (
        <label className="settings-checkbox-row" key={item.id}>
          <span className="settings-row-copy">
            <span className="settings-row-icon" aria-hidden="true">
              <item.icon size={17} strokeWidth={1.8} />
            </span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </span>
          <input
            className="settings-checkbox size-4"
            type="checkbox"
            checked={Boolean(enabled[item.id])}
            onChange={(event) => updatePreference(item, event.target.checked)}
          />
        </label>
      ))}
    </div>
  );
}
