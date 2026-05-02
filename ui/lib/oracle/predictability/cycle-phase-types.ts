// ============================================================================
// Cycle Phase Model Type Contracts — Stage M-H
// Type contracts only. No implementation functions. No phase classification.
// No scoring logic. No confidence computation. No runtime behavior.
// ============================================================================

// ---------------------------------------------------------------------------
// Phase constants
// ---------------------------------------------------------------------------

export const CYCLE_PHASES = Object.freeze({
  accumulation: 'accumulation',
  expansion: 'expansion',
  distribution: 'distribution',
  contraction: 'contraction',
  recovery: 'recovery',
  uncertain: 'uncertain',
} as const)

export type CyclePhase = (typeof CYCLE_PHASES)[keyof typeof CYCLE_PHASES]

// ---------------------------------------------------------------------------
// Warning severity constants
// ---------------------------------------------------------------------------

export const CYCLE_PHASE_WARNING_SEVERITIES = Object.freeze({
  info: 'info',
  warn: 'warn',
  block: 'block',
} as const)

export type CyclePhaseWarningSeverity =
  (typeof CYCLE_PHASE_WARNING_SEVERITIES)[keyof typeof CYCLE_PHASE_WARNING_SEVERITIES]

// ---------------------------------------------------------------------------
// Warning code constants
// ---------------------------------------------------------------------------

export const CYCLE_PHASE_WARNING_CODES = Object.freeze({
  UPSTREAM_MISSING: 'UPSTREAM_MISSING',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  STALE_EVIDENCE: 'STALE_EVIDENCE',
  HIGH_AMBIGUITY: 'HIGH_AMBIGUITY',
  MODEL_DISAGREEMENT: 'MODEL_DISAGREEMENT',
  QUALITY_DEGRADED: 'QUALITY_DEGRADED',
  BLOCKING_WARNING_PRESENT: 'BLOCKING_WARNING_PRESENT',
} as const)

export type CyclePhaseWarningCode =
  (typeof CYCLE_PHASE_WARNING_CODES)[keyof typeof CYCLE_PHASE_WARNING_CODES]

// ---------------------------------------------------------------------------
// Default safety flags
// ---------------------------------------------------------------------------

export const CYCLE_PHASE_DEFAULT_SAFETY_FLAGS = Object.freeze({
  advisoryOnly: true,
  humanReviewRequired: true,
  noActionRecommended: true,
} as const)

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

export const CYCLE_PHASE_THRESHOLDS = Object.freeze({
  MIN_CONFIDENCE: 0.3,
  AMBIGUITY_THRESHOLD: 0.85,
  HYSTERESIS_ENTRY: 0.6,
  HYSTERESIS_RETENTION: 0.4,
  QUALITY_PENALTY_LOW: 0.5,
  QUALITY_PENALTY_MODERATE: 0.8,
  STALENESS_WINDOW_MS: 3_600_000,
  WARNING_PENALTY_FACTOR: 0.9,
} as const)

// ---------------------------------------------------------------------------
// Warning type
// ---------------------------------------------------------------------------

export interface CyclePhaseWarning {
  readonly code: string
  readonly message: string
  readonly severity: CyclePhaseWarningSeverity
  readonly source: string
}

// ---------------------------------------------------------------------------
// Evidence summary type
// ---------------------------------------------------------------------------

export interface CyclePhaseEvidence {
  readonly trendSignal: string
  readonly regimeSignal: string
  readonly scenarioSignal: string
  readonly beliefSignal: string
  readonly dominantSignals: readonly string[]
  readonly summary: string
}

// ---------------------------------------------------------------------------
// Confidence breakdown type
// ---------------------------------------------------------------------------

export interface CyclePhaseConfidence {
  readonly phaseScoreConfidence: number
  readonly upstreamConfidencePenalty: number
  readonly dataQualityPenalty: number
  readonly warningPenalty: number
  readonly stalenessPenalty: number
  readonly overall: number
}

// ---------------------------------------------------------------------------
// Transition risk type
// ---------------------------------------------------------------------------

export interface CyclePhaseTransitionRisk {
  readonly regimeTransitionComponent: number
  readonly trendReversalComponent: number
  readonly scenarioDispersionComponent: number
  readonly ambiguityComponent: number
  readonly overall: number
}

// ---------------------------------------------------------------------------
// Upstream input summaries (consumed from M-G, M-F, M-D, M-B)
// ---------------------------------------------------------------------------

export interface TrendBaselineInputSummary {
  readonly direction: string
  readonly delta: number
  readonly acceleration: number
  readonly reversalIndicator: number
  readonly baselineDeviation: number
  readonly confidence: number
  readonly dataQuality: string
}

export interface MarkovRegimeInputSummary {
  readonly dominantState: string
  readonly stateStability: number
  readonly transitionProbability: number
  readonly confidence: number
}

export interface MonteCarloScenarioInputSummary {
  readonly scenarioDispersion: number
  readonly medianOutcome: number
  readonly confidenceInterval: readonly [number, number]
  readonly uncertaintyBand: number
  readonly confidence: number
}

export interface BayesianPosteriorInputSummary {
  readonly beliefStrength: number
  readonly priorToPosteriorDelta: number
  readonly updateMagnitude: number
  readonly confidence: number
}

// ---------------------------------------------------------------------------
// Aggregated input type
// ---------------------------------------------------------------------------

export interface CyclePhaseInput {
  readonly trendBaseline?: TrendBaselineInputSummary
  readonly markovRegime?: MarkovRegimeInputSummary
  readonly monteCarloScenario?: MonteCarloScenarioInputSummary
  readonly bayesianPosterior?: BayesianPosteriorInputSummary
  readonly signalType: string
  readonly assumptions: readonly string[]
  readonly inheritedWarnings: readonly CyclePhaseWarning[]
  readonly provenanceTrail: readonly string[]
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface CyclePhaseResult {
  readonly phase: CyclePhase
  readonly confidence: number
  readonly phaseScores: Readonly<Record<CyclePhase, number>>
  readonly transitionRisk: number
  readonly ambiguityScore: number
  readonly warnings: readonly CyclePhaseWarning[]
  readonly evidenceSummary: string
  readonly assumptions: readonly string[]
  readonly provenanceTrail: readonly string[]
  readonly advisoryOnly: true
  readonly humanReviewRequired: true
  readonly noActionRecommended: true
}
