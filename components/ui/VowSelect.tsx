"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type VowSelectOption = { value: string; label: string };

export function VowSelect({
  value,
  defaultValue = "",
  options,
  placeholder = "Select an option",
  ariaLabel,
  name,
  disabled = false,
  invalid = false,
  compact = false,
  leadingIcon,
  className,
  onChange,
}: {
  value?: string;
  defaultValue?: string;
  options: VowSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  compact?: boolean;
  leadingIcon?: ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}) {
  const generatedId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function select(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = Math.max(
      0,
      options.findIndex((option) => option.value === selectedValue),
    );
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + direction + options.length) % options.length;
      select(options[nextIndex].value);
    }
  }

  return (
    <div className={cn("vow-select", compact && "vow-select-compact", className)} ref={root}>
      {name && <input name={name} type="hidden" value={selectedValue} />}
      <button
        aria-controls={`${generatedId}-options`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        className="vow-select-trigger"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="vow-select-value">
          {leadingIcon && <span className="vow-select-leading-icon">{leadingIcon}</span>}
          <span className={selected ? "" : "vow-select-placeholder"}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="vow-select-chevron" size={16} />
      </button>
      {open && (
        <div className="vow-select-options" id={`${generatedId}-options`} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === selectedValue}
              className={option.value === selectedValue ? "selected" : ""}
              key={option.value}
              onClick={() => select(option.value)}
              role="option"
              tabIndex={0}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === selectedValue && <Check aria-hidden="true" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
