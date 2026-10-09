import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npm, ["run", "build"], {
  env: { ...process.env, NEXT_PUBLIC_DATA_SOURCE: "demo" },
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exitCode = result.status ?? 1;
