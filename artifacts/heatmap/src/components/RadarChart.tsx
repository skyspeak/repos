import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Category, BUCKETS } from '@/types';

interface Props {
  category: Category;
}

export default function RadarChart({ category }: Props) {
  const bucket = BUCKETS.find(b => b.id === category.bucket);
  const color = bucket?.color ?? '#3b82f6';

  // Spec-aligned 6 dimensions. Time Horizon is inverted so "sooner" reads as
  // higher on the chart (a more disruptive signal), matching the rest of the
  // dimensions where higher = more disruption opportunity.
  const data = [
    { axis: 'Disruption Risk', value: category.scores.disruptionRisk },
    { axis: 'Time Horizon', value: 11 - category.scores.timeHorizon },
    { axis: 'Incumbent Moat', value: category.scores.incumbentMoat },
    { axis: 'AI-Native Readiness', value: category.scores.aiNativeReadiness },
    { axis: 'Unstructured Density', value: category.scores.unstructuredDensity },
    { axis: 'Agent Surface Area', value: category.scores.agentSurfaceArea },
  ];

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Tooltip
            formatter={(v: number, _n, p) => {
              const axis = p?.payload?.axis as string | undefined;
              if (axis === 'Time Horizon') {
                return [`${(11 - v).toFixed(1)} yrs`, axis];
              }
              return [v.toFixed(1), axis ?? 'Score'];
            }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Radar
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
