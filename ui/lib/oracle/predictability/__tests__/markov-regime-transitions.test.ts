// ============================================================================
// Markov Regime Transition Pure Functions — Stage M-F Tests
// TDD-first. Deterministic fixtures. No side effects. No Evidence Router.
// No Predictability Kernel. No Monte Carlo. No Bayesian updater.
// No UI/API/DB/auth. No filesystem. No shell-promoter.
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  validateTransitionMatrix,
  normalizeMatrixRow,
  getTransitionRow,
  computeNextStateDistribution,
  applyConfidenceWidening,
  enforceQuarantineConstraint,
  findMostLikelyNextState,
  buildTransitionPath,
  computeMarkovTransition,
} from '../markov-regime-transitions'

import type {
  MarkovTransitionMatrix,
  MarkovTransitionCell,
  MarkovTransitionInput,
  MarkovRegimeState,
} from '../markov-regime-transition-types'

// ============================================================================
// Fixture Helpers
// ============================================================================

const EPSILON = 1e-10

function makeCell(
  fromState: MarkovRegimeState,
  toState: MarkovRegimeState,
  probability: number,
): MarkovTransitionCell {
  return {
    fromState,
    toState,
    probability,
    confidence: 'strong',
    provenance: 'test-fixture',
  }
}

function makeValidMatrix(): MarkovTransitionMatrix {
  return {
    id: 'matrix-001',
    states: ['stable', 'accelerating', 'declining'],
    cells: [
      makeCell('stable', 'stable', 0.7),
      makeCell('stable', 'accelerating', 0.2),
      makeCell('stable', 'declining', 0.1),
      makeCell('accelerating', 'stable', 0.3),
      makeCell('accelerating', 'accelerating', 0.5),
      makeCell('accelerating', 'declining', 0.2),
      makeCell('declining', 'stable', 0.2),
      makeCell('declining', 'accelerating', 0.1),
      makeCell('declining', 'declining', 0.7),
    ],
    sourceTier: 'T1',
    confidence: 'strong',
    assumptions: ['fixture data'],
    provenance: 'test-matrix-provenance',
  }
}

function makeInput(overrides?: Partial<MarkovTransitionInput>): MarkovTransitionInput {
  return {
    currentState: 'stable',
    candidateStates: ['stable', 'accelerating', 'declining'],
    transitionMatrix: makeValidMatrix(),
    observations: [
      {
        id: 'obs-001',
        state: 'stable',
        observedAt: '2026-01-01',
        confidence: 'strong',
        sourceTier: 'T1',
        provenance: 'test-obs-provenance',
      },
    ],
    horizon: 'short',
    assumptions: ['test assumption'],
    sourceTier: 'T1',
    confidence: 'strong',
    provenance: 'test-input-provenance',
    ...overrides,
  }
}

function sumDistribution(dist: Record<string, number>): number {
  return Object.values(dist).reduce((sum, v) => sum + v, 0)
}

// ============================================================================
// 1. validateTransitionMatrix
// ============================================================================

describe('validateTransitionMatrix', () => {
  it('passes valid matrix with no warnings', () => {
    const matrix = makeValidMatrix()
    const result = validateTransitionMatrix(matrix)
    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(0)
    expect(result.normalizedMatrix.cells).toHaveLength(matrix.cells.length)
  })

  it('normalizes non-normalized rows and emits warning', () => {
    const matrix: MarkovTransitionMatrix = {
      ...makeValidMatrix(),
      cells: [
        makeCell('stable', 'stable', 0.6),
        makeCell('stable', 'accelerating', 0.2),
        makeCell('stable', 'declining', 0.1),
        // row sums to 0.9, not 1.0
        makeCell('accelerating', 'stable', 0.3),
        makeCell('accelerating', 'accelerating', 0.5),
        makeCell('accelerating', 'declining', 0.2),
        makeCell('declining', 'stable', 0.2),
        makeCell('declining', 'accelerating', 0.1),
        makeCell('declining', 'declining', 0.7),
      ],
    }

    const result = validateTransitionMatrix(matrix)
    expect(result.valid).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some(w => w.code === 'MATRIX_ROWS_MUST_NORMALIZE')).toBe(true)

    // Normalized row should sum to 1.0
    const stableRow = result.normalizedMatrix.cells.filter(c => c.fromState === 'stable')
    const rowSum = stableRow.reduce((sum, c) => sum + c.probability, 0)
    expect(Math.abs(rowSum - 1.0)).toBeLessThan(EPSILON)
  })

  it('clamps out-of-bounds probabilities and emits warning', () => {
    const matrix: MarkovTransitionMatrix = {
      ...makeValidMatrix(),
      cells: [
        makeCell('stable', 'stable', 1.5),
        makeCell('stable', 'accelerating', -0.3),
        makeCell('stable', 'declining', 0.1),
        makeCell('accelerating', 'stable', 0.3),
        makeCell('accelerating', 'accelerating', 0.5),
        makeCell('accelerating', 'declining', 0.2),
        makeCell('declining', 'stable', 0.2),
        makeCell('declining', 'accelerating', 0.1),
        makeCell('declining', 'declining', 0.7),
      ],
    }

    const result = validateTransitionMatrix(matrix)
    expect(result.warnings.some(w => w.code === 'TRANSITION_PROBABILITIES_BOUNDED')).toBe(true)

    // All probabilities in result should be in [0, 1]
    for (const cell of result.normalizedMatrix.cells) {
      expect(cell.probability).toBeGreaterThanOrEqual(0)
      expect(cell.probability).toBeLessThanOrEqual(1)
    }
  })
})

