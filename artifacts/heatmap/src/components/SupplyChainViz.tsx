import { SupplyChain, BUCKETS, BucketId } from '@/types';
import { ArrowRight, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Props {
  supplyChain: SupplyChain;
  bucket: BucketId;
}

const VULN_CONFIG = {
  high: { label: 'High Vulnerability', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
  medium: { label: 'Medium Vulnerability', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  low: { label: 'Low Vulnerability', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20', icon: Info },
};

interface NodeProps {
  title: string;
  players: string[];
  aiImpact: string;
  vulnerability: 'high' | 'medium' | 'low';
  startupOpportunity?: string;
  color: string;
}

function SCNode({ title, players, aiImpact, vulnerability, startupOpportunity, color }: NodeProps) {
  const vuln = VULN_CONFIG[vulnerability];
  const VulnIcon = vuln.icon;

  return (
    <div className="flex-1 min-w-0 rounded-lg border border-border bg-card p-3.5 flex flex-col gap-2.5">
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
        <div>
          <div className="text-xs font-semibold text-foreground leading-tight">{title}</div>
          <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-1.5 py-0.5 rounded-md border ${vuln.bg} ${vuln.color}`}>
            <VulnIcon className="w-2.5 h-2.5" />
            {vuln.label}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground font-medium mb-1">Key Players</div>
        <div className="flex flex-wrap gap-1">
          {players.map((p, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground font-medium mb-1">AI Impact</div>
        <p className="text-xs text-foreground leading-relaxed">{aiImpact}</p>
      </div>

      {startupOpportunity && (
        <div className="rounded-md bg-primary/8 border border-primary/15 p-2">
          <div className="text-xs font-medium text-primary mb-0.5">Startup Wedge</div>
          <p className="text-xs text-foreground leading-relaxed">{startupOpportunity}</p>
        </div>
      )}
    </div>
  );
}

export default function SupplyChainViz({ supplyChain, bucket }: Props) {
  const bucketMeta = BUCKETS.find(b => b.id === bucket);
  const color = bucketMeta?.color ?? '#3b82f6';

  return (
    <div className="space-y-4">
      {/* Key insight */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3">
        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Key Strategic Insight</div>
        <p className="text-sm text-foreground leading-relaxed">{supplyChain.keyInsight}</p>
      </div>

      {/* Best insertion point */}
      <div className="rounded-lg border border-primary/20 bg-primary/8 p-3">
        <div className="text-xs font-semibold text-primary mb-1">Best Startup Insertion Point</div>
        <p className="text-sm text-foreground leading-relaxed">{supplyChain.bestInsertionPoint}</p>
      </div>

      {/* Chain nodes */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <SCNode
          title={supplyChain.inputProviders.label}
          players={supplyChain.inputProviders.players}
          aiImpact={supplyChain.inputProviders.aiImpact}
          vulnerability={supplyChain.inputProviders.vulnerability}
          startupOpportunity={supplyChain.inputProviders.startupOpportunity}
          color={color}
        />
        <div className="flex items-center justify-center text-muted-foreground md:shrink-0">
          <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
        </div>
        <SCNode
          title={supplyChain.intermediaries.label}
          players={supplyChain.intermediaries.players}
          aiImpact={supplyChain.intermediaries.aiImpact}
          vulnerability={supplyChain.intermediaries.vulnerability}
          startupOpportunity={supplyChain.intermediaries.startupOpportunity}
          color={color}
        />
        <div className="flex items-center justify-center text-muted-foreground md:shrink-0">
          <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
        </div>
        <SCNode
          title={supplyChain.endBuyers.label}
          players={supplyChain.endBuyers.players}
          aiImpact={supplyChain.endBuyers.aiImpact}
          vulnerability={supplyChain.endBuyers.vulnerability}
          color={color}
        />
      </div>
    </div>
  );
}
