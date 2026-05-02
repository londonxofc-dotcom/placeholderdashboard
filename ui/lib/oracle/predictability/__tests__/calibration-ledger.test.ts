// ============================================================================
// Calibration Ledger Tests — Stage M-I Pure Functions
// Tests first (RED). Implementation in calibration-ledger.ts.
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  recordForecast,
  resolveOutcome,
  expireEntry,
  invalidateEntry,
  computeBrierScore,
  computeCalibrationCurve,
  computeExpectedCalibrationError,
  detectConfidenceBias,
  computeAdjustmentFactor,
  buildAggregateResult,
} from '../calibration-ledger'
import {
  CALIBRATION_LEDGER_STATUSES,
  CALIBRATION_DEFAULT_SAFETY_FLAGS,
  type CalibrationLedgerInput,
  type CalibrationLedgerEntry,
  type CalibrationObservation,
  type CalibrationBucket,
  type CalibrationLedgerResult,
} from '../calibration-ledger-types'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<CalibrationLedgerInput> = {}): CalibrationLedgerInput {
  return {
    forecastId: 'fc-001',
    sourceModule: 'test-module',
    forecastedProbability: 0.7,
    confidenceLabel: 'moderate',
    scenario: 'Test scenario A will occur',
    evidenceBasis: ['evidence-1', 'evidence-2'],
    assumptions: ['assumption-1'],
    evaluationWindowMs: 86400000,
    timestamp: 1714600000000,
    ...overrides,
  }
}

function makeEntry(overrides: Partial<CalibrationLedgerEntry> = {}): CalibrationLedgerEntry {
  return {
    forecastId: 'fc-001',
    sourceModule: 'test-module',
    forecastedProbability: 0.7,
    confidenceLabel: 'moderate',
    scenario: 'Test scenario A will occur',
    evidenceBasis: ['evidence-1', 'evidence-2'],
    assumptions: ['assumption-1'],
    evaluationWindowMs: 86400000,
    forecastTimestamp: 1714600000000,
    status: 'pending',
    occurred: null,
    observedAt: null,
    verificationMethod: null,
    humanReviewedBy: null,
    notes: null,
    absoluteError: null,
    squaredError: null,
    surpriseScore: null,
    ...overrides,
  }
}

function makeObservation(overrides: Partial<CalibrationObservation> = {}): CalibrationObservation {
  return {
    forecastId: 'fc-001',
    occurred: true,
    observedAt: 1714686400000,
    verificationMethod: 'manual-review',
    humanReviewedBy: 'reviewer-nick',
    notes: 'Confirmed outcome',
    ...overrides,
  }
}

/** Build a resolved entry with known probability and outcome for Brier/calibration tests. */
function makeResolvedEntry(
  forecastedProbability: number,
  occurred: boolean,
  id = 'fc-resolved'
): CalibrationLedgerEntry {
  const o = occurred ? 1 : 0
  const absErr = Math.abs(forecastedProbability - o)
  const sqErr = absErr * absErr
  const p = occurred ? forecastedProbability : 1 - forecastedProbability
  const clampedP = Math.max(p, 1e-15)
  const surprise = -Math.log2(clampedP)

  return makeEntry({
    forecastId: id,
    forecastedProbability,
    status: 'resolved',
    occurred,
    observedAt: 1714686400000,
    verificationMethod: 'manual-review',
    humanReviewedBy: 'reviewer-nick',
    absoluteError: absErr,
    squaredError: sqErr,
    surpriseScore: surprise,
  })
}

// ---------------------------------------------------------------------------
// 15.1 Forecast Recording
// ---------------------------------------------------------------------------

