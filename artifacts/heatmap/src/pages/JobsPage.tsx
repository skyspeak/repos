import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ExternalLink, Briefcase, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import jobsData from '@/data/bls_jobs.json';
import { JOB_CATEGORY_TO_BUCKET, JOB_CATEGORY_LABEL } from '@/data/jobMapping';
import { CATEGORIES } from '@/data/categories';
import { BUCKETS, BucketId } from '@/types';

interface BlsJob {
  title: string;
  slug: string;
  category: string;
  pay: number;
  jobs: number;
  outlook: number;
  outlook_desc: string;
  education: string;
  exposure: number;
  exposure_rationale: string;
  url: string;
}

const JOBS = jobsData as BlsJob[];

type SortKey = 'exposure' | 'jobs' | 'pay' | 'title';

function exposureColor(e: number) {
  // 0-10 scale: low (cool) → high (warm)
  if (e >= 9) return 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30';
  if (e >= 7) return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30';
  if (e >= 5) return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  if (e >= 3) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
}

function bucketColor(id: BucketId | undefined) {
  return BUCKETS.find(b => b.id === id)?.color ?? '#94a3b8';
}

export default function JobsPage() {
  const [bucketFilter, setBucketFilter] = useState<BucketId | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('exposure');
  const [search, setSearch] = useState('');

  const enriched = useMemo(() => {
    return JOBS.map(j => ({
      ...j,
      bucket: JOB_CATEGORY_TO_BUCKET[j.category],
    }));
  }, []);

  const filtered = useMemo(() => {
    let r = enriched;
    if (bucketFilter !== 'all') r = r.filter(j => j.bucket === bucketFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(j => j.title.toLowerCase().includes(q));
    }
    const sorted = [...r];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'exposure': return b.exposure - a.exposure;
        case 'jobs': return b.jobs - a.jobs;
        case 'pay': return b.pay - a.pay;
        case 'title': return a.title.localeCompare(b.title);
      }
    });
    return sorted;
  }, [enriched, bucketFilter, search, sortKey]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, j) => s + j.jobs, 0);
    const weightedExp =
      total > 0
        ? filtered.reduce((s, j) => s + j.jobs * j.exposure, 0) / total
        : 0;
    const highRisk = filtered.filter(j => j.exposure >= 8).reduce((s, j) => s + j.jobs, 0);
    return { total, weightedExp, highRisk };
  }, [filtered]);

  // For each bucket, count linked heatmap categories
  const bucketCategoryCount = useMemo(() => {
    const m = new Map<BucketId, number>();
    CATEGORIES.forEach(c => m.set(c.bucket, (m.get(c.bucket) ?? 0) + 1));
    return m;
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            BLS Occupations × Disruption Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            342 occupations from the U.S. Bureau of Labor Statistics{' '}
            <a href="https://www.bls.gov/ooh/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
              Occupational Outlook Handbook
            </a>
            , scored for AI exposure by Andrej Karpathy's{' '}
            <a href="https://karpathy.ai/jobs" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
              Job Market Visualizer
            </a>
            , and cross-referenced with the heatmap's industry buckets so you
            can see which occupations sit inside each disruption category.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Occupations" value={filtered.length.toLocaleString()} sub="in view" />
        <Stat
          label="Workers Represented"
          value={`${(totals.total / 1_000_000).toFixed(1)}M`}
          sub="employment-weighted"
        />
        <Stat
          label="Weighted AI Exposure"
          value={totals.weightedExp.toFixed(1)}
          sub="0–10 (employment-weighted)"
        />
        <Stat
          label="High-Risk Workers"
          value={`${(totals.highRisk / 1_000_000).toFixed(1)}M`}
          sub="exposure ≥ 8"
        />
      </div>

      {/* Bucket filter chips */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          onClick={() => setBucketFilter('all')}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            bucketFilter === 'all'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          All sectors
        </button>
        {BUCKETS.map(b => (
          <button
            key={b.id}
            onClick={() => setBucketFilter(b.id)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1.5 ${
              bucketFilter === b.id
                ? 'text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
            style={
              bucketFilter === b.id
                ? { background: b.color, borderColor: b.color, color: '#fff' }
                : undefined
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: b.color }}
            />
            {b.label}
            <span className="opacity-60 text-[10px]">
              ({bucketCategoryCount.get(b.id) ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search occupations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <div className="flex items-center gap-1 ml-auto text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground mr-1">Sort:</span>
          {(['exposure', 'jobs', 'pay', 'title'] as SortKey[]).map(k => (
            <Button
              key={k}
              variant={sortKey === k ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSortKey(k)}
            >
              {k === 'exposure' ? 'AI Exposure' :
               k === 'jobs' ? 'Employment' :
               k === 'pay' ? 'Median Pay' : 'Title'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
          <div className="col-span-5">Occupation</div>
          <div className="col-span-2">BLS Category</div>
          <div className="col-span-1 text-right">Workers</div>
          <div className="col-span-1 text-right">Median Pay</div>
          <div className="col-span-1 text-center">Exposure</div>
          <div className="col-span-2">Heatmap Sector</div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.map(j => {
            const bucket = BUCKETS.find(b => b.id === j.bucket);
            return (
              <div
                key={j.slug}
                onClick={() => window.open(j.url, '_blank', 'noreferrer')}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors items-center group cursor-pointer"
              >
                <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{j.title}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                </div>
                <div className="col-span-2 text-xs text-muted-foreground truncate">
                  {JOB_CATEGORY_LABEL[j.category] ?? j.category}
                </div>
                <div className="col-span-1 text-right tabular-nums text-xs">
                  {j.jobs >= 1_000_000
                    ? `${(j.jobs / 1_000_000).toFixed(1)}M`
                    : `${(j.jobs / 1000).toFixed(0)}K`}
                </div>
                <div className="col-span-1 text-right tabular-nums text-xs">
                  ${(j.pay / 1000).toFixed(0)}K
                </div>
                <div className="col-span-1 flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-6 rounded text-xs font-semibold border tabular-nums ${exposureColor(j.exposure)}`}
                    title={j.exposure_rationale}
                  >
                    {j.exposure}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                  {bucket ? (
                    <Link
                      href={`/?sectors=${bucket.id}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground truncate"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: bucketColor(j.bucket) }}
                      />
                      <span className="truncate">{bucket.label}</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No occupations match the current filters.
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Data: U.S. BLS Occupational Outlook Handbook (143M jobs across 342 occupations).
        AI exposure scores via{' '}
        <a href="https://github.com/karpathy/jobs" target="_blank" rel="noreferrer" className="underline">
          karpathy/jobs
        </a>
        . Heatmap sector mapping is curated for this report.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
