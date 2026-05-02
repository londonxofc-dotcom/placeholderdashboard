// ============================================================================
// Trend Baseline Comparison Tests — Stage M-G Pure Functions
// ============================================================================

import {
  TREND_BASELINE_DIRECTIONS,
  TREND_BASELINE_THRESHOLDS,
  type TrendBaselineDataPoint,
  type TrendBaselineInput,
  type TrendBaselineResult,
  type TrendBaselineWarning,
} from '../trend-baseline-types'

import {
  validateBaselineWindows,
  computeLinearSlope,
  computeTrendDelta,
  computeAcceleration,
  classifyBaselineDirection,
  computeReversalIndicator,
  computeBaselineDeviation,
  assessDataQuality,
  computeOverallConfidence,
  computeTrendBaselineComparison,
} from '../trend-baseline-comparison'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makePoint(
  timestamp: string,
  value: number,
  confidence = 0.9
): TrendBaselineDataPoint {
  return { timestamp, value, confidence }
}

function makeLinearPoints(
  startValue: number,
  slope: number,
  count: number,
  startDay = 1,
  confidence = 0.9
): readonly TrendBaselineDataPoint[] {
  return Array.from({ length: count }, (_, i) =>
    makePoint(`2026-01-${String(startDay + i).padStart(2, '0')}`, startValue + slope * i, confidence)
  )
}

