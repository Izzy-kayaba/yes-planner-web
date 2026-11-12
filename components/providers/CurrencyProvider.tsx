"use client";
// Purpose: implements components/providers/CurrencyProvider.tsx for the Yes Planner web application.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  convertUsdToZar,
  defaultCurrency,
  formatMoney,
  type SupportedCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  displayMoney: (usdAmountMinor: number) => string;
  inputMoneyToUsdMinor: (amount: number) => number;
  usdMinorToInputMoney: (usdAmountMinor: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setSelectedCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [usdToZarRate, setUsdToZarRate] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch("/api/v1/currency", {
      cache: "no-store",
      headers: {
        "x-yes-locale": navigator.language,
        "x-yes-time-zone": timeZone,
        ...(window.location.pathname === "/za" || window.location.pathname.startsWith("/za/")
          ? { "x-country-code": "ZA" }
          : {}),
      },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Currency availability could not be loaded.");
        return response.json() as Promise<{ southAfrican: boolean; usdToZarRate: number | null }>;
      })
      .then((result) => {
        if (!active) return;
        setUsdToZarRate(result.usdToZarRate);
        setSelectedCurrency(result.southAfrican && result.usdToZarRate ? "ZAR" : "USD");
      })
      .catch(() => {
        if (active) setSelectedCurrency(defaultCurrency);
      });
    return () => {
      active = false;
    };
  }, []);

  function displayMoney(usdAmountMinor: number) {
    const amount =
      currency === "ZAR" && usdToZarRate
        ? convertUsdToZar(usdAmountMinor, usdToZarRate)
        : usdAmountMinor;
    return formatMoney(amount, currency);
  }

  // Form fields accept whole currency units; convert them to the USD-cent storage format.
  function inputMoneyToUsdMinor(amount: number) {
    if (currency === "ZAR" && usdToZarRate) {
      return Math.round((amount * 100) / usdToZarRate);
    }
    return Math.round(amount * 100);
  }

  // Convert stored USD cents back into the currency shown in an editable field.
  function usdMinorToInputMoney(usdAmountMinor: number) {
    if (currency === "ZAR" && usdToZarRate) {
      return usdAmountMinor * usdToZarRate / 100;
    }
    return usdAmountMinor / 100;
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, displayMoney, inputMoneyToUsdMinor, usdMinorToInputMoney }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider.");
  return context;
}
