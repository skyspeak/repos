/**
 * Step 02 — Revenue
 *
 * Extracts all revenue-related metrics: total revenue, revenue breakdown
 * by segment/product/geography, ARR, MRR, backlog, bookings, RPO, etc.
 * For S-1s this often covers historical revenue trends and unit economics.
 */

import { llm, getLLMModel } from "../client";
import { SYSTEM_PROMPT } from "../prompts/system";
import { ITEM_FORMAT } from "../prompts/item-format";
import type { PipelineContext, StepResult } from "../types";

const STEP_PROMPT = (ctx: PipelineContext) => `
You are reading a ${ctx.documentTypeLabel} for ${ctx.companyName} (${ctx.fiscalPeriod}).

TASK — STEP 2 of 7: Extract REVENUE metrics only.

Look for and extract checklist items covering:
- Total revenue (and YoY / QoQ change)
- Revenue by segment, product line, or geography (if broken out)
- Recurring revenue: ARR, MRR, subscription revenue, SaaS metrics
- Backlog, RPO (remaining performance obligations), bookings
- Revenue per customer, ARPU, ARPA
- Any revenue guidance for upcoming periods

Only include items that are actually mentioned. If revenue is not discussed, return an empty items array.
Return 0 to 6 items.

${ITEM_FORMAT}

Return ONLY:
{ "items": [...] }
`;

export async function runStep02(ctx: PipelineContext): Promise<StepResult> {
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
