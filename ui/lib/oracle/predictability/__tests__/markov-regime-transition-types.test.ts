// ============================================================================
// Markov Regime Transition Type Contract Tests — Stage M-E
// Contract-only tests. No implementation functions. No transition logic.
// No matrix calculations. No Evidence Router. No Predictability Kernel.
// No Bayesian updater. No Monte Carlo.
// ============================================================================

import {
  MARKOV_REGIME_STATES,
  MARKOV_TRANSITION_CONFIDENCES,
  MARKOV_TIME_HORIZONS,
  MARKOV_TRANSITION_SEVERITIES,
  MARKOV_CONTRACT_RULES,
} from '../markov-regime-transition-types'

import * as markovExports from '../markov-regime-transition-types'

import type {
  MarkovRegimeState,
  MarkovTransitionConfidence,
  MarkovTimeHorizon,
  MarkovTransitionSeverity,
  MarkovStateObservation,
  MarkovTransitionCell,
  MarkovTransitionMatrix,
  MarkovStateVector,
  MarkovTransitionInput,
  MarkovTransitionResult,
  MarkovTransitionWarning,
  MarkovContractRule,
} from '../markov-regime-transition-types'

// ============================================================================
// Fixtures
// ============================================================================

function makeObservation(overrides: Partial<MarkovStateObservation> = {}): MarkovStateObservation {
  return {
    id: 'obs-1',
    state: 'stable',
    observedAt: '2026-01-15T12:00:00Z',
    confidence: 'moderate',
    sourceTier: 'T1',
    provenance: 'test-fixture',
    ...overrides,
  }
}

function makeCell(overrides: Partial<MarkovTransitionCell> = {}): MarkovTransitionCell {
  return {
    fromState: 'stable',
    toState: 'accelerating',
    probability: 0.3,
    confidence: 'moderate',
    ...overrides,
  }
}

function makeMatrix(overrides: Partial<MarkovTransitionMatrix> = {}): MarkovTransitionMatrix {
  return {
    id: 'matrix-1',
    states: ['stable', 'accelerating', 'declining'],
    cells: [
      makeCell({ fromState: 'stable', toState: 'stable', probability: 0.5 }),
      makeCell({ fromState: 'stable', toState: 'accelerating', probability: 0.3 }),
      makeCell({ fromState: 'stable', toState: 'declining', probability: 0.2 }),
    ],
    sourceTier: 'T1',
    confidence: 'moderate',
    assumptions: ['market conditions remain similar'],
    provenance: 'test-fixture',
    ...overrides,
  }
}

function makeStateVector(overrides: Partial<MarkovStateVector> = {}): MarkovStateVector {
  return {
    horizon: 'medium',
    probabilities: { stable: 0.5, accelerating: 0.3, declining: 0.2 },
    confidence: 'moderate',
    assumptions: ['current trend continues'],
    warnings: [],
    provenance: 'test-fixture',
    ...overrides,
  }
}

function makeInput(overrides: Partial<MarkovTransitionInput> = {}): MarkovTransitionInput {
  return {
    currentState: 'stable',
    candidateStates: ['stable', 'accelerating', 'declining'],
    transitionMatrix: makeMatrix(),
    observations: [makeObservation()],
    horizon: 'medium',
    assumptions: ['no external shocks'],
    sourceTier: 'T1',
    confidence: 'moderate',
    provenance: 'test-fixture',
    ...overrides,
  }
}

