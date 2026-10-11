// Purpose: centralizes vendor and venue price-range rules used by forms, APIs, and views.

export type VendorPriceRangeResult =
  { valid: true; minMinor: number; maxMinor: number } | { valid: false; message: string };

/**
 * Validates and normalizes prices stored in USD minor units.
 * Both values are required so public views can display the exact range supplied by the business.
 */
export function validateVendorPriceRange(
  minMinor: unknown,
  maxMinor: unknown,
): VendorPriceRangeResult {
  if (
    typeof minMinor !== "number" ||
    !Number.isSafeInteger(minMinor) ||
    typeof maxMinor !== "number" ||
    !Number.isSafeInteger(maxMinor)
  ) {
    return { valid: false, message: "Prices must be whole USD minor-unit values." };
  }
  if (minMinor < 0 || maxMinor < 0) {
    return { valid: false, message: "Prices cannot be negative." };
  }
  if (minMinor > maxMinor) {
    return { valid: false, message: "Minimum price cannot be greater than maximum price." };
  }
  return { valid: true, minMinor, maxMinor };
}

/**
 * Formats a stored price range without assuming a fixed catalogue range.
 * The formatter is injected so this helper remains independent of currency presentation.
 */
export function formatVendorPriceRange(
  minMinor: number,
  maxMinor: number,
  formatMoney: (amountMinor: number) => string,
) {
  return minMinor === maxMinor
    ? formatMoney(minMinor)
    : `${formatMoney(minMinor)} – ${formatMoney(maxMinor)}`;
}
