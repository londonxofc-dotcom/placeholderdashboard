// ============================================================================
// Bayesian Updater Pure Function Tests — Stage M-B
// Tests written first (TDD). Implementation follows.
// No side effects. No filesystem. No API. No UI. No DB.
// ============================================================================

import {
  clampProbability,
  normalizeLikelihood,
  calculateBayesianPosterior,
  calculateProbabilityDelta,
  classifyBayesianEvidenceWeight,
  updateBayesianBelief,
} from '../bayesian-updater'

import type {
  BayesianProbability,
  BayesianPrior,
  BayesianEvidenceItem,
  BayesianUpdateInput,
  BayesianUpdateResult,
} from '../bayesian-updater-types'

// --- Helper: build a valid prior ---
function makePrior(overrides: Partial<BayesianPrior> = {}): BayesianPrior {
  return {
    id: 'p-test',
    hypothesis: 'Test hypothesis',
    priorProbability: 0.5 as BayesianProbability,
    sourceTier: 'T1',
    confidence: 'LIKELY',
    assumptions: [],
    ...overrides,
  }
}

// --- Helper: build a valid evidence item ---
function makeEvidence(overrides: Partial<BayesianEvidenceItem> = {}): BayesianEvidenceItem {
  return {
    id: 'e-test',
    claim: 'Test evidence',
    direction: 'supports',
    strength: 'moderate',
    likelihoodGivenHypothesis: 0.8 as BayesianProbability,
    likelihoodGivenNotHypothesis: 0.2 as BayesianProbability,
    sourceTier: 'T1',
    confidence: 'LIKELY',
    provenance: 'test-source',
    ...overrides,
  }
}

// --- Helper: build a valid update input ---
function makeInput(overrides: Partial<BayesianUpdateInput> = {}): BayesianUpdateInput {
  return {
    hypothesis: 'Test hypothesis',
    prior: makePrior(),
    evidence: [makeEvidence()],
    mode: 'balanced',
    ...overrides,
  }
}

