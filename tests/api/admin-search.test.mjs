import assert from "node:assert/strict";
import test from "node:test";
import { escapedAdminSearch, parseAdminSearch } from "../../lib/admin/search.ts";

test("admin search escapes regular-expression metacharacters", () => {
  assert.equal(escapedAdminSearch("venue.*(cape)"), "venue\\.\\*\\(cape\\)");
});

test("admin search trims input and rejects values over the supported limit", () => {
  assert.equal(parseAdminSearch(new URLSearchParams("search=%20venue%20")), "venue");
  assert.equal(parseAdminSearch(new URLSearchParams(`search=${"x".repeat(101)}`)), null);
});