describe('recordForecast', () => {
  it('creates a valid entry with pending status', () => {
    const entry = recordForecast(makeInput())
    expect(entry.status).toBe(CALIBRATION_LEDGER_STATUSES.pending)
  })

  it('sets occurred to null', () => {
    const entry = recordForecast(makeInput())
    expect(entry.occurred).toBeNull()
  })

  it('sets absoluteError to null', () => {
    const entry = recordForecast(makeInput())
    expect(entry.absoluteError).toBeNull()
  })

  it('sets squaredError to null', () => {
    const entry = recordForecast(makeInput())
    expect(entry.squaredError).toBeNull()
  })

  it('sets surpriseScore to null', () => {
    const entry = recordForecast(makeInput())
    expect(entry.surpriseScore).toBeNull()
  })

  it('sets observedAt to null', () => {
    const entry = recordForecast(makeInput())
    expect(entry.observedAt).toBeNull()
  })

  it('sets verificationMethod to null', () => {
    const entry = recordForecast(makeInput())
    expect(entry.verificationMethod).toBeNull()
  })

  it('sets humanReviewedBy to null', () => {
    const entry = recordForecast(makeInput())
    expect(entry.humanReviewedBy).toBeNull()
  })

  it('preserves forecastId from input', () => {
    const entry = recordForecast(makeInput({ forecastId: 'fc-xyz' }))
    expect(entry.forecastId).toBe('fc-xyz')
  })

  it('preserves sourceModule from input', () => {
    const entry = recordForecast(makeInput({ sourceModule: 'cycle-analysis' }))
    expect(entry.sourceModule).toBe('cycle-analysis')
  })

  it('preserves forecastedProbability from input', () => {
    const entry = recordForecast(makeInput({ forecastedProbability: 0.42 }))
    expect(entry.forecastedProbability).toBe(0.42)
  })

  it('preserves confidenceLabel from input', () => {
    const entry = recordForecast(makeInput({ confidenceLabel: 'high' }))
    expect(entry.confidenceLabel).toBe('high')
  })

  it('preserves scenario from input', () => {
    const entry = recordForecast(makeInput({ scenario: 'custom scenario' }))
    expect(entry.scenario).toBe('custom scenario')
  })

  it('preserves evidenceBasis from input', () => {
    const entry = recordForecast(makeInput({ evidenceBasis: ['a', 'b', 'c'] }))
    expect(entry.evidenceBasis).toEqual(['a', 'b', 'c'])
  })

  it('preserves assumptions from input', () => {
    const entry = recordForecast(makeInput({ assumptions: ['x', 'y'] }))
    expect(entry.assumptions).toEqual(['x', 'y'])
  })

  it('preserves evaluationWindowMs from input', () => {
    const entry = recordForecast(makeInput({ evaluationWindowMs: 3600000 }))
    expect(entry.evaluationWindowMs).toBe(3600000)
  })

  it('maps input timestamp to forecastTimestamp', () => {
    const entry = recordForecast(makeInput({ timestamp: 9999999 }))
    expect(entry.forecastTimestamp).toBe(9999999)
  })
})

// ---------------------------------------------------------------------------
// 15.2 Outcome Resolution
// ---------------------------------------------------------------------------

