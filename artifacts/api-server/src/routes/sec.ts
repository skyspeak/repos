import { Router } from "express";
import {
  lookupTicker,
  listFilingsByForm,
  fetchLatestFiling,
} from "../integrations/sec/edgar";

const router = Router();

router.get("/sec/lookup/:ticker", async (req, res): Promise<void> => {
  try {
    const company = await lookupTicker(req.params.ticker);
    if (!company) {
      res.status(404).json({ error: "Ticker not found in SEC EDGAR" });
      return;
    }
    res.json(company);
  } catch (err) {
    req.log.error({ err }, "SEC lookup failed");
    res.status(500).json({ error: "SEC lookup failed" });
  }
});

router.get("/sec/filings/:ticker", async (req, res): Promise<void> => {
  try {
    const company = await lookupTicker(req.params.ticker);
    if (!company) {
      res.status(404).json({ error: "Ticker not found in SEC EDGAR" });
      return;
    }
    const form = (req.query.form as string) ?? "S-1";
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const filings = await listFilingsByForm(company.cik, form, limit);
    res.json({ company, filings });
  } catch (err) {
    req.log.error({ err }, "SEC filings list failed");
    res.status(500).json({ error: "Failed to list SEC filings" });
  }
});

router.post("/sec/fetch-filing", async (req, res): Promise<void> => {
  const { ticker, form } = req.body as { ticker?: string; form?: string };
  if (!ticker || typeof ticker !== "string") {
    res.status(400).json({ error: "ticker is required" });
    return;
  }
  try {
    const result = await fetchLatestFiling(
      ticker,
      form && typeof form === "string" ? form : "S-1",
    );
    res.json({
      company: result.company,
      filing: result.filing,
      textLength: result.text.length,
      textPreview: result.text.slice(0, 500) + "…",
      documentType: result.filing.form.toUpperCase().startsWith("S-1")
        ? "s1_filing"
        : "earnings_presentation",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    req.log.error({ err }, "SEC fetch filing failed");
    res.status(400).json({ error: message });
  }
});

export default router;
