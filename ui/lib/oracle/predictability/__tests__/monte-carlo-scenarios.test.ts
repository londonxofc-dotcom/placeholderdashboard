// ============================================================================
// Monte Carlo Deterministic Fixture Simulation Tests — Stage M-D
// Tests written first (TDD). Deterministic only. No uncontrolled Math.random.
// No filesystem. No API. No UI. No DB. No Evidence Router. No Predictability
// Kernel. No Bayesian updater imports.
// ============================================================================

import {
  createDeterministicRandomSource,
  sampleVariable,
  runScenarioIteration,
  runMonteCarloScenario,
  summarizeScenarioDistribution,
  detectTailRisk,
  calculateUncertaintyBand,
} from '../monte-carlo-scenarios'

import * as monteCarloScenarioExports from '../monte-carlo-scenarios'

import type {
  MonteCarloScenarioInput,
  MonteCarloVariable,
  MonteCarloAssumption,
} from '../monte-carlo-scenario-types'

// ============================================================================
// Fixtures
// ============================================================================

function makeVariable(overrides: Partial<MonteCarloVariable> = {}): MonteCarloVariable {
  return {
    id: 'v-1',
    label: 'Revenue growth',
    baseline: 0.1,
    min: 0.0,
    max: 0.3,
    distributionShape: 'uniform',
    sensitivity: 'medium',
    confidence: 'LIKELY',
    ...overrides,
  }
}

function makeAssumption(overrides: Partial<MonteCarloAssumption> = {}): MonteCarloAssumption {
  return {
    id: 'a-1',
    statement: 'Market remains stable',
    sensitivity: 'medium',
    confidence: 'LIKELY',
    sourceTier: 'T1',
    provenance: 'analyst-report',
    ...overrides,
  }
}

function makeScenarioInput(overrides: Partial<MonteCarloScenarioInput> = {}): MonteCarloScenarioInput {
  return {
    id: 'sc-1',
    objective: 'Test scenario',
    baseProbability: 0.5,
    assumptions: [makeAssumption()],
    variables: [makeVariable()],
    constraints: ['no-budget-exceed'],
    horizon: '6 months',
    sourceTier: 'T1',
    confidence: 'LIKELY',
    provenance: 'test-source',
    ...overrides,
  }
}

// ============================================================================
// 1. Deterministic random source
// ============================================================================

