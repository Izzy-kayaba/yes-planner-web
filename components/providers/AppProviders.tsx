"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import type { Language } from "@/lib/i18n";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";

/** Client-only providers shared by every public and authenticated page. */
export function AppProviders({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: Language;
}) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider initialLanguage={initialLanguage}>
        <CurrencyProvider>
          <ScrollToTop />
          {children}
          <ThemeAwareToaster />
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function ThemeAwareToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      closeButton
      position="top-right"
      richColors
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
