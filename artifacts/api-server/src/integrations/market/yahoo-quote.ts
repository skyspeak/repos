/**
 * Yahoo Finance quote API (free, no API key — unofficial public endpoint).
 * Used for live price and market cap on public companies.
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

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}

export function formatQuoteLabel(q: StockQuote): string {
  const cap = q.marketCap != null ? formatUsd(q.marketCap) : "—";
  const sign = q.changePercent >= 0 ? "+" : "";
  return `${cap} · $${q.price.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)`;
}

export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Map<string, StockQuote>> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${unique.join(",")}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Disruptor/1.0 (research; market quotes)",
    },
  });
  if (!resp.ok) {
    throw new Error(`Yahoo quote failed: ${resp.status}`);
  }

  const data = (await resp.json()) as {
    quoteResponse?: {
      result?: Array<{
        symbol?: string;
        shortName?: string;
        regularMarketPrice?: number;
        regularMarketChangePercent?: number;
        marketCap?: number;
        currency?: string;
      }>;
    };
  };

  const out = new Map<string, StockQuote>();
  const asOf = new Date().toISOString();
  for (const row of data.quoteResponse?.result ?? []) {
    if (!row.symbol || row.regularMarketPrice == null) continue;
    out.set(row.symbol, {
      symbol: row.symbol,
      name: row.shortName ?? row.symbol,
      price: row.regularMarketPrice,
      changePercent: row.regularMarketChangePercent ?? 0,
      marketCap: row.marketCap ?? null,
      currency: row.currency ?? "USD",
      asOf,
    });
  }
  return out;
}
