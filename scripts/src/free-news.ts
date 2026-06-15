/**
 * Google News RSS (free, no API key) — used by weekly category regeneration.
 */

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXml(m[1].trim()) : "";
}

export async function fetchGoogleNewsRss(
  query: string,
  maxItems = 5,
): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Disruptor/1.0 (research RSS reader)" },
  });
  if (!resp.ok) {
    throw new Error(`Google News RSS failed: ${resp.status}`);
  }
  const xml = await resp.text();
  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemBlocks.slice(0, maxItems)) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const source = extractTag(block, "source") || "Google News";
    if (title && link) {
      items.push({
        title,
        url: link,
        publishedAt: pubDate || new Date().toISOString(),
        source,
      });
    }
  }
  return items;
}

export function newsToSignalContext(items: NewsItem[]): string {
  if (items.length === 0) return "No recent RSS headlines found.";
  return items
    .map(
      (n, i) =>
        `${i + 1}. [${n.publishedAt.slice(0, 16)}] ${n.title}\n   URL: ${n.url}`,
    )
    .join("\n");
}

export async function fetchCategoryNews(
  categoryName: string,
  companyNames: string[],
): Promise<NewsItem[]> {
  const queries = [
    `"${categoryName}" AI`,
    ...companyNames.slice(0, 2).map((n) => `"${n.split("(")[0].trim()}"`),
  ];
  const seen = new Set<string>();
  const all: NewsItem[] = [];

  for (const q of queries) {
    try {
      const batch = await fetchGoogleNewsRss(q, 3);
      for (const item of batch) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        all.push(item);
      }
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      /* skip failed query */
    }
    if (all.length >= 8) break;
  }
  return all.slice(0, 8);
}