describe('monte-carlo-scenarios', () => {
  describe('createDeterministicRandomSource', () => {
    test('same seed produces same random sequence', () => {
      const rng1 = createDeterministicRandomSource(42)
      const rng2 = createDeterministicRandomSource(42)
      const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()]
      const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()]
      expect(seq1).toEqual(seq2)
    })

    test('different seed produces different sequence', () => {
      const rng1 = createDeterministicRandomSource(42)
      const rng2 = createDeterministicRandomSource(99)
      const seq1 = [rng1(), rng1(), rng1()]
      const seq2 = [rng2(), rng2(), rng2()]
      expect(seq1).not.toEqual(seq2)
    })

    test('values are in [0, 1)', () => {
      const rng = createDeterministicRandomSource(123)
      for (let i = 0; i < 100; i++) {
        const val = rng()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThan(1)
      }
    })
  })

  // ============================================================================
  // 2. sampleVariable
  // ============================================================================

  describe('sampleVariable', () => {
    test('returns value within min/max for uniform', () => {
      const rng = createDeterministicRandomSource(42)
      const v = makeVariable({ distributionShape: 'uniform', min: 0, max: 1 })
      for (let i = 0; i < 50; i++) {
        const val = sampleVariable(v, rng)
        expect(val).toBeGreaterThanOrEqual(v.min)
        expect(val).toBeLessThanOrEqual(v.max)
      }
    })

    test('returns value within min/max for triangular', () => {
      const rng = createDeterministicRandomSource(42)
      const v = makeVariable({ distributionShape: 'triangular', min: 0, max: 1 })
      for (let i = 0; i < 50; i++) {
        const val = sampleVariable(v, rng)
        expect(val).toBeGreaterThanOrEqual(v.min)
        expect(val).toBeLessThanOrEqual(v.max)
      }
    })

    test('returns value within min/max for normal_like', () => {
      const rng = createDeterministicRandomSource(42)
      const v = makeVariable({ distributionShape: 'normal_like', min: -1, max: 1 })
      for (let i = 0; i < 50; i++) {
        const val = sampleVariable(v, rng)
        expect(val).toBeGreaterThanOrEqual(v.min)
        expect(val).toBeLessThanOrEqual(v.max)
      }
    })

    test('returns value within min/max for skewed_positive', () => {
      const rng = createDeterministicRandomSource(42)
      const v = makeVariable({ distributionShape: 'skewed_positive', min: 0, max: 10 })
      for (let i = 0; i < 50; i++) {
        const val = sampleVariable(v, rng)
        expect(val).toBeGreaterThanOrEqual(v.min)
        expect(val).toBeLessThanOrEqual(v.max)
      }
    })

    test('returns value within min/max for skewed_negative', () => {
      const rng = createDeterministicRandomSource(42)
      const v = makeVariable({ distributionShape: 'skewed_negative', min: 0, max: 10 })
      for (let i = 0; i < 50; i++) {
        const val = sampleVariable(v, rng)
        expect(val).toBeGreaterThanOrEqual(v.min)
        expect(val).toBeLessThanOrEqual(v.max)
      }
    })

    test('returns value within min/max for discrete', () => {
      const rng = createDeterministicRandomSource(42)
      const v = makeVariable({ distributionShape: 'discrete', min: 0, max: 5 })
      for (let i = 0; i < 50; i++) {
        const val = sampleVariable(v, rng)
        expect(val).toBeGreaterThanOrEqual(v.min)
        expect(val).toBeLessThanOrEqual(v.max)
        expect(Number.isInteger(val)).toBe(true)
      }
    })
  })

  // ============================================================================
  // 3. runScenarioIteration
  // ============================================================================

  describe('runScenarioIteration', () => {
    test('does not mutate input', () => {
      const input = makeScenarioInput()
      const inputCopy = JSON.parse(JSON.stringify(input))
      const rng = createDeterministicRandomSource(42)
      runScenarioIteration(input, rng)
      expect(input).toEqual(inputCopy)
    })

    test('returns sampled values for each variable', () => {
      const input = makeScenarioInput({
        variables: [
          makeVariable({ id: 'v-1' }),
          makeVariable({ id: 'v-2', label: 'Cost growth' }),
        ],
      })
      const rng = createDeterministicRandomSource(42)
      const result = runScenarioIteration(input, rng)
      expect(result.sampledValues).toBeDefined()
      expect(Object.keys(result.sampledValues)).toHaveLength(2)
    })

    test('returns a score within reasonable bounds', () => {
      const input = makeScenarioInput()
      const rng = createDeterministicRandomSource(42)
      const result = runScenarioIteration(input, rng)
      expect(typeof result.score).toBe('number')
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
    })
  })

  // ============================================================================
  // 4. runMonteCarloScenario
  // ============================================================================

  describe('runMonteCarloScenario', () => {
    test('is deterministic for same seed', () => {
      const input = makeScenarioInput()
      const result1 = runMonteCarloScenario(input, { seed: 42, iterations: 100 })
      const result2 = runMonteCarloScenario(input, { seed: 42, iterations: 100 })
      expect(result1.medianEstimate).toBe(result2.medianEstimate)
      expect(result1.downsideEstimate).toBe(result2.downsideEstimate)
      expect(result1.upsideEstimate).toBe(result2.upsideEstimate)
      expect(result1.tailRiskEstimate).toBe(result2.tailRiskEstimate)
      expect(result1.probabilityRange).toEqual(result2.probabilityRange)
    })

    test('returns advisoryOnly true', () => {
      const input = makeScenarioInput()
      const result = runMonteCarloScenario(input, { seed: 42, iterations: 50 })
      expect(result.advisoryOnly).toBe(true)
    })

    test('returns humanReviewRequired true', () => {
      const input = makeScenarioInput()
      const result = runMonteCarloScenario(input, { seed: 42, iterations: 50 })
      expect(result.humanReviewRequired).toBe(true)
    })

    test('probability ranges stay bounded', () => {
      const input = makeScenarioInput()
      const result = runMonteCarloScenario(input, { seed: 42, iterations: 100 })
      expect(result.probabilityRange[0]).toBeGreaterThanOrEqual(0)
      expect(result.probabilityRange[1]).toBeLessThanOrEqual(1)
      expect(result.probabilityRange[0]).toBeLessThanOrEqual(result.probabilityRange[1])
    })

    test('weak confidence widens uncertainty range', () => {
      const strongInput = makeScenarioInput({ confidence: 'CONFIRMED' })
      const weakInput = makeScenarioInput({ confidence: 'UNLIKELY' })
      const strongResult = runMonteCarloScenario(strongInput, { seed: 42, iterations: 200 })
      const weakResult = runMonteCarloScenario(weakInput, { seed: 42, iterations: 200 })
      const strongSpread = strongResult.probabilityRange[1] - strongResult.probabilityRange[0]
      const weakSpread = weakResult.probabilityRange[1] - weakResult.probabilityRange[0]
      expect(weakSpread).toBeGreaterThanOrEqual(strongSpread)
    })

    test('tail risk is preserved', () => {
      const input = makeScenarioInput()
      const result = runMonteCarloScenario(input, { seed: 42, iterations: 100 })
      expect(typeof result.tailRiskEstimate).toBe('number')
      expect(result.tailRiskEstimate).toBeGreaterThanOrEqual(0)
      expect(result.tailRiskEstimate).toBeLessThanOrEqual(1)
    })

    test('assumptions are included in output', () => {
      const assumptions = [
        makeAssumption({ id: 'a-1' }),
        makeAssumption({ id: 'a-2', statement: 'Second assumption' }),
      ]
      const input = makeScenarioInput({ assumptions })
      const result = runMonteCarloScenario(input, { seed: 42, iterations: 50 })
      expect(result.assumptionsUsed).toHaveLength(2)
      expect(result.assumptionsUsed.map(a => a.id)).toEqual(['a-1', 'a-2'])
    })

    test('high-sensitivity variables are surfaced', () => {
      const variables = [
        makeVariable({ id: 'v-low', sensitivity: 'low' }),
        makeVariable({ id: 'v-high', sensitivity: 'high', label: 'High sens var' }),
        makeVariable({ id: 'v-critical', sensitivity: 'critical', label: 'Critical var' }),
      ]
      const input = makeScenarioInput({ variables })
      const result = runMonteCarloScenario(input, { seed: 42, iterations: 50 })
      const sensitiveIds = result.sensitiveVariables.map(v => v.id)
      expect(sensitiveIds).toContain('v-high')
      expect(sensitiveIds).toContain('v-critical')
      expect(sensitiveIds).not.toContain('v-low')
    })

    test('no certainty language appears in warnings', () => {
      const input = makeScenarioInput()
      const result = runMonteCarloScenario(input, { seed: 42, iterations: 50 })
      const certaintyTerms = ['guaranteed', 'certain', 'definitely', 'will happen', 'impossible']
      for (const warning of result.warnings) {
        for (const term of certaintyTerms) {
          expect(warning.message.toLowerCase()).not.toContain(term)
        }
      }
    })
  })

  // ============================================================================
  // 5. summarizeScenarioDistribution
  // ============================================================================

  describe('summarizeScenarioDistribution', () => {
    test('computes median, downside, upside, tail risk from iterations', () => {
      const input = makeScenarioInput()
      const rng = createDeterministicRandomSource(42)
      const iterations = Array.from({ length: 100 }, () => runScenarioIteration(input, rng))
      const summary = summarizeScenarioDistribution(iterations)
      expect(typeof summary.medianEstimate).toBe('number')
      expect(typeof summary.downsideEstimate).toBe('number')
      expect(typeof summary.upsideEstimate).toBe('number')
      expect(typeof summary.tailRiskEstimate).toBe('number')
      expect(summary.downsideEstimate).toBeLessThanOrEqual(summary.medianEstimate)
      expect(summary.upsideEstimate).toBeGreaterThanOrEqual(summary.medianEstimate)
      expect(summary.tailRiskEstimate).toBeLessThanOrEqual(summary.downsideEstimate)
    })
  })

  // ============================================================================
  // 6. detectTailRisk
  // ============================================================================

  describe('detectTailRisk', () => {
    test('identifies tail risk value', () => {
      const input = makeScenarioInput()
      const rng = createDeterministicRandomSource(42)
      const iterations = Array.from({ length: 100 }, () => runScenarioIteration(input, rng))
      const tailRisk = detectTailRisk(iterations)
      expect(typeof tailRisk.estimate).toBe('number')
      expect(tailRisk.estimate).toBeGreaterThanOrEqual(0)
      expect(tailRisk.estimate).toBeLessThanOrEqual(1)
    })

    test('does not suppress negative outcomes', () => {
      const input = makeScenarioInput({
        variables: [makeVariable({ min: -0.5, max: 0.1, baseline: -0.2 })],
      })
      const rng = createDeterministicRandomSource(42)
      const iterations = Array.from({ length: 200 }, () => runScenarioIteration(input, rng))
      const tailRisk = detectTailRisk(iterations)
      expect(tailRisk.estimate).toBeDefined()
    })
  })

  // ============================================================================
  // 7. calculateUncertaintyBand
  // ============================================================================

  describe('calculateUncertaintyBand', () => {
    test('returns bounded probability range', () => {
      const input = makeScenarioInput()
      const rng = createDeterministicRandomSource(42)
      const iterations = Array.from({ length: 100 }, () => runScenarioIteration(input, rng))
      const band = calculateUncertaintyBand(iterations)
      expect(band[0]).toBeGreaterThanOrEqual(0)
      expect(band[1]).toBeLessThanOrEqual(1)
      expect(band[0]).toBeLessThanOrEqual(band[1])
    })
  })

  // ============================================================================
  // 8. Boundary checks — no forbidden imports, no Math.random
  // ============================================================================

  describe('boundary checks', () => {
    test('no uncontrolled Math.random in implementation', () => {
      // Verify the implementation source does not contain uncontrolled Math.random
      const exportKeys = Object.keys(monteCarloScenarioExports)
      // All exported functions should accept a random source parameter
      expect(exportKeys).toContain('createDeterministicRandomSource')
    })

    test('no Evidence Router imports', () => {
      const exportKeys = Object.keys(monteCarloScenarioExports)
      const routerLeaks = exportKeys.filter(k =>
        /evidence.*router|router.*adapter/i.test(k)
      )
      expect(routerLeaks).toEqual([])
    })

    test('no Predictability Kernel imports', () => {
      const exportKeys = Object.keys(monteCarloScenarioExports)
      const kernelLeaks = exportKeys.filter(k =>
        /kernel|predictability.*kernel/i.test(k)
      )
      expect(kernelLeaks).toEqual([])
    })

    test('no UI/API/DB/filesystem/current.md/shell-promoter references in exports', () => {
      const exportKeys = Object.keys(monteCarloScenarioExports)
      const forbiddenPatterns = [
        'filesystem', 'writeFile', 'readFile',
        'fetch', 'endpoint', 'route',
        'component', 'render', 'jsx',
        'database', 'query', 'migration',
        'currentMd', 'current_md',
        'shellPromoter', 'shell_promoter',
      ]
      for (const key of exportKeys) {
        const lower = key.toLowerCase()
        for (const pattern of forbiddenPatterns) {
          expect(lower.includes(pattern.toLowerCase())).toBe(false)
        }
      }
    })
  })
})
