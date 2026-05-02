// ============================================================================
// Calibration Ledger Type Contracts — Stage M-I
// Append-only conceptual record tracking forecast accuracy over time.
// Type contracts only. No implementation functions.
// ============================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CALIBRATION_LEDGER_STATUSES = Object.freeze({
  pending: 'pending',
  resolved: 'resolved',
  expired: 'expired',
  invalidated: 'invalidated',
} as const)

export const CALIBRATION_LEDGER_WARNING_CODES = Object.freeze({
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  OVERCONFIDENT: 'OVERCONFIDENT',
  UNDERCONFIDENT: 'UNDERCONFIDENT',
  STALE_PENDING: 'STALE_PENDING',
  BIN_SPARSITY: 'BIN_SPARSITY',
  UPSTREAM_MISSING: 'UPSTREAM_MISSING',
  HIGH_SURPRISE: 'HIGH_SURPRISE',
} as const)

export const CALIBRATION_LEDGER_WARNING_SEVERITIES = Object.freeze({
  info: 'info',
  warn: 'warn',
  block: 'block',
} as const)

export const CALIBRATION_OUTCOME_LABELS = Object.freeze({
  occurred: 'occurred',
  did_not_occur: 'did_not_occur',
  ambiguous: 'ambiguous',
  not_yet_observed: 'not_yet_observed',
} as const)

export const CALIBRATION_DEFAULT_SAFETY_FLAGS = Object.freeze({
  advisoryOnly: true,
  humanReviewRequired: true,
  noActionRecommended: true,
} as const)

// ---------------------------------------------------------------------------
// Derived union types from constants
// ---------------------------------------------------------------------------

export type CalibrationLedgerStatus =
  (typeof CALIBRATION_LEDGER_STATUSES)[keyof typeof CALIBRATION_LEDGER_STATUSES]

export type CalibrationOutcomeLabel =
  (typeof CALIBRATION_OUTCOME_LABELS)[keyof typeof CALIBRATION_OUTCOME_LABELS]

// ---------------------------------------------------------------------------
// Input types (spec Section 5)
// ---------------------------------------------------------------------------

export interface CalibrationLedgerInput {
  readonly forecastId: string
  readonly sourceModule: string
  readonly forecastedProbability: number
  readonly confidenceLabel: 'speculative' | 'low' | 'moderate' | 'high'
  readonly scenario: string
  readonly evidenceBasis: readonly string[]
  readonly assumptions: readonly string[]
  readonly evaluationWindowMs: number
  readonly timestamp: number
}

export interface CalibrationObservation {
  readonly forecastId: string
  readonly occurred: boolean
  readonly observedAt: number
  readonly verificationMethod: string
  readonly humanReviewedBy: string
  readonly notes?: string
}

// ---------------------------------------------------------------------------
// Ledger entry (spec Section 7)
// ---------------------------------------------------------------------------

export interface CalibrationLedgerEntry {
  readonly forecastId: string
  readonly sourceModule: string
  readonly forecastedProbability: number
  readonly confidenceLabel: 'speculative' | 'low' | 'moderate' | 'high'
  readonly scenario: string
  readonly evidenceBasis: readonly string[]
  readonly assumptions: readonly string[]
  readonly evaluationWindowMs: number
  readonly forecastTimestamp: number
  readonly status: CalibrationLedgerStatus
  readonly occurred: boolean | null
  readonly observedAt: number | null
  readonly verificationMethod: string | null
  readonly humanReviewedBy: string | null
  readonly notes: string | null
  readonly absoluteError: number | null
  readonly squaredError: number | null
  readonly surpriseScore: number | null
}

// ---------------------------------------------------------------------------
// Warning type
// ---------------------------------------------------------------------------

export interface CalibrationLedgerWarning {
  readonly code: (typeof CALIBRATION_LEDGER_WARNING_CODES)[keyof typeof CALIBRATION_LEDGER_WARNING_CODES]
  readonly message: string
  readonly severity: (typeof CALIBRATION_LEDGER_WARNING_SEVERITIES)[keyof typeof CALIBRATION_LEDGER_WARNING_SEVERITIES]
  readonly source: string
}

// ---------------------------------------------------------------------------
// Confidence adjustment
// ---------------------------------------------------------------------------

export interface CalibrationConfidenceAdjustment {
  readonly adjustmentFactor: number
  readonly direction: 'increase' | 'decrease' | 'none'
  readonly magnitude: number
  readonly basedOnCount: number
  readonly rationale: string
}

// ---------------------------------------------------------------------------
// Audit metadata
// ---------------------------------------------------------------------------

export interface CalibrationAuditMetadata {
  readonly ledgerVersion: string
  readonly computedAt: number
  readonly resolvedCount: number
  readonly pendingCount: number
  readonly expiredCount: number
  readonly invalidatedCount: number
  readonly totalEntries: number
  readonly oldestEntryTimestamp: number
  readonly newestEntryTimestamp: number
}

// ---------------------------------------------------------------------------
// Calibration curve bucket
// ---------------------------------------------------------------------------

export interface CalibrationBucket {
  readonly binLower: number
  readonly binUpper: number
  readonly meanPredictedProbability: number
  readonly observedFrequency: number
  readonly count: number
}

// ---------------------------------------------------------------------------
// Aggregate calibration result (spec Section 6.2)
// ---------------------------------------------------------------------------

export interface CalibrationLedgerResult {
  readonly brierScore: number
  readonly expectedCalibrationError: number
  readonly calibrationCurve: readonly CalibrationBucket[]
  readonly overconfidenceDetected: boolean
  readonly underconfidenceDetected: boolean
  readonly recommendedAdjustment: number
  readonly totalForecasts: number
  readonly resolvedForecasts: number
  readonly pendingForecasts: number
  readonly minimumCountMet: boolean
  readonly confidenceAdjustment: CalibrationConfidenceAdjustment
  readonly warnings: readonly CalibrationLedgerWarning[]
  readonly auditMetadata: CalibrationAuditMetadata
  readonly advisoryOnly: true
  readonly humanReviewRequired: true
  readonly noActionRecommended: true
}
