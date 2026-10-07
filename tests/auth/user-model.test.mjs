import assert from "node:assert/strict";
import test from "node:test";
import {
  accountTypeFromStoredUser,
  isAccountType,
  isSelfServiceRole,
} from "../../lib/auth/roles.ts";
import { offersWeddingPlanning } from "../../lib/vendors/services.ts";

test("uses only primary account concepts for new registrations", () => {
  assert.equal(isSelfServiceRole("Couple"), true);
  assert.equal(isSelfServiceRole("Vendor"), true);
  assert.equal(isSelfServiceRole("Venue"), true);
  assert.equal(isSelfServiceRole("Planner"), false);
});

test("maps a legacy planner account to a vendor account", () => {
  assert.equal(accountTypeFromStoredUser("Planner", undefined), "Vendor");
});

test("keeps account type separate from business services", () => {
  assert.equal(isAccountType("Photography"), false);
  assert.equal(isAccountType("Wedding planning"), false);
  assert.equal(offersWeddingPlanning(["Decor", "Wedding planning"]), true);
  assert.equal(offersWeddingPlanning(["Photography"]), false);
});
