// Purpose: verifies workspace input validation, normalization, and integrity safeguards.
import assert from "node:assert/strict";
import test from "node:test";
import {
  validateWorkspaceMoney,
  validateWorkspaceRecord,
} from "../../lib/api/workspace-validation.ts";

test("accepts valid guest contact data and normalizes it in place", () => {
  const guest = {
    phoneNumber: "+27 82 123 4567",
    email: "  Guest@Example.COM ",
  };

  const error = validateWorkspaceRecord("guests", guest);

  assert.equal(error, null);
  assert.equal(guest.phoneNumber, "+27821234567");
  assert.equal(guest.email, "guest@example.com");
});

test("rejects invalid, empty, and malformed guest contact values", () => {
  assert.match(
    validateWorkspaceRecord("guests", { phoneNumber: "", email: "guest@example.com" }) ?? "",
    /WhatsApp phone number/,
  );
  assert.match(
    validateWorkspaceRecord("guests", { phoneNumber: "+27821234567", email: "not-an-email" }) ?? "",
    /valid email/,
  );
  assert.equal(validateWorkspaceRecord("tasks", {}), null);
});

test("enforces money field names, integer boundaries, and module requirements", () => {
  assert.equal(validateWorkspaceMoney("budget", { amountMinor: 0, budgetMinor: 0 }), null);
  assert.match(
    validateWorkspaceMoney("budget", { amountMinor: -1, budgetMinor: 0 }) ?? "",
    /non-negative/,
  );
  assert.match(
    validateWorkspaceMoney("budget", { amountMinor: 10.5, budgetMinor: 0 }) ?? "",
    /whole|integer|minor-unit/,
  );
  assert.match(
    validateWorkspaceMoney("budget", { amountMinor: 100, budgetMinor: 100, price: 1 }) ?? "",
    /cannot be stored/,
  );
});

test("leaves unrelated records unchanged when no validation applies", () => {
  const record = { title: "Confirm photographer", due: "2026-10-12" };
  const snapshot = structuredClone(record);

  assert.equal(validateWorkspaceRecord("tasks", record), null);
  assert.deepEqual(record, snapshot);
});