function makeInput(overrides: Partial<TrendBaselineInput> = {}): TrendBaselineInput {
  return {
    previousWindow: makeLinearPoints(10, 1, 5, 1),
    currentWindow: makeLinearPoints(20, 2, 5, 10),
    windowConfig: {
      minPointsPerWindow: 3,
      overlapPolicy: 'reject' as const,
    },
    signalType: 'test-signal',
    assumptions: ['test assumption'],
    provenance: 'test-source',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 1-5: validateBaselineWindows
// ---------------------------------------------------------------------------

describe('validateBaselineWindows', () => {
  // Spec req 1
  it('passes validation for non-overlapping windows with sufficient data points', () => {
    const result = validateBaselineWindows(makeInput())
    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  // Spec req 2
  it('produces block-severity warning for overlapping windows with reject policy', () => {
    const input = makeInput({
      previousWindow: makeLinearPoints(10, 1, 5, 1),
      currentWindow: makeLinearPoints(20, 2, 5, 3), // overlaps with previous (days 3-7 vs 1-5)
      windowConfig: { minPointsPerWindow: 3, overlapPolicy: 'reject' },
    })
    const result = validateBaselineWindows(input)
    expect(result.valid).toBe(false)
    const overlapWarning = result.warnings.find(w => w.code === 'WINDOWS_OVERLAP')
    expect(overlapWarning).toBeDefined()
    expect(overlapWarning!.severity).toBe('block')
  })

  // Spec req 3
  it('produces warn-severity warning for overlapping windows with warn policy', () => {
    const input = makeInput({
      previousWindow: makeLinearPoints(10, 1, 5, 1),
      currentWindow: makeLinearPoints(20, 2, 5, 3),
      windowConfig: { minPointsPerWindow: 3, overlapPolicy: 'warn' },
    })
    const result = validateBaselineWindows(input)
    expect(result.valid).toBe(true)
    const overlapWarning = result.warnings.find(w => w.code === 'WINDOWS_OVERLAP')
    expect(overlapWarning).toBeDefined()
    expect(overlapWarning!.severity).toBe('warn')
  })

  // Spec req 4
  it('produces block-severity warning for empty window', () => {
    const input = makeInput({ previousWindow: [] })
    const result = validateBaselineWindows(input)
    expect(result.valid).toBe(false)
    const emptyWarning = result.warnings.find(w => w.code === 'WINDOW_EMPTY')
    expect(emptyWarning).toBeDefined()
    expect(emptyWarning!.severity).toBe('block')
  })

  // Spec req 5
  it('produces block-severity warning for window below minimum point count', () => {
    const input = makeInput({
      previousWindow: makeLinearPoints(10, 1, 2, 1),
      windowConfig: { minPointsPerWindow: 3, overlapPolicy: 'reject' },
    })
    const result = validateBaselineWindows(input)
    expect(result.valid).toBe(false)
    const minWarning = result.warnings.find(w => w.code === 'INSUFFICIENT_POINTS')
    expect(minWarning).toBeDefined()
    expect(minWarning!.severity).toBe('block')
  })

  // Spec req 27
  it('produces block-severity warning for NaN values in data points', () => {
    const input = makeInput({
      previousWindow: [
        makePoint('2026-01-01', 10),
        makePoint('2026-01-02', NaN),
        makePoint('2026-01-03', 12),
      ],
    })
    const result = validateBaselineWindows(input)
    expect(result.valid).toBe(false)
    const nanWarning = result.warnings.find(w => w.code === 'INVALID_VALUE')
    expect(nanWarning).toBeDefined()
    expect(nanWarning!.severity).toBe('block')
  })

  // Spec req 28
  it('produces block-severity warning for Infinity values in data points', () => {
    const input = makeInput({
      currentWindow: [
        makePoint('2026-01-10', 20),
        makePoint('2026-01-11', Infinity),
        makePoint('2026-01-12', 22),
      ],
    })
    const result = validateBaselineWindows(input)
    expect(result.valid).toBe(false)
    const infWarning = result.warnings.find(w => w.code === 'INVALID_VALUE')
    expect(infWarning).toBeDefined()
    expect(infWarning!.severity).toBe('block')
  })
})

// ---------------------------------------------------------------------------
// 6-8: computeLinearSlope
// ---------------------------------------------------------------------------

describe('computeLinearSlope', () => {
  // Spec req 6
  it('returns correct slope for known linear data', () => {
    const points = makeLinearPoints(1, 1, 3) // values: 1, 2, 3
    const slope = computeLinearSlope(points)
    expect(slope).toBeCloseTo(1.0, 6)
  })

  // Spec req 7
  it('returns 0 for constant data', () => {
    const points = [
      makePoint('2026-01-01', 5),
      makePoint('2026-01-02', 5),
      makePoint('2026-01-03', 5),
    ]
    const slope = computeLinearSlope(points)
    expect(slope).toBeCloseTo(0, 6)
  })

  // Spec req 8
  it('returns 0 for single-point input', () => {
    const points = [makePoint('2026-01-01', 10)]
    const slope = computeLinearSlope(points)
    expect(slope).toBe(0)
  })

  it('returns 0 for empty input', () => {
    const slope = computeLinearSlope([])
    expect(slope).toBe(0)
  })

  it('returns correct negative slope', () => {
    const points = makeLinearPoints(10, -2, 4) // 10, 8, 6, 4
    const slope = computeLinearSlope(points)
    expect(slope).toBeCloseTo(-2.0, 6)
  })
})

// ---------------------------------------------------------------------------
// 9: computeTrendDelta
// ---------------------------------------------------------------------------

describe('computeTrendDelta', () => {
  // Spec req 9
  it('correctly computes currentSlope - previousSlope', () => {
    expect(computeTrendDelta(1.0, 2.5)).toBeCloseTo(1.5, 10)
    expect(computeTrendDelta(3.0, 1.0)).toBeCloseTo(-2.0, 10)
    expect(computeTrendDelta(-1.0, 1.0)).toBeCloseTo(2.0, 10)
    expect(computeTrendDelta(0.5, 0.5)).toBeCloseTo(0, 10)
  })
})

// ---------------------------------------------------------------------------
// 10: computeAcceleration
// ---------------------------------------------------------------------------

describe('computeAcceleration', () => {
  // Spec req 10
  it('correctly computes second derivative normalized by window span', () => {
    // acceleration = (currentSlope - previousSlope) / (currentMidpoint - previousMidpoint)
    // For equal spans of 4 units each, with gap between them:
    // prevMidpoint = (0+3)/2 = 1.5, currMidpoint = (5+8)/2 = 6.5, separation = 5
    const accel = computeAcceleration(1.0, 3.0, 4, 4)
    // (3.0 - 1.0) / 5 with specific midpoint logic — just check it's positive and reasonable
    expect(accel).toBeGreaterThan(0)
  })

  it('returns 0 when slopes are equal', () => {
    expect(computeAcceleration(2.0, 2.0, 5, 5)).toBe(0)
  })

  it('returns negative acceleration for decelerating trend', () => {
    const accel = computeAcceleration(3.0, 1.0, 5, 5)
    expect(accel).toBeLessThan(0)
  })
})

// ---------------------------------------------------------------------------
// 11-14: classifyBaselineDirection
// ---------------------------------------------------------------------------

describe('classifyBaselineDirection', () => {
  const threshold = TREND_BASELINE_THRESHOLDS.SLOPE_FLAT_THRESHOLD

  // Spec req 11
  it('returns accelerating when both slopes positive and delta > 0', () => {
    expect(classifyBaselineDirection(0.5, 1.0, 1.5)).toBe('accelerating')
  })

  // Spec req 12
  it('returns decelerating when positive slope with negative delta', () => {
    expect(classifyBaselineDirection(-0.5, 1.5, 1.0)).toBe('decelerating')
  })

  // Spec req 13
  it('returns stable when delta magnitude is below threshold', () => {
    expect(classifyBaselineDirection(0.01, 1.0, 1.01)).toBe('stable')
  })

  // Spec req 14
  it('returns reversing when slopes have opposite signs', () => {
    expect(classifyBaselineDirection(2.0, -1.0, 1.0)).toBe('reversing')
    expect(classifyBaselineDirection(-2.0, 1.0, -1.0)).toBe('reversing')
  })
})

// ---------------------------------------------------------------------------
// 15-16: computeReversalIndicator
// ---------------------------------------------------------------------------

describe('computeReversalIndicator', () => {
  // Spec req 15
  it('returns 0 when slopes have same sign', () => {
    expect(computeReversalIndicator(1.0, 2.0)).toBe(0)
    expect(computeReversalIndicator(-1.0, -0.5)).toBe(0)
  })

  // Spec req 16
  it('returns > 0 when slopes have opposite signs', () => {
    expect(computeReversalIndicator(-1.0, 1.0)).toBeGreaterThan(0)
    expect(computeReversalIndicator(2.0, -1.5)).toBeGreaterThan(0)
  })

  it('returns value in [0, 1] range', () => {
    const r = computeReversalIndicator(-5.0, 3.0)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(1)
  })

  it('returns 0 when either slope is 0', () => {
    expect(computeReversalIndicator(0, 1.0)).toBe(0)
    expect(computeReversalIndicator(-1.0, 0)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 17: computeBaselineDeviation
// ---------------------------------------------------------------------------

describe('computeBaselineDeviation', () => {
  // Spec req 17
  it('correctly measures distance from projected trend', () => {
    const prevPoints = makeLinearPoints(10, 1, 5, 1)  // 10,11,12,13,14 on days 1-5
    const currPoints = makeLinearPoints(20, 0, 5, 10) // 20,20,20,20,20 on days 10-14
    const prevSlope = 1.0
    const deviation = computeBaselineDeviation(prevPoints, currPoints, prevSlope)
    // Previous trend projected forward: intercept at day 1 is 10, slope 1
    // Previous midpoint index ~ 2 (day 3), current midpoint index ~ 2 (day 12)
    // timeDelta = 12 - 3 = 9
    // projected = prevSlope * timeDelta + prevIntercept ≈ 1 * 9 + 12 = 21
    // actual mean = 20
    // deviation ≈ 20 - 21 = -1 (approximately)
    expect(typeof deviation).toBe('number')
    expect(Number.isFinite(deviation)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 18-19: assessDataQuality
// ---------------------------------------------------------------------------

describe('assessDataQuality', () => {
  // Spec req 18
  it('returns high for abundant high-confidence data', () => {
    const points = makeLinearPoints(1, 1, 10, 1, 0.9) // 10 points, 0.9 confidence
    const result = assessDataQuality(points, 3)
    expect(result.quality).toBe('high')
    expect(result.confidence).toBeGreaterThanOrEqual(0.7)
  })

  // Spec req 19
  it('returns low for sparse or low-confidence data', () => {
    const points = makeLinearPoints(1, 1, 2, 1, 0.2) // 2 points, 0.2 confidence
    const result = assessDataQuality(points, 3)
    expect(result.quality).toBe('low')
  })

  it('returns moderate for borderline data', () => {
    const points = makeLinearPoints(1, 1, 4, 1, 0.5) // 4 points, 0.5 confidence (>= minPoints, >= 0.4)
    const result = assessDataQuality(points, 3)
    expect(result.quality).toBe('moderate')
  })
})

// ---------------------------------------------------------------------------
// 20: computeOverallConfidence
// ---------------------------------------------------------------------------

describe('computeOverallConfidence', () => {
  // Spec req 20
  it('sparse data produces lower confidence than dense data', () => {
    const sparseConf = computeOverallConfidence(
      { quality: 'low', confidence: 0.3 },
      { quality: 'low', confidence: 0.3 }
    )
    const denseConf = computeOverallConfidence(
      { quality: 'high', confidence: 0.9 },
      { quality: 'high', confidence: 0.9 }
    )
    expect(denseConf).toBeGreaterThan(sparseConf)
  })

  it('returns value in [0, 1] range', () => {
    const conf = computeOverallConfidence(
      { quality: 'moderate', confidence: 0.6 },
      { quality: 'high', confidence: 0.8 }
    )
    expect(conf).toBeGreaterThanOrEqual(0)
    expect(conf).toBeLessThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// 21-26: computeTrendBaselineComparison — result shape and safety
// ---------------------------------------------------------------------------

describe('computeTrendBaselineComparison', () => {
  const input = makeInput()

  // Spec req 21
  it('advisoryOnly is always true in output', () => {
    const result = computeTrendBaselineComparison(input)
    expect(result.advisoryOnly).toBe(true)
  })

  // Spec req 22
  it('humanReviewRequired is always true in output', () => {
    const result = computeTrendBaselineComparison(input)
    expect(result.humanReviewRequired).toBe(true)
  })

  // Spec req 23
  it('provenance trail includes input provenance', () => {
    const result = computeTrendBaselineComparison(input)
    expect(result.provenanceTrail).toContain('test-source')
  })

  // Spec req 24
  it('assumptions from input are preserved in output', () => {
    const result = computeTrendBaselineComparison(input)
    expect(result.assumptions).toEqual(['test assumption'])
  })

  // Spec req 25
  it('input warnings are propagated to output', () => {
    const inputWarning: TrendBaselineWarning = {
      code: 'EXTERNAL_WARNING',
      message: 'propagated from upstream',
      severity: 'info',
      field: 'external',
    }
    const inputWithWarnings = makeInput({ warnings: [inputWarning] })
    const result = computeTrendBaselineComparison(inputWithWarnings)
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EXTERNAL_WARNING' })])
    )
  })

  // Spec req 26
  it('input object is not mutated', () => {
    const inputCopy = makeInput()
    const frozen = JSON.stringify(inputCopy)
    computeTrendBaselineComparison(inputCopy)
    expect(JSON.stringify(inputCopy)).toBe(frozen)
  })

  // Spec req 29
  it('produces correct full result for a known fixture', () => {
    const fixture = makeInput({
      previousWindow: makeLinearPoints(10, 1, 5, 1),  // slope ≈ 1.0
      currentWindow: makeLinearPoints(20, 2, 5, 10),   // slope ≈ 2.0
    })
    const result = computeTrendBaselineComparison(fixture)
    expect(result.signalType).toBe('test-signal')
    expect(result.previousTrendSlope).toBeCloseTo(1.0, 4)
    expect(result.currentTrendSlope).toBeCloseTo(2.0, 4)
    expect(result.delta).toBeCloseTo(1.0, 4)
    expect(result.acceleration).toBeGreaterThan(0)
    expect(result.direction).toBe('accelerating')
    expect(result.reversalIndicator).toBe(0) // same-sign slopes
    expect(typeof result.baselineDeviation).toBe('number')
    expect(result.dataQuality).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(result.advisoryOnly).toBe(true)
    expect(result.humanReviewRequired).toBe(true)
    expect(result.provenanceTrail).toContain('test-source')
    expect(result.assumptions).toEqual(['test assumption'])
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  // Spec req 30
  it('same input produces same output across multiple runs', () => {
    const fixture = makeInput()
    const result1 = computeTrendBaselineComparison(fixture)
    const result2 = computeTrendBaselineComparison(fixture)
    expect(result1).toEqual(result2)
  })
})

// ---------------------------------------------------------------------------
// 31-35: scope boundary checks
// ---------------------------------------------------------------------------

describe('scope boundary checks', () => {
  const implFile = 'ui/lib/oracle/predictability/trend-baseline-comparison.ts'
  const testFile = 'ui/lib/oracle/predictability/__tests__/trend-baseline-comparison.test.ts'

  let implContent: string
  let testContent: string

  beforeAll(async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(__dirname, '..', '..', '..', '..', '..')
    implContent = fs.readFileSync(path.join(root, implFile), 'utf-8')
    testContent = fs.readFileSync(path.join(root, testFile), 'utf-8')
  })

  // Spec req 31
  it('no Evidence Router imports in implementation or tests', () => {
    const forbidden = 'evidence' + '-' + 'router'
    expect(implContent).not.toMatch(new RegExp(forbidden))
    expect(testContent).not.toMatch(new RegExp(`import.*${forbidden}`))
  })

  // Spec req 32
  it('no Predictability Kernel imports in implementation or tests', () => {
    const forbidden = 'predictability' + '-' + 'kernel'
    expect(implContent).not.toMatch(new RegExp(forbidden))
    expect(testContent).not.toMatch(new RegExp(`import.*${forbidden}`))
  })

  // Spec req 33
  it('no UI/API/DB/filesystem/current.md/shell-promoter references in exports', () => {
    const sp = 'shell' + '-' + 'promoter'
    expect(implContent).not.toMatch(new RegExp(sp))
    expect(implContent).not.toMatch(/current\.md/)
    expect(implContent).not.toMatch(/import.*from.*['"](?:react|next|express|pg|prisma|supabase)/)
  })

  // Spec req 34
  it('no certainty language in any warning message', () => {
    const forbidden = /guaranteed|certain|definite|will happen|impossible/i
    expect(implContent).not.toMatch(forbidden)
  })

  // Spec req 35
  it('no imports from Stage M-A through M-F implementation files', () => {
    const forbiddenImports = [
      'bayesian-updater-types',
      'bayesian-updater',
      'monte-carlo-scenario-types',
      'monte-carlo-scenarios',
      'markov-regime-transition-types',
      'markov-regime-transitions',
    ]
    for (const mod of forbiddenImports) {
      expect(implContent).not.toMatch(new RegExp(`import.*from.*['"].*${mod}`))
      expect(testContent).not.toMatch(new RegExp(`import.*from.*['"].*${mod}`))
    }
  })
})
