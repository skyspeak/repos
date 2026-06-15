/**
 * Free market quotes for weekly category refresh (Yahoo Finance + SEC ticker index).
 */

const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
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

export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Map<string, StockQuote>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))];
  if (!unique.length) return new Map();
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${unique.join(",")}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Disruptor/1.0 (weekly refresh)" },
  });
  if (!resp.ok) throw new Error(`Yahoo quote ${resp.status}`);
  const data = (await resp.json()) as {
    quoteResponse?: {
      result?: Array<{
        symbol?: string;
        regularMarketPrice?: number;
        regularMarketChangePercent?: number;
        marketCap?: number;
      }>;
    };
  };
  const out = new Map<string, StockQuote>();
  for (const row of data.quoteResponse?.result ?? []) {
    if (!row.symbol || row.regularMarketPrice == null) continue;
    out.set(row.symbol, {
      symbol: row.symbol,
      price: row.regularMarketPrice,
      changePercent: row.regularMarketChangePercent ?? 0,
      marketCap: row.marketCap ?? null,
    });
  }
  return out;
}

function formatCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

export function formatVendorValuation(q: StockQuote): string {
  const cap = q.marketCap != null ? formatCap(q.marketCap) : `$${q.price.toFixed(2)}`;
  const sign = q.changePercent >= 0 ? "+" : "";
  return `${cap} · $${q.price.toFixed(2)} (${sign}${q.changePercent.toFixed(1)}%)`;
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

/** Parse "PTC ($18B)" from publicComps strings */
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
  let ti = 0;
  return comps.map((comp, i) => {
    const t = compTicker[i];
    if (!t) return comp;
    const q = quotes.get(t);
    if (!q) return comp;
    ti++;
    const cap = q.marketCap != null ? formatCap(q.marketCap) : `$${q.price.toFixed(0)}`;
    return `${t} (${cap})`;
  });
}
