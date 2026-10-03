export type SupportedCurrency = "USD" | "ZAR";

export const defaultCurrency: SupportedCurrency = "USD";

export function convertUsdToZar(amountMinor: number, exchangeRate: number) {
  return Math.round(amountMinor * exchangeRate);
}

export function formatMoney(amountMinor: number, currency: SupportedCurrency) {
  const amount = Math.round(amountMinor / 100).toLocaleString("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return currency === "ZAR" ? `R ${amount}` : `${amount}$`;
}
