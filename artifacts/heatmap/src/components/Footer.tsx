import { Link } from 'wouter';

interface Props {
  lastUpdated?: string;
  totalCategories?: number;
}

export default function Footer({ lastUpdated, totalCategories }: Props) {
  const stamp = lastUpdated ?? new Date().toISOString().slice(0, 10);
  return (
    <footer className="border-t border-border mt-12 px-4 sm:px-6 lg:px-8 py-6 bg-muted/20">
      <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          <div className="font-semibold text-foreground">AI Disruption Heatmap</div>
          <div>
            Independent research · {totalCategories ?? 40} industry categories
            tracked · Data current as of <span className="tabular-nums">{stamp}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/methodology" className="hover:text-foreground transition-colors">
            Methodology
          </Link>
          <span>·</span>
          <span>Built with React + Vite + Recharts</span>
        </div>
      </div>
    </footer>
  );
}
