"use client";
// Purpose: implements components/providers/CurrencyProvider.tsx for the Yes Planner web application.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultCurrency, formatMoney, type SupportedCurrency } from "@/lib/currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  displayMoney: (amountMinor: number) => string;
  displayStoredMoney: (amountMinor: number, storedCurrency: SupportedCurrency) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setSelectedCurrency] = useState<SupportedCurrency>(defaultCurrency);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ currency?: SupportedCurrency }>;
      })
      .then((profile) => {
        if (!active || !profile?.currency) return;
        setSelectedCurrency(profile.currency);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function displayMoney(amountMinor: number) {
    return formatMoney(amountMinor, currency);
  }

  function displayStoredMoney(amountMinor: number, _storedCurrency: SupportedCurrency) {
    return formatMoney(amountMinor, currency);
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        displayMoney,
        displayStoredMoney,
      }}
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
