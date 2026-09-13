import type { Metadata } from "next";
import { Cardo, Nunito } from "next/font/google";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/AppProviders";
import { isSupportedLanguage } from "@/lib/i18n";
import "./globals.css";
import "./workspace.css";
import "./modules.css";

const cardo = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-cardo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vow Planner",
    template: "%s · Vow Planner",
  },
  description: "One beautiful place to plan, manage and remember your wedding.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestedLocale = await getLocale();
  const initialLanguage = isSupportedLanguage(requestedLocale) ? requestedLocale : "en";

  return (
    <html
      lang={initialLanguage}
      className={`${cardo.variable} ${nunito.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppProviders initialLanguage={initialLanguage}>{children}</AppProviders>
      </body>
    </html>
  );
}
