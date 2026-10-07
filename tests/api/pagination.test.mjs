import assert from "node:assert/strict";
import test from "node:test";
import { paginatedResult, parsePagination } from "../../lib/api/pagination.ts";

test("uses the shared first-page defaults", () => {
  assert.deepEqual(parsePagination(new URLSearchParams()), {
    page: 1,
    pageSize: 25,
    skip: 0,
  });
});

test("parses page and pageSize and calculates the database offset", () => {
  assert.deepEqual(parsePagination(new URLSearchParams("page=3&pageSize=20")), {
    page: 3,
    pageSize: 20,
    skip: 40,
  });
});

test("rejects invalid, unsafe, and over-limit pagination values", () => {
  for (const query of [
    "page=0",
    "page=-1",
    "page=1.5",
    "page=1e100",
    "pageSize=0",
    "pageSize=101",
    "page=9007199254740991&pageSize=100",
  ]) {
    assert.equal(parsePagination(new URLSearchParams(query)), null, query);
  }
});

test("returns stable metadata for empty and final pages", () => {
  assert.deepEqual(paginatedResult([], 1, 25, 0), {
    items: [],
    pagination: {
      page: 1,
      pageSize: 25,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  assert.deepEqual(paginatedResult(["last"], 3, 2, 5).pagination, {
    page: 3,
    pageSize: 2,
    totalItems: 5,
    totalPages: 3,
    hasNextPage: false,
    hasPreviousPage: true,
  });
});
