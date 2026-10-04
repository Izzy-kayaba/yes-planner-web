"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/cn";

export function CharacterCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const { text } = useLanguage();
  const count = value.length;

  return (
    <small className={cn("character-count", min && count < min && "needs-more")}>
      {count} / {max} {text("characters")}
      {min ? ` · ${text("minimum")} ${min}` : ""}
    </small>
  );
}
