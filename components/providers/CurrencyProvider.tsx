"use client";

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

  return (
    <CurrencyContext.Provider value={{ currency, displayMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider.");
  return context;
}
