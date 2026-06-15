export type BucketId =
  | 'manufacturing'
  | 'logistics'
  | 'healthcare'
  | 'energy'
  | 'agriculture'
  | 'financial'
  | 'media'
  | 'defense'
  | 'construction'
  | 'enterprise-software';

export type GtmMotion = 'top-down' | 'plg' | 'channel' | 'vertical';

export interface Vendor {
  name: string;
  url: string;
  marketCapOrValuation: string;
  ticker?: string;
  keyProduct?: string;
  vulnerability?: string;
}

export interface Signal {
  date: string;
  type: 'funding' | 'mna' | 'product' | 'leadership';
  description: string;
  sourceUrl: string;
}

export interface SupplyChainNode {
  label: string;
  players: string[];
  aiImpact: string;
  vulnerability: 'high' | 'medium' | 'low';
  startupOpportunity?: string;
}

export interface SupplyChain {
  inputProviders: SupplyChainNode;
  intermediaries: SupplyChainNode;
  endBuyers: SupplyChainNode;
  keyInsight: string;
  bestInsertionPoint: string;
}

export interface ProductArchitecture {
  dataIngestion: string;
  aiPrimitives: string[];
  integrationSurface: string[];
  deploymentModel: string;
  keyTechnologies: string[];
  buildVsBuy: string;
}

export interface GtmStrategy {
  motion: GtmMotion;
  rationale: string;
  buyerPersona: string;
  dealSizeRange: string;
  salesCycle: string;
  topChannels: string[];
  landAndExpandPath: string;
}

export interface StartupWedge {
  thesis: string;
  targetCustomer: string;
  moat: string;
}

export interface Category {
  id: string;
  name: string;
  bucket: BucketId;
  scores: {
    disruptionRisk: number;
    timeHorizon: number;
    incumbentMoat: number;
    aiNativeReadiness: number;
    unstructuredDensity: number;
    agentSurfaceArea: number;
  };
  supplyChainVulnerability: number;
  startupOpportunity: number;
  composite: number;
  marketSize: number;
  cagr: number;
  revenueMultiple: string;
  publicComps: string[];
  gtmMotion: GtmMotion;
  incumbents: Vendor[];
  challengers: Vendor[];
  thesis: string;
  signals: Signal[];
  supplyChain: SupplyChain;
  productArchitecture: ProductArchitecture;
  gtmStrategy: GtmStrategy;
  startupWedges: StartupWedge[];
  lastUpdated: string;
}

export interface BucketMeta {
  id: BucketId;
  label: string;
  color: string;
  description: string;
}

export const BUCKETS: BucketMeta[] = [
  { id: 'manufacturing', label: 'Manufacturing & Industry', color: '#f97316', description: 'Industrial production, quality, and maintenance' },
  { id: 'logistics', label: 'Logistics & Supply Chain', color: '#8b5cf6', description: 'Freight, warehousing, and fulfillment' },
  { id: 'healthcare', label: 'Healthcare & Life Sciences', color: '#ef4444', description: 'Clinical, pharma, and medtech' },
  { id: 'energy', label: 'Energy & Utilities', color: '#eab308', description: 'Power, oil & gas, and renewables' },
  { id: 'agriculture', label: 'Agriculture & Food', color: '#22c55e', description: 'Precision ag, food safety, and agri-supply' },
  { id: 'financial', label: 'Financial Services', color: '#3b82f6', description: 'Banking, insurance, and capital markets' },
  { id: 'media', label: 'Media & Content', color: '#ec4899', description: 'Ad tech, publishing, and content ops' },
  { id: 'defense', label: 'Defense & Government', color: '#64748b', description: 'Intelligence, military logistics, and gov admin' },
  { id: 'construction', label: 'Construction & Real Estate', color: '#a16207', description: 'Construction PM, property, and facilities' },
  { id: 'enterprise-software', label: 'Enterprise Software', color: '#06b6d4', description: 'Pure-software B2B SaaS categories' },
];
