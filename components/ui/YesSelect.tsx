"use client";

import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type YesSelectOption = { value: string; label: string };

export function YesSelect({
  value,
  defaultValue = "",
  options,
  placeholder = "Select an option",
  ariaLabel,
  id,
  name,
  disabled = false,
  invalid = false,
  required = false,
  compact = false,
  leadingIcon,
  className,
  onChange,
}: {
  value?: string;
  defaultValue?: string;
  options: YesSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  compact?: boolean;
  leadingIcon?: ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}) {
  const generatedId = useId().replaceAll(":", "");
  const controlId = id ?? `yes-select-${generatedId}`;
  const controlName = name ?? controlId;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const optionsList = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !optionsList.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    const positionOptions = () => {
      const triggerElement = trigger.current;
      const optionsElement = optionsList.current;
      if (!triggerElement || !optionsElement) return;

      const triggerRect = triggerElement.getBoundingClientRect();
      const gap = 7;
      const viewportPadding = 12;
      const spaceBelow = window.innerHeight - triggerRect.bottom - gap - viewportPadding;
      const spaceAbove = triggerRect.top - gap - viewportPadding;

      optionsElement.style.minWidth = `${triggerRect.width}px`;
      optionsElement.style.width = compact ? `${triggerRect.width}px` : "max-content";
      const preferredHeight = Math.min(optionsElement.scrollHeight, 260);
      const opensUp = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
      const availableHeight = Math.max(0, opensUp ? spaceAbove : spaceBelow);
      optionsElement.style.maxHeight = `${availableHeight}px`;

      const menuHeight = Math.min(optionsElement.scrollHeight, availableHeight);
      const menuWidth = optionsElement.getBoundingClientRect().width;
      const left = Math.max(
        viewportPadding,
        Math.min(triggerRect.left, window.innerWidth - menuWidth - viewportPadding),
      );
      const top = opensUp ? triggerRect.top - gap - menuHeight : triggerRect.bottom + gap;

      optionsElement.style.left = `${left}px`;
      optionsElement.style.top = `${top}px`;
      optionsElement.style.visibility = "visible";
    };

    positionOptions();
    window.addEventListener("resize", positionOptions);
    window.addEventListener("scroll", positionOptions, true);
    const resizeObserver = new ResizeObserver(positionOptions);
    if (trigger.current) resizeObserver.observe(trigger.current);
    if (optionsList.current) resizeObserver.observe(optionsList.current);

    return () => {
      window.removeEventListener("resize", positionOptions);
      window.removeEventListener("scroll", positionOptions, true);
      resizeObserver.disconnect();
    };
  }, [compact, open, options.length]);

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
    <div className={cn("yes-select", compact && "yes-select-compact", className)} ref={root}>
      <input id={`${controlId}-value`} name={controlName} type="hidden" value={selectedValue} />
      <button
        id={controlId}
        aria-controls={`${controlId}-options`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-label={ariaLabel}
        className="yes-select-trigger"
        disabled={disabled}
        ref={trigger}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="yes-select-value">
          {leadingIcon && <span className="yes-select-leading-icon">{leadingIcon}</span>}
          <span className={selected ? "" : "yes-select-placeholder"}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="yes-select-chevron" size={16} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn("yes-select-options", compact && "yes-select-options-compact")}
            id={`${controlId}-options`}
            ref={optionsList}
            role="listbox"
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
