"use client";

import { ArrowDownWideNarrow, Search, SlidersHorizontal } from "lucide-react";
import type { FormEvent } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { YesSelect, type YesSelectOption } from "@/components/ui/YesSelect";

export function AdminSearch({
  value,
  onChange,
  onSearch,
  filters = [],
  sortLabel,
  sortValue,
  defaultSortValue = "default",
  sortOptions = [],
  onSortChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  filters?: {
    label: string;
    value: string;
    options: YesSelectOption[];
    onChange: (value: string) => void;
  }[];
  sortLabel?: string;
  sortValue?: string;
  defaultSortValue?: string;
  sortOptions?: YesSelectOption[];
  onSortChange?: (value: string) => void;
}) {
  const { text } = useLanguage();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }

  return (
    <div className="admin-table-controls mb-5">
      <form className="admin-search" onSubmit={submit} role="search">
        <Search aria-hidden="true" className="admin-search-icon" size={17} />
        <input
          aria-label={text("Search records")}
          maxLength={100}
          onChange={(event) => onChange(event.target.value)}
          placeholder={text("Search records")}
          value={value}
        />
        <button aria-label={text("Search")} className="admin-search-button" type="submit">
          <Search aria-hidden="true" size={15} />
        </button>
      </form>
      <div className="admin-table-management">
        {filters.length > 0 && (
          <div aria-label={text("Filter")} className="admin-table-filter-group" role="group">
            <span
              aria-label={text("Filter")}
              className="admin-table-group-label admin-table-group-icon"
              title={text("Filter")}
            >
              <SlidersHorizontal aria-hidden="true" size={14} />
              <span className="sr-only">{text("Filter")}</span>
            </span>
            <div className="admin-table-filter-options">
              {filters.map((filter) => (
                <div className="admin-table-filter-control" key={filter.label}>
                  <YesSelect
                    ariaLabel={text(filter.label)}
                    className={`admin-table-select ${
                      filter.value !== "all" ? "admin-table-select-active" : ""
                    }`}
                    options={filter.options}
                    value={filter.value}
                    onChange={filter.onChange}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {sortLabel && sortValue !== undefined && onSortChange && sortOptions.length > 0 && (
          <div className="admin-table-sort-group">
            <span
              aria-label={text("Sort")}
              className="admin-table-group-label admin-table-group-icon"
              title={text("Sort")}
            >
              <ArrowDownWideNarrow aria-hidden="true" size={15} />
              <span className="sr-only">{text("Sort")}</span>
            </span>
            <YesSelect
              ariaLabel={text(sortLabel)}
              className={`admin-table-select ${
                sortValue !== defaultSortValue ? "admin-table-select-active" : ""
              }`}
              options={sortOptions}
              value={sortValue}
              onChange={onSortChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
