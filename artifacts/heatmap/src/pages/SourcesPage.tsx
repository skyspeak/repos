import { useMemo, useState } from 'react';
import { ExternalLink, Search, Download } from 'lucide-react';
import CATEGORIES from '@/data/categories';
import { BUCKETS, BucketId, Category } from '@/types';

interface Citation {
  label: string;
  url: string;
  type: 'incumbent' | 'challenger' | 'signal';
  detail?: string;
}

function citationsFor(c: Category): Citation[] {
  const out: Citation[] = [];
  for (const v of c.incumbents) {
    if (v.url) out.push({ label: v.name, url: v.url, type: 'incumbent', detail: v.marketCapOrValuation });
  }
  for (const v of c.challengers) {
    if (v.url) out.push({ label: v.name, url: v.url, type: 'challenger', detail: v.marketCapOrValuation });
  }
  for (const s of c.signals) {
    if (s.sourceUrl) out.push({ label: s.description, url: s.sourceUrl, type: 'signal', detail: `${s.date} · ${s.type}` });
  }
  return out;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

const TYPE_STYLES: Record<Citation['type'], string> = {
  incumbent: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  challenger: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  signal: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

export default function SourcesPage() {
  const [query, setQuery] = useState('');
  const [activeBucket, setActiveBucket] = useState<BucketId | 'all'>('all');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES
      .filter(c => activeBucket === 'all' || c.bucket === activeBucket)
      .map(c => {
        const cites = citationsFor(c);
        const filtered = q
          ? cites.filter(
              ci =>
                ci.label.toLowerCase().includes(q) ||
                ci.url.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q),
            )
          : cites;
        return { category: c, citations: filtered };
      })
      .filter(g => g.citations.length > 0);
  }, [query, activeBucket]);

  const totals = useMemo(() => {
    let citations = 0;
    const domains = new Set<string>();
    for (const g of grouped) {
      citations += g.citations.length;
      for (const ci of g.citations) domains.add(hostOf(ci.url));
    }
    return { citations, domains: domains.size, categories: grouped.length };
  }, [grouped]);

  function exportCsv() {
    const rows: string[] = ['category,bucket,type,label,domain,url,detail'];
    for (const g of grouped) {
      for (const ci of g.citations) {
        const cells = [
          g.category.name,
          g.category.bucket,
          ci.type,
          ci.label.replace(/"/g, '""'),
          hostOf(ci.url),
          ci.url,
          (ci.detail ?? '').replace(/"/g, '""'),
        ].map(v => `"${v}"`);
        rows.push(cells.join(','));
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ai-disruption-heatmap-sources.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sources & Citations</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Every primary citation behind the heatmap, grouped by category. Includes incumbent
            vendor sites, AI-native challengers, and dated signal links (funding, product
            launches, M&amp;A). Use this page to audit any specific claim or jump straight to
            the underlying source.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-bold">{totals.categories}</div>
          <div className="text-xs text-muted-foreground">Categories shown</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-bold">{totals.citations}</div>
          <div className="text-xs text-muted-foreground">Citations</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-bold">{totals.domains}</div>
          <div className="text-xs text-muted-foreground">Unique domains</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-bold">{CATEGORIES.length}</div>
          <div className="text-xs text-muted-foreground">Total categories</div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by vendor, domain, or category..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveBucket('all')}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
            activeBucket === 'all'
              ? 'border-foreground text-foreground bg-accent'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          All sectors
        </button>
        {BUCKETS.map(b => (
          <button
            key={b.id}
            onClick={() => setActiveBucket(b.id)}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              activeBucket === b.id
                ? 'text-white border-transparent'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
            style={activeBucket === b.id ? { background: b.color } : undefined}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
            {b.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-500/60" /> Incumbent vendor
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/60" /> AI-native challenger
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-blue-500/60" /> Dated signal (funding · product · M&amp;A)
        </span>
      </div>

      <div className="mt-6 space-y-5">
        {grouped.length === 0 && (
          <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-8 text-center">
            No citations match your filters.
          </div>
        )}

        {grouped.map(({ category, citations }) => {
          const bucket = BUCKETS.find(b => b.id === category.bucket)!;
          return (
            <section
              key={category.id}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <header className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: bucket.color }}
                  />
                  <h2 className="text-base font-semibold">{category.name}</h2>
                  <span className="text-[11px] text-muted-foreground">
                    {bucket.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{citations.length} citations</span>
                  <span>·</span>
                  <span>Updated {category.lastUpdated}</span>
                </div>
              </header>

              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {citations.map((ci, i) => (
                  <li key={i}>
                    <a
                      href={ci.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block h-full rounded-md border border-border hover:border-foreground/30 hover:bg-accent/30 transition-colors p-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${TYPE_STYLES[ci.type]}`}
                        >
                          {ci.type}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5" />
                      </div>
                      <div className="mt-1.5 text-xs font-medium line-clamp-2 leading-snug">
                        {ci.label}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground font-mono truncate">
                        {hostOf(ci.url)}
                      </div>
                      {ci.detail && (
                        <div className="mt-1 text-[10px] text-muted-foreground truncate">
                          {ci.detail}
                        </div>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-[11px] text-muted-foreground max-w-3xl">
        <strong>Caveat:</strong> citations are anchor links to primary vendor pages, regulators,
        and dated news, not exhaustive bibliographies. Quantitative scores in the heatmap are
        synthesized analyst estimates informed by these sources, not audited market-research
        figures. Cutoff: May 2025.
      </p>
    </div>
  );
}
