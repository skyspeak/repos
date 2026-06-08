/**
 * Step 03 — Profitability
 *
 * Extracts all margins, earnings, and cost structure metrics:
 * gross margin, operating margin, net income/loss, EBITDA, EPS,
 * cost of revenue, operating expenses, R&D, S&M, G&A spend.
 */

import { llm, getLLMModel } from "../client";
import { SYSTEM_PROMPT } from "../prompts/system";
import { ITEM_FORMAT } from "../prompts/item-format";
import type { PipelineContext, StepResult } from "../types";

const STEP_PROMPT = (ctx: PipelineContext) => `
You are reading a ${ctx.documentTypeLabel} for ${ctx.companyName} (${ctx.fiscalPeriod}).

TASK — STEP 3 of 7: Extract PROFITABILITY and COST metrics only.

Look for and extract checklist items covering:
- Gross profit and gross margin %
- Operating income/loss and operating margin %
- Net income/loss and net margin %
- EBITDA or Adjusted EBITDA
- Earnings per share (EPS) — GAAP and Non-GAAP
- Cost of revenue / cost of goods sold (COGS)
- Operating expenses breakdown: R&D, Sales & Marketing, G&A
- Stock-based compensation (SBC) as a % of revenue
- Path to profitability commentary (if loss-making)

Only include items that are actually mentioned. Return 0 to 7 items.

${ITEM_FORMAT}

Return ONLY:
{ "items": [...] }
`;

export async function runStep03(ctx: PipelineContext): Promise<StepResult> {
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
