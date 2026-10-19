// Purpose: implements tests/scripts/environment.test.mjs for the Yes Planner web application.
import assert from "node:assert/strict";
import test from "node:test";
import { loadEnvironment, parseScriptArguments } from "../../scripts/environment.mjs";

test("loads the selected staging environment without referencing another environment", () => {
  assert.equal(loadEnvironment("staging").environment, "staging");
});

test("requires an explicit database target", () => {
  assert.throws(() => parseScriptArguments([]), /Choose the database target/);
  assert.deepEqual(parseScriptArguments(["--env", "development"]), {
    environment: "development",
    positional: [],
  });
  assert.deepEqual(parseScriptArguments(["admin@example.com", "--env=production"]), {
    environment: "production",
    positional: ["admin@example.com"],
  });
  assert.deepEqual(parseScriptArguments(["--env", "staging"]), {
    environment: "staging",
    positional: [],
  });
});

test("rejects unsupported and repeated environment selections", () => {
  assert.throws(() => parseScriptArguments(["--env", "preview"]), /Choose an environment/);
  assert.throws(
    () => parseScriptArguments(["--env", "development", "--env", "production"]),
    /exactly one environment/,
  );
});