describe('resolveOutcome', () => {
  it('transitions pending to resolved', () => {
    const resolved = resolveOutcome(makeEntry(), makeObservation())
    expect(resolved.status).toBe(CALIBRATION_LEDGER_STATUSES.resolved)
  })

  it('sets occurred from observation', () => {
    const resolved = resolveOutcome(makeEntry(), makeObservation({ occurred: true }))
    expect(resolved.occurred).toBe(true)

    const resolvedFalse = resolveOutcome(
      makeEntry({ forecastId: 'fc-002' }),
      makeObservation({ forecastId: 'fc-002', occurred: false })
    )
    expect(resolvedFalse.occurred).toBe(false)
  })

  it('sets observedAt from observation', () => {
    const resolved = resolveOutcome(makeEntry(), makeObservation({ observedAt: 12345 }))
    expect(resolved.observedAt).toBe(12345)
  })

  it('sets verificationMethod from observation', () => {
    const resolved = resolveOutcome(makeEntry(), makeObservation({ verificationMethod: 'automated' }))
    expect(resolved.verificationMethod).toBe('automated')
  })

  it('sets humanReviewedBy from observation', () => {
    const resolved = resolveOutcome(makeEntry(), makeObservation({ humanReviewedBy: 'alice' }))
    expect(resolved.humanReviewedBy).toBe('alice')
  })

  it('computes correct absoluteError when occurred is true', () => {
    // forecastedProbability=0.7, occurred=true (o=1), absoluteError = |0.7-1| = 0.3
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.7 }),
      makeObservation({ occurred: true })
    )
    expect(resolved.absoluteError).toBeCloseTo(0.3, 10)
  })

  it('computes correct absoluteError when occurred is false', () => {
    // forecastedProbability=0.7, occurred=false (o=0), absoluteError = |0.7-0| = 0.7
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.7 }),
      makeObservation({ occurred: false })
    )
    expect(resolved.absoluteError).toBeCloseTo(0.7, 10)
  })

  it('computes correct squaredError when occurred is true', () => {
    // (0.7-1)^2 = 0.09
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.7 }),
      makeObservation({ occurred: true })
    )
    expect(resolved.squaredError).toBeCloseTo(0.09, 10)
  })

  it('computes correct squaredError when occurred is false', () => {
    // (0.7-0)^2 = 0.49
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.7 }),
      makeObservation({ occurred: false })
    )
    expect(resolved.squaredError).toBeCloseTo(0.49, 10)
  })

  it('computes correct surpriseScore when occurred is true', () => {
    // p = forecastedProbability = 0.7, surprise = -log2(0.7) ~ 0.5146
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.7 }),
      makeObservation({ occurred: true })
    )
    expect(resolved.surpriseScore).toBeCloseTo(-Math.log2(0.7), 6)
  })

  it('computes correct surpriseScore when occurred is false', () => {
    // p = 1 - forecastedProbability = 0.3, surprise = -log2(0.3) ~ 1.7370
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.7 }),
      makeObservation({ occurred: false })
    )
    expect(resolved.surpriseScore).toBeCloseTo(-Math.log2(0.3), 6)
  })

  it('handles surpriseScore for extreme probability near 1.0 when occurred', () => {
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.999 }),
      makeObservation({ occurred: true })
    )
    expect(resolved.surpriseScore).toBeCloseTo(-Math.log2(0.999), 6)
    expect(Number.isFinite(resolved.surpriseScore!)).toBe(true)
  })

  it('handles surpriseScore for extreme probability near 0.0 when occurred (clamp avoids Infinity)', () => {
    const resolved = resolveOutcome(
      makeEntry({ forecastedProbability: 0.0 }),
      makeObservation({ occurred: true })
    )
    // p would be 0, but should be clamped to avoid -log2(0) = Infinity
    expect(Number.isFinite(resolved.surpriseScore!)).toBe(true)
    expect(resolved.surpriseScore!).toBeGreaterThan(0)
  })

  it('rejects resolution of a non-pending entry (resolved)', () => {
    const alreadyResolved = makeEntry({ status: 'resolved' })
    expect(() => resolveOutcome(alreadyResolved, makeObservation())).toThrow()
  })

  it('rejects resolution of a non-pending entry (expired)', () => {
    const expired = makeEntry({ status: 'expired' })
    expect(() => resolveOutcome(expired, makeObservation())).toThrow()
  })

  it('rejects resolution of a non-pending entry (invalidated)', () => {
    const invalidated = makeEntry({ status: 'invalidated' })
    expect(() => resolveOutcome(invalidated, makeObservation())).toThrow()
  })

  it('requires humanReviewedBy to be non-empty', () => {
    expect(() =>
      resolveOutcome(makeEntry(), makeObservation({ humanReviewedBy: '' }))
    ).toThrow()
  })

  it('does not mutate the input entry', () => {
    const entry = makeEntry()
    const copy = JSON.parse(JSON.stringify(entry))
    resolveOutcome(entry, makeObservation())
    expect(entry).toEqual(copy)
  })

  it('preserves notes from observation', () => {
    const resolved = resolveOutcome(makeEntry(), makeObservation({ notes: 'important note' }))
    expect(resolved.notes).toBe('important note')
  })
})

// ---------------------------------------------------------------------------
// 15.3 Entry Lifecycle
// ---------------------------------------------------------------------------

describe('expireEntry', () => {
  it('transitions pending to expired', () => {
    const expired = expireEntry(makeEntry())
    expect(expired.status).toBe(CALIBRATION_LEDGER_STATUSES.expired)
  })

  it('rejects expiring a resolved entry', () => {
    expect(() => expireEntry(makeEntry({ status: 'resolved' }))).toThrow()
  })

  it('rejects expiring an already expired entry', () => {
    expect(() => expireEntry(makeEntry({ status: 'expired' }))).toThrow()
  })

  it('rejects expiring an invalidated entry', () => {
    expect(() => expireEntry(makeEntry({ status: 'invalidated' }))).toThrow()
  })

  it('does not mutate the input entry', () => {
    const entry = makeEntry()
    const copy = JSON.parse(JSON.stringify(entry))
    expireEntry(entry)
    expect(entry).toEqual(copy)
  })
})

describe('invalidateEntry', () => {
  it('transitions pending to invalidated', () => {
    const invalidated = invalidateEntry(makeEntry(), 'duplicate forecast')
    expect(invalidated.status).toBe(CALIBRATION_LEDGER_STATUSES.invalidated)
  })

  it('rejects invalidating a resolved entry', () => {
    expect(() => invalidateEntry(makeEntry({ status: 'resolved' }), 'reason')).toThrow()
  })

  it('rejects invalidating an expired entry', () => {
    expect(() => invalidateEntry(makeEntry({ status: 'expired' }), 'reason')).toThrow()
  })

  it('rejects invalidating an already invalidated entry', () => {
    expect(() => invalidateEntry(makeEntry({ status: 'invalidated' }), 'reason')).toThrow()
  })

  it('does not mutate the input entry', () => {
    const entry = makeEntry()
    const copy = JSON.parse(JSON.stringify(entry))
    invalidateEntry(entry, 'reason')
    expect(entry).toEqual(copy)
  })
})

