"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { intlMessages, languageCookieName, type Language, type TranslationKey } from "@/lib/i18n";
import { getLiteralMessageKey } from "@/lib/i18n-literals";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  text: (value: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: Language;
}) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    updateLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${languageCookieName}=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    document.cookie = `vow-language=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <NextIntlClientProvider
      locale={language}
      messages={intlMessages[language]}
      timeZone="Africa/Johannesburg"
    >
      <LanguageContextBridge language={language} setLanguage={setLanguage}>
        {children}
      </LanguageContextBridge>
    </NextIntlClientProvider>
  );
}

function LanguageContextBridge({
  children,
  language,
  setLanguage,
}: {
  children: ReactNode;
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const translateMessage = useTranslations();

  const translateText = useCallback(
    (content: string) => {
      const key = getLiteralMessageKey(content);
      return key ? translateMessage(key) : content;
    },
    [translateMessage],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, values) => translateMessage(key, values),
      text: translateText,
    }),
    [language, setLanguage, translateMessage, translateText],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}
