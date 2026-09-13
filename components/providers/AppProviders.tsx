"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

/** Client-only providers shared by every public and authenticated page. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <ThemeAwareToaster />
      </ThemeProvider>
    </LanguageProvider>
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