// ---------------------------------------------------------------------------
// 15.4 Brier Score
// ---------------------------------------------------------------------------

describe('computeBrierScore', () => {
  it('returns 0.0 for perfect forecasts (all correct with p=1.0 or p=0.0)', () => {
    const entries = [
      makeResolvedEntry(1.0, true, 'fc-1'),
      makeResolvedEntry(0.0, false, 'fc-2'),
    ]
    expect(computeBrierScore(entries)).toBeCloseTo(0.0, 10)
  })

  it('returns 1.0 for worst-case forecasts (all maximally wrong)', () => {
    const entries = [
      makeResolvedEntry(0.0, true, 'fc-1'),
      makeResolvedEntry(1.0, false, 'fc-2'),
    ]
    expect(computeBrierScore(entries)).toBeCloseTo(1.0, 10)
  })

  it('computes correct score for mixed forecasts', () => {
    // Entry 1: p=0.8, occurred=true  -> (0.8-1)^2 = 0.04
    // Entry 2: p=0.3, occurred=false -> (0.3-0)^2 = 0.09
    // BS = (0.04 + 0.09) / 2 = 0.065
    const entries = [
      makeResolvedEntry(0.8, true, 'fc-1'),
      makeResolvedEntry(0.3, false, 'fc-2'),
    ]
    expect(computeBrierScore(entries)).toBeCloseTo(0.065, 10)
  })

  it('excludes non-resolved entries from calculation', () => {
    const entries = [
      makeResolvedEntry(1.0, true, 'fc-1'),
      makeEntry({ forecastId: 'fc-pending', status: 'pending' }),
      makeEntry({ forecastId: 'fc-expired', status: 'expired' }),
      makeEntry({ forecastId: 'fc-invalid', status: 'invalidated' }),
    ]
    // Only fc-1 is resolved: BS = (1.0-1)^2 / 1 = 0.0
    expect(computeBrierScore(entries)).toBeCloseTo(0.0, 10)
  })

  it('returns 0.25 for a coin-flip forecast (p=0.5) regardless of outcome', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    // (0.5-1)^2 = 0.25
    expect(computeBrierScore(entries)).toBeCloseTo(0.25, 10)

    const entries2 = [makeResolvedEntry(0.5, false, 'fc-2')]
    // (0.5-0)^2 = 0.25
    expect(computeBrierScore(entries2)).toBeCloseTo(0.25, 10)
  })

  it('handles single entry', () => {
    const entries = [makeResolvedEntry(0.9, true, 'fc-1')]
    // (0.9-1)^2 = 0.01
    expect(computeBrierScore(entries)).toBeCloseTo(0.01, 10)
  })
})

// ---------------------------------------------------------------------------
// 15.5 Calibration Curve
// ---------------------------------------------------------------------------

