"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";

export function DisplayMoney({ amountMinor }: { amountMinor: number }) {
  return useCurrency().displayMoney(amountMinor);
}
