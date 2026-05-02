// ============================================================================
// Trend Baseline Comparison — Stage M-G Pure Functions
// Pure functions only. No side effects. No mutation. No I/O.
// ============================================================================

import {
  TREND_BASELINE_THRESHOLDS,
  type TrendBaselineDataPoint,
  type TrendBaselineDirection,
  type TrendBaselineDataQuality,
  type TrendBaselineInput,
  type TrendBaselineResult,
  type TrendBaselineWarning,
} from './trend-baseline-types'

// ---------------------------------------------------------------------------
// 1. validateBaselineWindows
// ---------------------------------------------------------------------------

export function validateBaselineWindows(
  input: TrendBaselineInput
): { valid: boolean; warnings: TrendBaselineWarning[] } {
  const warnings: TrendBaselineWarning[] = []

  // Check empty windows
  if (input.previousWindow.length === 0) {
    warnings.push({
      code: 'WINDOW_EMPTY',
      message: 'Previous window contains no data points',
      severity: 'block',
      field: 'previousWindow',
    })
  }
  if (input.currentWindow.length === 0) {
    warnings.push({
      code: 'WINDOW_EMPTY',
      message: 'Current window contains no data points',
      severity: 'block',
      field: 'currentWindow',
    })
  }

  // Check minimum point count
  const minPoints = input.windowConfig.minPointsPerWindow
  if (input.previousWindow.length > 0 && input.previousWindow.length < minPoints) {
    warnings.push({
      code: 'INSUFFICIENT_POINTS',
      message: `Previous window has ${input.previousWindow.length} points, minimum is ${minPoints}`,
      severity: 'block',
      field: 'previousWindow',
    })
  }
  if (input.currentWindow.length > 0 && input.currentWindow.length < minPoints) {
    warnings.push({
      code: 'INSUFFICIENT_POINTS',
      message: `Current window has ${input.currentWindow.length} points, minimum is ${minPoints}`,
      severity: 'block',
      field: 'currentWindow',
    })
  }

  // Check for invalid values (NaN, Infinity)
  const checkFiniteValues = (
    points: readonly TrendBaselineDataPoint[],
    fieldName: string
  ): void => {
    for (const point of points) {
      if (!Number.isFinite(point.value)) {
        warnings.push({
          code: 'INVALID_VALUE',
          message: `Non-finite value detected in ${fieldName} at timestamp ${point.timestamp}`,
          severity: 'block',
          field: fieldName,
        })
        return
      }
      if (!Number.isFinite(point.confidence)) {
        warnings.push({
          code: 'INVALID_VALUE',
          message: `Non-finite confidence detected in ${fieldName} at timestamp ${point.timestamp}`,
          severity: 'block',
          field: fieldName,
        })
        return
      }
    }
  }
  checkFiniteValues(input.previousWindow, 'previousWindow')
  checkFiniteValues(input.currentWindow, 'currentWindow')

  // Check for overlapping windows
  if (input.previousWindow.length > 0 && input.currentWindow.length > 0) {
    const prevTimestamps = input.previousWindow.map(p => p.timestamp)
    const currTimestamps = input.currentWindow.map(p => p.timestamp)
    const prevMax = prevTimestamps.reduce((a, b) => (a > b ? a : b))
    const currMin = currTimestamps.reduce((a, b) => (a < b ? a : b))

    if (currMin <= prevMax) {
      const severity = input.windowConfig.overlapPolicy === 'reject' ? 'block' : 'warn'
      warnings.push({
        code: 'WINDOWS_OVERLAP',
        message: 'Current window overlaps with previous window',
        severity,
        field: 'windowConfig',
      } as TrendBaselineWarning)
    }
  }

  // Check window span mismatch
  if (input.previousWindow.length >= 2 && input.currentWindow.length >= 2) {
    const prevSpan = getWindowSpanDays(input.previousWindow)
    const currSpan = getWindowSpanDays(input.currentWindow)
    if (prevSpan > 0 && currSpan > 0) {
      const ratio = Math.max(prevSpan, currSpan) / Math.min(prevSpan, currSpan)
      if (ratio > TREND_BASELINE_THRESHOLDS.WINDOW_SPAN_MISMATCH_RATIO) {
        warnings.push({
          code: 'WINDOW_SPAN_MISMATCH',
          message: `Window spans differ by ratio ${ratio.toFixed(1)}x`,
          severity: 'info',
          field: 'windowConfig',
        })
      }
    }
  }

  const hasBlock = warnings.some(w => w.severity === 'block')
  const validOverlap = input.windowConfig.overlapPolicy === 'warn'
    ? !warnings.some(w => w.severity === 'block' && w.code !== 'WINDOWS_OVERLAP')
    : !hasBlock

  return { valid: validOverlap, warnings }
}

// ---------------------------------------------------------------------------
// 2. computeLinearSlope (OLS closed-form)
// ---------------------------------------------------------------------------

