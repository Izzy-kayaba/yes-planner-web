import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const stages = [
  { name: "Static, authorization, API and build suites", script: "validate" },
  { name: "Production-like browser suite", script: "test:e2e" },
];
const results = [];

for (const stage of stages) {
  console.log(`\n=== ${stage.name} ===`);
  const result = spawnSync(npm, ["run", stage.script], {
    env: { ...process.env, NEXT_PUBLIC_DATA_SOURCE: "demo" },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  results.push({ name: stage.name, passed: result.status === 0 });
}

console.log("\n=== Test suite results ===");
for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"}  ${result.name}`);
}
process.exitCode = results.every((result) => result.passed) ? 0 : 1;
