import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import { businessMetadataRow, weddingMetadataRow } from "../../lib/admin/metadata.ts";

test("wedding administration metadata excludes owner identity and private planning data", () => {
  const row = weddingMetadataRow({
    _id: new ObjectId("64a000000000000000000001"),
    displayName: "Ruth & Izzy",
    weddingDate: "2026-10-18",
    venue: "The Garden Estate",
    location: "ZA",
    ownerUserId: "private-user-id",
    planningNotes: "Private note",
    budgetMinor: 52000000,
  });

  assert.deepEqual(row, {
    id: "64a000000000000000000001",
    values: ["Ruth & Izzy", "2026-10-18", "The Garden Estate", "ZA"],
  });
  assert.equal(JSON.stringify(row).includes("private-user-id"), false);
  assert.equal(JSON.stringify(row).includes("Private note"), false);
});

test("business directory metadata contains public fields without credentials or owner IDs", () => {
  const row = businessMetadataRow({
    _id: new ObjectId("64a000000000000000000002"),
    businessName: "The Garden Estate",
    services: ["Venue", "Catering"],
    serviceArea: "Western Cape",
    published: true,
    claimed: false,
    ownerUserId: "private-user-id",
    password: "not-included",
  });

  assert.deepEqual(row, {
    id: "64a000000000000000000002",
    values: ["The Garden Estate", "Venue, Catering", "Western Cape", "Published", "Claimed"],
  });
  assert.equal(JSON.stringify(row).includes("private-user-id"), false);
  assert.equal(JSON.stringify(row).includes("not-included"), false);
});
