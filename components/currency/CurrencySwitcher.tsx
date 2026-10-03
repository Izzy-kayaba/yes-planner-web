"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { SupportedCurrency } from "@/lib/currency";

export function CurrencySwitcher() {
  const { availableCurrencies, currency, setCurrency } = useCurrency();
  const { text } = useLanguage();
  return (
    <label className="currency-switcher">
      <span className="sr-only">{text("Display currency")}</span>
      <select
        aria-label={text("Display currency")}
        onChange={(event) => setCurrency(event.target.value as SupportedCurrency)}
        value={currency}
      >
        {availableCurrencies.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
