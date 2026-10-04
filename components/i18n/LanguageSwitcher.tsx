"use client";

import { Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { YesSelect } from "@/components/ui/YesSelect";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  function changeLanguage(nextLanguage: "en" | "fr") {
    setLanguage(nextLanguage);
    // Refresh server-rendered sections after the cookie changes so every page uses the new language.
    router.refresh();
  }

  return (
    <div className={`language-switcher${compact ? " language-switcher-compact" : ""}`}>
      <YesSelect
        ariaLabel={t("settings.preferredLanguage")}
        id={compact ? "language-compact" : "language"}
        name="language"
        compact={compact}
        leadingIcon={<Globe2 size={15} aria-hidden="true" />}
        options={[
          { value: "en", label: compact ? "EN" : t("language.english") },
          { value: "fr", label: compact ? "FR" : t("language.french") },
        ]}
        value={language}
        onChange={(value) => changeLanguage(value as "en" | "fr")}
      />
    </div>
  );
}
