/**
 * Step 04 — Growth & Efficiency
 *
 * Extracts customer/user growth metrics, retention, and efficiency ratios:
 * DAU/MAU, net new customers, NRR/NDR, churn, LTV, CAC, magic number,
 * Rule of 40, revenue growth rate.
 */

import { llm, getLLMModel } from "../client";
import { SYSTEM_PROMPT } from "../prompts/system";
import { ITEM_FORMAT } from "../prompts/item-format";
import type { PipelineContext, StepResult } from "../types";

const STEP_PROMPT = (ctx: PipelineContext) => `
You are reading a ${ctx.documentTypeLabel} for ${ctx.companyName} (${ctx.fiscalPeriod}).

TASK — STEP 4 of 7: Extract GROWTH and EFFICIENCY metrics only.

Look for and extract checklist items covering:
- Customer / user count and growth (total customers, DAU, MAU, paying users)
- Net Revenue Retention (NRR) or Net Dollar Retention (NDR)
- Gross and net churn rates
- Customer Lifetime Value (LTV) or cohort data
- Customer Acquisition Cost (CAC) or sales efficiency
- Rule of 40 score (revenue growth % + FCF margin %)
- Magic number or sales efficiency ratio
- Product engagement metrics (if discussed)
- Geographic expansion, new market entry
- Revenue growth rate as a standalone item if not covered in Step 2

Only include items actually mentioned. Return 0 to 6 items.

${ITEM_FORMAT}

Return ONLY:
{ "items": [...] }
`;

export async function runStep04(ctx: PipelineContext): Promise<StepResult> {
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
