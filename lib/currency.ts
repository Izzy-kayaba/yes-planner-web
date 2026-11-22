// Purpose: implements lib/currency.ts for the Yes Planner web application.
export type SupportedCurrency = "USD" | "ZAR";

export const defaultCurrency: SupportedCurrency = "USD";

export function currencyForCountry(country: string | null | undefined): SupportedCurrency {
  return country?.trim().toUpperCase() === "ZA" || country?.trim().toUpperCase() === "SA"
    ? "ZAR"
    : defaultCurrency;
}

export function formatMoney(amountMinor: number, currency: SupportedCurrency) {
  const amount = Math.round(amountMinor / 100).toLocaleString("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return currency === "ZAR" ? `R${amount}` : `${amount}$`;
}

export function currencyLabel(currency: SupportedCurrency) {
  return currency === "ZAR" ? "South African Rand (ZAR)" : "US Dollar (USD)";
}
