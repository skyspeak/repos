/**
 * Free market quotes for weekly category refresh (Yahoo Finance spark/chart + SEC tickers).
 */

const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const USER_AGENT =
  "Mozilla/5.0 (compatible; Disruptor/1.0; +https://github.com/skyspeak/repos)";
const MIN_SEC_GAP_MS = 120;
let lastSecAt = 0;
let tickersCache: Map<string, { cik: string; title: string }> | null = null;

async function secFetch(url: string): Promise<Response> {
  const wait = MIN_SEC_GAP_MS - (Date.now() - lastSecAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastSecAt = Date.now();
  const email = process.env.SEC_CONTACT_EMAIL ?? "research@disruptor.app";
  return fetch(url, {
    headers: { "User-Agent": `Disruptor ${email}`, Accept: "application/json" },
  });
}

async function loadTickerIndex(): Promise<Map<string, { cik: string; title: string }>> {
  if (tickersCache) return tickersCache;
  const resp = await secFetch(TICKERS_URL);
  if (!resp.ok) throw new Error("SEC ticker index failed");
  const data = (await resp.json()) as Record<
    string,
    { cik_str: number; ticker: string; title: string }
  >;
  tickersCache = new Map();
  for (const e of Object.values(data)) {
    tickersCache.set(e.ticker.toUpperCase(), {
      cik: String(e.cik_str).padStart(10, "0"),
      title: e.title,
    });
  }
  return tickersCache;
}

function nameTokens(name: string): string[] {
  const cleaned = name.replace(/\([^)]*\)/g, " ").trim();
  const parts = cleaned.split(/[\s,/]+/).filter(Boolean);
  const tokens: string[] = [];
  if (parts[0]) tokens.push(parts[0]);
  return [...new Set(tokens.map((t) => t.replace(/[^A-Za-z0-9.-]/g, "")))];
}

export async function resolveTickerFromName(
  name: string,
  explicit?: string,
): Promise<string | null> {
  const index = await loadTickerIndex();
  if (explicit) {
    const t = explicit.toUpperCase();
    if (index.has(t)) return t;
  }
  for (const token of nameTokens(name)) {
    const upper = token.toUpperCase();
    if (upper.length >= 1 && upper.length <= 5 && index.has(upper)) return upper;
  }
  const first = nameTokens(name)[0]?.toLowerCase();
  if (first && first.length >= 3) {
    for (const [ticker, { title }] of index) {
      if (title.toLowerCase().includes(first)) return ticker;
    }
  }
  return null;
}

export interface StockQuote {
  symbol: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
}

interface SparkMeta {
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
}

function metaToQuote(meta: SparkMeta): StockQuote | null {
  if (!meta.symbol || meta.regularMarketPrice == null) return null;
  const prev = meta.chartPreviousClose ?? meta.regularMarketPrice;
  const changePercent =
    prev > 0 ? ((meta.regularMarketPrice - prev) / prev) * 100 : 0;
  return {
    symbol: meta.symbol,
    price: meta.regularMarketPrice,
    changePercent,
    marketCap: null,
  };
}

export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Map<string, StockQuote>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))];
  if (!unique.length) return new Map();

  const out = new Map<string, StockQuote>();

  if (unique.length > 1) {
    const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${unique.join(",")}&range=1d&interval=1d`;
    const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (resp.ok) {
      const data = (await resp.json()) as {
        spark?: {
          result?: Array<{ response?: Array<{ meta?: SparkMeta }> }>;
        };
      };
      for (const row of data.spark?.result ?? []) {
        const q = metaToQuote(row.response?.[0]?.meta ?? {});
        if (q) out.set(q.symbol, q);
      }
    }
  }

  for (const symbol of unique) {
    if (out.has(symbol)) continue;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!resp.ok) continue;
    const data = (await resp.json()) as {
      chart?: { result?: Array<{ meta?: SparkMeta }> };
    };
    const q = metaToQuote(data.chart?.result?.[0]?.meta ?? {});
    if (q) out.set(symbol, q);
    await new Promise((r) => setTimeout(r, 80));
  }

  return out;
}

export function formatVendorValuation(q: StockQuote): string {
  const sign = q.changePercent >= 0 ? "+" : "";
  return `$${q.price.toFixed(2)} (${sign}${q.changePercent.toFixed(1)}%)`;
}

type Vendor = { name: string; marketCapOrValuation: string; ticker?: string };

export async function refreshVendorQuotes(vendors: Vendor[]): Promise<void> {
  const tickers: string[] = [];
  const vendorTicker = new Map<string, string>();
  for (const v of vendors) {
    const t = await resolveTickerFromName(v.name, v.ticker);
    if (t) {
      tickers.push(t);
      vendorTicker.set(v.name, t);
    }
  }
  if (!tickers.length) return;
  const quotes = await fetchYahooQuotes(tickers);
  for (const v of vendors) {
    const t = vendorTicker.get(v.name);
    if (!t) continue;
    const q = quotes.get(t);
    if (q) v.marketCapOrValuation = formatVendorValuation(q);
  }
}

export async function refreshPublicComps(comps: string[]): Promise<string[]> {
  const index = await loadTickerIndex();
  const tickers: string[] = [];
  const compTicker: string[] = [];

  for (const comp of comps) {
    const m = comp.match(/^([A-Za-z0-9.-]+)/);
    const candidate = m?.[1]?.toUpperCase();
    if (candidate && index.has(candidate)) {
      tickers.push(candidate);
      compTicker.push(candidate);
    } else {
      compTicker.push("");
    }
  }

  if (!tickers.length) return comps;
  const quotes = await fetchYahooQuotes(tickers);
  return comps.map((comp, i) => {
    const t = compTicker[i];
    if (!t) return comp;
    const q = quotes.get(t);
    if (!q) return comp;
    const sign = q.changePercent >= 0 ? "+" : "";
    return `${t} ($${q.price.toFixed(2)}, ${sign}${q.changePercent.toFixed(1)}%)`;
  });
}
