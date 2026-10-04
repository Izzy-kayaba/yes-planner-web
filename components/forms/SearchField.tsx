"use client";

import { Search } from "lucide-react";
import { useId } from "react";
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
  const id = `search-${useId().replaceAll(":", "")}`;
  return (
    <label className="table-search">
      <Search size={16} aria-hidden="true" />
      <input
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={text(placeholder)}
        type="search"
      />
    </label>
  );
}
