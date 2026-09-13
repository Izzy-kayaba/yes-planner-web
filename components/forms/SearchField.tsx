"use client";

import { Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { text } = useLanguage();
  return (
    <label className="table-search">
      <Search size={16} aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={text(placeholder)}
        type="search"
      />
    </label>
  );
}
