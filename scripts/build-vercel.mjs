import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

globalThis.require = createRequire(import.meta.url);

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const heatmapDir = path.join(rootDir, "artifacts/heatmap");

async function buildApi() {
  const apiDir = path.join(rootDir, "api");
  await rm(apiDir, { recursive: true, force: true });
  await mkdir(apiDir, { recursive: true });

  await esbuild({
    entryPoints: [path.join(rootDir, "artifacts/api-server/src/vercel.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.join(apiDir, "index.js"),
    logLevel: "info",
    external: ["pg-native"],
    banner: {
      js: `const { createRequire: __cr } = require('module');
const __req = __cr(__filename);
globalThis.require = __req;`,
    },
  });

  console.log("✓ API bundled to api/index.js");
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
  throw new Error("vite not found — run pnpm install first");
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

await buildApi();
buildFrontend();
console.log("✓ Deploy build complete");
