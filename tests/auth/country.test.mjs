// Purpose: implements tests/auth/country.test.mjs for the Yes Planner web application.
import assert from "node:assert/strict";
import test from "node:test";
import { appendCountryPath, appendZaPath, normalizeCountry } from "../../lib/country.ts";

test("normalizes SA to the ISO country code ZA", () => {
  assert.equal(normalizeCountry("sa"), "ZA");
});

test("adds the ZA prefix once for South African paths", () => {
  assert.equal(appendZaPath("/marketplace", "ZA"), "/za/marketplace");
  assert.equal(appendZaPath("/za/marketplace", "ZA"), "/za/marketplace");
});

test("adds a dynamic two-letter country prefix for other detected countries", () => {
  assert.equal(appendCountryPath("/marketplace", "FR"), "/fr/marketplace");
  assert.equal(appendCountryPath("/fr/marketplace", "FR"), "/fr/marketplace");
  assert.equal(appendCountryPath("/marketplace", ""), "/marketplace");
});

test("uses the detected country for non-South-African paths", () => {
  assert.equal(appendCountryPath("/marketplace", "US"), "/us/marketplace");
});
