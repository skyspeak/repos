/**
 * Shared types for the step-by-step analyzer pipeline.
 */

export interface ChecklistItem {
  metric: string;
  category: string;
  whatItIs: string;
  whatItMeans: string;
  verdict: "positive" | "negative" | "neutral" | "mixed";
  verdictReason: string;
  value: string | null;
  yoyChange: string | null;
  qoqChange: string | null;
  flags: string | null;
}

/** Context built up as steps run sequentially */
export interface PipelineContext {
  documentText: string;
  documentType: "earnings_transcript" | "earnings_presentation" | "s1_filing";
  documentTypeLabel: string;
  /** Filled in by step 01 */
  companyName: string;
  /** Filled in by step 01 */
  fiscalPeriod: string;
}

export interface StepResult {
  items: ChecklistItem[];
}

export interface SummaryResult {
  summary: string;
  overallVerdict: "positive" | "negative" | "neutral" | "mixed";
  keyStrengths: string[];
  keyRisks: string[];
}

export interface AnalysisResult {
  companyName: string;
  checklist: ChecklistItem[];
  summary: string;
  overallVerdict: "positive" | "negative" | "neutral" | "mixed";
  keyStrengths: string[];
  keyRisks: string[];
}
