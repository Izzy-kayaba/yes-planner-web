import fs from "node:fs";
import path from "node:path";

function readEnvironment(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
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

export function loadProjectEnvironment() {
  const root = process.cwd();
  const production = process.env.NODE_ENV === "production";
  const candidates = production
    ? [".env.production.local", ".env.production", ".env.local", ".env"]
    : [".env.local", ".env.development.local", ".env.development", ".env"];
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

export function databaseEnvironment() {
  const { production } = loadProjectEnvironment();
  const prefix = production ? "MONGODB_PRODUCTION" : "MONGODB_DEVELOPMENT";
  const uri = process.env[`${prefix}_URI`] ?? process.env.MONGODB_URI;
  const databaseName = process.env[`${prefix}_DATABASE`] ?? process.env.MONGODB_DATABASE;
  if (!uri || !databaseName) {
    throw new Error(
      `MongoDB configuration is missing. Set ${prefix}_URI and ${prefix}_DATABASE in .env.local (development) or .env.production (production).`,
    );
  }
  return { uri, databaseName };
}
