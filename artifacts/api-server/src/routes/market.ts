import { Router } from "express";
import { fetchYahooQuotes } from "../integrations/market/yahoo-quote";
import {
  resolveTickerFromName,
  resolveTickersForNames,
} from "../integrations/market/resolve-ticker";

const router = Router();

router.get("/market/quote/:symbol", async (req, res): Promise<void> => {
  try {
    const quotes = await fetchYahooQuotes([req.params.symbol]);
    const q = quotes.get(req.params.symbol.toUpperCase());
    if (!q) {
      res.status(404).json({ error: "Symbol not found" });
      return;
    }
    res.json(q);
  } catch (err) {
    req.log.error({ err }, "Market quote failed");
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

router.get("/market/quotes", async (req, res): Promise<void> => {
  const raw = req.query.tickers;
  const tickers =
    typeof raw === "string"
      ? raw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  if (tickers.length === 0) {
    res.status(400).json({ error: "tickers query param required (comma-separated)" });
    return;
  }
  try {
    const quotes = await fetchYahooQuotes(tickers.slice(0, 30));
    res.json({
      asOf: new Date().toISOString(),
      quotes: Object.fromEntries(quotes),
    });
  } catch (err) {
    req.log.error({ err }, "Market quotes failed");
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

router.post("/market/quotes-by-name", async (req, res): Promise<void> => {
  const { vendors } = req.body as {
    vendors?: Array<{ name: string; ticker?: string }>;
  };
  if (!vendors?.length) {
    res.status(400).json({ error: "vendors array required" });
    return;
  }
  try {
    const nameToTicker = await resolveTickersForNames(vendors.slice(0, 40));
    const tickers = [...new Set(nameToTicker.values())];
    const quotes = await fetchYahooQuotes(tickers);
    const byName: Record<string, unknown> = {};
    for (const [name, ticker] of nameToTicker) {
      const q = quotes.get(ticker);
      if (q) byName[name] = { ticker, ...q };
    }
    res.json({ asOf: new Date().toISOString(), quotes: byName });
  } catch (err) {
    req.log.error({ err }, "Market quotes-by-name failed");
    res.status(500).json({ error: "Failed to resolve quotes" });
  }
});

router.get("/market/resolve/:name", async (req, res): Promise<void> => {
  try {
    const ticker = await resolveTickerFromName(
      decodeURIComponent(req.params.name),
    );
    if (!ticker) {
      res.status(404).json({ error: "Could not resolve ticker" });
      return;
    }
    res.json({ name: req.params.name, ticker });
  } catch (err) {
    req.log.error({ err }, "Ticker resolve failed");
    res.status(500).json({ error: "Resolve failed" });
  }
});

export default router;
