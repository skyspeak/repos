import { loadTickerIndex } from "../sec/edgar";

/** Strip suffix noise: "PTC (ThingWorx)" → "PTC", "IBM Maximo" → "IBM" */
function nameTokens(name: string): string[] {
  const cleaned = name.replace(/\([^)]*\)/g, " ").trim();
  const parts = cleaned.split(/[\s,/]+/).filter(Boolean);
  const tokens: string[] = [];
  if (parts[0]) tokens.push(parts[0]);
  if (parts.length > 1 && parts[1].length <= 4) tokens.push(parts[1]);
  return [...new Set(tokens.map((t) => t.replace(/[^A-Za-z0-9.-]/g, "")))];
}

export async function resolveTickerFromName(
  vendorName: string,
  explicitTicker?: string,
): Promise<string | null> {
  if (explicitTicker) {
    const t = explicitTicker.trim().toUpperCase();
    const index = await loadTickerIndex();
    if (index.has(t)) return t;
  }

  const index = await loadTickerIndex();
  const byTitle = [...index.entries()].map(([ticker, { title }]) => ({
    ticker,
    title: title.toLowerCase(),
  }));

  for (const token of nameTokens(vendorName)) {
    const upper = token.toUpperCase();
    if (upper.length >= 1 && upper.length <= 5 && index.has(upper)) {
      return upper;
    }
  }

  const lower = vendorName.toLowerCase();
  for (const { ticker, title } of byTitle) {
    if (title.includes(lower) || lower.includes(title.split(" ")[0])) {
      return ticker;
    }
  }

  const first = nameTokens(vendorName)[0]?.toLowerCase();
  if (first && first.length >= 3) {
    const hit = byTitle.find(
      (r) => r.title.startsWith(first) || r.title.includes(` ${first}`),
    );
    if (hit) return hit.ticker;
  }

  return null;
}

export async function resolveTickersForNames(
  names: Array<{ name: string; ticker?: string }>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const { name, ticker } of names) {
    const resolved = await resolveTickerFromName(name, ticker);
    if (resolved) out.set(name, resolved);
  }
  return out;
}
