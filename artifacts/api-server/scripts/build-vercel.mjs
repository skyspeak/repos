/**
 * Vercel shim when Root Directory is `artifacts/api-server`.
 * Delegates to the monorepo build at the repository root.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const script = path.join(repoRoot, "scripts/build-vercel.mjs");

const result = spawnSync(process.execPath, [script], {
  stdio: "inherit",
  cwd: repoRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