describe('bayesian-updater', () => {
  // ========================================================================
  // 1. clampProbability
  // ========================================================================
  describe('clampProbability', () => {
    test('returns value unchanged when within [0, 1]', () => {
      expect(clampProbability(0.5)).toBe(0.5)
      expect(clampProbability(0)).toBe(0)
      expect(clampProbability(1)).toBe(1)
    })

    test('clamps negative values to 0', () => {
      expect(clampProbability(-0.1)).toBe(0)
      expect(clampProbability(-100)).toBe(0)
    })

    test('clamps values above 1 to 1', () => {
      expect(clampProbability(1.1)).toBe(1)
      expect(clampProbability(999)).toBe(1)
    })
  })

  // ========================================================================
  // 2. normalizeLikelihood
  // ========================================================================
  describe('normalizeLikelihood', () => {
    test('returns value unchanged when within (0, 1)', () => {
      expect(normalizeLikelihood(0.5)).toBe(0.5)
      expect(normalizeLikelihood(0.9)).toBe(0.9)
    })

    test('floors zero to a small epsilon', () => {
      const result = normalizeLikelihood(0)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(0.01)
    })

    test('floors negative values to a small epsilon', () => {
      const result = normalizeLikelihood(-0.5)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(0.01)
    })

    test('caps values at or above 1 to 1 - epsilon', () => {
      const result = normalizeLikelihood(1.5)
      expect(result).toBeLessThan(1)
      expect(result).toBeGreaterThan(0.999)
      // Also caps exactly 1
      const resultExact = normalizeLikelihood(1)
      expect(resultExact).toBeLessThan(1)
      expect(resultExact).toBeGreaterThan(0.999)
    })
  })

  // ========================================================================
  // 3. calculateBayesianPosterior
  // ========================================================================
  describe('calculateBayesianPosterior', () => {
    test('computes correct posterior for standard inputs', () => {
      // P(H|E) = (0.8 * 0.5) / ((0.8 * 0.5) + (0.2 * 0.5)) = 0.4 / 0.5 = 0.8
      const result = calculateBayesianPosterior(0.5, 0.8, 0.2)
      expect(result).toBeCloseTo(0.8, 10)
    })

    test('returns prior when likelihoods are equal', () => {
      // Equal likelihoods mean evidence is uninformative
      const result = calculateBayesianPosterior(0.6, 0.5, 0.5)
      expect(result).toBeCloseTo(0.6, 10)
    })

    test('posterior is bounded between 0 and 1', () => {
      const result = calculateBayesianPosterior(0.99, 0.99, 0.01)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(1)
    })

    test('strong opposing evidence lowers posterior', () => {
      // P(E|H) low, P(E|~H) high → posterior drops
      const result = calculateBayesianPosterior(0.5, 0.1, 0.9)
      expect(result).toBeCloseTo(0.1, 1)
    })
  })

  // ========================================================================
  // 4. calculateProbabilityDelta
  // ========================================================================
  describe('calculateProbabilityDelta', () => {
    test('returns positive delta when posterior > prior', () => {
      expect(calculateProbabilityDelta(0.8, 0.5)).toBeCloseTo(0.3, 10)
    })

    test('returns negative delta when posterior < prior', () => {
      expect(calculateProbabilityDelta(0.2, 0.5)).toBeCloseTo(-0.3, 10)
    })

    test('returns zero when posterior equals prior', () => {
      expect(calculateProbabilityDelta(0.5, 0.5)).toBe(0)
    })
  })

  // ========================================================================
  // 5. classifyBayesianEvidenceWeight
  // ========================================================================
  describe('classifyBayesianEvidenceWeight', () => {
    test('classifies negligible delta as negligible', () => {
      expect(classifyBayesianEvidenceWeight(0.01)).toBe('negligible')
    })

    test('classifies small delta as weak', () => {
      expect(classifyBayesianEvidenceWeight(0.05)).toBe('weak')
    })

    test('classifies medium delta as moderate', () => {
      expect(classifyBayesianEvidenceWeight(0.15)).toBe('moderate')
    })

    test('classifies large delta as strong', () => {
      expect(classifyBayesianEvidenceWeight(0.35)).toBe('strong')
    })

    test('uses absolute value of delta', () => {
      expect(classifyBayesianEvidenceWeight(-0.35)).toBe('strong')
    })
  })

  // ========================================================================
  // 6. updateBayesianBelief
  // ========================================================================
  describe('updateBayesianBelief', () => {
    test('returns result with advisoryOnly always true', () => {
      const result = updateBayesianBelief(makeInput())
      expect(result.advisoryOnly).toBe(true)
    })

    test('posterior equals prior when evidence list is empty', () => {
      const input = makeInput({ evidence: [] })
      const result = updateBayesianBelief(input)
      expect(result.posteriorProbability).toBe(input.prior.priorProbability)
      expect(result.probabilityDelta).toBe(0)
    })

    test('supporting evidence increases posterior', () => {
      const input = makeInput({
        prior: makePrior({ priorProbability: 0.5 as BayesianProbability }),
        evidence: [makeEvidence({
          likelihoodGivenHypothesis: 0.9 as BayesianProbability,
          likelihoodGivenNotHypothesis: 0.1 as BayesianProbability,
        })],
      })
      const result = updateBayesianBelief(input)
      expect(result.posteriorProbability).toBeGreaterThan(0.5)
    })

    test('opposing evidence decreases posterior', () => {
      const input = makeInput({
        prior: makePrior({ priorProbability: 0.5 as BayesianProbability }),
        evidence: [makeEvidence({
          direction: 'opposes',
          likelihoodGivenHypothesis: 0.1 as BayesianProbability,
          likelihoodGivenNotHypothesis: 0.9 as BayesianProbability,
        })],
      })
      const result = updateBayesianBelief(input)
      expect(result.posteriorProbability).toBeLessThan(0.5)
    })

    test('multiple evidence items are applied sequentially', () => {
      const singleEvidence = makeEvidence({
        likelihoodGivenHypothesis: 0.8 as BayesianProbability,
        likelihoodGivenNotHypothesis: 0.2 as BayesianProbability,
      })
      const input = makeInput({
        prior: makePrior({ priorProbability: 0.5 as BayesianProbability }),
        evidence: [singleEvidence, { ...singleEvidence, id: 'e-2' }],
      })
      const result = updateBayesianBelief(input)
      // Two supporting evidence items should shift more than one
      const singleResult = updateBayesianBelief(makeInput({
        prior: makePrior({ priorProbability: 0.5 as BayesianProbability }),
        evidence: [singleEvidence],
      }))
      expect(result.posteriorProbability).toBeGreaterThan(singleResult.posteriorProbability)
    })

    test('result includes all required fields', () => {
      const result = updateBayesianBelief(makeInput())
      expect(result.hypothesis).toBeDefined()
      expect(typeof result.priorProbability).toBe('number')
      expect(typeof result.posteriorProbability).toBe('number')
      expect(typeof result.probabilityDelta).toBe('number')
      expect(Array.isArray(result.evidenceUsed)).toBe(true)
      expect(Array.isArray(result.evidenceWarnings)).toBe(true)
      expect(Array.isArray(result.assumptions)).toBe(true)
      expect(typeof result.uncertainty).toBe('string')
      expect(typeof result.explanation).toBe('string')
      expect(result.advisoryOnly).toBe(true)
    })

    test('posterior is always bounded between 0 and 1', () => {
      // Extreme evidence that would push posterior beyond bounds
      const input = makeInput({
        prior: makePrior({ priorProbability: 0.99 as BayesianProbability }),
        evidence: [makeEvidence({
          likelihoodGivenHypothesis: 0.99 as BayesianProbability,
          likelihoodGivenNotHypothesis: 0.01 as BayesianProbability,
        })],
      })
      const result = updateBayesianBelief(input)
      expect(result.posteriorProbability).toBeGreaterThanOrEqual(0)
      expect(result.posteriorProbability).toBeLessThanOrEqual(1)
    })

    test('warns when conflicting evidence directions are present', () => {
      const input = makeInput({
        evidence: [
          makeEvidence({ id: 'e-support', direction: 'supports' }),
          makeEvidence({ id: 'e-oppose', direction: 'opposes',
            likelihoodGivenHypothesis: 0.2 as BayesianProbability,
            likelihoodGivenNotHypothesis: 0.8 as BayesianProbability,
          }),
        ],
      })
      const result = updateBayesianBelief(input)
      const conflictWarning = result.evidenceWarnings.find(
        w => w.code === 'CONFLICTED_EVIDENCE_MUST_WARN'
      )
      expect(conflictWarning).toBeDefined()
    })

    test('explanation is non-empty', () => {
      const result = updateBayesianBelief(makeInput())
      expect(result.explanation.length).toBeGreaterThan(0)
    })
  })
})
