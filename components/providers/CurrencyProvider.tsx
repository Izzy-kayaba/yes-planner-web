"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  convertUsdToZar,
  defaultCurrency,
  formatMoney,
  type SupportedCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  availableCurrencies: SupportedCurrency[];
  setCurrency: (currency: SupportedCurrency) => void;
  displayMoney: (usdAmountMinor: number) => string;
};

const storageKey = "vow-planner-display-currency";
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setSelectedCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [southAfrican, setSouthAfrican] = useState(false);
  const [usdToZarRate, setUsdToZarRate] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch("/api/v1/currency", {
      cache: "no-store",
      headers: {
        "x-vow-locale": navigator.language,
        "x-vow-time-zone": timeZone,
      },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Currency availability could not be loaded.");
        return response.json() as Promise<{ southAfrican: boolean; usdToZarRate: number | null }>;
      })
      .then((result) => {
        if (!active) return;
        setSouthAfrican(result.southAfrican);
        setUsdToZarRate(result.usdToZarRate);
        const stored = window.localStorage.getItem(storageKey);
        if (stored === "ZAR" && result.southAfrican && result.usdToZarRate) {
          setSelectedCurrency("ZAR");
        }
      })
      .catch(() => {
        if (active) setSelectedCurrency(defaultCurrency);
      });
    return () => {
      active = false;
    };
  }, []);

  const availableCurrencies = useMemo<SupportedCurrency[]>(
    () => (southAfrican && usdToZarRate ? ["USD", "ZAR"] : ["USD"]),
    [southAfrican, usdToZarRate],
  );

  function setCurrency(nextCurrency: SupportedCurrency) {
    const allowed = availableCurrencies.includes(nextCurrency) ? nextCurrency : defaultCurrency;
    setSelectedCurrency(allowed);
    window.localStorage.setItem(storageKey, allowed);
  }

  function displayMoney(usdAmountMinor: number) {
    const amount =
      currency === "ZAR" && usdToZarRate
        ? convertUsdToZar(usdAmountMinor, usdToZarRate)
        : usdAmountMinor;
    return formatMoney(amount, currency);
  }

  return (
    <CurrencyContext.Provider value={{ currency, availableCurrencies, setCurrency, displayMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider.");
  return context;
}
