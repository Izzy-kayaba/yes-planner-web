"use client";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AuthHeading({ mode }: { mode: "login" | "register" }) {
  const { t, text } = useLanguage();
  const register = mode === "register";

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-[3]">
          <span className="min-[915px]:hidden">
            <Link className="icon-button" href="/" aria-label={text("Back to home")}>
              <ArrowLeft size={19} />
            </Link>
          </span>
          <span className="hidden min-[915px]:block">
            <p className="eyebrow mb-0">{t(register ? "auth.registerEyebrow" : "auth.welcome")}</p>
          </span>
        </div>
        <div className="flex-[1]">
          <LanguageSwitcher compact />
        </div>
      </div>

      <p className="eyebrow min-[915px]:hidden">
        {t(register ? "auth.registerEyebrow" : "auth.welcome")}
      </p>
      <h2>{t(register ? "auth.registerTitle" : "auth.loginTitle")}</h2>
      <p className="auth-intro">{t(register ? "auth.registerIntro" : "auth.loginIntro")}</p>
    </>
  );
}
