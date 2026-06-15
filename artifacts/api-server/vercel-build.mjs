/**
 * Vercel production build — lives in artifacts/api-server so it is always
 * found when Vercel Root Directory is `artifacts/api-server`.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

globalThis.require = createRequire(import.meta.url);

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "../..");
const heatmapDir = path.join(rootDir, "artifacts/heatmap");

const apiBundles = [
  path.join(rootDir, "api/bundle.js"),
  path.join(here, "api/bundle.js"),
];

async function buildApi() {
  for (const outfile of apiBundles) {
    await rm(outfile, { force: true });
    await mkdir(path.dirname(outfile), { recursive: true });
  }

  await esbuild({
    entryPoints: [path.join(here, "src/vercel.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: apiBundles[0],
    logLevel: "info",
    external: ["pg-native"],
    banner: {
      js: `const { createRequire: __cr } = require('module');
const __req = __cr(__filename);
globalThis.require = __req;`,
    },
  });

  const { copyFile } = await import("node:fs/promises");
  await copyFile(apiBundles[0], apiBundles[1]);
  console.log("✓ API bundled to api/bundle.js");
}

function findVite() {
  const candidates = [
    path.join(heatmapDir, "node_modules", "vite", "bin", "vite.js"),
    path.join(rootDir, "node_modules", "vite", "bin", "vite.js"),
    path.join(heatmapDir, "node_modules", ".bin", "vite"),
    path.join(rootDir, "node_modules", ".bin", "vite"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("vite not found — run pnpm install from the repository root");
}

function buildFrontend() {
  const viteBin = findVite();
  execSync(`node "${viteBin}" build --config vite.config.ts`, {
    cwd: heatmapDir,
    stdio: "inherit",
    env: {
      ...process.env,
      BASE_PATH: "/",
      NODE_ENV: "production",
    },
  });
  console.log("✓ Frontend built to artifacts/heatmap/dist/public");
}

console.log(`Vercel build (repo root: ${rootDir})`);
await buildApi();
buildFrontend();
console.log("✓ Deploy build complete");
