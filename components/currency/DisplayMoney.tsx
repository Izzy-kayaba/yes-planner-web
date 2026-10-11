"use client";
// Purpose: implements components/currency/DisplayMoney.tsx for the Yes Planner web application.

import { useCurrency } from "@/components/providers/CurrencyProvider";

export function DisplayMoney({ amountMinor }: { amountMinor: number }) {
  return useCurrency().displayMoney(amountMinor);
}
