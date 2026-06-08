/**
 * Step 05 — Balance Sheet & Cash Flow
 *
 * Extracts liquidity, capital structure, and cash flow metrics:
 * cash & equivalents, debt, free cash flow, operating cash flow,
 * capex, share buybacks, dividends, burn rate, runway.
 */

import { llm, getLLMModel } from "../client";
import { SYSTEM_PROMPT } from "../prompts/system";
import { ITEM_FORMAT } from "../prompts/item-format";
import type { PipelineContext, StepResult } from "../types";

const STEP_PROMPT = (ctx: PipelineContext) => `
You are reading a ${ctx.documentTypeLabel} for ${ctx.companyName} (${ctx.fiscalPeriod}).

TASK — STEP 5 of 7: Extract BALANCE SHEET and CASH FLOW metrics only.

Look for and extract checklist items covering:
- Cash, cash equivalents, and short-term investments (total liquidity)
- Total debt, long-term debt, or credit facilities
- Free Cash Flow (FCF) and FCF margin %
- Operating cash flow
- Capital expenditures (capex)
- Net cash position (cash minus debt)
- Burn rate and cash runway (important for pre-profit companies)
- Share buybacks or dividend payments
- Dilution from stock-based compensation

Only include items that are actually mentioned. Return 0 to 5 items.

${ITEM_FORMAT}

Return ONLY:
{ "items": [...] }
`;

export async function runStep05(ctx: PipelineContext): Promise<StepResult> {
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
