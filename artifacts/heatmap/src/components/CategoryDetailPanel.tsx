import { motion, AnimatePresence } from 'framer-motion';
import { Category, BUCKETS } from '@/types';
import { X, ExternalLink, ChevronRight, BarChart3, Cpu, Target, Link, Lightbulb, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import RadarChart from './RadarChart';
import SupplyChainViz from './SupplyChainViz';
import LLMDrawer from './LLMDrawer';
import { useState, useEffect } from 'react';
import LLMSettingsModal from './LLMSettingsModal';
import { useMarketQuotes, formatLiveQuote } from '@/hooks/use-market-quotes';
import type { Vendor } from '@/types';

function VendorValuation({
  vendor,
  quote,
}: {
  vendor: Vendor;
  quote?: ReturnType<typeof useMarketQuotes>['quotes'][string];
}) {
  if (quote) {
    return (
      <div className="text-right shrink-0 max-w-[55%]">
        <div className="text-xs font-mono text-foreground leading-tight">{formatLiveQuote(quote)}</div>
        <div className="text-[10px] text-muted-foreground">Yahoo Finance · {quote.ticker}</div>
      </div>
    );
  }
  return (
    <span className="text-xs text-muted-foreground font-mono shrink-0">{vendor.marketCapOrValuation}</span>
  );
}

interface Props {
  category: Category | null;
  onClose: () => void;
}

function ScoreRing({ value, color, label }: { value: number; color: string; label: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 10) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold tabular-nums" style={{ color }}>
            {value.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-1 text-center leading-tight">{label}</div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 text-xs text-muted-foreground shrink-0">{label}</div>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(value / 10) * 100}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-8 text-xs font-mono font-semibold text-foreground text-right">{value.toFixed(1)}</div>
    </div>
  );
}

const GTM_LABELS = {
  'top-down': 'Top-Down Enterprise',
  plg: 'Product-Led Growth',
  channel: 'Channel / Partner',
  vertical: 'Vertical Specialist',
};

