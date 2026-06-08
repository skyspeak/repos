/**
 * Reusable format description for a checklist item.
 * Included in each step prompt so the LLM always returns consistent shape.
 */
export const ITEM_FORMAT = `Each item in the "items" array must follow this exact JSON shape:

{
  "metric":       "Short name, e.g. 'Revenue', 'Gross Margin', 'Customer Acquisition Cost'",
  "category":     "One of: Revenue | Profitability | Growth | Efficiency | Balance Sheet | Cash Flow | Risk | Guidance | Market Position | Management | Valuation | Strategy",
  "whatItIs":     "1-2 plain-English sentences explaining what this metric IS in general (define it for a newcomer)",
  "whatItMeans":  "1-3 sentences explaining what THIS COMPANY'S specific result tells us right now",
  "verdict":      "positive | negative | neutral | mixed",
  "verdictReason":"1 sentence explaining the verdict",
  "value":        "The actual number or quoted phrase from the document, or null if not explicitly stated",
  "yoyChange":    "e.g. '+18% YoY', 'declined', null if not available",
  "qoqChange":    "e.g. '+3% QoQ', null if not available or not applicable",
  "flags":        "A short note starting with ⚠️ for red flags or ✅ for green flags, or null if none"
}`;