describe('computeCalibrationCurve', () => {
  it('produces non-overlapping bins covering [0,1]', () => {
    const entries = [
      makeResolvedEntry(0.1, false, 'fc-1'),
      makeResolvedEntry(0.5, true, 'fc-2'),
      makeResolvedEntry(0.9, true, 'fc-3'),
    ]
    const curve = computeCalibrationCurve(entries, 5)

    // First bin starts at 0
    expect(curve[0].binLower).toBeCloseTo(0, 10)
    // Last bin ends at 1
    expect(curve[curve.length - 1].binUpper).toBeCloseTo(1, 10)

    // Non-overlapping: each bin's upper equals next bin's lower
    for (let i = 0; i < curve.length - 1; i++) {
      expect(curve[i].binUpper).toBeCloseTo(curve[i + 1].binLower, 10)
    }
  })

  it('returns correct number of bins', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const curve = computeCalibrationCurve(entries, 10)
    expect(curve).toHaveLength(10)
  })

  it('reports meanPredictedProbability within each bin', () => {
    // Two entries in the same bin: 0.71, 0.79 -> mean ~ 0.75
    const entries = [
      makeResolvedEntry(0.71, true, 'fc-1'),
      makeResolvedEntry(0.79, false, 'fc-2'),
    ]
    const curve = computeCalibrationCurve(entries, 10)
    // Both should land in the 0.7-0.8 bin
    const bin = curve.find(b => b.binLower >= 0.7 - 0.001 && b.binUpper <= 0.8 + 0.001 && b.count > 0)
    expect(bin).toBeDefined()
    expect(bin!.meanPredictedProbability).toBeCloseTo(0.75, 2)
  })

  it('reports observedFrequency as fraction of occurred in each bin', () => {
    // Two entries in same bin: one occurred, one did not -> observedFrequency = 0.5
    const entries = [
      makeResolvedEntry(0.71, true, 'fc-1'),
      makeResolvedEntry(0.79, false, 'fc-2'),
    ]
    const curve = computeCalibrationCurve(entries, 10)
    const bin = curve.find(b => b.count === 2)
    expect(bin).toBeDefined()
    expect(bin!.observedFrequency).toBeCloseTo(0.5, 10)
  })

  it('reports empty bins with zero count', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const curve = computeCalibrationCurve(entries, 10)
    const emptyBins = curve.filter(b => b.count === 0)
    expect(emptyBins.length).toBe(9) // only 1 of 10 bins has data
    for (const bin of emptyBins) {
      expect(bin.meanPredictedProbability).toBe(0)
      expect(bin.observedFrequency).toBe(0)
    }
  })

  it('produces diagonal for perfect calibration (predicted matches observed)', () => {
    // If we predict 0.8 and 80% actually occur, the bin should be on the diagonal
    const entries = [
      makeResolvedEntry(0.85, true, 'fc-1'),
      makeResolvedEntry(0.85, true, 'fc-2'),
      makeResolvedEntry(0.85, true, 'fc-3'),
      makeResolvedEntry(0.85, false, 'fc-4'),
      // 3 out of 4 occurred = 0.75, mean predicted = 0.85
      // Not perfectly diagonal but close. For exact diagonal:
    ]
    // Use 5 entries: 4 occurred at p=0.8 and 1 not -> observedFreq = 0.8 = meanPredicted
    const perfectEntries = [
      makeResolvedEntry(0.81, true, 'fc-a'),
      makeResolvedEntry(0.82, true, 'fc-b'),
      makeResolvedEntry(0.83, true, 'fc-c'),
      makeResolvedEntry(0.84, true, 'fc-d'),
      makeResolvedEntry(0.80, false, 'fc-e'),
    ]
    const curve = computeCalibrationCurve(perfectEntries, 10)
    const activeBin = curve.find(b => b.count > 0)
    expect(activeBin).toBeDefined()
    // 4/5 occurred = 0.8 observed frequency, mean predicted ~ 0.82
    // Close to diagonal (within 0.05)
    expect(Math.abs(activeBin!.observedFrequency - activeBin!.meanPredictedProbability)).toBeLessThan(0.05)
  })

  it('defaults to 10 bins when binCount is omitted', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const curve = computeCalibrationCurve(entries)
    expect(curve).toHaveLength(10)
  })

  it('each bin has correct count', () => {
    const entries = [
      makeResolvedEntry(0.15, true, 'fc-1'),
      makeResolvedEntry(0.15, false, 'fc-2'),
      makeResolvedEntry(0.55, true, 'fc-3'),
    ]
    const curve = computeCalibrationCurve(entries, 5)
    const totalCount = curve.reduce((sum, b) => sum + b.count, 0)
    expect(totalCount).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// 15.6 Expected Calibration Error
// ---------------------------------------------------------------------------

describe('computeExpectedCalibrationError', () => {
  it('returns 0.0 for perfectly calibrated curve', () => {
    // Perfect: predicted mean equals observed frequency in every bin
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.3, observedFrequency: 0.3, count: 10 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.7, observedFrequency: 0.7, count: 10 },
    ]
    expect(computeExpectedCalibrationError(curve)).toBeCloseTo(0.0, 10)
  })

  it('increases as predicted and observed diverge', () => {
    const wellCalibrated: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.3, observedFrequency: 0.32, count: 10 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.7, observedFrequency: 0.68, count: 10 },
    ]
    const poorlyCalibrated: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.3, observedFrequency: 0.7, count: 10 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.7, observedFrequency: 0.3, count: 10 },
    ]
    const eceGood = computeExpectedCalibrationError(wellCalibrated)
    const eceBad = computeExpectedCalibrationError(poorlyCalibrated)
    expect(eceBad).toBeGreaterThan(eceGood)
  })

  it('correctly weights by bin count', () => {
    // Bin A: count=90, |0.5-0.5|=0 contribution=0
    // Bin B: count=10, |0.8-0.2|=0.6 contribution = (10/100)*0.6 = 0.06
    // ECE = 0.06
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.5, observedFrequency: 0.5, count: 90 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.8, observedFrequency: 0.2, count: 10 },
    ]
    expect(computeExpectedCalibrationError(curve)).toBeCloseTo(0.06, 6)
  })

  it('returns 0.0 for empty curve (all bins count=0)', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0, observedFrequency: 0, count: 0 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0, observedFrequency: 0, count: 0 },
    ]
    expect(computeExpectedCalibrationError(curve)).toBeCloseTo(0.0, 10)
  })

  it('result is always non-negative', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 1.0, meanPredictedProbability: 0.9, observedFrequency: 0.1, count: 5 },
    ]
    expect(computeExpectedCalibrationError(curve)).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// 15.7 Confidence Bias Detection
