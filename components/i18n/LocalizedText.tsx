"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

/** Translates fixed interface copy without adding an extra HTML wrapper. */
export function LocalizedText({ value }: { value: string }) {
  const { text } = useLanguage();
  return text(value);
}
