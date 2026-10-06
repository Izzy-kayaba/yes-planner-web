import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mapInstagramProfile } from "../../lib/auth/instagram.ts";

const fixture = JSON.parse(
  await readFile(new URL("../fixtures/instagram-profile.json", import.meta.url), "utf8"),
);

test("maps the Instagram profile fixture to a Better Auth identity", () => {
  assert.deepEqual(mapInstagramProfile(fixture), {
    id: fixture.id,
    name: fixture.username,
    email: `${fixture.id}@instagram.yesplanner.invalid`,
    emailVerified: false,
  });
});

test("uses a stable fallback name when Instagram omits the username", () => {
  assert.equal(mapInstagramProfile({ id: fixture.id })?.name, `instagram-${fixture.id}`);
});

test("rejects an Instagram response without a stable account id", () => {
  assert.equal(mapInstagramProfile({ username: fixture.username }), null);
});
