/**
 * Step 06 — Risk & Concerns
 *
 * Extracts risk factors, headwinds, competitive threats, and
 * management warnings: macro risks, customer concentration,
 * regulatory issues, litigation, and anything management
 * flagged as a concern or headwind.
 */

import { llm, getLLMModel } from "../client";
import { SYSTEM_PROMPT } from "../prompts/system";
import { ITEM_FORMAT } from "../prompts/item-format";
import type { PipelineContext, StepResult } from "../types";

const STEP_PROMPT = (ctx: PipelineContext) => `
You are reading a ${ctx.documentTypeLabel} for ${ctx.companyName} (${ctx.fiscalPeriod}).

TASK — STEP 6 of 7: Extract RISK factors and CONCERNS only.

Look for and extract checklist items covering:
- Macroeconomic headwinds (inflation, FX, interest rates, slowdown)
- Customer concentration risk (top customers as % of revenue)
- Competitive pressure or market share loss
- Regulatory, legal, or compliance risk
- Execution risk (new product delays, integration challenges)
- Management warnings or soft guidance (phrases like "we expect headwinds", "remain cautious")
- Any deceleration trend in key metrics
- Geopolitical exposure

For each risk, the verdict should be "negative" or "mixed". Be direct — a beginner investor needs to know what could go wrong.
Return 0 to 6 items.

${ITEM_FORMAT}

Return ONLY:
{ "items": [...] }
`;

export async function runStep06(ctx: PipelineContext): Promise<StepResult> {
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
  return { items: Array.isArray(parsed.items) ? parsed.items : [] };
}