export function computeLinearSlope(points: readonly TrendBaselineDataPoint[]): number {
  const n = points.length
  if (n <= 1) return 0

  // Use index-based x values (0, 1, 2, ...) for deterministic OLS
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (let i = 0; i < n; i++) {
    const x = i
    const y = points[i].value
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  }

  const denominator = n * sumX2 - sumX * sumX
  if (Math.abs(denominator) < TREND_BASELINE_THRESHOLDS.EPSILON) {
    return 0
  }

  return (n * sumXY - sumX * sumY) / denominator
}

// ---------------------------------------------------------------------------
// 3. computeTrendDelta
// ---------------------------------------------------------------------------

export function computeTrendDelta(previousSlope: number, currentSlope: number): number {
  return currentSlope - previousSlope
}

// ---------------------------------------------------------------------------
// 4. computeAcceleration
// ---------------------------------------------------------------------------

export function computeAcceleration(
  previousSlope: number,
  currentSlope: number,
  previousWindowSpan: number,
  currentWindowSpan: number
): number {
  const slopeDelta = currentSlope - previousSlope
  if (slopeDelta === 0) return 0

  // Midpoints as half the span; separation = half prev span + half curr span
  const midpointSeparation = (previousWindowSpan + currentWindowSpan) / 2
  if (Math.abs(midpointSeparation) < TREND_BASELINE_THRESHOLDS.EPSILON) {
    return 0
  }

  return slopeDelta / midpointSeparation
}

// ---------------------------------------------------------------------------
// 5. classifyBaselineDirection
// ---------------------------------------------------------------------------

export function classifyBaselineDirection(
  delta: number,
  previousSlope: number,
  currentSlope: number
): TrendBaselineDirection {
  const threshold = TREND_BASELINE_THRESHOLDS.SLOPE_FLAT_THRESHOLD

  // Stable: delta below threshold
  if (Math.abs(delta) < threshold) {
    return 'stable'
  }

  // Reversing: slopes have opposite signs (and both are significant)
  if (previousSlope * currentSlope < 0) {
    return 'reversing'
  }

  // Accelerating: both positive and delta > 0, or both negative and delta < 0
  if (delta > 0 && currentSlope > 0) {
    return 'accelerating'
  }

  // Decelerating: positive previous slope with negative delta
  if (delta < 0 && previousSlope > 0) {
    return 'decelerating'
  }

  // Decelerating for negative slopes getting less negative
  if (delta > 0 && previousSlope < 0) {
    return 'decelerating'
  }

  // Accelerating for negative slopes getting more negative
  if (delta < 0 && currentSlope < 0) {
    return 'accelerating'
  }

  return 'stable'
}

// ---------------------------------------------------------------------------
// 6. computeReversalIndicator
// ---------------------------------------------------------------------------

export function computeReversalIndicator(
  previousSlope: number,
  currentSlope: number
): number {
  // No reversal if either slope is 0 or same sign
  if (previousSlope === 0 || currentSlope === 0) return 0
  if (previousSlope * currentSlope > 0) return 0

  // Opposite signs: compute heuristic strength
  const absPrev = Math.abs(previousSlope)
  const absCurr = Math.abs(currentSlope)
  const signFactor = 2
  const raw = (absPrev * absCurr) / (absPrev + absCurr) * signFactor

  return Math.min(1, raw)
}

// ---------------------------------------------------------------------------
// 7. computeBaselineDeviation
// ---------------------------------------------------------------------------

export function computeBaselineDeviation(
  previousPoints: readonly TrendBaselineDataPoint[],
  currentPoints: readonly TrendBaselineDataPoint[],
  previousSlope: number
): number {
  if (previousPoints.length === 0 || currentPoints.length === 0) return 0

  // Compute previous intercept using OLS
  const prevN = previousPoints.length
  const prevMeanX = (prevN - 1) / 2 // mean of indices 0..n-1
  const prevMeanY = previousPoints.reduce((s, p) => s + p.value, 0) / prevN
  const prevIntercept = prevMeanY - previousSlope * prevMeanX

  // Current window mean value
  const currMeanY = currentPoints.reduce((s, p) => s + p.value, 0) / currentPoints.length

  // Time delta: difference between current midpoint index and previous midpoint index
  // Using timestamp-based indexing: compute offset of current points relative to previous
  const prevTimestamps = previousPoints.map(p => new Date(p.timestamp).getTime())
  const currTimestamps = currentPoints.map(p => new Date(p.timestamp).getTime())

  const prevMinT = Math.min(...prevTimestamps)
  const prevMaxT = Math.max(...prevTimestamps)
  const currMinT = Math.min(...currTimestamps)
  const currMaxT = Math.max(...currTimestamps)

  const prevMidT = (prevMinT + prevMaxT) / 2
  const currMidT = (currMinT + currMaxT) / 2

  // Convert time delta to index units (same scale as OLS x-axis)
  const prevSpanT = prevMaxT - prevMinT
  const indexScale = prevN > 1 && prevSpanT > 0
    ? (prevN - 1) / prevSpanT
    : 1

  const timeDeltaIndices = (currMidT - prevMidT) * indexScale

  // Projected value at current midpoint
  const projected = previousSlope * (prevMeanX + timeDeltaIndices) + prevIntercept

  return currMeanY - projected
}

