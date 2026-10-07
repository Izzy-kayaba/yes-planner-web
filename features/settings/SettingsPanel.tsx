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
    emailVerified: false,
    linkedProviders: [] as string[],
    hasPassword: false,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

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
      .catch((error: Error) => toast.error(text(error.message)));
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
        text(error instanceof Error ? error.message : "Profile settings could not be saved."),
      );
    }
  }

  function updateProfile<K extends keyof typeof profile>(field: K, value: (typeof profile)[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function connectGoogle() {
    const result = await authClient.linkSocial({
      provider: "google",
      callbackURL: `${window.location.origin}/settings`,
    });
    if (result.error) toast.error(text(result.error.message ?? "Google could not be connected."));
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error(text("Use at least 8 characters with a number and a symbol."));
      return;
    }
    setPasswordSaving(true);
    try {
      const result = profile.hasPassword
        ? await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
          })
        : await apiRequest<{ status: true }>("/api/v1/me/password", {
            method: "POST",
            body: JSON.stringify({ newPassword }),
          });
      if ("error" in result && result.error)
        throw new Error(text(result.error.message ?? "Password could not be saved."));
      setCurrentPassword("");
      setNewPassword("");
      setProfile((current) => ({ ...current, hasPassword: true }));
      toast.success(text(profile.hasPassword ? "Password changed." : "Password added."));
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Password could not be saved."));
    } finally {
      setPasswordSaving(false);
    }
  }

  async function sendVerificationEmail() {
    const result = await authClient.sendVerificationEmail({
      email: profile.email,
      callbackURL: `${window.location.origin}/settings`,
    });
    if (result.error) {
      toast.error(text(result.error.message ?? "Verification email could not be sent."));
      return;
    }
    toast.success(text("Verification email sent. Check your inbox."));
  }

  async function sendTestEmail() {
    try {
      await apiRequest("/api/v1/me/email-test", { method: "POST" });
      toast.success(text("Test email sent. Check your inbox."));
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Test email could not be sent."));
    }
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
                    id="settings-first-name"
                    name="firstName"
                    onChange={(event) => updateProfile("firstName", event.target.value)}
                    required
                    value={profile.firstName}
                  />
                </label>
                <label>
                  <FieldLabel required>{t("auth.lastName")}</FieldLabel>
                  <input
                    id="settings-last-name"
                    name="lastName"
                    onChange={(event) => updateProfile("lastName", event.target.value)}
                    required
                    value={profile.lastName}
                  />
                </label>
              </div>
              <label>
                <FieldLabel required>{t("auth.email")}</FieldLabel>
                <input
                  id="settings-email"
                  name="email"
                  readOnly
                  required
                  type="email"
                  value={profile.email}
                />
              </label>
              <label className="settings-toggle-row">
                <input
                  id="settings-whatsapp-notifications"
                  name="whatsappNotifications"
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
                  id="settings-phone-number"
                  name="phoneNumber"
                  international
                  countryCallingCodeEditable={false}
                  onChange={(value) => updateProfile("phoneNumber", value ?? "")}
                  value={profile.phoneNumber}
                  required
                />
              </label>
              <section className="grid gap-2 border-t border-yes-line pt-4">
                <h3>{text("Sign-in providers")}</h3>
                <p className="text-sm text-yes-muted">
                  {text("Email and password")}:{" "}
                  {profile.hasPassword ? text("Available") : text("Not set")}
                  {" · "}
                  {text("Social providers")}:{" "}
                  {profile.linkedProviders.length
                    ? profile.linkedProviders
                        .map((provider) => (provider === "google" ? "Google" : provider))
                        .join(", ")
                    : text("None connected")}
                </p>
                <p className="text-sm text-yes-muted">
                  {text(profile.emailVerified ? "Email verified" : "Email not verified")}
                </p>
                {!profile.emailVerified &&
                  (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") !== "demo" && (
                    <button
                      className="button button-secondary w-fit"
                      onClick={() => void sendVerificationEmail()}
                      type="button"
                    >
                      {text("Send verification email")}
                    </button>
                  )}
                {(process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") !== "demo" && (
                  <button
                    className="button button-secondary w-fit"
                    onClick={() => void sendTestEmail()}
                    type="button"
                  >
                    {text("Send test email")}
                  </button>
                )}
              </section>
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
            <div className="grid gap-6">
              <section className="grid gap-4">
                <div>
                  <h3>{text("Sign-in methods")}</h3>
                  <p className="mt-2 text-sm text-yes-muted">
                    {text(
                      "Connect Google while signed in to combine it with your existing account.",
                    )}
                  </p>
                </div>
                <p className="text-sm">
                  {text("Connected")}:{" "}
                  {profile.linkedProviders.length
                    ? profile.linkedProviders
                        .map((provider) => (provider === "google" ? "Google" : provider))
                        .join(", ")
                    : text("Email and password only")}
                </p>
                {!profile.linkedProviders.includes("google") && (
                  <button
                    className="button button-secondary w-fit"
                    onClick={() => void connectGoogle()}
                    type="button"
                  >
                    {text("Connect Google")}
                  </button>
                )}
                <p className="text-sm text-yes-muted">
                  {text(profile.emailVerified ? "Email verified" : "Email not verified")}
                </p>
              </section>
              <form className="grid gap-4 border-t border-yes-line pt-5" onSubmit={savePassword}>
                <div>
                  <h3>{text(profile.hasPassword ? "Change password" : "Add a password")}</h3>
                  <p className="mt-2 text-sm text-yes-muted">
                    {text("Use a password as another way to sign in to this account.")}
                  </p>
                </div>
                {profile.hasPassword && (
                  <label>
                    <FieldLabel required>{text("Current password")}</FieldLabel>
                    <input
                      autoComplete="current-password"
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                      type="password"
                      value={currentPassword}
                    />
                  </label>
                )}
                <label>
                  <FieldLabel required>
                    {text(profile.hasPassword ? "New password" : "Password")}
                  </FieldLabel>
                  <input
                    autoComplete="new-password"
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    type="password"
                    value={newPassword}
                  />
                </label>
                <button
                  className="button button-primary w-fit"
                  disabled={passwordSaving}
                  type="submit"
                >
                  {text(profile.hasPassword ? "Change password" : "Add password")}
                </button>
              </form>
              <PreferenceList items={securityPreferences} storageKey="security" />
            </div>
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
            id={`${storageKey}-${item.id}`}
            name={`${storageKey}-${item.id}`}
            type="checkbox"
            checked={Boolean(enabled[item.id])}
            onChange={(event) => updatePreference(item, event.target.checked)}
          />
        </label>
      ))}
    </div>
  );
}