function makeResult(overrides: Partial<MarkovTransitionResult> = {}): MarkovTransitionResult {
  return {
    currentState: 'stable',
    mostLikelyNextState: 'stable',
    nextStateDistribution: { stable: 0.5, accelerating: 0.3, declining: 0.2 },
    transitionPath: ['stable', 'stable'],
    confidence: 'moderate',
    assumptions: ['no external shocks'],
    warnings: [],
    provenanceTrail: ['test-fixture'],
    advisoryOnly: true,
    humanReviewRequired: true,
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('markov-regime-transition-types', () => {
  // ==========================================================================
  // 1. Regime states
  // ==========================================================================

  describe('MARKOV_REGIME_STATES', () => {
    test('all 10 regime states exist', () => {
      const expected = [
        'unknown', 'stable', 'accelerating', 'decelerating',
        'volatile', 'recovering', 'declining', 'breakout',
        'constrained', 'quarantined',
      ]
      for (const state of expected) {
        expect(MARKOV_REGIME_STATES).toHaveProperty(state)
        expect(MARKOV_REGIME_STATES[state as keyof typeof MARKOV_REGIME_STATES]).toBe(state)
      }
    })

    test('has exactly 10 states', () => {
      expect(Object.keys(MARKOV_REGIME_STATES)).toHaveLength(10)
    })
  })

  // ==========================================================================
  // 2. Transition confidence
  // ==========================================================================

  describe('MARKOV_TRANSITION_CONFIDENCES', () => {
    test('all confidence labels exist', () => {
      const expected = ['weak', 'moderate', 'strong', 'verified']
      for (const label of expected) {
        expect(MARKOV_TRANSITION_CONFIDENCES).toHaveProperty(label)
        expect(MARKOV_TRANSITION_CONFIDENCES[label as keyof typeof MARKOV_TRANSITION_CONFIDENCES]).toBe(label)
      }
    })

    test('has exactly 4 confidence labels', () => {
      expect(Object.keys(MARKOV_TRANSITION_CONFIDENCES)).toHaveLength(4)
    })
  })

  // ==========================================================================
  // 3. Time horizons
  // ==========================================================================

  describe('MARKOV_TIME_HORIZONS', () => {
    test('all time horizons exist', () => {
      const expected = ['short', 'medium', 'long', 'strategic']
      for (const h of expected) {
        expect(MARKOV_TIME_HORIZONS).toHaveProperty(h)
        expect(MARKOV_TIME_HORIZONS[h as keyof typeof MARKOV_TIME_HORIZONS]).toBe(h)
      }
    })

    test('has exactly 4 horizons', () => {
      expect(Object.keys(MARKOV_TIME_HORIZONS)).toHaveLength(4)
    })
  })

  // ==========================================================================
  // 4. Warning severities
  // ==========================================================================

  describe('MARKOV_TRANSITION_SEVERITIES', () => {
    test('all severities exist', () => {
      const expected = ['info', 'warn', 'block']
      for (const s of expected) {
        expect(MARKOV_TRANSITION_SEVERITIES).toHaveProperty(s)
        expect(MARKOV_TRANSITION_SEVERITIES[s as keyof typeof MARKOV_TRANSITION_SEVERITIES]).toBe(s)
      }
    })

    test('has exactly 3 severities', () => {
      expect(Object.keys(MARKOV_TRANSITION_SEVERITIES)).toHaveLength(3)
    })
  })

  // ==========================================================================
  // 5. MarkovStateObservation shape
  // ==========================================================================

  describe('MarkovStateObservation', () => {
    test('includes state, observedAt, confidence, sourceTier, provenance', () => {
      const obs = makeObservation()
      expect(obs.id).toBeDefined()
      expect(obs.state).toBe('stable')
      expect(obs.observedAt).toBeDefined()
      expect(obs.confidence).toBe('moderate')
      expect(obs.sourceTier).toBe('T1')
      expect(obs.provenance).toBe('test-fixture')
    })

    test('supports optional tags and notes', () => {
      const obs = makeObservation({ tags: ['market', 'q1'], notes: 'Test note' })
      expect(obs.tags).toEqual(['market', 'q1'])
      expect(obs.notes).toBe('Test note')
    })
  })

  // ==========================================================================
  // 6. MarkovTransitionCell shape
  // ==========================================================================

  describe('MarkovTransitionCell', () => {
    test('includes fromState, toState, probability, confidence', () => {
      const cell = makeCell()
      expect(cell.fromState).toBe('stable')
      expect(cell.toState).toBe('accelerating')
      expect(cell.probability).toBe(0.3)
      expect(cell.confidence).toBe('moderate')
    })

    test('supports optional provenance and notes', () => {
      const cell = makeCell({ provenance: 'historical-data', notes: 'Based on Q1' })
      expect(cell.provenance).toBe('historical-data')
      expect(cell.notes).toBe('Based on Q1')
    })
  })

  // ==========================================================================
  // 7. MarkovTransitionMatrix shape
  // ==========================================================================

  describe('MarkovTransitionMatrix', () => {
    test('includes states, cells, assumptions, provenance', () => {
      const matrix = makeMatrix()
      expect(matrix.id).toBeDefined()
      expect(matrix.states).toEqual(['stable', 'accelerating', 'declining'])
      expect(matrix.cells).toHaveLength(3)
      expect(matrix.assumptions).toEqual(['market conditions remain similar'])
      expect(matrix.provenance).toBe('test-fixture')
    })

    test('includes sourceTier and confidence', () => {
      const matrix = makeMatrix()
      expect(matrix.sourceTier).toBe('T1')
      expect(matrix.confidence).toBe('moderate')
    })

    test('supports optional createdAt and notes', () => {
      const matrix = makeMatrix({ createdAt: '2026-01-01', notes: 'Test matrix' })
      expect(matrix.createdAt).toBe('2026-01-01')
      expect(matrix.notes).toBe('Test matrix')
    })
  })

  // ==========================================================================
  // 8. MarkovStateVector shape
  // ==========================================================================

  describe('MarkovStateVector', () => {
    test('includes horizon, probabilities, assumptions, warnings, provenance', () => {
      const sv = makeStateVector()
      expect(sv.horizon).toBe('medium')
      expect(sv.probabilities).toEqual({ stable: 0.5, accelerating: 0.3, declining: 0.2 })
      expect(sv.confidence).toBe('moderate')
      expect(sv.assumptions).toEqual(['current trend continues'])
      expect(sv.warnings).toEqual([])
      expect(sv.provenance).toBe('test-fixture')
    })
  })

  // ==========================================================================
  // 9. MarkovTransitionInput shape
  // ==========================================================================

  describe('MarkovTransitionInput', () => {
    test('keeps currentState, candidateStates, transitionMatrix, observations, and horizon separate', () => {
      const input = makeInput()
      expect(input.currentState).toBe('stable')
      expect(input.candidateStates).toEqual(['stable', 'accelerating', 'declining'])
      expect(input.transitionMatrix.id).toBe('matrix-1')
      expect(input.observations).toHaveLength(1)
      expect(input.horizon).toBe('medium')
    })

    test('includes assumptions, sourceTier, confidence, provenance', () => {
      const input = makeInput()
      expect(input.assumptions).toEqual(['no external shocks'])
      expect(input.sourceTier).toBe('T1')
      expect(input.confidence).toBe('moderate')
      expect(input.provenance).toBe('test-fixture')
    })

    test('supports optional warnings', () => {
      const warning: MarkovTransitionWarning = {
        code: 'TEST',
        message: 'test warning',
        severity: 'info',
      }
      const input = makeInput({ warnings: [warning] })
      expect(input.warnings).toHaveLength(1)
    })
  })

  // ==========================================================================
  // 10. MarkovTransitionResult shape
  // ==========================================================================

  describe('MarkovTransitionResult', () => {
    test('includes mostLikelyNextState, nextStateDistribution, transitionPath, advisoryOnly, humanReviewRequired', () => {
      const result = makeResult()
      expect(result.currentState).toBe('stable')
      expect(result.mostLikelyNextState).toBe('stable')
      expect(result.nextStateDistribution).toEqual({ stable: 0.5, accelerating: 0.3, declining: 0.2 })
      expect(result.transitionPath).toEqual(['stable', 'stable'])
      expect(result.advisoryOnly).toBe(true)
      expect(result.humanReviewRequired).toBe(true)
    })

    test('includes confidence, assumptions, warnings, provenanceTrail', () => {
      const result = makeResult()
      expect(result.confidence).toBe('moderate')
      expect(result.assumptions).toEqual(['no external shocks'])
      expect(result.warnings).toEqual([])
      expect(result.provenanceTrail).toEqual(['test-fixture'])
    })
  })

  // ==========================================================================
  // 11. Contract rules
  // ==========================================================================

  describe('MARKOV_CONTRACT_RULES', () => {
    test('all 10 contract rules exist', () => {
      const expectedIds = [
        'TRANSITION_PROBABILITIES_BOUNDED',
        'MATRIX_ROWS_MUST_NORMALIZE',
        'STATE_LABELS_ARE_OPERATIONAL',
        'QUARANTINED_CANNOT_STRONG_POSITIVE',
        'WEAK_CONFIDENCE_WIDENS_UNCERTAINTY',
        'PROVENANCE_REQUIRED',
        'ADVISORY_ONLY_OUTPUT',
        'HUMAN_REVIEW_REQUIRED',
        'NO_CERTAINTY_CLAIMS',
        'NO_AUTONOMOUS_ACTION',
      ]
      const actualIds = MARKOV_CONTRACT_RULES.map(r => r.id)
      for (const id of expectedIds) {
        expect(actualIds).toContain(id)
      }
    })

    test('has exactly 10 rules', () => {
      expect(MARKOV_CONTRACT_RULES).toHaveLength(10)
    })

    test('each rule has id, description, severity, appliesTo', () => {
      for (const rule of MARKOV_CONTRACT_RULES) {
        expect(typeof rule.id).toBe('string')
        expect(typeof rule.description).toBe('string')
        expect(typeof rule.severity).toBe('string')
        expect(typeof rule.appliesTo).toBe('string')
      }
    })
  })

  // ==========================================================================
  // 12–16. Boundary checks
  // ==========================================================================

  describe('boundary checks', () => {
    test('no implementation functions are exported', () => {
      const exportKeys = Object.keys(markovExports)
      const implementationPatterns = [
        'calculate', 'normalize', 'run', 'compute', 'simulate', 'execute',
        'process', 'evaluate', 'score', 'predict', 'forecast',
      ]
      for (const key of exportKeys) {
        const lower = key.toLowerCase()
        for (const pattern of implementationPatterns) {
          expect(lower.startsWith(pattern)).toBe(false)
        }
      }
    })

    test('no matrix calculation function exists yet', () => {
      const exportKeys = Object.keys(markovExports)
      const calcPatterns = [
        'calculateNextStateDistribution',
        'normalizeTransitionMatrix',
        'runMarkovTransition',
      ]
      for (const name of calcPatterns) {
        expect(exportKeys).not.toContain(name)
      }
    })

    test('no Evidence Router imports', () => {
      const exportKeys = Object.keys(markovExports)
      const routerLeaks = exportKeys.filter(k =>
        /evidence.*router|router.*adapter/i.test(k)
      )
      expect(routerLeaks).toEqual([])
    })

    test('no Predictability Kernel imports', () => {
      const exportKeys = Object.keys(markovExports)
      const kernelLeaks = exportKeys.filter(k =>
        /kernel|predictability.*kernel/i.test(k)
      )
      expect(kernelLeaks).toEqual([])
    })

    test('no UI/API/DB/filesystem/current.md/shell-promoter references in exports', () => {
      const exportKeys = Object.keys(markovExports)
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