// ---------------------------------------------------------------------------
// 8. assessDataQuality
// ---------------------------------------------------------------------------

export function assessDataQuality(
  points: readonly TrendBaselineDataPoint[],
  minPoints: number
): { quality: TrendBaselineDataQuality; confidence: number } {
  const n = points.length
  if (n === 0) {
    return { quality: 'low', confidence: 0 }
  }

  const meanConfidence = points.reduce((s, p) => s + p.confidence, 0) / n

  if (n >= 2 * minPoints && meanConfidence >= 0.7) {
    return { quality: 'high', confidence: meanConfidence }
  }

  if (n >= minPoints && meanConfidence >= 0.4) {
    return { quality: 'moderate', confidence: meanConfidence }
  }

  return { quality: 'low', confidence: meanConfidence }
}

// ---------------------------------------------------------------------------
// 9. computeOverallConfidence
// ---------------------------------------------------------------------------

export function computeOverallConfidence(
  previousQuality: { quality: string; confidence: number },
  currentQuality: { quality: string; confidence: number }
): number {
  const geometricMean = Math.sqrt(
    Math.max(0, previousQuality.confidence) * Math.max(0, currentQuality.confidence)
  )

  let qualityPenalty = 1.0
  if (previousQuality.quality === 'low' || currentQuality.quality === 'low') {
    qualityPenalty = 0.5
  } else if (previousQuality.quality === 'moderate' || currentQuality.quality === 'moderate') {
    qualityPenalty = 0.8
  }

  return Math.min(1, geometricMean * qualityPenalty)
}

// ---------------------------------------------------------------------------
// 10. computeTrendBaselineComparison (orchestrator)
// ---------------------------------------------------------------------------

export function computeTrendBaselineComparison(
  input: TrendBaselineInput
): TrendBaselineResult {
  // Step 1: Validate
  const validation = validateBaselineWindows(input)
  const allWarnings: TrendBaselineWarning[] = [...validation.warnings]

  // Propagate input warnings
  if (input.warnings) {
    allWarnings.push(...input.warnings)
  }

  // Step 2-3: Compute slopes
  const previousTrendSlope = computeLinearSlope(input.previousWindow)
  const currentTrendSlope = computeLinearSlope(input.currentWindow)

  // Step 4: Delta
  const delta = computeTrendDelta(previousTrendSlope, currentTrendSlope)

  // Step 5: Acceleration
  const prevSpan = input.previousWindow.length
  const currSpan = input.currentWindow.length
  const acceleration = computeAcceleration(previousTrendSlope, currentTrendSlope, prevSpan, currSpan)

  // Step 6: Direction
  const direction = classifyBaselineDirection(delta, previousTrendSlope, currentTrendSlope)

  // Step 7: Reversal
  const reversalIndicator = computeReversalIndicator(previousTrendSlope, currentTrendSlope)

  // Step 8: Baseline deviation
  const baselineDeviation = computeBaselineDeviation(
    input.previousWindow,
    input.currentWindow,
    previousTrendSlope
  )

  // Step 9: Data quality
  const prevQuality = assessDataQuality(
    input.previousWindow,
    input.windowConfig.minPointsPerWindow
  )
  const currQuality = assessDataQuality(
    input.currentWindow,
    input.windowConfig.minPointsPerWindow
  )

  // Step 10: Overall confidence
  const confidence = computeOverallConfidence(prevQuality, currQuality)

  // Step 11: Determine overall data quality (minimum of both)
  const qualityRank: Record<string, number> = { high: 2, moderate: 1, low: 0 }
  const minQualityRank = Math.min(
    qualityRank[prevQuality.quality] ?? 0,
    qualityRank[currQuality.quality] ?? 0
  )
  const dataQuality: TrendBaselineDataQuality =
    minQualityRank === 2 ? 'high' : minQualityRank === 1 ? 'moderate' : 'low'

  return {
    signalType: input.signalType,
    previousTrendSlope,
    currentTrendSlope,
    delta,
    acceleration,
    direction,
    reversalIndicator,
    baselineDeviation,
    dataQuality,
    confidence,
    assumptions: [...input.assumptions],
    warnings: allWarnings,
    provenanceTrail: [input.provenance],
    advisoryOnly: true,
    humanReviewRequired: true,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getWindowSpanDays(points: readonly TrendBaselineDataPoint[]): number {
  if (points.length < 2) return 0
  const timestamps = points.map(p => new Date(p.timestamp).getTime())
  const min = Math.min(...timestamps)
  const max = Math.max(...timestamps)
  return (max - min) / (1000 * 60 * 60 * 24)
}
