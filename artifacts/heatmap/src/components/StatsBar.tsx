import { Category } from '@/types';
import { useMemo } from 'react';

interface Props {
  categories: Category[];
}

export default function StatsBar({ categories }: Props) {
  const stats = useMemo(() => {
    if (!categories.length) return null;
    const totalTAM = categories.reduce((s, c) => s + c.marketSize, 0);
    const avgComposite = categories.reduce((s, c) => s + c.composite, 0) / categories.length;
    const avgCAGR = categories.reduce((s, c) => s + c.cagr, 0) / categories.length;
    const topDisruption = [...categories].sort((a, b) => b.scores.disruptionRisk - a.scores.disruptionRisk)[0];
    return { totalTAM, avgComposite, avgCAGR, topDisruption };
  }, [categories]);

  if (!stats) return null;

  const items = [
    { label: 'Categories', value: categories.length.toString(), sub: 'in view' },
    { label: 'Combined TAM', value: `$${stats.totalTAM}B`, sub: 'addressable market' },
    { label: 'Avg Composite Score', value: stats.avgComposite.toFixed(1), sub: 'out of 10.0' },
    { label: 'Avg Market CAGR', value: `${stats.avgCAGR.toFixed(0)}%`, sub: '3-year projected' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {items.map(item => (
        <div key={item.label} className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-xl font-bold tracking-tight text-foreground">{item.value}</div>
          <div className="text-xs font-medium text-foreground mt-0.5">{item.label}</div>
          <div className="text-xs text-muted-foreground">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
