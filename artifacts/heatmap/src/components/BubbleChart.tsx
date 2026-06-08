import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { Category, BUCKETS, BucketId } from '@/types';
import { useMemo, useState } from 'react';

interface Props {
  categories: Category[];
  onSelect: (c: Category) => void;
  selectedId?: string;
  onToggleBucket?: (b: BucketId) => void;
  activeBuckets?: BucketId[];
}

type YMetric = 'disruptionRisk' | 'startupOpportunity' | 'supplyChainVulnerability';

const Y_METRICS: { id: YMetric; label: string; short: string; min: number; max: number }[] = [
  { id: 'disruptionRisk', label: 'Disruption Risk', short: 'Risk', min: 5.5, max: 10.4 },
  { id: 'startupOpportunity', label: 'Startup Opportunity', short: 'Startup Opp.', min: 5.5, max: 10.4 },
  { id: 'supplyChainVulnerability', label: 'Supply Chain Vulnerability', short: 'Supply Vuln.', min: 5.5, max: 10.4 },
];

interface BubbleDatum {
  x: number;
  y: number;
  z: number;
  raw: Category;
  showLabel: boolean;
  labelIndex: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: BubbleDatum }>;
}

// Deterministic pseudo-random in [-1, 1] from a string id
function seededJitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h % 1000) + 1000) % 1000) / 500 - 1;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const cat = payload[0]?.payload?.raw;
  if (!cat) return null;
  const bucket = BUCKETS.find(b => b.id === cat.bucket);
  return (
    <div className="bg-popover border border-popover-border rounded-lg shadow-lg p-3 max-w-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: bucket?.color }}
        />
        <span className="text-xs text-muted-foreground">{bucket?.label}</span>
      </div>
      <div className="font-semibold text-sm text-foreground mb-2">{cat.name}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">Disruption Risk</span>
        <span className="font-medium tabular-nums">{cat.scores.disruptionRisk.toFixed(1)}</span>
        <span className="text-muted-foreground">Time Horizon</span>
        <span className="font-medium tabular-nums">{cat.scores.timeHorizon} yrs</span>
        <span className="text-muted-foreground">Composite</span>
        <span className="font-medium tabular-nums">{cat.composite.toFixed(1)}</span>
        <span className="text-muted-foreground">Startup Opp.</span>
        <span className="font-medium tabular-nums">{cat.startupOpportunity.toFixed(1)}</span>
        <span className="text-muted-foreground">Supply Chain Vuln.</span>
        <span className="font-medium tabular-nums">{cat.supplyChainVulnerability.toFixed(1)}</span>
        <span className="text-muted-foreground">TAM</span>
        <span className="font-medium tabular-nums">${cat.marketSize}B</span>
        <span className="text-muted-foreground">GTM Motion</span>
        <span className="font-medium uppercase text-[10px] tracking-wide">{cat.gtmStrategy?.motion ?? '—'}</span>
      </div>
      <div className="mt-2 text-xs text-primary">Click to explore →</div>
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: BubbleDatum;
  onSelect: (c: Category) => void;
  selectedId?: string;
  focusedBucket: BucketId | null;
}

const CustomDot = (props: CustomDotProps) => {
  const { cx, cy, payload, onSelect, selectedId, focusedBucket } = props;
  const cat = payload?.raw;
  if (!cat || cx === undefined || cy === undefined) return null;
  const bucket = BUCKETS.find(b => b.id === cat.bucket);
  const color = bucket?.color ?? '#888';
  const isSelected = cat.id === selectedId;
  const dimmed = focusedBucket !== null && cat.bucket !== focusedBucket;
  const r = Math.max(7, Math.min(24, 7 + Math.sqrt(cat.marketSize / 2000) * 18));

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(cat)}
    >
      {isSelected && (
        <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity={0.2} />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        opacity={dimmed ? 0.12 : isSelected ? 1 : 0.78}
        stroke={isSelected ? color : 'white'}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />
      {payload?.showLabel && !dimmed && (() => {
        const idx = payload.labelIndex;
        // Stagger labels vertically and horizontally so they don't collide
        const yOffset = -(r + 10 + (idx % 3) * 14);
        const xOffset = idx < 3 ? 0 : (idx % 2 === 0 ? -55 : 55);
        const anchor: 'start' | 'middle' | 'end' =
          xOffset === 0 ? 'middle' : xOffset > 0 ? 'start' : 'end';
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={cx}
              y1={cy - r}
              x2={cx + xOffset * 0.5}
              y2={cy + yOffset + 3}
              stroke={color}
              strokeWidth={1}
              opacity={0.55}
            />
            <text
              x={cx + xOffset}
              y={cy + yOffset}
              textAnchor={anchor}
              fontSize={10.5}
              fontWeight={600}
              fill="hsl(var(--foreground))"
              style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 3 }}
            >
              {cat.name.length > 22 ? cat.name.slice(0, 20) + '…' : cat.name}
            </text>
          </g>
        );
      })()}
    </g>
  );
};

