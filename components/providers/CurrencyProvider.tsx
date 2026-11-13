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
  setCurrency: (currency: SupportedCurrency) => void;
  displayMoney: (usdAmountMinor: number) => string;
  displayStoredMoney: (amountMinor: number, storedCurrency: SupportedCurrency) => string;
  inputMoneyToUsdMinor: (amount: number) => number;
  usdMinorToInputMoney: (usdAmountMinor: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setSelectedCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [usdToZarRate, setUsdToZarRate] = useState<number | null>(null);

  function setCurrency(nextCurrency: SupportedCurrency) {
    setSelectedCurrency(nextCurrency);
    window.localStorage.setItem("yes-planner-currency", nextCurrency);
  }

  useEffect(() => {
    let active = true;
    const storedCurrency = window.localStorage.getItem("yes-planner-currency");
    if (storedCurrency === "USD" || storedCurrency === "ZAR") setSelectedCurrency(storedCurrency);
    fetch("/api/v1/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ currency?: SupportedCurrency }>;
      })
      .then((profile) => {
        if (!active || !profile?.currency) return;
        setSelectedCurrency(profile.currency);
        window.localStorage.setItem("yes-planner-currency", profile.currency);
      })
      .catch(() => undefined);

    fetch("/api/v1/currency", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Currency availability could not be loaded.");
        return response.json() as Promise<{ usdToZarRate: number | null }>;
      })
      .then((result) => {
        if (active) setUsdToZarRate(result.usdToZarRate);
      })
      .catch(() => {
        if (active) setUsdToZarRate(null);
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

  function displayStoredMoney(amountMinor: number, storedCurrency: SupportedCurrency) {
    return formatMoney(amountMinor, storedCurrency);
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
      return (usdAmountMinor * usdToZarRate) / 100;
    }
    return usdAmountMinor / 100;
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        displayMoney,
        displayStoredMoney,
        inputMoneyToUsdMinor,
        usdMinorToInputMoney,
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
