import assert from "node:assert/strict";
import test from "node:test";
import { mapFacebookProfile } from "../../lib/auth/facebook.ts";

test("maps a Facebook profile with an unverified email safely", () => {
  assert.deepEqual(mapFacebookProfile({ id: "123", name: "Alex", email: "Alex@Example.com" }), {
    id: "123",
    name: "Alex",
    email: "alex@example.com",
    emailVerified: false,
  });
});

test("uses a non-deliverable identity when Facebook omits email", () => {
  assert.deepEqual(mapFacebookProfile({ id: "123", name: "Alex" }), {
    id: "123",
    name: "Alex",
    email: "123@facebook.yesplanner.invalid",
    emailVerified: false,
  });
});

test("rejects a Facebook response without an id", () => {
  assert.equal(mapFacebookProfile({ name: "Alex" }), null);
});
