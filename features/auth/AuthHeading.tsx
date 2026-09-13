"use client";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function AuthHeading({ mode }: { mode: "login" | "register" }) {
  const { t } = useLanguage();
  const register = mode === "register";

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="eyebrow mb-0">{t(register ? "auth.registerEyebrow" : "auth.welcome")}</p>
        <LanguageSwitcher compact />
      </div>
      <h2>{t(register ? "auth.registerTitle" : "auth.loginTitle")}</h2>
      <p className="auth-intro">{t(register ? "auth.registerIntro" : "auth.loginIntro")}</p>
    </>
  );
}
