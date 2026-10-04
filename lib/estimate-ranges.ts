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
  { id: "under-500", minMinor: 0, maxMinor: 50_000 },
  { id: "500-1000", minMinor: 50_000, maxMinor: 100_000 },
  { id: "1000-2500", minMinor: 100_000, maxMinor: 250_000 },
  { id: "2500-5000", minMinor: 250_000, maxMinor: 500_000 },
  { id: "5000-plus", minMinor: 500_000, maxMinor: null },
];

export const guestRanges: GuestRange[] = [
  { id: "1-50", min: 1, max: 50 },
  { id: "51-100", min: 51, max: 100 },
  { id: "101-150", min: 101, max: 150 },
  { id: "151-200", min: 151, max: 200 },
  { id: "201-plus", min: 201, max: null },
];

export function moneyRangeValue(range: MoneyRange) {
  return range.maxMinor ?? range.minMinor;
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
