export type MoneyRange = {
  id: string;
  minMinor: number;
  maxMinor: number | null;
};

export type GuestRange = {
  id: string;
  min: number;
  max: number | null;
};

export const budgetRanges: MoneyRange[] = [
  { id: "under-10000", minMinor: 0, maxMinor: 1_000_000 },
  { id: "10000-25000", minMinor: 1_000_000, maxMinor: 2_500_000 },
  { id: "25000-50000", minMinor: 2_500_000, maxMinor: 5_000_000 },
  { id: "50000-100000", minMinor: 5_000_000, maxMinor: 10_000_000 },
  { id: "100000-plus", minMinor: 10_000_000, maxMinor: null },
];

export const vendorPriceRanges: MoneyRange[] = [
  // Keep the first legacy key so existing profiles remain readable.
  { id: "under-500", minMinor: 0, maxMinor: 50_000 },
  { id: "500-1000", minMinor: 50_000, maxMinor: 100_000 },
  { id: "1000-2500", minMinor: 100_000, maxMinor: 250_000 },
  { id: "2500-5000", minMinor: 250_000, maxMinor: 500_000 },
  { id: "5000-plus", minMinor: 500_000, maxMinor: null },
];

export const guestRanges: GuestRange[] = [
  { id: "under-50", min: 1, max: 49 },
  { id: "50-99", min: 50, max: 99 },
  { id: "100-149", min: 100, max: 149 },
  { id: "150-199", min: 150, max: 199 },
  { id: "200-plus", min: 200, max: null },
];

export function moneyRangeValue(range: MoneyRange) {
  return range.maxMinor ?? range.minMinor;
}

export function moneyRangeLabel(
  range: MoneyRange,
  formatMoney: (amountMinor: number) => string,
  translate: (
    key: "pricing.under" | "pricing.range" | "pricing.plus",
    values: Record<string, string>,
  ) => string,
) {
  if (range.minMinor === 0 && range.maxMinor !== null) {
    return translate("pricing.under", { amount: formatMoney(range.maxMinor) });
  }
  if (range.maxMinor === null) {
    return translate("pricing.plus", { amount: formatMoney(range.minMinor) });
  }
  return translate("pricing.range", {
    min: formatMoney(range.minMinor),
    max: formatMoney(range.maxMinor),
  });
}

export function guestRangeLabel(
  range: GuestRange,
  translate: (
    key: "guests.under" | "guests.range" | "guests.plus",
    values: Record<string, string>,
  ) => string,
) {
  if (range.min === 1) return translate("guests.under", { amount: String(range.max) });
  if (range.max === null) return translate("guests.plus", { amount: String(range.min) });
  return translate("guests.range", { min: String(range.min), max: String(range.max) });
}

export function guestRangeValue(range: GuestRange) {
  return range.max ?? range.min;
}

export function inferMoneyRange(ranges: MoneyRange[], amountMinor: number) {
  return (
    ranges.find(
      (range) =>
        amountMinor >= range.minMinor && (range.maxMinor === null || amountMinor <= range.maxMinor),
    )?.id ?? ""
  );
}

export function inferGuestRange(guests: number) {
  return (
    guestRanges.find((range) => guests >= range.min && (range.max === null || guests <= range.max))
      ?.id ?? ""
  );
}