// ---------------------------------------------------------------------------

describe('detectConfidenceBias', () => {
  it('detects overconfidence when predicted > observed across bins', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.4, observedFrequency: 0.2, count: 20 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.8, observedFrequency: 0.5, count: 20 },
    ]
    const result = detectConfidenceBias(curve)
    expect(result.overconfidenceDetected).toBe(true)
  })

  it('detects underconfidence when predicted < observed across bins', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.2, observedFrequency: 0.4, count: 20 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.6, observedFrequency: 0.9, count: 20 },
    ]
    const result = detectConfidenceBias(curve)
    expect(result.underconfidenceDetected).toBe(true)
  })

  it('sets neither flag when well-calibrated', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.3, observedFrequency: 0.3, count: 20 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.7, observedFrequency: 0.7, count: 20 },
    ]
    const result = detectConfidenceBias(curve)
    expect(result.overconfidenceDetected).toBe(false)
    expect(result.underconfidenceDetected).toBe(false)
  })

  it('handles empty bins gracefully (no flags set)', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0, observedFrequency: 0, count: 0 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0, observedFrequency: 0, count: 0 },
    ]
    const result = detectConfidenceBias(curve)
    expect(result.overconfidenceDetected).toBe(false)
    expect(result.underconfidenceDetected).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 15.8 Adjustment Factor
// ---------------------------------------------------------------------------

