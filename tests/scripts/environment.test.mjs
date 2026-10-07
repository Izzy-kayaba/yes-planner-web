import assert from "node:assert/strict";
import test from "node:test";
import { parseScriptArguments } from "../../scripts/environment.mjs";

test("requires an explicit development or production database target", () => {
  assert.throws(() => parseScriptArguments([]), /Choose the database target/);
  assert.deepEqual(parseScriptArguments(["--env", "development"]), {
    environment: "development",
    positional: [],
  });
  assert.deepEqual(parseScriptArguments(["admin@example.com", "--env=production"]), {
    environment: "production",
    positional: ["admin@example.com"],
  });
});

test("rejects unsupported and repeated environment selections", () => {
  assert.throws(() => parseScriptArguments(["--env", "preview"]), /Choose an environment/);
  assert.throws(
    () => parseScriptArguments(["--env", "development", "--env", "production"]),
    /exactly one environment/,
  );
});
