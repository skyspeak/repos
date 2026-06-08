/**
 * Step 01 — Identify
 *
 * Extracts: company name, fiscal period, and any high-level "identity"
 * facts about the company (what it does, how big it is, what segment it's in).
 * Also produces the first set of checklist items covering top-line context.
 */

import { llm, getLLMModel } from "../client";
import { SYSTEM_PROMPT } from "../prompts/system";
import { ITEM_FORMAT } from "../prompts/item-format";
import type { PipelineContext, StepResult } from "../types";

const STEP_PROMPT = (ctx: Pick<PipelineContext, "documentTypeLabel">) => `
You are reading a ${ctx.documentTypeLabel}.

TASK — STEP 1 of 7: Identify the company and extract company-level context items.

Extract:
1. "companyName" — the company's name as it appears in the document
2. "fiscalPeriod" — the time period covered (e.g. "Q4 2024", "FY 2024", "IPO filing 2024"), or "N/A" if unclear
3. "items" — 2 to 4 checklist items covering broad company context:
   - What the company does / its business model
   - Its scale (number of employees, countries, customers — whatever is mentioned)
   - Any notable milestones or major headlines from this document

${ITEM_FORMAT}

Return ONLY this JSON structure:
{
  "companyName": "...",
  "fiscalPeriod": "...",
  "items": [...]
}
`;

export async function runStep01(
  ctx: PipelineContext,
): Promise<{ companyName: string; fiscalPeriod: string } & StepResult> {
  const response = await llm.chat.completions.create({
    model: getLLMModel(),
    max_completion_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${STEP_PROMPT(ctx)}\n\nDOCUMENT:\n${ctx.documentText.slice(0, 80000)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    companyName: parsed.companyName ?? "Unknown Company",
    fiscalPeriod: parsed.fiscalPeriod ?? "N/A",
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}
