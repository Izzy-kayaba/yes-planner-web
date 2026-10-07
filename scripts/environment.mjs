import fs from "node:fs";
import path from "node:path";

function readEnvironment(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  // Read simple KEY=value files without making database scripts depend on app startup.
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

// Read only the files for the environment the operator selected. This prevents
// a missing production setting from silently falling back to local credentials.
function loadEnvironment(environment) {
  const root = process.cwd();
  const production = environment === "production";
  const candidates = production
    ? [".env.production.local", ".env.production"]
    : [".env.development.local", ".env.local", ".env.development", ".env"];
  for (const fileName of candidates) {
    const values = readEnvironment(path.resolve(root, fileName));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
  return {
    production,
    environmentFiles: candidates.filter((file) => fs.existsSync(path.resolve(root, file))),
  };
}

// Remove --env from the command arguments so every database script uses the
// same explicit target-selection rules and positional argument handling.
export function parseScriptArguments(args) {
  let environment;
  let environmentWasSelected = false;
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--env") {
      if (environmentWasSelected || index + 1 >= args.length) {
        throw new Error(
          "Select exactly one environment with --env development or --env production.",
        );
      }
      environment = args[index + 1];
      index += 1;
      environmentWasSelected = true;
    } else if (argument.startsWith("--env=")) {
      if (environmentWasSelected) {
        throw new Error(
          "Select exactly one environment with --env development or --env production.",
        );
      }
      environment = argument.slice("--env=".length);
      environmentWasSelected = true;
    } else {
      positional.push(argument);
    }
  }

  if (!environmentWasSelected) {
    throw new Error("Choose the database target with --env development or --env production.");
  }
  if (environment !== "development" && environment !== "production") {
    throw new Error("Choose an environment with --env development or --env production.");
  }

  return { environment, positional };
}

// Select the database only from the chosen environment's dedicated variables.
export function databaseEnvironment(environment) {
  if (environment !== "development" && environment !== "production") {
    throw new Error("Choose an environment with --env development or --env production.");
  }
  loadEnvironment(environment);
  const prefix = environment === "production" ? "MONGODB_PRODUCTION" : "MONGODB_DEVELOPMENT";
  const uri = process.env[`${prefix}_URI`];
  const databaseName = process.env[`${prefix}_DATABASE`];
  if (!uri || !databaseName) {
    throw new Error(
      `MongoDB configuration is missing. Set ${prefix}_URI and ${prefix}_DATABASE in the selected environment file or shell.`,
    );
  }
  return { uri, databaseName, environment };
}
