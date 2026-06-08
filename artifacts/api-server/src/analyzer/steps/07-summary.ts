/**
 * Step 07 — Summary
 *
 * Final step. Takes all checklist items collected so far and produces:
 * - A plain-English summary for a beginner
 * - An overall verdict
 * - 3-5 key strengths
 * - 3-5 key risks
 *
 * This step DOES NOT produce more checklist items — it synthesizes.
 */

import { llm, getLLMModel } from "../client";
import { SYSTEM_PROMPT } from "../prompts/system";
import type { PipelineContext, ChecklistItem, SummaryResult } from "../types";

const STEP_PROMPT = (
  ctx: PipelineContext,
  items: ChecklistItem[],
) => `
You are reading a ${ctx.documentTypeLabel} for ${ctx.companyName} (${ctx.fiscalPeriod}).

TASK — STEP 7 of 7: Write an overall summary for a beginner investor.

Here are all the checklist items extracted so far:
${JSON.stringify(items, null, 2)}

Based on all of the above, produce:

1. "summary" — 3-5 sentences in plain English for someone who has never invested before.
   Tell them: what kind of company this is, how it is performing right now, and the 1-2 things
   they should pay the most attention to. Be concrete. Reference actual numbers.

2. "overallVerdict" — one of: "positive" | "negative" | "neutral" | "mixed"
   Use "positive" only if the weight of evidence clearly points that way.
   Use "mixed" when there are meaningful positives AND meaningful risks.
   Be honest.

3. "keyStrengths" — array of 3 to 5 strings. Each should be a specific, concrete strength
   backed by something from the document. No vague statements.

4. "keyRisks" — array of 3 to 5 strings. Each should be a specific, concrete risk.
   A beginner needs to know what could go wrong.

Return ONLY this JSON:
{
  "summary": "...",
  "overallVerdict": "...",
  "keyStrengths": [...],
  "keyRisks": [...]
}
`;

export async function runStep07(
  ctx: PipelineContext,
  allItems: ChecklistItem[],
): Promise<SummaryResult> {
  const response = await llm.chat.completions.create({
    model: getLLMModel(),
    max_completion_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: STEP_PROMPT(ctx, allItems) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    summary: parsed.summary ?? "",
    overallVerdict: parsed.overallVerdict ?? "neutral",
    keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : [],
    keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : [],
  };
}
