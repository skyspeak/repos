export interface ScoreSet {
  disruptionRisk: number;
  timeHorizon: number;
  incumbentMoat: number;
  aiNativeReadiness: number;
  unstructuredDensity: number;
  agentSurfaceArea: number;
}

/** Matches the composite formula documented on the Methodology page. */
export function computeComposite(
  scores: ScoreSet,
  startupOpportunity: number,
): number {
  const raw =
    scores.disruptionRisk * 0.2 +
    scores.aiNativeReadiness * 0.25 +
    scores.agentSurfaceArea * 0.2 +
    scores.unstructuredDensity * 0.15 +
    startupOpportunity * 0.15 +
    (10 - scores.incumbentMoat) * 0.05;
  return Math.round(raw * 10) / 10;
}