// ============================================================================
// 2. normalizeMatrixRow
// ============================================================================

describe('normalizeMatrixRow', () => {
  it('normalizes cells to sum to 1.0', () => {
    const cells: MarkovTransitionCell[] = [
      makeCell('stable', 'stable', 0.6),
      makeCell('stable', 'accelerating', 0.2),
      makeCell('stable', 'declining', 0.1),
    ]
    const normalized = normalizeMatrixRow(cells, 'stable')
    const sum = normalized.reduce((s, c) => s + c.probability, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThan(EPSILON)
  })

  it('returns new cells without mutating input', () => {
    const cells: MarkovTransitionCell[] = [
      makeCell('stable', 'stable', 0.6),
      makeCell('stable', 'accelerating', 0.3),
      makeCell('stable', 'declining', 0.1),
    ]
    const originalProbs = cells.map(c => c.probability)
    normalizeMatrixRow(cells, 'stable')
    cells.forEach((c, i) => {
      expect(c.probability).toBe(originalProbs[i])
    })
  })
})

// ============================================================================
// 3. getTransitionRow
// ============================================================================

describe('getTransitionRow', () => {
  it('extracts correct row for a given state', () => {
    const matrix = makeValidMatrix()
    const row = getTransitionRow(matrix, 'accelerating')
    expect(row.length).toBe(3)
    expect(row.every(c => c.fromState === 'accelerating')).toBe(true)
  })

  it('returns empty array if state not in matrix', () => {
    const matrix = makeValidMatrix()
    const row = getTransitionRow(matrix, 'quarantined')
    expect(row).toHaveLength(0)
  })
})

// ============================================================================
// 4. computeNextStateDistribution
// ============================================================================

describe('computeNextStateDistribution', () => {
  it('returns correct distribution from the matrix row', () => {
    const matrix = makeValidMatrix()
    const dist = computeNextStateDistribution('stable', matrix)
    expect(dist['stable']).toBeCloseTo(0.7, 10)
    expect(dist['accelerating']).toBeCloseTo(0.2, 10)
    expect(dist['declining']).toBeCloseTo(0.1, 10)
  })

  it('distribution sums to 1.0 within epsilon', () => {
    const matrix = makeValidMatrix()
    const dist = computeNextStateDistribution('stable', matrix)
    expect(Math.abs(sumDistribution(dist) - 1.0)).toBeLessThan(EPSILON)
  })

  it('returns uniform distribution for missing state', () => {
    const matrix = makeValidMatrix()
    const dist = computeNextStateDistribution('quarantined', matrix)
    const states = matrix.states
    const uniform = 1 / states.length
    for (const state of states) {
      expect(dist[state]).toBeCloseTo(uniform, 10)
    }
  })
})

// ============================================================================
// 5. applyConfidenceWidening
// ============================================================================

describe('applyConfidenceWidening', () => {
  const sharpDist: Record<string, number> = {
    stable: 0.8,
    accelerating: 0.15,
    declining: 0.05,
  }

  it('preserves distribution when confidence is verified', () => {
    const result = applyConfidenceWidening(sharpDist, 'verified')
    expect(result['stable']).toBeCloseTo(0.8, 10)
    expect(result['accelerating']).toBeCloseTo(0.15, 10)
    expect(result['declining']).toBeCloseTo(0.05, 10)
  })

  it('widens distribution toward uniform when confidence is weak', () => {
    const result = applyConfidenceWidening(sharpDist, 'weak')
    const uniform = 1 / 3
    // Weak confidence should push toward uniform — max value should decrease
    expect(result['stable']).toBeLessThan(0.8)
    // Min value should increase toward uniform
    expect(result['declining']).toBeGreaterThan(0.05)
    // Should still sum to 1.0
    expect(Math.abs(sumDistribution(result) - 1.0)).toBeLessThan(EPSILON)
  })

  it('moderate confidence widens less than weak', () => {
    const weak = applyConfidenceWidening(sharpDist, 'weak')
    const moderate = applyConfidenceWidening(sharpDist, 'moderate')
    // Moderate should be between original and weak
    expect(moderate['stable']).toBeGreaterThan(weak['stable'])
    expect(moderate['stable']).toBeLessThanOrEqual(0.8)
  })

  it('strong confidence widens less than moderate', () => {
    const moderate = applyConfidenceWidening(sharpDist, 'moderate')
    const strong = applyConfidenceWidening(sharpDist, 'strong')
    expect(strong['stable']).toBeGreaterThan(moderate['stable'])
  })

  it('output sums to 1.0 for all confidence levels', () => {
    for (const conf of ['weak', 'moderate', 'strong', 'verified'] as const) {
      const result = applyConfidenceWidening(sharpDist, conf)
      expect(Math.abs(sumDistribution(result) - 1.0)).toBeLessThan(EPSILON)
    }
  })
})

// ============================================================================
// 6. enforceQuarantineConstraint
// ============================================================================

describe('enforceQuarantineConstraint', () => {
  it('does not modify distribution for non-quarantined state', () => {
    const dist: Record<string, number> = {
      stable: 0.7,
      accelerating: 0.2,
      declining: 0.1,
    }
    const result = enforceQuarantineConstraint(dist, 'stable')
    expect(result.distribution['stable']).toBeCloseTo(0.7, 10)
    expect(result.distribution['accelerating']).toBeCloseTo(0.2, 10)
    expect(result.distribution['declining']).toBeCloseTo(0.1, 10)
    expect(result.warnings).toHaveLength(0)
  })

  it('suppresses strong positive transitions from quarantined state', () => {
    const dist: Record<string, number> = {
      accelerating: 0.5,
      breakout: 0.3,
      recovering: 0.1,
      quarantined: 0.05,
      unknown: 0.05,
    }
    const result = enforceQuarantineConstraint(dist, 'quarantined')
    // Positive states should be capped
    expect(result.distribution['accelerating']).toBeLessThanOrEqual(0.3)
    expect(result.distribution['breakout']).toBeLessThanOrEqual(0.3)
    expect(result.distribution['recovering']).toBeLessThanOrEqual(0.3)
    // Warning should be emitted
    expect(result.warnings.some(w => w.code === 'QUARANTINED_CANNOT_STRONG_POSITIVE')).toBe(true)
    // Distribution still sums to 1.0
    expect(Math.abs(sumDistribution(result.distribution) - 1.0)).toBeLessThan(EPSILON)
  })

  it('does not warn if quarantined state has no strong positive transitions', () => {
    const dist: Record<string, number> = {
      quarantined: 0.6,
      unknown: 0.2,
      declining: 0.1,
      accelerating: 0.1,
    }
    const result = enforceQuarantineConstraint(dist, 'quarantined')
    expect(result.warnings).toHaveLength(0)
  })
})

// ============================================================================
// 7. findMostLikelyNextState
// ============================================================================

describe('findMostLikelyNextState', () => {
  it('returns the state with highest probability', () => {
    const dist: Record<string, number> = {
      stable: 0.1,
      accelerating: 0.6,
      declining: 0.3,
    }
    expect(findMostLikelyNextState(dist)).toBe('accelerating')
  })

  it('breaks ties deterministically — first key wins', () => {
    const dist: Record<string, number> = {
      stable: 0.5,
      accelerating: 0.5,
      declining: 0.0,
    }
    const result = findMostLikelyNextState(dist)
    // Should return the first key with max probability
    expect(result).toBe('stable')
  })
})

// ============================================================================
// 8. buildTransitionPath
// ============================================================================

describe('buildTransitionPath', () => {
  it('returns path from current to most likely next', () => {
    const path = buildTransitionPath('stable', 'accelerating')
    expect(path).toEqual(['stable', 'accelerating'])
  })

  it('returns single-element path when current equals next', () => {
    const path = buildTransitionPath('stable', 'stable')
    expect(path).toEqual(['stable'])
  })
})

// ============================================================================
// 9. computeMarkovTransition — full orchestrator
// ============================================================================

describe('computeMarkovTransition', () => {
  it('produces correct full result for a known fixture', () => {
    const input = makeInput()
    const result = computeMarkovTransition(input)

    expect(result.currentState).toBe('stable')
    expect(result.mostLikelyNextState).toBe('stable') // 0.7 is highest
    expect(result.nextStateDistribution['stable']).toBeCloseTo(0.7, 1)
    expect(Math.abs(sumDistribution(result.nextStateDistribution as Record<string, number>) - 1.0)).toBeLessThan(EPSILON)
    expect(result.transitionPath[0]).toBe('stable')
    expect(result.confidence).toBe('strong')
    expect(result.advisoryOnly).toBe(true)
    expect(result.humanReviewRequired).toBe(true)
  })

  it('advisoryOnly is always true', () => {
    const result = computeMarkovTransition(makeInput())
    expect(result.advisoryOnly).toBe(true)
  })

  it('humanReviewRequired is always true', () => {
    const result = computeMarkovTransition(makeInput())
    expect(result.humanReviewRequired).toBe(true)
  })

  it('preserves assumptions from input', () => {
    const input = makeInput({ assumptions: ['assumption A', 'assumption B'] })
    const result = computeMarkovTransition(input)
    expect(result.assumptions).toContain('assumption A')
    expect(result.assumptions).toContain('assumption B')
  })

  it('includes provenance trail from input and matrix', () => {
    const result = computeMarkovTransition(makeInput())
    expect(result.provenanceTrail).toContain('test-input-provenance')
    expect(result.provenanceTrail).toContain('test-matrix-provenance')
  })

  it('propagates input warnings to output', () => {
    const inputWarning = {
      code: 'TEST_WARNING',
      message: 'Test input warning',
      severity: 'info' as const,
    }
    const input = makeInput({ warnings: [inputWarning] })
    const result = computeMarkovTransition(input)
    expect(result.warnings.some(w => w.code === 'TEST_WARNING')).toBe(true)
  })

  it('does not mutate input object', () => {
    const input = makeInput()
    const inputJson = JSON.stringify(input)
    computeMarkovTransition(input)
    expect(JSON.stringify(input)).toBe(inputJson)
  })

  it('produces same output for same input (determinism)', () => {
    const input = makeInput()
    const r1 = computeMarkovTransition(input)
    const r2 = computeMarkovTransition(input)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('handles missing current state in matrix with uniform fallback', () => {
    const input = makeInput({ currentState: 'quarantined' })
    const result = computeMarkovTransition(input)
    // Should produce a result (uniform fallback for missing row)
    expect(result.currentState).toBe('quarantined')
    expect(result.warnings.some(w => w.severity === 'block')).toBe(true)
  })
})

// ============================================================================
// 10. Boundary checks — forbidden imports and references
// ============================================================================

describe('boundary checks', () => {
  it('does not export Evidence Router imports', async () => {
    const source = await import('../markov-regime-transitions')
    const keys = Object.keys(source)
    const forbidden = ['evidenceRouter', 'EvidenceRouter', 'adaptEvidence', 'routeEvidence']
    for (const f of forbidden) {
      expect(keys).not.toContain(f)
    }
  })

  it('does not export Predictability Kernel imports', async () => {
    const source = await import('../markov-regime-transitions')
    const keys = Object.keys(source)
    const forbidden = ['predictabilityKernel', 'PredictabilityKernel', 'runKernel']
    for (const f of forbidden) {
      expect(keys).not.toContain(f)
    }
  })

  it('does not export UI/API/DB/filesystem/shell-promoter references', async () => {
    const source = await import('../markov-regime-transitions')
    const keys = Object.keys(source)
    const forbidden = ['fetch', 'readFile', 'writeFile', 'database', 'shellPromoter', 'promoter']
    for (const f of forbidden) {
      expect(keys).not.toContain(f)
    }
  })

  it('no certainty language in warning messages from validation', () => {
    const matrix: MarkovTransitionMatrix = {
      ...makeValidMatrix(),
      cells: [
        makeCell('stable', 'stable', 1.5),
        makeCell('stable', 'accelerating', -0.3),
        makeCell('stable', 'declining', 0.1),
        makeCell('accelerating', 'stable', 0.3),
        makeCell('accelerating', 'accelerating', 0.5),
        makeCell('accelerating', 'declining', 0.2),
        makeCell('declining', 'stable', 0.2),
        makeCell('declining', 'accelerating', 0.1),
        makeCell('declining', 'declining', 0.7),
      ],
    }
    const result = validateTransitionMatrix(matrix)
    const forbidden = ['guaranteed', 'certain', 'definite', 'will happen', 'impossible']
    for (const w of result.warnings) {
      for (const word of forbidden) {
        expect(w.message.toLowerCase()).not.toContain(word)
      }
    }
  })
})
