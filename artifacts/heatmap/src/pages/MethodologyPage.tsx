import { CATEGORIES } from '@/data/categories';
import { BUCKETS } from '@/types';
import { BarChart2, Link, Target, Zap, TrendingUp, Shield, Clock, Brain, Database, Users, Layers, DollarSign, RefreshCw } from 'lucide-react';

const SCORE_DIMENSIONS = [
  {
    icon: Zap,
    name: 'Disruption Risk',
    description: 'How fundamentally AI changes or eliminates the core value proposition of incumbents in this category. 10 = complete displacement; 5 = significant augmentation; 1 = AI adds features but does not threaten the business model.',
    weight: '20%',
  },
  {
    icon: Clock,
    name: 'Time Horizon',
    description: 'Estimated years until AI-native solutions capture >25% market share. Lower = sooner disruption. Scored 1–10 where 1 = disruption is happening now (2025) and 10 = 7+ years away.',
    weight: '10%',
  },
  {
    icon: Shield,
    name: 'Incumbent Moat',
    description: 'Strength of existing players\' defensibility against AI-native entrants. High moat = difficult for startups; low moat = open door for disruption. Scored 1–10.',
    weight: '15%',
  },
  {
    icon: Brain,
    name: 'AI Native Readiness',
    description: 'How well-suited the category\'s core workflows are for current AI capabilities (foundation models, agents, computer vision). High score = AI can address the core problem today.',
    weight: '20%',
  },
  {
    icon: Database,
    name: 'Unstructured Data Density',
    description: 'What fraction of the category\'s value creation involves unstructured data (documents, speech, images, video). LLMs and foundation models are most powerful against unstructured workflows.',
    weight: '15%',
  },
  {
    icon: Users,
    name: 'Agent Surface Area',
    description: 'How many distinct, high-value tasks in the category can be performed by AI agents (multi-step autonomous workflows). Higher = more of the value chain can be automated.',
    weight: '20%',
  },
];

const COMPOSITE_FORMULA = [
  { factor: 'Disruption Risk', weight: 0.20 },
  { factor: 'AI Native Readiness', weight: 0.25 },
  { factor: 'Agent Surface Area', weight: 0.20 },
  { factor: 'Unstructured Data Density', weight: 0.15 },
  { factor: 'Startup Opportunity', weight: 0.15 },
  { factor: 'Incumbent Moat (inverted)', weight: 0.05 },
];

const SUPPLY_CHAIN_FRAMEWORK = [
  {
    node: 'Input Providers',
    description: 'Data, materials, or information sources that feed into the industry. AI impact: data aggregation, quality improvement, and source diversification. Often medium vulnerability.',
    color: '#8b5cf6',
  },
  {
    node: 'Intermediaries',
    description: 'The layer where most value is added and extracted — brokers, processors, advisors, service providers. This is the highest AI disruption target in most industries. AI directly eliminates the need for human intermediation in routine transactions.',
    color: '#ef4444',
  },
  {
    node: 'End Buyers',
    description: 'The ultimate consumers of the value. Typically low vulnerability — they benefit from AI-driven cost reduction and quality improvement. The disruption risk is in who serves them, not in the buyers themselves.',
    color: '#22c55e',
  },
];

const GTM_MOTIONS = [
  { motion: 'Top-Down Enterprise', description: 'C-suite or senior leadership sponsors the deal. Required when decisions have safety, regulatory, or company-wide workflow implications. Sales cycles 6–24 months. ACV $250K+.' },
  { motion: 'Product-Led Growth', description: 'Individual users or small teams adopt the product independently. Viral expansion from bottoms-up. Required when the product delivers immediate individual productivity gain. Sales cycles days–weeks. ACV $5K–$100K.' },
  { motion: 'Channel / Partner', description: 'Go-to-market through existing trusted distribution relationships — channel partners, OEMs, or industry associations. Required when direct trust is hard to build (agriculture, defense). ACV varies.' },
  { motion: 'Vertical Specialist', description: 'Deep industry focus enables specialized knowledge and credibility that horizontal vendors cannot match. Required when the buyer needs proof of domain expertise before purchasing. Sales cycles 3–9 months. ACV $50K–$2M.' },
];

