/**
 * Yahoo Finance chart/spark API (free, no API key — unofficial public endpoint).
 * v7 /quote is blocked; v7/spark and v8/chart still work with a browser User-Agent.
 */

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  currency: string;
  asOf: string;
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; Disruptor/1.0; +https://github.com/skyspeak/repos)";

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}

export function formatQuoteLabel(q: StockQuote): string {
  const sign = q.changePercent >= 0 ? "+" : "";
  const change = `${sign}${q.changePercent.toFixed(2)}%`;
  if (q.marketCap != null) {
    return `${formatUsd(q.marketCap)} · $${q.price.toFixed(2)} (${change})`;
  }
  return `$${q.price.toFixed(2)} (${change})`;
}

interface SparkMeta {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  currency?: string;
}

function metaToQuote(meta: SparkMeta): StockQuote | null {
  if (!meta.symbol || meta.regularMarketPrice == null) return null;
  const prev = meta.chartPreviousClose ?? meta.regularMarketPrice;
  const changePercent =
    prev > 0 ? ((meta.regularMarketPrice - prev) / prev) * 100 : 0;
  return {
    symbol: meta.symbol,
    name: meta.shortName ?? meta.longName ?? meta.symbol,
    price: meta.regularMarketPrice,
    changePercent,
    marketCap: null,
    currency: meta.currency ?? "USD",
    asOf: new Date().toISOString(),
  };
}

async function fetchSparkBatch(symbols: string[]): Promise<Map<string, StockQuote>> {
  const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbols.join(",")}&range=1d&interval=1d`;
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) throw new Error(`Yahoo spark failed: ${resp.status}`);
  const data = (await resp.json()) as {
    spark?: {
      result?: Array<{ symbol?: string; response?: Array<{ meta?: SparkMeta }> }>;
    };
  };
  const out = new Map<string, StockQuote>();
  for (const row of data.spark?.result ?? []) {
    const meta = row.response?.[0]?.meta;
    const q = meta ? metaToQuote(meta) : null;
    if (q) out.set(q.symbol, q);
  }
  return out;
}

async function fetchChartSymbol(symbol: string): Promise<StockQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) return null;
  const data = (await resp.json()) as {
    chart?: { result?: Array<{ meta?: SparkMeta }> };
  };
  const meta = data.chart?.result?.[0]?.meta;
  return meta ? metaToQuote(meta) : null;
}

export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Map<string, StockQuote>> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  const out = new Map<string, StockQuote>();

  if (unique.length > 1) {
    try {
      const batch = await fetchSparkBatch(unique);
      for (const [k, v] of batch) out.set(k, v);
    } catch {
      /* fall through to per-symbol */
    }
  }

  for (const symbol of unique) {
    if (out.has(symbol)) continue;
    const q = await fetchChartSymbol(symbol);
    if (q) out.set(symbol, q);
    await new Promise((r) => setTimeout(r, 80));
  }

  return out;
}
