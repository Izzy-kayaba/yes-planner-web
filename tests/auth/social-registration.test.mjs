import assert from "node:assert/strict";
import test from "node:test";
import { isExistingGoogleRegistration } from "../../lib/auth/social-registration.ts";

test("recognizes an older account during Google registration", () => {
  assert.equal(isExistingGoogleRegistration("register:google:2000", new Date(1000)), true);
});

test("allows a Google account created by the current registration", () => {
  assert.equal(isExistingGoogleRegistration("register:google:1000", new Date(2000)), false);
});

test("does not apply Google duplicate handling to login or Instagram", () => {
  assert.equal(isExistingGoogleRegistration("login:google:2000", new Date(1000)), false);
  assert.equal(isExistingGoogleRegistration("register:instagram:2000", new Date(1000)), false);
});