const BUCKET_DISTRIBUTION = BUCKETS.map(b => ({
  ...b,
  count: CATEGORIES.filter(c => c.bucket === b.id).length,
  avgComposite: CATEGORIES.filter(c => c.bucket === b.id).reduce((s, c) => s + c.composite, 0) / Math.max(1, CATEGORIES.filter(c => c.bucket === b.id).length),
}));

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Methodology</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          A framework for scoring AI disruption risk, startup opportunity, and supply chain vulnerability across industry categories.
          Built for venture investors, startup founders, and corporate strategists evaluating AI investment and competitive risk.
        </p>
      </div>

      {/* Scoring dimensions */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          Score Dimensions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Each category is scored across six dimensions on a 1–10 scale. Scores are based on analysis of industry reports, funding data, public company filings, and expert interviews conducted Q1–Q2 2025.
        </p>
        <div className="space-y-3">
          {SCORE_DIMENSIONS.map(d => {
            const Icon = d.icon;
            return (
              <div key={d.name} className="rounded-lg border border-border bg-card p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm font-semibold text-foreground">{d.name}</div>
                    <span className="text-xs font-mono text-muted-foreground">Weight: {d.weight}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Composite formula */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Composite Score Formula
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          The composite score represents the overall AI disruption opportunity for each category, combining scores across all dimensions with weights reflecting relative importance.
        </p>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="font-mono text-xs bg-muted rounded-md p-3 mb-4 text-foreground leading-loose">
            Composite = Σ(dimension_score × weight)
          </div>
          <div className="space-y-2">
            {COMPOSITE_FORMULA.map(f => (
              <div key={f.factor} className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground w-44">{f.factor}</div>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${f.weight * 100 * 4}%` }}
                  />
                </div>
                <div className="text-xs font-mono text-foreground w-8 text-right">{(f.weight * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supply chain framework */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Link className="w-4 h-4 text-primary" />
          Supply Chain Analysis Framework
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Supply chain analysis is the most important analytical layer because it identifies exactly which actors in an industry are being displaced and where startup wedges exist. Each category maps the industry value chain into three nodes and assesses AI impact at each layer.
        </p>
        <div className="space-y-3">
          {SUPPLY_CHAIN_FRAMEWORK.map(n => (
            <div key={n.node} className="rounded-lg border border-border bg-card p-4 flex gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.color }} />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">{n.node}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/8 p-4">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Key Principle</div>
          <p className="text-sm text-foreground leading-relaxed">
            In the vast majority of industries, the intermediary layer is the primary disruption target. AI enables value to flow directly from input providers to end buyers, compressing or eliminating the intermediary margin. The best startup insertion points are at the junctions between layers where AI can capture stranded value.
          </p>
        </div>
      </section>

      {/* GTM motions */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          GTM Motion Definitions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Each category is assigned the optimal GTM motion for AI-native startups entering that market. The motion is determined by buyer structure, deal size, and the nature of AI value delivery.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {GTM_MOTIONS.map(m => (
            <div key={m.motion} className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-semibold text-foreground mb-1">{m.motion}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sector distribution */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Sector Coverage
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {CATEGORIES.length} categories across {BUCKETS.length} super-buckets. Coverage is intentionally broad — from industrial manufacturing to defense to enterprise software — to surface non-obvious disruption patterns beyond the conventional "SaaS" frame.
        </p>
        <div className="space-y-2">
          {BUCKET_DISTRIBUTION.sort((a, b) => b.avgComposite - a.avgComposite).map(b => (
            <div key={b.id} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
              <div className="w-44 text-xs text-foreground">{b.label}</div>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(b.avgComposite / 10) * 100}%`, backgroundColor: b.color }}
                />
              </div>
              <div className="text-xs font-mono text-muted-foreground">{b.avgComposite.toFixed(1)} avg · {b.count} cats</div>
            </div>
          ))}
        </div>
      </section>

      {/* Product architecture framework */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Product Architecture Framework
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Each category includes a reference architecture for the AI-native challenger product. We use a five-part schema so architectures are comparable across categories.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'Data Ingestion', description: 'Source systems and protocols the product reads from. Named integrations (Epic FHIR, X12 EDI, RTSP streams) — not vague categories.' },
            { name: 'AI Primitives', description: 'The specific model classes, agent patterns, and retrieval strategies. Examples: vision transformers for object detection, LLM agents for SAR narrative generation, GNNs for entity resolution.' },
            { name: 'Integration Surface', description: 'The systems of record the product writes back to (Salesforce, ServiceNow, Procore, Epic). Determines how deeply the product embeds into existing workflows.' },
            { name: 'Deployment Model', description: 'How the product is delivered: multi-tenant SaaS, single-tenant cloud, FedRAMP / HIPAA / IL-5 compliance posture, edge inference for latency-sensitive use cases.' },
            { name: 'Key Technologies', description: 'The engineering stack — frameworks, model serving infra, data stores. Reveals where investment is required vs. commodity.' },
            { name: 'Build vs. Buy', description: 'Explicit guidance on which components a startup should build for moat vs. buy as commodity (foundation models, KYC data, satellite imagery).' },
          ].map(p => (
            <div key={p.name} className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-semibold text-foreground mb-1">{p.name}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Financial methodology */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Financial Data Methodology
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Each category carries four financial figures. They are intentionally simple so investors can sort, compare, and stress-test quickly.
        </p>
        <div className="space-y-3">
          {[
            { label: 'TAM ($B)', detail: 'Total addressable market for the AI-native challenger product, not the entire incumbent industry. Sourced from a triangulation of Grand View Research, MarketsandMarkets, IDC, Gartner, and disclosed funding rounds. We bias toward the smaller, more defensible figure.' },
            { label: 'CAGR (%)', detail: '3-year forward CAGR for the AI-augmented segment, not the legacy market. We use disclosed company-level growth rates where possible and analyst projections otherwise.' },
            { label: 'Revenue Multiple', detail: 'Range of EV/ARR multiples observed for AI-native private comps in the relevant vertical, sourced from Pitchbook, Crunchbase, and disclosed funding rounds. Multiples compress quickly — treat as Q2 2025 snapshot.' },
            { label: 'Time Horizon (years)', detail: 'Estimated years until AI-native solutions capture >25% market share. Used as the X-axis on the disruption matrix and as the inverted dimension on the radar chart.' },
            { label: 'Public Comps', detail: '3 named public or unicorn-private companies whose business model is most directly affected. Market caps are point-in-time and round to the nearest billion.' },
          ].map(f => (
            <div key={f.label} className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-semibold text-foreground mb-1">{f.label}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Update cadence & authoring */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          Update Cadence & Authoring
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          AI capabilities and competitive landscapes shift quickly. LLM-generated deep dives and investment analyses refresh daily; heatmap scores, theses, and signals are regenerated weekly via an automated pipeline.
        </p>
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            <span className="font-semibold text-foreground">Weekly category refresh.</span>{' '}
            All 42 heatmap categories — scores, thesis, and signals — are re-evaluated every Monday by an LLM batch job. Updates are committed to the repo and deployed automatically. The "As of <span className="font-mono">Month Year</span>" stamp on each detail panel reflects the most recent weekly run.
          </p>
          <p>
            <span className="font-semibold text-foreground">Daily LLM refresh.</span>{' '}
            AI deep dives and document analyses reset at UTC midnight each day. Re-running the same analysis after that boundary triggers a fresh LLM pass.
          </p>
          <p>
            <span className="font-semibold text-foreground">Continuous signal capture.</span>{' '}
            Funding rounds, M&A, product launches, and leadership moves are added to the signals list within 7 days of public disclosure. Each signal carries a source link.
          </p>
          <p>
            <span className="font-semibold text-foreground">Authoring.</span>{' '}
            Categories are authored by sector specialists with a minimum of 5 years of operating or investing experience in the relevant industry. Each category is reviewed by a second analyst before publication.
          </p>
          <p>
            <span className="font-semibold text-foreground">Version control.</span>{' '}
            The full data set is stored as typed TypeScript and versioned in Git. Historical snapshots are tagged for backtesting thesis accuracy.
          </p>
          <p>
            <span className="font-semibold text-foreground">Reader feedback loop.</span>{' '}
            Founders, investors, and operators in each category are invited to submit corrections and new signals. Corrections are reflected within 14 days; new signals within 7.
          </p>
        </div>
      </section>

      {/* Data sources */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-3">Data Sources & Caveats</h2>
        <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>• Market size and CAGR figures are drawn from publicly available market research reports (Grand View Research, MarketsandMarkets, IDC, Gartner) as of Q1 2025, cross-referenced with disclosed funding rounds and public company investor presentations.</p>
          <p>• Disruption scores reflect the analysis team's judgment based on current AI capabilities (Q1-Q2 2025), deployment evidence at enterprise customers, and academic research. These are qualitative assessments, not statistical models.</p>
          <p>• Revenue multiples reflect private market SaaS comparables in the relevant vertical, sourced from Pitchbook, Crunchbase, and disclosed funding rounds. These change rapidly in venture markets.</p>
          <p>• All scores represent a point-in-time view (May 2025). AI capabilities evolve rapidly and these assessments should be revisited quarterly.</p>
          <p>• This report does not constitute investment advice. It is an analytical framework designed to help investors and founders identify and evaluate AI disruption opportunities.</p>
        </div>
      </section>
    </div>
  );
}
