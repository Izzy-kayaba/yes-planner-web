import assert from "node:assert/strict";
import test from "node:test";
import { isSyntheticFacebookEmail, mapFacebookProfile } from "../../lib/auth/facebook.ts";

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
  assert.equal(isSyntheticFacebookEmail("123@facebook.yesplanner.invalid"), true);
});

test("does not classify a real Facebook email as synthetic", () => {
  assert.equal(isSyntheticFacebookEmail("alex@example.com"), false);
});

test("rejects a Facebook response without an id", () => {
  assert.equal(mapFacebookProfile({ name: "Alex" }), null);
});
