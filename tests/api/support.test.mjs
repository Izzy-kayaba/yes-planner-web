import assert from "node:assert/strict";
import test from "node:test";
import {
  manageableSupportStatuses,
  supportRequestSchema,
  supportStatusSchema,
} from "../../lib/support/contracts.ts";

test("accepts a valid support request and normalizes surrounding whitespace", () => {
  const result = supportRequestSchema.safeParse({
    category: "Technical Problem",
    subject: "  Sign-in page is blank  ",
    description: "  The sign-in page stays blank after I submit my credentials.  ",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.subject, "Sign-in page is blank");
  assert.equal(
    result.data.description,
    "The sign-in page stays blank after I submit my credentials.",
  );
});

test("rejects unsupported categories and short descriptions", () => {
  assert.equal(
    supportRequestSchema.safeParse({
      category: "Other Service",
      subject: "Need help",
      description: "This is a long enough description.",
    }).success,
    false,
  );
  assert.equal(
    supportRequestSchema.safeParse({
      category: "Account",
      subject: "Help me",
      description: "Short",
    }).success,
    false,
  );
});

test("support staff can select only actionable statuses, never fabricate a new request", () => {
  assert.equal(manageableSupportStatuses.includes("Resolved"), true);
  assert.equal(
    supportStatusSchema.safeParse({ requestId: "64a000000000000000000001", status: "Resolved" })
      .success,
    true,
  );
  assert.equal(
    supportStatusSchema.safeParse({ requestId: "64a000000000000000000001", status: "New" }).success,
    false,
  );
});
