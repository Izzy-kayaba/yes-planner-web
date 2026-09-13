import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "components", "features", "hooks", "lib", "scripts", "types", "docs"];
const checkedExtensions = new Set([".css", ".md", ".mjs", ".ts", ".tsx"]);
const violations = [];

async function inspect(relativePath) {
  let entries;
  try {
    entries = await readdir(relativePath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      await inspect(child);
    } else if (checkedExtensions.has(path.extname(entry.name))) {
      const lineCount = (await readFile(child, "utf8")).split(/\r?\n/).length;
      if (lineCount > 1000) violations.push(`${child}: ${lineCount} lines`);
    }
  }
}

for (const root of roots) await inspect(root);

if (violations.length) {
  console.error(`Files over the 1,000-line limit:\n${violations.join("\n")}`);
  process.exit(1);
}

console.log("All maintained frontend files are within the 1,000-line limit.");
