import assert from "node:assert/strict";
import test from "node:test";
import { currencyForCountry, formatMoney } from "../../lib/currency.ts";

test("defaults South Africa to ZAR and other countries to USD", () => {
  assert.equal(currencyForCountry("ZA"), "ZAR");
  assert.equal(currencyForCountry("SA"), "ZAR");
  assert.equal(currencyForCountry("US"), "USD");
  assert.equal(currencyForCountry(null), "USD");
});

test("formats the stored amount without exchange-rate conversion", () => {
  assert.equal(formatMoney(100_000, "ZAR"), "R1,000");
  assert.equal(formatMoney(100_000, "USD"), "1,000$");
});
