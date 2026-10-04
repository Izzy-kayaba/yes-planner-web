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
import { isValidPhoneNumber } from "libphonenumber-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-number-input";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest } from "@/lib/api/client";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { FieldLabel } from "@/components/forms/FieldLabel";

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
    id: "vendor-requests",
    label: "Vendor request updates",
    description: "Status changes from vendors you asked to work with",
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
  const router = useRouter();
  const { t, text } = useLanguage();
  const { data: session } = authClient.useSession();
  const [active, setActive] = useState<(typeof tabs)[number][0]>("profile");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    whatsappNotifications: false,
  });

  useEffect(() => {
    if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") {
      try {
        const stored = window.localStorage.getItem("yes-planner-profile");
        if (stored) {
          const saved = JSON.parse(stored) as Partial<typeof profile> & { phone?: string };
          setProfile((current) => ({
            ...current,
            ...saved,
            phoneNumber: saved.phoneNumber ?? saved.phone ?? "",
          }));
        }
      } catch {
        toast.error(text("Saved profile settings could not be loaded."));
      }
      return;
    }
    apiRequest<typeof profile>("/api/v1/me")
      .then(setProfile)
      .catch((error: Error) => toast.error(error.message));
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidPhoneNumber(profile.phoneNumber)) {
      toast.error(text("Enter a valid phone number."));
      return;
    }
    try {
      if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") {
        window.localStorage.setItem("yes-planner-profile", JSON.stringify(profile));
      } else {
        const saved = await apiRequest<typeof profile>("/api/v1/me", {
          method: "PATCH",
          body: JSON.stringify(profile),
        });
        setProfile(saved);
        router.refresh();
      }
      toast.success(text("Profile settings saved."));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : text("Profile settings could not be saved."),
      );
    }
  }

  function updateProfile<K extends keyof typeof profile>(field: K, value: (typeof profile)[K]) {
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
                  <h3>{text("Profile information")}</h3>
                  <p>
                    {text("This information is visible to people sharing a workspace with you.")}
                  </p>
                </div>
              </div>
              <div className="form-row">
                <label>
                  <FieldLabel required>{t("auth.firstName")}</FieldLabel>
                  <input
                    name="firstName"
                    onChange={(event) => updateProfile("firstName", event.target.value)}
                    required
                    value={profile.firstName}
                  />
                </label>
                <label>
                  <FieldLabel required>{t("auth.lastName")}</FieldLabel>
                  <input
                    name="lastName"
                    onChange={(event) => updateProfile("lastName", event.target.value)}
                    required
                    value={profile.lastName}
                  />
                </label>
              </div>
              <label>
                <FieldLabel required>{t("auth.email")}</FieldLabel>
                <input name="email" readOnly required type="email" value={profile.email} />
              </label>
              <label className="settings-toggle-row">
                <input
                  checked={profile.whatsappNotifications}
                  onChange={(event) => updateProfile("whatsappNotifications", event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>{text("WhatsApp notifications")}</strong>
                  <small>
                    {text("Receive important workspace and vendor-request updates on WhatsApp.")}
                  </small>
                </span>
              </label>
              <label>
                <FieldLabel required>{t("auth.phone")}</FieldLabel>
                <PhoneInput
                  className="phone-input"
                  defaultCountry="ZA"
                  international
                  countryCallingCodeEditable={false}
                  onChange={(value) => updateProfile("phoneNumber", value ?? "")}
                  value={profile.phoneNumber}
                  required
                />
              </label>
              <div className="settings-actions">
                {session?.user.role === "Couple" && (
                  <Link className="button button-secondary" href="/onboarding">
                    {text("Edit wedding details")}
                  </Link>
                )}
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
                <p className="mt-2 text-sm text-yes-muted">
                  {text(
                    "Your choice updates the shared navigation and dashboard language and is remembered on this device.",
                  )}
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
  const { text } = useLanguage();
  const key = `yes-planner-settings-${storageKey}`;
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setEnabled(JSON.parse(stored));
    } catch {
      toast.error(text("Saved preferences could not be loaded."));
    }
  }, [key]);

  function updatePreference(item: Preference, value: boolean) {
    setEnabled((current) => {
      const next = { ...current, [item.id]: value };
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
    toast.success(`${text(item.label)} ${text(value ? "enabled" : "disabled")}.`);
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
              <strong>{text(item.label)}</strong>
              <small>{text(item.description)}</small>
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
