import type { Metadata } from "next";
import { Cardo, Nunito } from "next/font/google";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/AppProviders";
import { isSupportedLanguage } from "@/lib/i18n";
import { getTextTranslator } from "@/lib/i18n-server";
import { siteDescription, siteUrl } from "@/lib/site";
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

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return {
    metadataBase: siteUrl,
    title: {
      default: "Yes Planner",
      template: "%s · Yes Planner",
    },
    description: text(siteDescription),
    alternates: { canonical: "/" },
    icons: {
      icon: [
        { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      siteName: "Yes Planner",
      title: "Yes Planner · Wedding planning, beautifully organised",
      description: siteDescription,
      url: "/",
      images: [
        { url: "/favicon/android-chrome-512x512.png", width: 512, height: 512, alt: "Yes Planner" },
      ],
    },
    twitter: {
      card: "summary",
      title: "Yes Planner",
      description: siteDescription,
      images: ["/favicon/android-chrome-512x512.png"],
    },
    robots: { index: true, follow: true },
  };
}

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
