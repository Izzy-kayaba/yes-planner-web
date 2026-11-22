"use client";

import { Moon, Sun } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

export function AuthUtilityControls() {
  const { text } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const darkMode = resolvedTheme === "dark";

  return (
    <div className="auth-utility-controls" aria-label={text("Display preferences")}>
      <LanguageSwitcher compact />
      <button
        aria-label={text(darkMode ? "Use light theme" : "Use dark theme")}
        className="icon-button"
        onClick={() => setTheme(darkMode ? "light" : "dark")}
        type="button"
      >
        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    </div>
  );
}
