/**
 * SEC EDGAR integration (free, https://www.sec.gov/os/accessing-edgar-data)
 * Requires SEC_CONTACT_EMAIL env var for User-Agent compliance.
 */

const SEC_DATA = "https://data.sec.gov";
const SEC_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";
const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";

const MIN_REQUEST_GAP_MS = 120;
const MAX_FILING_CHARS = 120_000;
const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024;

let lastRequestAt = 0;
let tickersCache: Map<string, { cik: string; title: string }> | null = null;
let tickersLoadedAt = 0;
const TICKERS_TTL_MS = 24 * 60 * 60 * 1000;

export interface EdgarCompany {
  ticker: string;
  cik: string;
  name: string;
}

export interface EdgarFiling {
  form: string;
  filingDate: string;
  accessionNumber: string;
  primaryDocument: string;
  reportDate?: string;
  documentUrl: string;
}

function secUserAgent(): string {
  const email =
    process.env.SEC_CONTACT_EMAIL ??
    process.env.VERCEL_GIT_COMMIT_AUTHOR_EMAIL ??
    "research@disruptor.app";
  return `Disruptor ${email}`;
}

async function secFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = MIN_REQUEST_GAP_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  const resp = await fetch(url, {
    headers: {
      "User-Agent": secUserAgent(),
      Accept: "application/json, text/html, text/plain, */*",
    },
  });
  if (resp.status === 403) {
    throw new Error(
      "SEC EDGAR blocked this request (403). Set SEC_CONTACT_EMAIL in Vercel env vars to a real email address.",
    );
  }
  if (!resp.ok) {
    throw new Error(`SEC request failed ${resp.status}: ${url}`);
  }
  return resp;
}

function padCik(cik: string | number): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

function cikPathSegment(cik: string | number): string {
  return String(parseInt(String(cik).replace(/\D/g, ""), 10));
}

export async function loadTickerIndex(): Promise<
  Map<string, { cik: string; title: string }>
> {
  if (tickersCache && Date.now() - tickersLoadedAt < TICKERS_TTL_MS) {
    return tickersCache;
  }
  const resp = await secFetch(TICKERS_URL);
  const data = (await resp.json()) as Record<
    string,
    { cik_str: number; ticker: string; title: string }
  >;
  tickersCache = new Map();
  for (const entry of Object.values(data)) {
    tickersCache.set(entry.ticker.toUpperCase(), {
      cik: padCik(entry.cik_str),
      title: entry.title,
    });
  }
  tickersLoadedAt = Date.now();
  return tickersCache;
}

export async function lookupTicker(ticker: string): Promise<EdgarCompany | null> {
  const index = await loadTickerIndex();
  const hit = index.get(ticker.trim().toUpperCase());
  if (!hit) return null;
  return { ticker: ticker.toUpperCase(), cik: hit.cik, name: hit.title };
}

interface SubmissionsResponse {
  name: string;
  tickers: string[];
  filings: {
    recent: {
      form: string[];
      filingDate: string[];
      accessionNumber: string[];
      primaryDocument: string[];
      reportDate?: string[];
    };
  };
}

export async function listFilingsByForm(
  cik: string,
  formPrefix: string,
  limit = 5,
): Promise<EdgarFiling[]> {
  const url = `${SEC_DATA}/submissions/CIK${padCik(cik)}.json`;
  const resp = await secFetch(url);
  const data = (await resp.json()) as SubmissionsResponse;
  const recent = data.filings.recent;
  const out: EdgarFiling[] = [];
  const upper = formPrefix.toUpperCase();

  for (let i = 0; i < recent.form.length && out.length < limit; i++) {
    const form = recent.form[i];
    if (!form.toUpperCase().startsWith(upper)) continue;
    const accession = recent.accessionNumber[i];
    const primary = recent.primaryDocument[i];
    const accessionPath = accession.replace(/-/g, "");
    out.push({
      form,
      filingDate: recent.filingDate[i],
      accessionNumber: accession,
      primaryDocument: primary,
      reportDate: recent.reportDate?.[i],
      documentUrl: `${SEC_ARCHIVES}/${cikPathSegment(cik)}/${accessionPath}/${primary}`,
    });
  }
  return out;
}

export function htmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

export function extractKeySections(text: string): string {
  const upper = text.toUpperCase();
  const markers = [
    "ITEM 1. BUSINESS",
    "ITEM 1A. RISK FACTORS",
    "ITEM 7. MANAGEMENT",
    "ITEM 7A. QUANTITATIVE",
  ];
  const chunks: string[] = [];

  for (let m = 0; m < markers.length; m++) {
    const start = upper.indexOf(markers[m]);
    if (start === -1) continue;
    const nextStarts = markers
      .slice(m + 1)
      .map((mk) => upper.indexOf(mk, start + markers[m].length))
      .filter((i) => i > start);
    const end =
      nextStarts.length > 0 ? Math.min(...nextStarts) : start + 40_000;
    chunks.push(text.slice(start, Math.min(end, start + 40_000)).trim());
  }

  if (chunks.length > 0) return chunks.join("\n\n---\n\n");
  return text.slice(0, MAX_FILING_CHARS);
}

export function truncateForAnalysis(text: string): string {
  const extracted = extractKeySections(text);
  if (extracted.length <= MAX_FILING_CHARS) return extracted;
  return extracted.slice(0, MAX_FILING_CHARS);
}

export async function fetchFilingText(filing: EdgarFiling): Promise<string> {
  const resp = await secFetch(filing.documentUrl);
  const reader = resp.body?.getReader();
  if (!reader) {
    const raw = await resp.text();
    const text =
      raw.includes("<html") || raw.includes("<HTML") ? htmlToText(raw) : raw;
    return truncateForAnalysis(text);
  }

  const decoder = new TextDecoder();
  let raw = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_DOWNLOAD_BYTES) {
      reader.cancel();
      break;
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();

  const text =
    raw.includes("<html") || raw.includes("<HTML") ? htmlToText(raw) : raw;
  return truncateForAnalysis(text);
}

export function mapFormToDocumentType(
  form: string,
): "s1_filing" | "earnings_presentation" {
  const f = form.toUpperCase();
  if (f.startsWith("S-1")) return "s1_filing";
  if (f.startsWith("10-K") || f.startsWith("10-Q")) return "earnings_presentation";
  if (f.startsWith("8-K")) return "earnings_presentation";
  return "s1_filing";
}

export async function fetchLatestFiling(
  ticker: string,
  formPrefix: string,
): Promise<{ company: EdgarCompany; filing: EdgarFiling; text: string }> {
  const company = await lookupTicker(ticker);
  if (!company) throw new Error(`Ticker not found in SEC EDGAR: ${ticker}`);
  const filings = await listFilingsByForm(company.cik, formPrefix, 1);
  if (filings.length === 0) {
    throw new Error(`No ${formPrefix} filings found for ${ticker}`);
  }
  const filing = filings[0];
  const text = await fetchFilingText(filing);
  if (text.length < 500) {
    throw new Error(`Filing text too short (${text.length} chars) — parse may have failed`);
  }
  return { company, filing, text };
}
