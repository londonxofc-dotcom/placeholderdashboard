// ============================================================================
// Calibration Ledger — Stage M-I Pure Functions
// Append-only conceptual record tracking forecast accuracy over time.
// All functions are pure. No side effects. No I/O. No mutation.
// ============================================================================

import {
  CALIBRATION_LEDGER_STATUSES,
  CALIBRATION_LEDGER_WARNING_CODES,
  CALIBRATION_LEDGER_WARNING_SEVERITIES,
  CALIBRATION_DEFAULT_SAFETY_FLAGS,
  type CalibrationLedgerInput,
  type CalibrationObservation,
  type CalibrationLedgerEntry,
  type CalibrationLedgerWarning,
  type CalibrationConfidenceAdjustment,
  type CalibrationAuditMetadata,
  type CalibrationBucket,
  type CalibrationLedgerResult,
} from './calibration-ledger-types'

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

/** Maps a probability [0,1] to a bin index for the given bin count. */
function assignToBin(probability: number, binCount: number): number {
  if (probability >= 1.0) return binCount - 1
  const index = Math.floor(probability * binCount)
  return Math.min(index, binCount - 1)
}

/** Computes information-theoretic surprise: -log2(p) where p is the
 *  probability assigned to the actual outcome, clamped to avoid log(0). */
function computeSurpriseScore(forecastedProbability: number, occurred: boolean): number {
  const p = occurred ? forecastedProbability : 1 - forecastedProbability
  const clampedP = Math.max(p, 1e-15)
  return -Math.log2(clampedP)
}

/** Returns whether the resolved count meets or exceeds the minimum. */
function checkMinimumCount(resolvedCount: number, minimumCount: number): boolean {
  return resolvedCount >= minimumCount
}

/** Returns only entries with status 'resolved'. */
function filterResolved(entries: readonly CalibrationLedgerEntry[]): CalibrationLedgerEntry[] {
  return entries.filter(e => e.status === CALIBRATION_LEDGER_STATUSES.resolved)
}

// ---------------------------------------------------------------------------
// Exported functions (spec Section 14.1)
// ---------------------------------------------------------------------------

/** Creates a new ledger entry in pending status from a forecast input. */
export function recordForecast(input: CalibrationLedgerInput): CalibrationLedgerEntry {
  return {
    forecastId: input.forecastId,
    sourceModule: input.sourceModule,
    forecastedProbability: input.forecastedProbability,
    confidenceLabel: input.confidenceLabel,
    scenario: input.scenario,
    evidenceBasis: input.evidenceBasis,
    assumptions: input.assumptions,
    evaluationWindowMs: input.evaluationWindowMs,
    forecastTimestamp: input.timestamp,
    status: CALIBRATION_LEDGER_STATUSES.pending,
    occurred: null,
    observedAt: null,
    verificationMethod: null,
    humanReviewedBy: null,
    notes: null,
    absoluteError: null,
    squaredError: null,
    surpriseScore: null,
  }
}

/** Transitions a pending entry to resolved, computing per-entry metrics. */
export function resolveOutcome(
  entry: CalibrationLedgerEntry,
  observation: CalibrationObservation
): CalibrationLedgerEntry {
  if (entry.status !== CALIBRATION_LEDGER_STATUSES.pending) {
    throw new Error(`Cannot resolve entry with status '${entry.status}' — only pending entries can be resolved`)
  }
  if (!observation.humanReviewedBy) {
    throw new Error('humanReviewedBy is required and must be non-empty')
  }

  const o = observation.occurred ? 1 : 0
  const absErr = Math.abs(entry.forecastedProbability - o)
  const sqErr = absErr * absErr
  const surprise = computeSurpriseScore(entry.forecastedProbability, observation.occurred)

  return {
    forecastId: entry.forecastId,
    sourceModule: entry.sourceModule,
    forecastedProbability: entry.forecastedProbability,
    confidenceLabel: entry.confidenceLabel,
    scenario: entry.scenario,
    evidenceBasis: entry.evidenceBasis,
    assumptions: entry.assumptions,
    evaluationWindowMs: entry.evaluationWindowMs,
    forecastTimestamp: entry.forecastTimestamp,
    status: CALIBRATION_LEDGER_STATUSES.resolved,
    occurred: observation.occurred,
    observedAt: observation.observedAt,
    verificationMethod: observation.verificationMethod,
    humanReviewedBy: observation.humanReviewedBy,
    notes: observation.notes ?? null,
    absoluteError: absErr,
    squaredError: sqErr,
    surpriseScore: surprise,
  }
}

