"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label
      className={cn(
        "language-switcher inline-flex items-center gap-2 text-vow-muted",
        compact && "language-switcher-compact",
        !compact && "rounded-xl border border-vow-line bg-vow-surface px-3",
      )}
    >
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">{t("settings.preferredLanguage")}</span>
      <select
        className={cn(
          "language-switcher-select h-10 border-0 bg-transparent p-0 text-xs font-bold shadow-none",
          compact && "w-12",
        )}
        value={language}
        onChange={(event) => setLanguage(event.target.value as "en" | "fr")}
        aria-label={t("settings.preferredLanguage")}
      >
        <option value="en">{compact ? "EN" : t("language.english")}</option>
        <option value="fr">{compact ? "FR" : t("language.french")}</option>
      </select>
    </label>
  );
}
