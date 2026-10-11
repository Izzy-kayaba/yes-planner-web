// Purpose: verifies vendor and venue price-range business rules and display formatting.
import assert from "node:assert/strict";
import test from "node:test";
import { formatVendorPriceRange, validateVendorPriceRange } from "../../lib/vendors/pricing.ts";

const money = (minor) => `$${minor}`;

test("accepts a valid minimum and maximum price", () => {
  assert.deepEqual(validateVendorPriceRange(10000, 25000), {
    valid: true,
    minMinor: 10000,
    maxMinor: 25000,
  });
});

test("accepts equal minimum and maximum values at the zero boundary", () => {
  assert.deepEqual(validateVendorPriceRange(0, 0), {
    valid: true,
    minMinor: 0,
    maxMinor: 0,
  });
  assert.equal(formatVendorPriceRange(0, 0, money), "$0");
});

test("rejects inverted, negative, fractional, and missing prices", () => {
  assert.equal(validateVendorPriceRange(25000, 10000).valid, false);
  assert.equal(validateVendorPriceRange(-1, 10000).valid, false);
  assert.equal(validateVendorPriceRange(100.5, 200).valid, false);
  assert.equal(validateVendorPriceRange(null, 200).valid, false);
});

test("formats the exact supplied range instead of selecting a catalogue bucket", () => {
  assert.equal(formatVendorPriceRange(12500, 38750, money), "$12500 – $38750");
});

test("does not mutate the supplied numeric values", () => {
  const min = 10000;
  const max = 20000;
  validateVendorPriceRange(min, max);
  assert.equal(min, 10000);
  assert.equal(max, 20000);
});

test("propagates a formatter dependency failure instead of returning misleading data", () => {
  assert.throws(
    () =>
      formatVendorPriceRange(10000, 20000, () => {
        throw new Error("currency service unavailable");
      }),
    /currency service unavailable/,
  );
});