describe('computeAdjustmentFactor', () => {
  it('returns 1.0 for perfectly calibrated curve', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.3, observedFrequency: 0.3, count: 10 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.7, observedFrequency: 0.7, count: 10 },
    ]
    expect(computeAdjustmentFactor(curve)).toBeCloseTo(1.0, 6)
  })

  it('returns > 1.0 for underconfident forecasts (observed > predicted)', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.2, observedFrequency: 0.4, count: 10 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.6, observedFrequency: 0.9, count: 10 },
    ]
    expect(computeAdjustmentFactor(curve)).toBeGreaterThan(1.0)
  })

  it('returns < 1.0 for overconfident forecasts (observed < predicted)', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 0.5, meanPredictedProbability: 0.4, observedFrequency: 0.2, count: 10 },
      { binLower: 0.5, binUpper: 1.0, meanPredictedProbability: 0.8, observedFrequency: 0.5, count: 10 },
    ]
    expect(computeAdjustmentFactor(curve)).toBeLessThan(1.0)
  })

  it('is always positive', () => {
    const curve: CalibrationBucket[] = [
      { binLower: 0.0, binUpper: 1.0, meanPredictedProbability: 0.9, observedFrequency: 0.1, count: 5 },
    ]
    expect(computeAdjustmentFactor(curve)).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 15.9 Minimum Count Gate
// ---------------------------------------------------------------------------

describe('buildAggregateResult — minimum count gate', () => {
  it('sets minimumCountMet to false when resolved count is below threshold', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result = buildAggregateResult(entries, { minimumCount: 10 })
    expect(result.minimumCountMet).toBe(false)
  })

  it('sets minimumCountMet to true when resolved count meets threshold', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeResolvedEntry(0.5, i % 2 === 0, `fc-${i}`)
    )
    const result = buildAggregateResult(entries, { minimumCount: 10 })
    expect(result.minimumCountMet).toBe(true)
  })

  it('still computes raw per-entry metrics even below minimum count', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result = buildAggregateResult(entries, { minimumCount: 100 })
    expect(result.minimumCountMet).toBe(false)
    // Brier score should still be computed
    expect(typeof result.brierScore).toBe('number')
    expect(Number.isFinite(result.brierScore)).toBe(true)
  })

  it('includes INSUFFICIENT_DATA warning when below minimum', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result = buildAggregateResult(entries, { minimumCount: 50 })
    const insufficientWarning = result.warnings.find(w => w.code === 'INSUFFICIENT_DATA')
    expect(insufficientWarning).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 15.10 Safety Flags
// ---------------------------------------------------------------------------

describe('safety flags', () => {
  it('buildAggregateResult includes advisoryOnly: true', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result = buildAggregateResult(entries)
    expect(result.advisoryOnly).toBe(true)
  })

  it('buildAggregateResult includes humanReviewRequired: true', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result = buildAggregateResult(entries)
    expect(result.humanReviewRequired).toBe(true)
  })

  it('buildAggregateResult includes noActionRecommended: true', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result = buildAggregateResult(entries)
    expect(result.noActionRecommended).toBe(true)
  })

  it('result satisfies CalibrationLedgerResult type', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result: CalibrationLedgerResult = buildAggregateResult(entries)
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 15.10 continued — No side effects / purity
// ---------------------------------------------------------------------------

describe('purity and immutability', () => {
  it('recordForecast does not mutate input', () => {
    const input = makeInput()
    const copy = JSON.parse(JSON.stringify(input))
    recordForecast(input)
    expect(input).toEqual(copy)
  })

  it('resolveOutcome does not mutate observation', () => {
    const obs = makeObservation()
    const copy = JSON.parse(JSON.stringify(obs))
    resolveOutcome(makeEntry(), obs)
    expect(obs).toEqual(copy)
  })

  it('computeBrierScore does not mutate entries array', () => {
    const entries = [makeResolvedEntry(0.5, true)]
    const copy = JSON.parse(JSON.stringify(entries))
    computeBrierScore(entries)
    expect(entries).toEqual(copy)
  })

  it('buildAggregateResult does not mutate entries array', () => {
    const entries = [makeResolvedEntry(0.5, true)]
    const copy = JSON.parse(JSON.stringify(entries))
    buildAggregateResult(entries)
    expect(entries).toEqual(copy)
  })

  it('same input to buildAggregateResult produces same output', () => {
    const entries = [
      makeResolvedEntry(0.8, true, 'fc-1'),
      makeResolvedEntry(0.3, false, 'fc-2'),
    ]
    const r1 = buildAggregateResult(entries)
    const r2 = buildAggregateResult(entries)
    expect(r1).toEqual(r2)
  })
})

// ---------------------------------------------------------------------------
// buildAggregateResult — full integration
// ---------------------------------------------------------------------------

describe('buildAggregateResult', () => {
  it('returns correct totalForecasts including all statuses', () => {
    const entries = [
      makeResolvedEntry(0.5, true, 'fc-1'),
      makeEntry({ forecastId: 'fc-2', status: 'pending' }),
      makeEntry({ forecastId: 'fc-3', status: 'expired' }),
    ]
    const result = buildAggregateResult(entries)
    expect(result.totalForecasts).toBe(3)
  })

  it('returns correct resolvedForecasts count', () => {
    const entries = [
      makeResolvedEntry(0.5, true, 'fc-1'),
      makeResolvedEntry(0.8, false, 'fc-2'),
      makeEntry({ forecastId: 'fc-3', status: 'pending' }),
    ]
    const result = buildAggregateResult(entries)
    expect(result.resolvedForecasts).toBe(2)
  })

  it('returns correct pendingForecasts count', () => {
    const entries = [
      makeResolvedEntry(0.5, true, 'fc-1'),
      makeEntry({ forecastId: 'fc-2', status: 'pending' }),
      makeEntry({ forecastId: 'fc-3', status: 'pending' }),
    ]
    const result = buildAggregateResult(entries)
    expect(result.pendingForecasts).toBe(2)
  })

  it('computes brierScore matching computeBrierScore output', () => {
    const entries = [
      makeResolvedEntry(0.8, true, 'fc-1'),
      makeResolvedEntry(0.3, false, 'fc-2'),
    ]
    const result = buildAggregateResult(entries)
    const directBrier = computeBrierScore(entries)
    expect(result.brierScore).toBeCloseTo(directBrier, 10)
  })

  it('calibrationCurve has correct length from binCount config', () => {
    const entries = [makeResolvedEntry(0.5, true, 'fc-1')]
    const result = buildAggregateResult(entries, { binCount: 5 })
    expect(result.calibrationCurve).toHaveLength(5)
  })

  it('includes auditMetadata with correct counts', () => {
    const entries = [
      makeResolvedEntry(0.5, true, 'fc-1'),
      makeEntry({ forecastId: 'fc-2', status: 'pending' }),
      makeEntry({ forecastId: 'fc-3', status: 'expired' }),
      makeEntry({ forecastId: 'fc-4', status: 'invalidated' }),
    ]
    const result = buildAggregateResult(entries)
    expect(result.auditMetadata.resolvedCount).toBe(1)
    expect(result.auditMetadata.pendingCount).toBe(1)
    expect(result.auditMetadata.expiredCount).toBe(1)
    expect(result.auditMetadata.invalidatedCount).toBe(1)
    expect(result.auditMetadata.totalEntries).toBe(4)
  })

  it('includes confidenceAdjustment with basedOnCount', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeResolvedEntry(0.6, i < 6, `fc-${i}`)
    )
    const result = buildAggregateResult(entries)
    expect(result.confidenceAdjustment).toBeDefined()
    expect(result.confidenceAdjustment.basedOnCount).toBe(10)
  })

  it('recommendedAdjustment matches computeAdjustmentFactor', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeResolvedEntry(0.6, i < 6, `fc-${i}`)
    )
    const result = buildAggregateResult(entries)
    const curve = computeCalibrationCurve(entries)
    const directFactor = computeAdjustmentFactor(curve)
    expect(result.recommendedAdjustment).toBeCloseTo(directFactor, 6)
  })

  it('handles empty entries array gracefully', () => {
    const result = buildAggregateResult([])
    expect(result.totalForecasts).toBe(0)
    expect(result.resolvedForecasts).toBe(0)
    expect(result.minimumCountMet).toBe(false)
    expect(result.advisoryOnly).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 15.11 Scope Boundary Checks
// ---------------------------------------------------------------------------

describe('scope boundary checks', () => {
  const implFile = path.resolve(__dirname, '..', 'calibration-ledger.ts')
  const testFile = path.resolve(__dirname, 'calibration-ledger.test.ts')

  let implContent: string
  let testContent: string

  beforeAll(async () => {
    const fs = await import('fs')
    implContent = fs.readFileSync(implFile, 'utf-8')
    testContent = fs.readFileSync(testFile, 'utf-8')
  })

  it('only imports from calibration-ledger-types', () => {
    const importLines = implContent.split('\n').filter(
      (line: string) => line.trim().startsWith('import ') && line.includes('from')
    )
    for (const line of importLines) {
      expect(line).toContain('calibration-ledger-types')
    }
  })

  it('does not import from cycle-analysis', () => {
    expect(implContent).not.toMatch(/import.*from.*['"].*cycle-analysis/)
    // Check test file imports only (first 30 lines where imports live)
    const testImportSection = testContent.split('\n').slice(0, 30).join('\n')
    expect(testImportSection).not.toMatch(/import.*from.*['"].*cycle-analysis/)
  })

  it('does not import from Evidence Router', () => {
    const forbidden = 'evidence-router'
    expect(implContent).not.toContain(forbidden)
  })

  it('does not import from Predictability Kernel', () => {
    const forbidden = 'predictability-kernel'
    expect(implContent).not.toContain(forbidden)
  })

  it('does not reference shell-promoter', () => {
    expect(implContent).not.toContain('shell-promoter')
  })

  it('does not reference KEEP_DEFERRED', () => {
    expect(implContent).not.toContain('KEEP_DEFERRED')
  })

  it('contains no certainty language', () => {
    const forbidden = /guaranteed|certain|definite|will happen|impossible/i
    expect(implContent).not.toMatch(forbidden)
  })

  it('does not import from earlier stage implementation files', () => {
    const forbiddenImports = [
      'bayesian-updater',
      'monte-carlo-scenarios',
      'markov-regime-transitions',
      'trend-baseline-comparison',
      'cycle-phase',
    ]
    for (const mod of forbiddenImports) {
      expect(implContent).not.toMatch(new RegExp(`import.*from.*['"].*${mod}['"]`))
    }
  })

  it('contains no I/O operations (fetch, fs, localStorage, document, window)', () => {
    expect(implContent).not.toMatch(/\bfetch\s*\(/)
    expect(implContent).not.toContain('XMLHttpRequest')
    expect(implContent).not.toContain('localStorage')
    expect(implContent).not.toContain('sessionStorage')
    expect(implContent).not.toContain('document.')
    expect(implContent).not.toContain('window.')
  })

  it('contains no Math.random or Date.now calls', () => {
    expect(implContent).not.toContain('Math.random')
    expect(implContent).not.toContain('Date.now')
    expect(implContent).not.toContain('new Date')
  })
})
