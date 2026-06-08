import { Category, BUCKETS } from '@/types';
import { TrendingUp, Zap, Clock, Link as LinkIcon } from 'lucide-react';

interface Props {
  categories: Category[];
  onSelect: (c: Category) => void;
  selectedId?: string;
}

type LeaderboardId = 'risk' | 'opp' | 'imminent' | 'supply';

interface Leaderboard {
  id: LeaderboardId;
  label: string;
  short: string;
  icon: React.ElementType;
  sort: (a: Category, b: Category) => number;
  fmt: (c: Category) => string;
  pickValue: (c: Category) => number;
}

const LEADERBOARDS: Leaderboard[] = [
  {
    id: 'risk',
    label: 'Top 10 Disruption Risk',
    short: 'Risk',
    icon: Zap,
    sort: (a, b) => b.scores.disruptionRisk - a.scores.disruptionRisk,
    fmt: c => c.scores.disruptionRisk.toFixed(1),
    pickValue: c => c.scores.disruptionRisk,
  },
  {
    id: 'opp',
    label: 'Top 10 Startup Opportunity',
    short: 'Opp.',
    icon: TrendingUp,
    sort: (a, b) => b.startupOpportunity - a.startupOpportunity,
    fmt: c => c.startupOpportunity.toFixed(1),
    pickValue: c => c.startupOpportunity,
  },
  {
    id: 'imminent',
    label: 'Most Imminent (Soonest Disruption)',
    short: 'Imminent',
    icon: Clock,
    sort: (a, b) => a.scores.timeHorizon - b.scores.timeHorizon || b.scores.disruptionRisk - a.scores.disruptionRisk,
    fmt: c => `${c.scores.timeHorizon}y`,
    pickValue: c => 10 - c.scores.timeHorizon,
  },
  {
    id: 'supply',
    label: 'Top 10 Supply Chain Vulnerability',
    short: 'Supply',
    icon: LinkIcon,
    sort: (a, b) => b.supplyChainVulnerability - a.supplyChainVulnerability,
    fmt: c => c.supplyChainVulnerability.toFixed(1),
    pickValue: c => c.supplyChainVulnerability,
  },
];

function LeaderboardList({
  categories,
  board,
  onSelect,
  selectedId,
}: {
  categories: Category[];
  board: Leaderboard;
  onSelect: (c: Category) => void;
  selectedId?: string;
}) {
  const top = [...categories].sort(board.sort).slice(0, 10);
  return (
    <div className="p-2 space-y-0.5">
      {top.map((cat, i) => {
        const bucket = BUCKETS.find(b => b.id === cat.bucket);
        const isSelected = cat.id === selectedId;
        const score = board.fmt(cat);
        const value = board.pickValue(cat);
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={`w-full text-left rounded-lg px-3 py-2 transition-colors flex items-center gap-2 group ${
              isSelected ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/50 text-foreground'
            }`}
          >
            <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: bucket?.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate leading-tight">{cat.name}</div>
              <div className="text-xs text-muted-foreground truncate">{bucket?.label.split(' ')[0]}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-bold tabular-nums" style={{ color: isSelected ? undefined : bucket?.color }}>
                {score}
              </div>
              <div className="w-12 h-1 rounded-full bg-muted overflow-hidden mt-0.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(value / 10) * 100}%`, backgroundColor: bucket?.color }}
                />
              </div>
            </div>
          </button>
        );
      })}
      {top.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-6">No categories match current filters</div>
      )}
    </div>
  );
}

export default function RankingsSidebar({ categories, onSelect, selectedId }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
        <div className="text-xs font-semibold text-foreground">Leaderboards</div>
        <div className="text-[11px] text-muted-foreground">Top 10 per dimension</div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {LEADERBOARDS.map(b => {
          const Icon = b.icon;
          return (
            <section key={b.id}>
              <div className="px-4 py-2 flex items-center gap-2 bg-muted/30 sticky top-0 z-10 backdrop-blur">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">{b.label}</span>
              </div>
              <LeaderboardList categories={categories} board={b} onSelect={onSelect} selectedId={selectedId} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
