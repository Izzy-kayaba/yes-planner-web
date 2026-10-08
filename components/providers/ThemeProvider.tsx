"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = Exclude<Theme, "system">;

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme(theme: Theme): void;
};

const storageKey = "theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Read the operating-system preference only in the browser, after hydration.
function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Keep the in-memory choice working when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(storageKey);
      if (isTheme(savedTheme)) setThemeState(savedTheme);
    } catch {
      // The operating-system preference remains available without local storage.
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      setThemeState(isTheme(event.newValue) ? event.newValue : "system");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const resolved = theme === "system" ? systemTheme() : theme;
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
      setResolvedTheme(resolved);
    };

    applyTheme();
    if (theme !== "system") return;

    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    preference.addEventListener("change", applyTheme);
    return () => preference.removeEventListener("change", applyTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