/** Transitions a pending entry to expired. */
export function expireEntry(entry: CalibrationLedgerEntry): CalibrationLedgerEntry {
  if (entry.status !== CALIBRATION_LEDGER_STATUSES.pending) {
    throw new Error(`Cannot expire entry with status '${entry.status}' — only pending entries can be expired`)
  }

  return {
    forecastId: entry.forecastId,
    sourceModule: entry.sourceModule,
    forecastedProbability: entry.forecastedProbability,
    confidenceLabel: entry.confidenceLabel,
    scenario: entry.scenario,
    evidenceBasis: entry.evidenceBasis,
    assumptions: entry.assumptions,
    evaluationWindowMs: entry.evaluationWindowMs,
    forecastTimestamp: entry.forecastTimestamp,
    status: CALIBRATION_LEDGER_STATUSES.expired,
    occurred: entry.occurred,
    observedAt: entry.observedAt,
    verificationMethod: entry.verificationMethod,
    humanReviewedBy: entry.humanReviewedBy,
    notes: entry.notes,
    absoluteError: entry.absoluteError,
    squaredError: entry.squaredError,
    surpriseScore: entry.surpriseScore,
  }
}

/** Transitions a pending entry to invalidated. */
export function invalidateEntry(
  entry: CalibrationLedgerEntry,
  _reason: string
): CalibrationLedgerEntry {
  if (entry.status !== CALIBRATION_LEDGER_STATUSES.pending) {
    throw new Error(`Cannot invalidate entry with status '${entry.status}' — only pending entries can be invalidated`)
  }

  return {
    forecastId: entry.forecastId,
    sourceModule: entry.sourceModule,
    forecastedProbability: entry.forecastedProbability,
    confidenceLabel: entry.confidenceLabel,
    scenario: entry.scenario,
    evidenceBasis: entry.evidenceBasis,
    assumptions: entry.assumptions,
    evaluationWindowMs: entry.evaluationWindowMs,
    forecastTimestamp: entry.forecastTimestamp,
    status: CALIBRATION_LEDGER_STATUSES.invalidated,
    occurred: entry.occurred,
    observedAt: entry.observedAt,
    verificationMethod: entry.verificationMethod,
    humanReviewedBy: entry.humanReviewedBy,
    notes: entry.notes,
    absoluteError: entry.absoluteError,
    squaredError: entry.squaredError,
    surpriseScore: entry.surpriseScore,
  }
}

/** Computes Brier score: BS = (1/N) * sum((fi - oi)^2) across resolved entries. */
export function computeBrierScore(entries: readonly CalibrationLedgerEntry[]): number {
  const resolved = filterResolved(entries)
  if (resolved.length === 0) return 0

  const sum = resolved.reduce((acc, e) => {
    const o = e.occurred ? 1 : 0
    const diff = e.forecastedProbability - o
    return acc + diff * diff
  }, 0)

  return sum / resolved.length
}

/** Computes calibration curve: predicted probability vs observed frequency across bins. */
export function computeCalibrationCurve(
  entries: readonly CalibrationLedgerEntry[],
  binCount: number = 10
): CalibrationBucket[] {
  const resolved = filterResolved(entries)

  const bins: { sumPredicted: number; sumOccurred: number; count: number }[] = Array.from(
    { length: binCount },
    () => ({ sumPredicted: 0, sumOccurred: 0, count: 0 })
  )

  for (const entry of resolved) {
    const idx = assignToBin(entry.forecastedProbability, binCount)
    bins[idx].sumPredicted += entry.forecastedProbability
    bins[idx].sumOccurred += entry.occurred ? 1 : 0
    bins[idx].count += 1
  }

  const binWidth = 1.0 / binCount

  return bins.map((bin, i): CalibrationBucket => ({
    binLower: i * binWidth,
    binUpper: (i + 1) * binWidth,
    meanPredictedProbability: bin.count > 0 ? bin.sumPredicted / bin.count : 0,
    observedFrequency: bin.count > 0 ? bin.sumOccurred / bin.count : 0,
    count: bin.count,
  }))
}

/** Computes Expected Calibration Error: weighted sum of |observedFreq - meanPredicted| per bin. */
export function computeExpectedCalibrationError(curve: readonly CalibrationBucket[]): number {
  const totalCount = curve.reduce((sum, b) => sum + b.count, 0)
  if (totalCount === 0) return 0

  return curve.reduce((ece, bin) => {
    if (bin.count === 0) return ece
    const weight = bin.count / totalCount
    const gap = Math.abs(bin.observedFrequency - bin.meanPredictedProbability)
    return ece + weight * gap
  }, 0)
}

/** Detects systematic overconfidence or underconfidence from a calibration curve. */
export function detectConfidenceBias(
  curve: readonly CalibrationBucket[]
): { overconfidenceDetected: boolean; underconfidenceDetected: boolean } {
  const populated = curve.filter(b => b.count > 0)

  if (populated.length === 0) {
    return { overconfidenceDetected: false, underconfidenceDetected: false }
  }

  let overCount = 0
  let underCount = 0

  for (const bin of populated) {
    if (bin.meanPredictedProbability > bin.observedFrequency) {
      overCount++
    } else if (bin.meanPredictedProbability < bin.observedFrequency) {
      underCount++
    }
  }

  return {
    overconfidenceDetected: overCount > populated.length / 2,
    underconfidenceDetected: underCount > populated.length / 2,
  }
}

