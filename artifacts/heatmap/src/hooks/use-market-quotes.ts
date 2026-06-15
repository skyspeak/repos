import { useEffect, useState } from "react";
import type { Vendor } from "@/types";

export interface LiveQuote {
  ticker: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  currency: string;
  asOf: string;
}

function formatCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

export function formatLiveQuote(q: LiveQuote): string {
  const cap = q.marketCap != null ? formatCap(q.marketCap) : null;
  const sign = q.changePercent >= 0 ? "+" : "";
  const change = `${sign}${q.changePercent.toFixed(2)}%`;
  if (cap) return `${cap} · $${q.price.toFixed(2)} (${change})`;
  return `$${q.price.toFixed(2)} (${change})`;
}

export function useMarketQuotes(vendors: Vendor[] | undefined) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vendors?.length) {
      setQuotes({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/market/quotes-by-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendors: vendors.map((v) => ({ name: v.name, ticker: v.ticker })),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.quotes) return;
        setQuotes(data.quotes as Record<string, LiveQuote>);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vendors]);

  return { quotes, loading };
}