export default function CategoryDetailPanel({ category, onClose }: Props) {
  const [llmSettingsOpen, setLlmSettingsOpen] = useState(false);
  const bucket = category ? BUCKETS.find(b => b.id === category.bucket) : undefined;
  const color = bucket?.color ?? '#3b82f6';
  const allVendors = category
    ? [...category.incumbents, ...category.challengers]
    : undefined;
  const { quotes: liveQuotes } = useMarketQuotes(allVendors);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <>
      <AnimatePresence>
        {category && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {category && (
          <motion.div
            key="drawer"
            initial={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={
              isMobile
                ? 'fixed left-0 right-0 bottom-0 top-12 z-50 bg-background border-t border-border shadow-xl flex flex-col rounded-t-2xl'
                : 'fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background border-l border-border shadow-xl flex flex-col'
            }
          >
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-border shrink-0">
          <div
            className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground leading-tight">{category.name}</h2>
              <Badge variant="secondary" className="text-xs font-normal" style={{ backgroundColor: `${color}20`, color }}>
                {bucket?.label}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal gap-1 text-muted-foreground">
                <Calendar className="w-2.5 h-2.5" />
                As of {new Date(category.lastUpdated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs font-normal">{GTM_LABELS[category.gtmMotion]}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Thesis */}
            <p className="text-sm text-foreground leading-relaxed mb-4">{category.thesis}</p>

            {/* Financial row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="text-xs text-muted-foreground">TAM</div>
                <div className="text-base font-bold text-foreground tabular-nums">${category.marketSize}B</div>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="text-xs text-muted-foreground">CAGR</div>
                <div className="text-base font-bold text-foreground tabular-nums">{category.cagr}%</div>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="text-xs text-muted-foreground">Revenue Multiple</div>
                <div className="text-sm font-semibold text-foreground">{category.revenueMultiple}</div>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="text-xs text-muted-foreground">Time Horizon</div>
                <div className="text-base font-bold text-foreground tabular-nums">{category.scores.timeHorizon} yrs</div>
              </div>
            </div>

            {/* Score overview row */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Composite + headline scores as rings */}
              <div className="col-span-2 sm:col-span-1 rounded-lg border border-border bg-card p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Headline Scores</div>
                <div className="grid grid-cols-3 gap-2 py-1">
                  <ScoreRing value={category.composite} color={color} label="Composite" />
                  <ScoreRing value={category.supplyChainVulnerability} color={color} label="Supply Chain" />
                  <ScoreRing value={category.startupOpportunity} color={color} label="Startup Opp." />
                </div>
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Sub-scores</div>
                  <ScoreBar label="Disruption Risk" value={category.scores.disruptionRisk} color={color} />
                  <ScoreBar label="AI Readiness" value={category.scores.aiNativeReadiness} color={color} />
                  <ScoreBar label="Agent Surface" value={category.scores.agentSurfaceArea} color={color} />
                  <ScoreBar label="Unstructured Data" value={category.scores.unstructuredDensity} color={color} />
                  <ScoreBar label="Incumbent Moat" value={category.scores.incumbentMoat} color={color} />
                </div>
              </div>

              {/* Radar */}
              <div className="col-span-2 sm:col-span-1 rounded-lg border border-border bg-card p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Score Profile</div>
                <RadarChart category={category} />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="supply-chain">
              <TabsList className="w-full grid grid-cols-5 h-9 text-xs">
                <TabsTrigger value="supply-chain" className="text-xs gap-1"><Link className="w-3 h-3" />Supply Chain</TabsTrigger>
                <TabsTrigger value="product" className="text-xs gap-1"><Cpu className="w-3 h-3" />Product</TabsTrigger>
                <TabsTrigger value="gtm" className="text-xs gap-1"><Target className="w-3 h-3" />GTM</TabsTrigger>
                <TabsTrigger value="players" className="text-xs gap-1"><BarChart3 className="w-3 h-3" />Players</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs gap-1"><Sparkles className="w-3 h-3" />AI Dive</TabsTrigger>
              </TabsList>

              {/* Supply Chain Tab */}
              <TabsContent value="supply-chain" className="mt-4">
                <SupplyChainViz supplyChain={category.supplyChain} bucket={category.bucket} />
              </TabsContent>

              {/* Product Architecture Tab */}
              <TabsContent value="product" className="mt-4 space-y-4">
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Data Ingestion</div>
                    <p className="text-sm text-foreground leading-relaxed">{category.productArchitecture.dataIngestion}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">AI Primitives</div>
                    <ul className="space-y-1">
                      {category.productArchitecture.aiPrimitives.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Integration Surface</div>
                    <div className="flex flex-wrap gap-1.5">
                      {category.productArchitecture.integrationSurface.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Deployment Model</div>
                    <p className="text-sm text-foreground leading-relaxed">{category.productArchitecture.deploymentModel}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Key Technologies</div>
                    <div className="flex flex-wrap gap-1.5">
                      {category.productArchitecture.keyTechnologies.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Build vs. Buy</div>
                    <p className="text-sm text-foreground leading-relaxed">{category.productArchitecture.buildVsBuy}</p>
                  </div>
                </div>
              </TabsContent>

              {/* GTM Tab */}
              <TabsContent value="gtm" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Motion', value: GTM_LABELS[category.gtmStrategy.motion] },
                    { label: 'Buyer Persona', value: category.gtmStrategy.buyerPersona },
                    { label: 'Deal Size', value: category.gtmStrategy.dealSizeRange },
                    { label: 'Sales Cycle', value: category.gtmStrategy.salesCycle },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg border border-border bg-card p-3">
                      <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                      <div className="text-xs font-semibold text-foreground leading-snug">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">GTM Rationale</div>
                    <p className="text-sm text-foreground leading-relaxed">{category.gtmStrategy.rationale}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Top Channels</div>
                    <ul className="space-y-1">
                      {category.gtmStrategy.topChannels.map((ch, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <span>{ch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Land & Expand Path</div>
                    <p className="text-sm text-foreground leading-relaxed">{category.gtmStrategy.landAndExpandPath}</p>
                  </div>
                </div>

                {/* Startup Wedges */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    Startup Wedge Ideas
                  </div>
                  <div className="space-y-2">
                    {category.startupWedges.map((w, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                        <div className="text-sm font-medium text-foreground leading-snug">{w.thesis}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Target:</span> {w.targetCustomer}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Moat:</span> {w.moat}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Players Tab */}
              <TabsContent value="players" className="mt-4 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Incumbents at Risk</div>
                  <div className="space-y-2">
                    {category.incumbents.map((v, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <a href={v.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-semibold text-foreground hover:text-primary flex items-center gap-1">
                            {v.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                          <VendorValuation vendor={v} quote={liveQuotes[v.name]} />
                        </div>
                        {v.keyProduct && (
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80 mb-0.5">
                            Key product: <span className="text-foreground/80 normal-case tracking-normal font-medium">{v.keyProduct}</span>
                          </div>
                        )}
                        {v.vulnerability && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{v.vulnerability}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Challengers & Startups</div>
                  <div className="space-y-2">
                    {category.challengers.map((v, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <a href={v.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-semibold text-foreground hover:text-primary flex items-center gap-1">
                            {v.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                          <VendorValuation vendor={v} quote={liveQuotes[v.name]} />
                        </div>
                        {v.keyProduct && (
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                            Key product: <span className="text-foreground/80 normal-case tracking-normal font-medium">{v.keyProduct}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signals */}
                {category.signals.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Market Signals</div>
                    <div className="space-y-2">
                      {category.signals.map((s, i) => {
                        const typeColors = { funding: 'bg-green-500/15 text-green-600 dark:text-green-400', mna: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', product: 'bg-purple-500/15 text-purple-600 dark:text-purple-400', leadership: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' };
                        return (
                          <div key={i} className="rounded-lg border border-border bg-card p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[s.type]}`}>
                                {s.type.toUpperCase()}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">{s.date}</span>
                              {s.sourceUrl && (
                                <a
                                  href={s.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-0.5"
                                >
                                  source <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-foreground leading-relaxed">{s.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Public comps */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Public Comps</div>
                  <div className="flex flex-wrap gap-1.5">
                    {category.publicComps.map((c, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg border border-border bg-muted text-foreground font-mono">{c}</span>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* AI Deep Dive Tab */}
              <TabsContent value="ai" className="mt-4">
                <LLMDrawer category={category} onOpenSettings={() => setLlmSettingsOpen(true)} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LLMSettingsModal open={llmSettingsOpen} onClose={() => setLlmSettingsOpen(false)} />
    </>
  );
}
