import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearch, useLocation } from 'wouter';
import { CATEGORIES } from '@/data/categories';
import { BUCKETS, Category, BucketId, GtmMotion } from '@/types';
import BubbleChart from '@/components/BubbleChart';
import FilterBar from '@/components/FilterBar';
import CategoryDetailPanel from '@/components/CategoryDetailPanel';
import RankingsSidebar from '@/components/RankingsSidebar';
import StatsBar from '@/components/StatsBar';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SortKey =
  | 'composite'
  | 'disruptionRisk'
  | 'timeHorizon'
  | 'startupOpportunity'
  | 'supplyChainVulnerability'
  | 'marketSize'
  | 'cagr';

const REPORT_DATE = 'May 2025';

const VALID_SORT_KEYS: SortKey[] = [
  'composite',
  'disruptionRisk',
  'timeHorizon',
  'startupOpportunity',
  'supplyChainVulnerability',
  'marketSize',
  'cagr',
];

const VALID_BUCKET_IDS = new Set<BucketId>(BUCKETS.map(b => b.id));
const VALID_CATEGORY_IDS = new Set<string>(CATEGORIES.map(c => c.id));

export default function HeatmapPage() {
  const search = useSearch();
  const [, navigate] = useLocation();

  const initial = useMemo(() => {
    const params = new URLSearchParams(search);
    const catId = params.get('cat');
    const sectorsRaw = params.get('sectors');
    const sortRaw = params.get('sort');
    const q = params.get('q') ?? '';
    const sectors = (sectorsRaw ? sectorsRaw.split(',') : [])
      .filter((b): b is BucketId => VALID_BUCKET_IDS.has(b as BucketId));
    const sort = (sortRaw && (VALID_SORT_KEYS as string[]).includes(sortRaw)
      ? (sortRaw as SortKey)
      : 'composite');
    const cat = catId && VALID_CATEGORY_IDS.has(catId)
      ? CATEGORIES.find(c => c.id === catId) ?? null
      : null;
    return { sectors, sort, q, cat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedBuckets, setSelectedBuckets] = useState<BucketId[]>(initial.sectors);
  const [sortKey, setSortKey] = useState<SortKey>(initial.sort);
  const [searchQuery, setSearchQuery] = useState(initial.q);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(initial.cat);
  const [minDisruption, setMinDisruption] = useState(0);
  const [maxTimeHorizon, setMaxTimeHorizon] = useState(7);
  const [minStartupOpp, setMinStartupOpp] = useState(0);
  const [gtmMotions, setGtmMotions] = useState<GtmMotion[]>([]);

  // Normalize URL on mount (e.g. strip invalid params) without adding history.
  const didMountNormalize = useRef(false);
  useEffect(() => {
    if (didMountNormalize.current) return;
    didMountNormalize.current = true;
    const params = new URLSearchParams();
    if (selectedCategory) params.set('cat', selectedCategory.id);
    if (selectedBuckets.length > 0) params.set('sectors', selectedBuckets.join(','));
    if (sortKey !== 'composite') params.set('sort', sortKey);
    if (searchQuery.trim()) params.set('q', searchQuery);
    const qs = params.toString();
    const target = qs ? `/?${qs}` : '/';
    const current = window.location.search;
    const currentTarget = current ? `/${current}` : '/';
    if (target !== currentTarget) navigate(target, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state -> URL on user-driven changes (push new history entry).
  useEffect(() => {
    if (!didMountNormalize.current) return;
    const params = new URLSearchParams();
    if (selectedCategory) params.set('cat', selectedCategory.id);
    if (selectedBuckets.length > 0) params.set('sectors', selectedBuckets.join(','));
    if (sortKey !== 'composite') params.set('sort', sortKey);
    if (searchQuery.trim()) params.set('q', searchQuery);
    const qs = params.toString();
    const target = qs ? `/?${qs}` : '/';
    const current = window.location.search;
    const currentTarget = current ? `/${current}` : '/';
    if (target === currentTarget) return;
    navigate(target);
  }, [selectedCategory, selectedBuckets, sortKey, searchQuery, navigate]);

  // Sync URL -> state (back/forward navigation)
  useEffect(() => {
    const params = new URLSearchParams(search);
    const catId = params.get('cat');
    const sectorsRaw = params.get('sectors');
    const sortRaw = params.get('sort');
    const q = params.get('q') ?? '';
    const sectors = (sectorsRaw ? sectorsRaw.split(',') : [])
      .filter((b): b is BucketId => VALID_BUCKET_IDS.has(b as BucketId));
    const sort = (sortRaw && (VALID_SORT_KEYS as string[]).includes(sortRaw)
      ? (sortRaw as SortKey)
      : 'composite');
    const cat = catId && VALID_CATEGORY_IDS.has(catId)
      ? CATEGORIES.find(c => c.id === catId) ?? null
      : null;

    setSelectedBuckets(prev =>
      prev.length === sectors.length && prev.every((b, i) => b === sectors[i]) ? prev : sectors
    );
    setSortKey(prev => (prev === sort ? prev : sort));
    setSearchQuery(prev => (prev === q ? prev : q));
    setSelectedCategory(prev => (prev?.id === cat?.id ? prev : cat));
  }, [search]);

  const filtered = useMemo(() => {
    let cats = CATEGORIES;
    if (selectedBuckets.length > 0) cats = cats.filter(c => selectedBuckets.includes(c.bucket));
    if (gtmMotions.length > 0) cats = cats.filter(c => gtmMotions.includes(c.gtmMotion));
    if (minDisruption > 0) cats = cats.filter(c => c.scores.disruptionRisk >= minDisruption);
    if (maxTimeHorizon < 7) cats = cats.filter(c => c.scores.timeHorizon <= maxTimeHorizon);
    if (minStartupOpp > 0) cats = cats.filter(c => c.startupOpportunity >= minStartupOpp);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cats = cats.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.thesis.toLowerCase().includes(q) ||
        BUCKETS.find(b => b.id === c.bucket)?.label.toLowerCase().includes(q) ||
        c.incumbents.some(v => v.name.toLowerCase().includes(q)) ||
        c.challengers.some(v => v.name.toLowerCase().includes(q)) ||
        c.publicComps.some(p => p.toLowerCase().includes(q))
      );
    }
    return cats;
  }, [selectedBuckets, gtmMotions, minDisruption, maxTimeHorizon, minStartupOpp, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === 'marketSize') return b.marketSize - a.marketSize;
      if (sortKey === 'cagr') return b.cagr - a.cagr;
      if (sortKey === 'disruptionRisk') return b.scores.disruptionRisk - a.scores.disruptionRisk;
      if (sortKey === 'timeHorizon') return a.scores.timeHorizon - b.scores.timeHorizon;
      return (b[sortKey as 'composite' | 'startupOpportunity' | 'supplyChainVulnerability'] as number) - (a[sortKey as 'composite' | 'startupOpportunity' | 'supplyChainVulnerability'] as number);
    });
  }, [filtered, sortKey]);

  const isFiltered =
    selectedBuckets.length > 0 ||
    gtmMotions.length > 0 ||
    minDisruption > 0 ||
    maxTimeHorizon < 7 ||
    minStartupOpp > 0 ||
    searchQuery.trim().length > 0;

  function resetAll() {
    setSelectedBuckets([]);
    setGtmMotions([]);
    setMinDisruption(0);
    setMaxTimeHorizon(7);
    setMinStartupOpp(0);
    setSearchQuery('');
  }

  function handleExportCSV() {
    const header = [
      'Name', 'Sector', 'Composite Score', 'Disruption Risk', 'Time Horizon (yrs)',
      'Supply Chain Vulnerability', 'Startup Opportunity',
      'Market Size ($B)', 'CAGR (%)', 'Revenue Multiple',
      'Incumbent Moat', 'AI Native Readiness', 'Agent Surface', 'Unstructured Data',
      'GTM Motion',
    ].join(',');
    const rows = CATEGORIES.map(c => [
      `"${c.name}"`,
      `"${BUCKETS.find(b => b.id === c.bucket)?.label}"`,
      c.composite.toFixed(1),
      c.scores.disruptionRisk.toFixed(1),
      c.scores.timeHorizon,
      c.supplyChainVulnerability.toFixed(1),
      c.startupOpportunity.toFixed(1),
      c.marketSize,
      c.cagr,
      `"${c.revenueMultiple}"`,
      c.scores.incumbentMoat,
      c.scores.aiNativeReadiness,
      c.scores.agentSurfaceArea,
      c.scores.unstructuredDensity,
      c.gtmMotion,
    ].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-disruption-heatmap-2025.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* Hero */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">AI Disruption Heatmap</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                As of {REPORT_DATE}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Mapping AI-driven disruption risk, startup opportunity, and supply chain vulnerability across {CATEGORIES.length} industry categories.
              Three analysis layers per category: supply chain, product architecture, and GTM strategy.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 shrink-0">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <StatsBar categories={filtered} />

      <FilterBar
        selectedBuckets={selectedBuckets}
        onToggleBucket={bucket => {
          setSelectedBuckets(prev =>
            prev.includes(bucket) ? prev.filter(b => b !== bucket) : [...prev, bucket]
          );
        }}
        onClearBuckets={() => setSelectedBuckets([])}
        sortKey={sortKey}
        onSortChange={setSortKey}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        minDisruption={minDisruption}
        onMinDisruptionChange={setMinDisruption}
        maxTimeHorizon={maxTimeHorizon}
        onMaxTimeHorizonChange={setMaxTimeHorizon}
        minStartupOpp={minStartupOpp}
        onMinStartupOppChange={setMinStartupOpp}
        gtmMotions={gtmMotions}
        onToggleGtm={m =>
          setGtmMotions(prev => (prev.includes(m) ? prev.filter(g => g !== m) : [...prev, m]))
        }
        onResetAll={resetAll}
        isFiltered={isFiltered}
        resultCount={filtered.length}
      />

      <div className="mt-6 flex flex-col xl:flex-row gap-6 xl:min-h-[600px]">
        {/* Main bubble chart area */}
        <div className="flex-1 min-w-0">
          <BubbleChart
            categories={sorted}
            onSelect={setSelectedCategory}
            selectedId={selectedCategory?.id}
            onToggleBucket={(b) =>
              setSelectedBuckets(prev =>
                prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
              )
            }
            activeBuckets={selectedBuckets}
          />
        </div>

        {/* Rankings sidebar — full-width on mobile/tablet (stacks below chart), 320px sidebar at xl+ */}
        <div className="w-full xl:w-80 shrink-0">
          <RankingsSidebar
            categories={sorted}
            onSelect={setSelectedCategory}
            selectedId={selectedCategory?.id}
          />
        </div>
      </div>

      {/* Detail panel */}
      <CategoryDetailPanel
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
}