/** Computes adjustment factor: aggregate observed frequency / aggregate mean predicted probability. */
export function computeAdjustmentFactor(curve: readonly CalibrationBucket[]): number {
  const populated = curve.filter(b => b.count > 0)

  if (populated.length === 0) return 1.0

  const totalObserved = populated.reduce((sum, b) => sum + b.observedFrequency * b.count, 0)
  const totalPredicted = populated.reduce((sum, b) => sum + b.meanPredictedProbability * b.count, 0)

  if (totalPredicted === 0) return 1.0

  return totalObserved / totalPredicted
}

/** Orchestrates all aggregate metrics into a single CalibrationLedgerResult. */
export function buildAggregateResult(
  entries: readonly CalibrationLedgerEntry[],
  config?: { minimumCount?: number; binCount?: number }
): CalibrationLedgerResult {
  const minimumCount = config?.minimumCount ?? 30
  const binCount = config?.binCount ?? 10

  const resolved = filterResolved(entries)
  const resolvedCount = resolved.length
  const pendingCount = entries.filter(e => e.status === CALIBRATION_LEDGER_STATUSES.pending).length
  const expiredCount = entries.filter(e => e.status === CALIBRATION_LEDGER_STATUSES.expired).length
  const invalidatedCount = entries.filter(e => e.status === CALIBRATION_LEDGER_STATUSES.invalidated).length

  const minimumCountMet = checkMinimumCount(resolvedCount, minimumCount)
  const brierScore = computeBrierScore(entries)
  const calibrationCurve = computeCalibrationCurve(entries, binCount)
  const expectedCalibrationError = computeExpectedCalibrationError(calibrationCurve)
  const bias = detectConfidenceBias(calibrationCurve)
  const adjustmentFactor = computeAdjustmentFactor(calibrationCurve)

  const warnings: CalibrationLedgerWarning[] = []

  if (!minimumCountMet) {
    warnings.push({
      code: CALIBRATION_LEDGER_WARNING_CODES.INSUFFICIENT_DATA,
      message: `Only ${resolvedCount} resolved entries — below minimum of ${minimumCount}`,
      severity: CALIBRATION_LEDGER_WARNING_SEVERITIES.warn,
      source: 'buildAggregateResult',
    })
  }

  if (bias.overconfidenceDetected) {
    warnings.push({
      code: CALIBRATION_LEDGER_WARNING_CODES.OVERCONFIDENT,
      message: 'Systematic overconfidence detected across calibration bins',
      severity: CALIBRATION_LEDGER_WARNING_SEVERITIES.warn,
      source: 'buildAggregateResult',
    })
  }

  if (bias.underconfidenceDetected) {
    warnings.push({
      code: CALIBRATION_LEDGER_WARNING_CODES.UNDERCONFIDENT,
      message: 'Systematic underconfidence detected across calibration bins',
      severity: CALIBRATION_LEDGER_WARNING_SEVERITIES.warn,
      source: 'buildAggregateResult',
    })
  }

  const direction: 'increase' | 'decrease' | 'none' =
    adjustmentFactor > 1.0 ? 'increase' : adjustmentFactor < 1.0 ? 'decrease' : 'none'

  const confidenceAdjustment: CalibrationConfidenceAdjustment = {
    adjustmentFactor,
    direction,
    magnitude: Math.abs(adjustmentFactor - 1.0),
    basedOnCount: resolvedCount,
    rationale:
      direction === 'none'
        ? 'Forecasts are well-calibrated — no adjustment recommended'
        : direction === 'increase'
          ? 'Observed outcomes exceed predicted probabilities — consider increasing confidence'
          : 'Predicted probabilities exceed observed outcomes — consider decreasing confidence',
  }

  const timestamps = entries.map(e => e.forecastTimestamp)
  const oldestEntryTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : 0
  const newestEntryTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0

  const auditMetadata: CalibrationAuditMetadata = {
    ledgerVersion: '1.0.0',
    computedAt: 0,
    resolvedCount,
    pendingCount,
    expiredCount,
    invalidatedCount,
    totalEntries: entries.length,
    oldestEntryTimestamp,
    newestEntryTimestamp,
  }

  return {
    brierScore,
    expectedCalibrationError,
    calibrationCurve,
    overconfidenceDetected: bias.overconfidenceDetected,
    underconfidenceDetected: bias.underconfidenceDetected,
    recommendedAdjustment: adjustmentFactor,
    totalForecasts: entries.length,
    resolvedForecasts: resolvedCount,
    pendingForecasts: pendingCount,
    minimumCountMet,
    confidenceAdjustment,
    warnings,
    auditMetadata,
    advisoryOnly: CALIBRATION_DEFAULT_SAFETY_FLAGS.advisoryOnly,
    humanReviewRequired: CALIBRATION_DEFAULT_SAFETY_FLAGS.humanReviewRequired,
    noActionRecommended: CALIBRATION_DEFAULT_SAFETY_FLAGS.noActionRecommended,
  }
}
