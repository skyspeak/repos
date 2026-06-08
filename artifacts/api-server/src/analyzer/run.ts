/**
 * Analysis pipeline orchestrator
 *
 * Runs 7 steps sequentially. Each step focuses on a specific category
 * so the LLM can be precise rather than trying to do everything at once.
 *
 * Steps:
 *   01-identify      — company context, business model, scale
 *   02-revenue       — revenue, ARR, backlog, guidance
 *   03-profitability — margins, operating expenses, EPS
 *   04-growth        — customers, retention, NRR, CAC
 *   05-balance-sheet — cash, debt, FCF, burn rate
 *   06-risk          — headwinds, concentration, competitive threats
 *   07-summary       — synthesizes all items into a beginner-friendly verdict
 */

import { logger } from "../lib/logger";
import type { PipelineContext, AnalysisResult, ChecklistItem } from "./types";
import { runStep01 } from "./steps/01-identify";
import { runStep02 } from "./steps/02-revenue";
import { runStep03 } from "./steps/03-profitability";
import { runStep04 } from "./steps/04-growth";
import { runStep05 } from "./steps/05-balance-sheet";
import { runStep06 } from "./steps/06-risk";
import { runStep07 } from "./steps/07-summary";

function docTypeLabel(
  documentType: PipelineContext["documentType"],
): string {
  switch (documentType) {
    case "earnings_transcript":
      return "Earnings Call Transcript";
    case "earnings_presentation":
      return "Earnings Presentation";
    case "s1_filing":
      return "S-1 Filing (IPO document)";
  }
}

function sanitizeItems(raw: unknown[]): ChecklistItem[] {
  const validVerdicts = new Set(["positive", "negative", "neutral", "mixed"]);
  return raw
    .filter((item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
    )
    .filter(
      (item) =>
        typeof item.metric === "string" &&
        typeof item.category === "string" &&
        typeof item.whatItIs === "string" &&
        typeof item.whatItMeans === "string" &&
        validVerdicts.has(item.verdict as string),
    )
    .map((item) => ({
      metric: item.metric as string,
      category: item.category as string,
      whatItIs: item.whatItIs as string,
      whatItMeans: item.whatItMeans as string,
      verdict: item.verdict as ChecklistItem["verdict"],
      verdictReason:
        typeof item.verdictReason === "string" ? item.verdictReason : "",
      value: typeof item.value === "string" ? item.value : null,
      yoyChange: typeof item.yoyChange === "string" ? item.yoyChange : null,
      qoqChange: typeof item.qoqChange === "string" ? item.qoqChange : null,
      flags: typeof item.flags === "string" ? item.flags : null,
    }));
}

export async function runAnalysis(
  documentText: string,
  documentType: PipelineContext["documentType"],
  companyNameHint?: string | null,
): Promise<AnalysisResult> {
  const ctx: PipelineContext = {
    documentText,
    documentType,
    documentTypeLabel: docTypeLabel(documentType),
    companyName: companyNameHint ?? "the company",
    fiscalPeriod: "N/A",
  };

  // Step 01 — Identify (updates context with real company name + period)
  logger.info({ step: "01-identify" }, "Analyzer step starting");
  const step01 = await runStep01(ctx);
  ctx.companyName = companyNameHint || step01.companyName;
  ctx.fiscalPeriod = step01.fiscalPeriod;
  logger.info({ step: "01-identify", items: step01.items.length }, "Analyzer step done");

  // Steps 02–06 run sequentially, each focused on a category
  const steps = [
    { name: "02-revenue", fn: () => runStep02(ctx) },
    { name: "03-profitability", fn: () => runStep03(ctx) },
    { name: "04-growth", fn: () => runStep04(ctx) },
    { name: "05-balance-sheet", fn: () => runStep05(ctx) },
    { name: "06-risk", fn: () => runStep06(ctx) },
  ] as const;

  const allItems: ChecklistItem[] = sanitizeItems(step01.items);

  for (const step of steps) {
    logger.info({ step: step.name }, "Analyzer step starting");
    const result = await step.fn();
    const clean = sanitizeItems(result.items);
    allItems.push(...clean);
    logger.info({ step: step.name, items: clean.length }, "Analyzer step done");
  }

  // Step 07 — Summary (synthesizes everything)
  logger.info({ step: "07-summary", totalItems: allItems.length }, "Analyzer step starting");
  const summary = await runStep07(ctx, allItems);
  logger.info({ step: "07-summary" }, "Analyzer step done");

  return {
    companyName: ctx.companyName,
    checklist: allItems,
    summary: summary.summary,
    overallVerdict: summary.overallVerdict,
    keyStrengths: summary.keyStrengths,
    keyRisks: summary.keyRisks,
  };
}
