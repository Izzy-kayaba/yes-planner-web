import assert from "node:assert/strict";
import test from "node:test";
import { appendZaPath, normalizeCountry } from "../../lib/country.ts";

test("normalizes SA to the ISO country code ZA", () => {
  assert.equal(normalizeCountry("sa"), "ZA");
});

test("adds the ZA prefix once for South African paths", () => {
  assert.equal(appendZaPath("/marketplace", "ZA"), "/za/marketplace");
  assert.equal(appendZaPath("/za/marketplace", "ZA"), "/za/marketplace");
});

test("leaves non-South-African paths unchanged", () => {
  assert.equal(appendZaPath("/marketplace", "US"), "/marketplace");
});
