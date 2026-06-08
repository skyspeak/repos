import { BUCKETS, BucketId, GtmMotion } from '@/types';
import { SortKey } from '@/pages/HeatmapPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X, Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  selectedBuckets: BucketId[];
  onToggleBucket: (b: BucketId) => void;
  onClearBuckets: () => void;

  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;

  searchQuery: string;
  onSearchChange: (q: string) => void;

  minDisruption: number;
  onMinDisruptionChange: (v: number) => void;

  maxTimeHorizon: number;
  onMaxTimeHorizonChange: (v: number) => void;

  minStartupOpp: number;
  onMinStartupOppChange: (v: number) => void;

  gtmMotions: GtmMotion[];
  onToggleGtm: (m: GtmMotion) => void;

  onResetAll: () => void;
  isFiltered: boolean;
  resultCount: number;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'composite', label: 'Composite Score' },
  { value: 'disruptionRisk', label: 'Disruption Risk' },
  { value: 'timeHorizon', label: 'Most Imminent' },
  { value: 'supplyChainVulnerability', label: 'Supply Chain Vulnerability' },
  { value: 'startupOpportunity', label: 'Startup Opportunity' },
  { value: 'marketSize', label: 'Market Size (TAM)' },
  { value: 'cagr', label: 'CAGR' },
];

const GTM_OPTIONS: { value: GtmMotion; label: string }[] = [
  { value: 'top-down', label: 'Top-Down' },
  { value: 'plg', label: 'PLG' },
  { value: 'channel', label: 'Channel' },
  { value: 'vertical', label: 'Vertical' },
];

export default function FilterBar(props: Props) {
  const {
    selectedBuckets, onToggleBucket,
    sortKey, onSortChange,
    searchQuery, onSearchChange,
    minDisruption, onMinDisruptionChange,
    maxTimeHorizon, onMaxTimeHorizonChange,
    minStartupOpp, onMinStartupOppChange,
    gtmMotions, onToggleGtm,
    onResetAll, isFiltered, resultCount,
  } = props;

  return (
    <div className="space-y-3">
      {/* Search + Sort row */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search categories, vendors, or theses..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Advanced filters
              {(minDisruption > 0 || maxTimeHorizon < 7 || minStartupOpp > 0 || gtmMotions.length > 0) && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {[
                    minDisruption > 0,
                    maxTimeHorizon < 7,
                    minStartupOpp > 0,
                    gtmMotions.length > 0,
                  ].filter(Boolean).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Min Disruption Risk</label>
                <span className="text-xs font-mono text-muted-foreground">≥ {minDisruption.toFixed(1)}</span>
              </div>
              <Slider
                value={[minDisruption]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={v => onMinDisruptionChange(v[0])}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Max Time Horizon (years)</label>
                <span className="text-xs font-mono text-muted-foreground">≤ {maxTimeHorizon}y</span>
              </div>
              <Slider
                value={[maxTimeHorizon]}
                min={1}
                max={7}
                step={1}
                onValueChange={v => onMaxTimeHorizonChange(v[0])}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Min Startup Opportunity</label>
                <span className="text-xs font-mono text-muted-foreground">≥ {minStartupOpp.toFixed(1)}</span>
              </div>
              <Slider
                value={[minStartupOpp]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={v => onMinStartupOppChange(v[0])}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">GTM Motion</div>
              <div className="flex flex-wrap gap-1.5">
                {GTM_OPTIONS.map(g => {
                  const active = gtmMotions.includes(g.value);
                  return (
                    <button
                      key={g.value}
                      onClick={() => onToggleGtm(g.value)}
                      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground border-transparent'
                          : 'border-border text-muted-foreground hover:text-foreground bg-background'
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortKey} onValueChange={v => onSortChange(v as SortKey)}>
          <SelectTrigger className="h-8 text-sm w-52">
            <span className="text-muted-foreground text-xs mr-1">Sort:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onResetAll} className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-3 h-3" />
            Reset all
          </Button>
        )}

        <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          <span className="font-semibold text-foreground">{resultCount}</span> shown
        </div>
      </div>

      {/* Bucket filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {BUCKETS.map(bucket => {
          const active = selectedBuckets.includes(bucket.id);
          return (
            <button
              key={bucket.id}
              onClick={() => onToggleBucket(bucket.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                active
                  ? 'text-white border-transparent'
                  : 'text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground bg-background'
              }`}
              style={active ? { backgroundColor: bucket.color, borderColor: bucket.color } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: active ? 'rgba(255,255,255,0.8)' : bucket.color }}
              />
              {bucket.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