export default function BubbleChart({ categories, onSelect, selectedId, onToggleBucket, activeBuckets = [] }: Props) {
  const [focusedBucket, setFocusedBucket] = useState<BucketId | null>(null);
  const [yMetric, setYMetric] = useState<YMetric>('disruptionRisk');
  const [showLabels, setShowLabels] = useState(true);

  const yMeta = Y_METRICS.find(m => m.id === yMetric)!;

  function valueFor(c: Category, m: YMetric): number {
    if (m === 'disruptionRisk') return c.scores.disruptionRisk;
    if (m === 'startupOpportunity') return c.startupOpportunity;
    return c.supplyChainVulnerability;
  }

  const data = useMemo(() => {
    // Top 5 by current Y metric get persistent labels (with stagger index)
    const topOrdered = [...categories]
      .sort((a, b) => valueFor(b, yMetric) - valueFor(a, yMetric))
      .slice(0, 5);
    const labelIndexById = new Map<string, number>();
    topOrdered.forEach((c, i) => labelIndexById.set(c.id, i));
    return categories.map(c => ({
      x: c.scores.timeHorizon + seededJitter(c.id) * 0.32,
      y: valueFor(c, yMetric) + seededJitter(c.id + 'y') * 0.08,
      z: c.marketSize,
      raw: c,
      showLabel: showLabels && labelIndexById.has(c.id),
      labelIndex: labelIndexById.get(c.id) ?? -1,
    }));
  }, [categories, yMetric, showLabels]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Disruption Matrix</h2>
          <p className="text-xs text-muted-foreground">
            X: Time Horizon (yrs) · Y: {yMeta.label} · Bubble size: TAM
            {showLabels ? ' · Top 5 labeled' : ''}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="mr-1">Y axis:</span>
              {Y_METRICS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setYMetric(m.id)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    yMetric === m.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border hover:text-foreground'
                  }`}
                >
                  {m.short}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={e => setShowLabels(e.target.checked)}
                className="accent-foreground"
              />
              Show top labels
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end max-w-md">
          {BUCKETS.map(b => {
            const hovered = focusedBucket === b.id;
            const filtered = activeBuckets.includes(b.id);
            return (
              <button
                key={b.id}
                onMouseEnter={() => setFocusedBucket(b.id)}
                onMouseLeave={() => setFocusedBucket(null)}
                onClick={() => onToggleBucket?.(b.id)}
                title={filtered ? `Click to remove ${b.label} filter` : `Click to filter to ${b.label}`}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                  filtered
                    ? 'text-background border-foreground'
                    : hovered
                    ? 'border-foreground text-foreground bg-accent'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                style={
                  filtered
                    ? { background: b.color, borderColor: b.color, color: '#fff' }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <span>{b.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[560px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 50, right: 40, bottom: 30, left: 30 }}>
            {/* Quadrant shading: top-left = imminent + high risk = "Act Now" */}
            <ReferenceArea
              x1={0.5}
              x2={3}
              y1={8.5}
              y2={10}
              fill="#ef4444"
              fillOpacity={0.06}
              stroke="none"
              ifOverflow="visible"
            />
            <ReferenceArea
              x1={3}
              x2={7.5}
              y1={8.5}
              y2={10}
              fill="#f59e0b"
              fillOpacity={0.05}
              stroke="none"
              ifOverflow="visible"
            />
            <ReferenceArea
              x1={0.5}
              x2={3}
              y1={5.5}
              y2={8.5}
              fill="#3b82f6"
              fillOpacity={0.04}
              stroke="none"
              ifOverflow="visible"
            />

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />

            <XAxis
              type="number"
              dataKey="x"
              domain={[0.5, 7.5]}
              name="Time Horizon"
              label={{
                value: '← Sooner    Time Horizon (yrs)    Later →',
                position: 'insideBottom',
                offset: -10,
                fontSize: 11,
                fill: 'hsl(var(--muted-foreground))',
              }}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              ticks={[1, 2, 3, 4, 5, 6, 7]}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[yMeta.min, yMeta.max]}
              name={yMeta.label}
              label={{
                value: `${yMeta.label} →`,
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fontSize: 11,
                fill: 'hsl(var(--muted-foreground))',
              }}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
            />
            <ZAxis type="number" dataKey="z" range={[200, 2000]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />

            <ReferenceLine
              y={8.5}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              x={3}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
            />

            {/* Quadrant corner labels */}
            <ReferenceLine
              segment={[
                { x: 0.7, y: 9.85 },
                { x: 0.7, y: 9.85 },
              ]}
              stroke="transparent"
              label={{
                value: 'ACT NOW',
                position: 'insideTopLeft',
                fontSize: 10,
                fontWeight: 700,
                fill: '#ef4444',
                offset: 0,
              }}
            />
            <ReferenceLine
              segment={[
                { x: 7.3, y: 9.85 },
                { x: 7.3, y: 9.85 },
              ]}
              stroke="transparent"
              label={{
                value: 'PLAN AHEAD',
                position: 'insideTopRight',
                fontSize: 10,
                fontWeight: 700,
                fill: '#f59e0b',
                offset: 0,
              }}
            />
            <ReferenceLine
              segment={[
                { x: 0.7, y: 5.7 },
                { x: 0.7, y: 5.7 },
              ]}
              stroke="transparent"
              label={{
                value: 'QUICK WINS',
                position: 'insideBottomLeft',
                fontSize: 10,
                fontWeight: 700,
                fill: '#3b82f6',
                offset: 0,
              }}
            />
            <ReferenceLine
              segment={[
                { x: 7.3, y: 5.7 },
                { x: 7.3, y: 5.7 },
              ]}
              stroke="transparent"
              label={{
                value: 'WATCH',
                position: 'insideBottomRight',
                fontSize: 10,
                fontWeight: 700,
                fill: 'hsl(var(--muted-foreground))',
                offset: 0,
              }}
            />

            <Scatter
              data={data}
              isAnimationActive
              animationDuration={500}
              shape={(props: object) => (
                <CustomDot
                  {...(props as Omit<CustomDotProps, 'onSelect' | 'selectedId' | 'focusedBucket'>)}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  focusedBucket={focusedBucket}
                />
              )}
            >
              {data.map((_, i) => (
                <Cell key={i} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span>Hover a sector chip to focus · click to filter the heatmap · click any bubble for full detail</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Act Now</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Plan Ahead</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Quick Wins</span>
        </span>
      </div>
    </div>
  );
}
