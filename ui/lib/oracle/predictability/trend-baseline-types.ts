// ============================================================================
// Trend Baseline Type Contracts — Stage M-G
// Type contracts only. No implementation functions. No trend computation.
// ============================================================================

// ---------------------------------------------------------------------------
// Direction constants
// ---------------------------------------------------------------------------

export const TREND_BASELINE_DIRECTIONS = Object.freeze({
  accelerating: 'accelerating',
  decelerating: 'decelerating',
  stable: 'stable',
  reversing: 'reversing',
} as const)

export type TrendBaselineDirection =
  (typeof TREND_BASELINE_DIRECTIONS)[keyof typeof TREND_BASELINE_DIRECTIONS]

// ---------------------------------------------------------------------------
// Overlap policy constants
// ---------------------------------------------------------------------------

export const TREND_BASELINE_OVERLAP_POLICIES = Object.freeze({
  reject: 'reject',
  warn: 'warn',
} as const)

export type TrendBaselineOverlapPolicy =
  (typeof TREND_BASELINE_OVERLAP_POLICIES)[keyof typeof TREND_BASELINE_OVERLAP_POLICIES]

// ---------------------------------------------------------------------------
// Data quality constants
// ---------------------------------------------------------------------------

export const TREND_BASELINE_DATA_QUALITY_LEVELS = Object.freeze({
  high: 'high',
  moderate: 'moderate',
  low: 'low',
} as const)

export type TrendBaselineDataQuality =
  (typeof TREND_BASELINE_DATA_QUALITY_LEVELS)[keyof typeof TREND_BASELINE_DATA_QUALITY_LEVELS]

// ---------------------------------------------------------------------------
// Warning severity constants
// ---------------------------------------------------------------------------

export const TREND_BASELINE_WARNING_SEVERITIES = Object.freeze({
  info: 'info',
  warn: 'warn',
  block: 'block',
} as const)

export type TrendBaselineWarningSeverity =
  (typeof TREND_BASELINE_WARNING_SEVERITIES)[keyof typeof TREND_BASELINE_WARNING_SEVERITIES]

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

export const TREND_BASELINE_THRESHOLDS = Object.freeze({
  SLOPE_FLAT_THRESHOLD: 0.05,
  MIN_POINTS_FOR_QUALITY: 5,
  EPSILON: 1e-9,
  HIGH_CONFIDENCE_THRESHOLD: 0.8,
  MODERATE_CONFIDENCE_THRESHOLD: 0.5,
  WINDOW_SPAN_MISMATCH_RATIO: 2.0,
  QUALITY_PENALTY_LOW: 0.3,
  QUALITY_PENALTY_MODERATE: 0.7,
} as const)

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

export interface TrendBaselineDataPoint {
  readonly timestamp: string
  readonly value: number
  readonly confidence: number
}

export interface TrendBaselineWindowConfig {
  readonly minPointsPerWindow: number
  readonly overlapPolicy: TrendBaselineOverlapPolicy
}

export interface TrendBaselineWarning {
  readonly code: string
  readonly message: string
  readonly severity: TrendBaselineWarningSeverity
  readonly field: string
}

export interface TrendBaselineInput {
  readonly previousWindow: readonly TrendBaselineDataPoint[]
  readonly currentWindow: readonly TrendBaselineDataPoint[]
  readonly windowConfig: TrendBaselineWindowConfig
  readonly signalType: string
  readonly assumptions: readonly string[]
  readonly provenance: string
  readonly warnings?: readonly TrendBaselineWarning[]
}

export interface TrendBaselineResult {
  readonly signalType: string
  readonly previousTrendSlope: number
  readonly currentTrendSlope: number
  readonly delta: number
  readonly acceleration: number
  readonly direction: TrendBaselineDirection
  readonly reversalIndicator: number
  readonly baselineDeviation: number
  readonly dataQuality: TrendBaselineDataQuality
  readonly confidence: number
  readonly assumptions: readonly string[]
  readonly warnings: readonly TrendBaselineWarning[]
  readonly provenanceTrail: readonly string[]
  readonly advisoryOnly: true
  readonly humanReviewRequired: true
}
