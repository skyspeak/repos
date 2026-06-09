/**
 * Re-export categories-data.json (e.g. after manual edits or format normalization).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataPath = path.join(
  root,
  "artifacts/heatmap/src/data/categories-data.json",
);

const categories = JSON.parse(readFileSync(dataPath, "utf8"));
writeFileSync(dataPath, `${JSON.stringify(categories, null, 2)}\n`, "utf8");
console.log(`Normalized ${categories.length} categories in ${dataPath}`);
