import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import OpenAI from "openai";
import { computeComposite } from "./composite";
import { fetchCategoryNews, newsToSignalContext } from "./free-news";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataPath = path.join(
  root,
  "artifacts/heatmap/src/data/categories-data.json",
);

const SignalSchema = z.object({
  date: z.string(),
  type: z.enum(["funding", "mna", "product", "leadership"]),
  description: z.string(),
  sourceUrl: z.string(),
});

const RefreshSchema = z.object({
  scores: z.object({
    disruptionRisk: z.number().min(1).max(10),
    timeHorizon: z.number().min(1).max(10),
    incumbentMoat: z.number().min(1).max(10),
    aiNativeReadiness: z.number().min(1).max(10),
    unstructuredDensity: z.number().min(1).max(10),
    agentSurfaceArea: z.number().min(1).max(10),
  }),
  supplyChainVulnerability: z.number().min(1).max(10),
  startupOpportunity: z.number().min(1).max(10),
  thesis: z.string().min(40),
  signals: z.array(SignalSchema).min(1).max(5),
});

type CategoryRecord = {
  id: string;
  name: string;
  bucket: string;
  scores: z.infer<typeof RefreshSchema>["scores"];
  supplyChainVulnerability: number;
  startupOpportunity: number;
  composite: number;
  thesis: string;
  signals: z.infer<typeof SignalSchema>[];
  incumbents: { name: string }[];
  challengers: { name: string }[];
  lastUpdated: string;
  [key: string]: unknown;
};

function getLLMClient(): OpenAI {
  const geminiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    return new OpenAI({
      apiKey: geminiKey,
      baseURL:
        process.env.GEMINI_BASE_URL ??
        "https://generativelanguage.googleapis.com/v1beta/openai",
    });
  }

  const openRouterKey =
    process.env.OPENROUTER_API_KEY ?? process.env.LLM_API_KEY;
  if (openRouterKey) {
    return new OpenAI({
      apiKey: openRouterKey,
      baseURL:
        process.env.OPENROUTER_BASE_URL ??
        process.env.LLM_BASE_URL ??
        "https://openrouter.ai/api/v1",
    });
  }

  throw new Error(
    "Set GEMINI_API_KEY or OPENROUTER_API_KEY to regenerate categories.",
  );
}

function getModel(client: OpenAI): string {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  }
  return process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet";
}

function buildPrompt(
  category: CategoryRecord,
  asOf: string,
  newsContext: string,
): string {
  return `You are an expert venture analyst updating an AI disruption heatmap category.

Category: ${category.name} (${category.id})
Sector bucket: ${category.bucket}
As-of date: ${asOf}

Current incumbents: ${category.incumbents.map((i) => i.name).join(", ")}
Current challengers: ${category.challengers.map((c) => c.name).join(", ")}

Current scores (1–10):
- disruptionRisk: ${category.scores.disruptionRisk}
- timeHorizon: ${category.scores.timeHorizon} (lower = sooner disruption)
- incumbentMoat: ${category.scores.incumbentMoat}
- aiNativeReadiness: ${category.scores.aiNativeReadiness}
- unstructuredDensity: ${category.scores.unstructuredDensity}
- agentSurfaceArea: ${category.scores.agentSurfaceArea}
- supplyChainVulnerability: ${category.supplyChainVulnerability}
- startupOpportunity: ${category.startupOpportunity}

Current thesis: ${category.thesis}

Recent signals:
${category.signals.map((s) => `- [${s.date}] ${s.type}: ${s.description}`).join("\n")}

Recent headlines (Google News RSS, free — use these for signals with real URLs):
${newsContext}

Task: Refresh this category for the week of ${asOf}. Use the RSS headlines above where relevant. Update scores modestly (typically ±0.3–1.0 unless a major event warrants more). Rewrite the thesis in 2–4 sentences with specific company names and numbers. Provide 2–4 signals from the last 90 days with real source URLs from the headlines when possible.

Return ONLY valid JSON matching this schema:
{
  "scores": {
    "disruptionRisk": number,
    "timeHorizon": number,
    "incumbentMoat": number,
    "aiNativeReadiness": number,
    "unstructuredDensity": number,
    "agentSurfaceArea": number
  },
  "supplyChainVulnerability": number,
  "startupOpportunity": number,
  "thesis": string,
  "signals": [
    { "date": "YYYY-MM", "type": "funding"|"mna"|"product"|"leadership", "description": string, "sourceUrl": string }
  ]
}`;
}

async function refreshCategory(
  client: OpenAI,
  model: string,
  category: CategoryRecord,
  asOf: string,
  newsContext: string,
): Promise<z.infer<typeof RefreshSchema>> {
  const response = await client.chat.completions.create({
    model,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You produce precise JSON for an AI industry disruption database. Be specific with company names, dates, and dollar amounts. Prefer source URLs from the provided RSS headlines.",
      },
      { role: "user", content: buildPrompt(category, asOf, newsContext) },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error(`Empty LLM response for ${category.id}`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON for ${category.id}: ${raw.slice(0, 200)}`);
  }

  return RefreshSchema.parse(parsed);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let id: string | undefined;
  let limit: number | undefined;
  let delayMs = 2000;

  for (const arg of args) {
    if (arg.startsWith("--id=")) id = arg.slice(5);
    else if (arg.startsWith("--limit=")) limit = Number(arg.slice(8));
    else if (arg.startsWith("--delay-ms=")) delayMs = Number(arg.slice(11));
  }

  return { id, limit, delayMs };
}

async function main() {
  const { id, limit, delayMs } = parseArgs();
  const asOf = new Date().toISOString().slice(0, 10);
  const categories = JSON.parse(readFileSync(dataPath, "utf8")) as CategoryRecord[];

  let targets = categories;
  if (id) {
    targets = categories.filter((c) => c.id === id);
    if (targets.length === 0) {
      throw new Error(`Category not found: ${id}`);
    }
  } else if (limit) {
    targets = categories.slice(0, limit);
  }

  const client = getLLMClient();
  const model = getModel(client);
  console.log(
    `Regenerating ${targets.length} categor${targets.length === 1 ? "y" : "ies"} with ${model} (as-of ${asOf})…`,
  );

  const byId = new Map(categories.map((c) => [c.id, c]));
  let updated = 0;

  for (const target of targets) {
    process.stdout.write(`  ${target.id}… `);
    try {
      const companies = [
        ...target.incumbents.map((i) => i.name),
        ...target.challengers.map((c) => c.name),
      ];
      const news = await fetchCategoryNews(target.name, companies);
      const newsContext = newsToSignalContext(news);

      const refresh = await refreshCategory(
        client,
        model,
        target,
        asOf,
        newsContext,
      );
      const composite = computeComposite(
        refresh.scores,
        refresh.startupOpportunity,
      );

      const current = byId.get(target.id)!;
      Object.assign(current, {
        scores: refresh.scores,
        supplyChainVulnerability: refresh.supplyChainVulnerability,
        startupOpportunity: refresh.startupOpportunity,
        composite,
        thesis: refresh.thesis,
        signals: refresh.signals,
        lastUpdated: asOf,
      });
      updated++;
      console.log(`ok (composite ${composite})`);
    } catch (err) {
      console.log("failed");
      console.error(err);
      process.exitCode = 1;
    }

    if (delayMs > 0 && target !== targets[targets.length - 1]) {
      await sleep(delayMs);
    }
  }

  writeFileSync(
    dataPath,
    `${JSON.stringify(categories, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${updated} update(s) → ${dataPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
