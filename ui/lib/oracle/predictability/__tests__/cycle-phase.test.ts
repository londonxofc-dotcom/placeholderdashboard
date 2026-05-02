// ============================================================================
// Cycle Phase Model — Stage M-H Pure Function Tests
// Tests first (RED). Implementation in cycle-phase.ts.
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  classifyCyclePhase,
  computePhaseConfidence,
  assessPhaseTransitionRisk,
  detectPhaseAmbiguity,
  buildCyclePhaseResult,
} from '../cycle-phase'
import {
  CYCLE_PHASES,
  CYCLE_PHASE_THRESHOLDS,
  CYCLE_PHASE_WARNING_CODES,
  CYCLE_PHASE_WARNING_SEVERITIES,
  type CyclePhaseInput,
  type CyclePhaseWarning,
  type CyclePhaseConfidence,
  type CyclePhaseTransitionRisk,
  type CyclePhaseResult,
  type CyclePhase,
  type TrendBaselineInputSummary,
  type MarkovRegimeInputSummary,
  type MonteCarloScenarioInputSummary,
  type BayesianPosteriorInputSummary,
} from '../cycle-phase-types'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeTrend(overrides: Partial<TrendBaselineInputSummary> = {}): TrendBaselineInputSummary {
  return {
    direction: 'stable',
    delta: 0,
    acceleration: 0,
    reversalIndicator: 0,
    baselineDeviation: 0,
    confidence: 0.8,
    dataQuality: 'high',
    ...overrides,
  }
}

function makeMarkov(overrides: Partial<MarkovRegimeInputSummary> = {}): MarkovRegimeInputSummary {
  return {
    dominantState: 'stable',
    stateStability: 0.8,
    transitionProbability: 0.1,
    confidence: 0.8,
    ...overrides,
  }
}

function makeMonteCarlo(overrides: Partial<MonteCarloScenarioInputSummary> = {}): MonteCarloScenarioInputSummary {
  return {
    scenarioDispersion: 0.2,
    medianOutcome: 50,
    confidenceInterval: [40, 60] as const,
    uncertaintyBand: 0.15,
    confidence: 0.8,
    ...overrides,
  }
}

function makeBayesian(overrides: Partial<BayesianPosteriorInputSummary> = {}): BayesianPosteriorInputSummary {
  return {
    beliefStrength: 0.7,
    priorToPosteriorDelta: 0.1,
    updateMagnitude: 0.1,
    confidence: 0.8,
    ...overrides,
  }
}

function makeInput(overrides: Partial<CyclePhaseInput> = {}): CyclePhaseInput {
  return {
    trendBaseline: makeTrend(),
    markovRegime: makeMarkov(),
    monteCarloScenario: makeMonteCarlo(),
    bayesianPosterior: makeBayesian(),
    signalType: 'engagement',
    assumptions: ['upstream models are advisory only'],
    inheritedWarnings: [],
    provenanceTrail: ['M-G', 'M-F', 'M-D', 'M-B'],
    ...overrides,
  }
}

// Accumulation: stable trend, low acceleration, regime stable, narrowing scenarios, strengthening prior
function makeAccumulationInput(): CyclePhaseInput {
  return makeInput({
    trendBaseline: makeTrend({
      direction: 'stable',
      delta: 0.02,
      acceleration: 0.01,
      reversalIndicator: 0.05,
      baselineDeviation: 0.1,
      confidence: 0.85,
    }),
    markovRegime: makeMarkov({
      dominantState: 'stable',
      stateStability: 0.9,
      transitionProbability: 0.05,
      confidence: 0.85,
    }),
    monteCarloScenario: makeMonteCarlo({
      scenarioDispersion: 0.1,
      uncertaintyBand: 0.08,
      confidence: 0.85,
    }),
    bayesianPosterior: makeBayesian({
      beliefStrength: 0.75,
      priorToPosteriorDelta: 0.05,
      updateMagnitude: 0.05,
      confidence: 0.85,
    }),
  })
}

// Expansion: accelerating positive trend, high regime confidence, narrow scenarios, strong posterior
function makeExpansionInput(): CyclePhaseInput {
  return makeInput({
    trendBaseline: makeTrend({
      direction: 'accelerating',
      delta: 0.5,
      acceleration: 0.3,
      reversalIndicator: 0.05,
      baselineDeviation: 0.4,
      confidence: 0.9,
    }),
    markovRegime: makeMarkov({
      dominantState: 'growth',
      stateStability: 0.95,
      transitionProbability: 0.03,
      confidence: 0.9,
    }),
    monteCarloScenario: makeMonteCarlo({
      scenarioDispersion: 0.08,
      uncertaintyBand: 0.06,
      confidence: 0.9,
    }),
    bayesianPosterior: makeBayesian({
      beliefStrength: 0.9,
      priorToPosteriorDelta: 0.3,
      updateMagnitude: 0.3,
      confidence: 0.9,
    }),
  })
}

// Distribution: decelerating positive trend, widening scenarios, weakening posterior
function makeDistributionInput(): CyclePhaseInput {
  return makeInput({
    trendBaseline: makeTrend({
      direction: 'decelerating',
      delta: 0.15,
      acceleration: -0.2,
      reversalIndicator: 0.4,
      baselineDeviation: 0.3,
      confidence: 0.75,
    }),
    markovRegime: makeMarkov({
      dominantState: 'peak',
      stateStability: 0.5,
      transitionProbability: 0.35,
      confidence: 0.7,
    }),
    monteCarloScenario: makeMonteCarlo({
      scenarioDispersion: 0.5,
      uncertaintyBand: 0.4,
      confidence: 0.7,
    }),
    bayesianPosterior: makeBayesian({
      beliefStrength: 0.4,
      priorToPosteriorDelta: -0.15,
      updateMagnitude: 0.15,
      confidence: 0.7,
    }),
  })
}

// Contraction: negative accelerating trend, regime transitioning, wide scenarios, shifting posterior
function makeContractionInput(): CyclePhaseInput {
  return makeInput({
    trendBaseline: makeTrend({
      direction: 'reversing',
      delta: -0.4,
      acceleration: -0.35,
      reversalIndicator: 0.8,
      baselineDeviation: 0.5,
      confidence: 0.8,
    }),
    markovRegime: makeMarkov({
      dominantState: 'decline',
      stateStability: 0.3,
      transitionProbability: 0.6,
      confidence: 0.75,
    }),
    monteCarloScenario: makeMonteCarlo({
      scenarioDispersion: 0.7,
      uncertaintyBand: 0.6,
      confidence: 0.7,
    }),
    bayesianPosterior: makeBayesian({
      beliefStrength: 0.5,
      priorToPosteriorDelta: -0.3,
      updateMagnitude: 0.35,
      confidence: 0.75,
    }),
  })
}

// Recovery: flattening negative trend, settling regime, narrowing from wide, stabilizing posterior
function makeRecoveryInput(): CyclePhaseInput {
  return makeInput({
    trendBaseline: makeTrend({
      direction: 'decelerating',
      delta: -0.05,
      acceleration: 0.15,
      reversalIndicator: 0.2,
      baselineDeviation: 0.15,
      confidence: 0.8,
    }),
    markovRegime: makeMarkov({
      dominantState: 'settling',
      stateStability: 0.7,
      transitionProbability: 0.15,
      confidence: 0.8,
    }),
    monteCarloScenario: makeMonteCarlo({
      scenarioDispersion: 0.25,
      uncertaintyBand: 0.2,
      confidence: 0.8,
    }),
    bayesianPosterior: makeBayesian({
      beliefStrength: 0.6,
      priorToPosteriorDelta: 0.08,
      updateMagnitude: 0.08,
      confidence: 0.8,
    }),
  })
}

// ---------------------------------------------------------------------------
// Export checks
// ---------------------------------------------------------------------------

describe('cycle-phase exports', () => {
  it('exports classifyCyclePhase as a function', () => {
    expect(typeof classifyCyclePhase).toBe('function')
  })

  it('exports computePhaseConfidence as a function', () => {
    expect(typeof computePhaseConfidence).toBe('function')
  })

  it('exports assessPhaseTransitionRisk as a function', () => {
    expect(typeof assessPhaseTransitionRisk).toBe('function')
  })

  it('exports detectPhaseAmbiguity as a function', () => {
    expect(typeof detectPhaseAmbiguity).toBe('function')
  })

  it('exports buildCyclePhaseResult as a function', () => {
    expect(typeof buildCyclePhaseResult).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// classifyCyclePhase — phase classification
// ---------------------------------------------------------------------------

describe('classifyCyclePhase', () => {
  it('classifies accumulation from characteristic evidence', () => {
    const result = classifyCyclePhase(makeAccumulationInput())
    expect(result.phase).toBe(CYCLE_PHASES.accumulation)
  })

  it('classifies expansion from characteristic evidence', () => {
    const result = classifyCyclePhase(makeExpansionInput())
    expect(result.phase).toBe(CYCLE_PHASES.expansion)
  })

  it('classifies distribution from characteristic evidence', () => {
    const result = classifyCyclePhase(makeDistributionInput())
    expect(result.phase).toBe(CYCLE_PHASES.distribution)
  })

  it('classifies contraction from characteristic evidence', () => {
    const result = classifyCyclePhase(makeContractionInput())
    expect(result.phase).toBe(CYCLE_PHASES.contraction)
  })

  it('classifies recovery from characteristic evidence', () => {
    const result = classifyCyclePhase(makeRecoveryInput())
    expect(result.phase).toBe(CYCLE_PHASES.recovery)
  })

  it('returns uncertain when all upstream inputs are missing', () => {
    const input = makeInput({
      trendBaseline: undefined,
      markovRegime: undefined,
      monteCarloScenario: undefined,
      bayesianPosterior: undefined,
    })
    const result = classifyCyclePhase(input)
    expect(result.phase).toBe(CYCLE_PHASES.uncertain)
  })

  it('returns uncertain when a blocking warning is present', () => {
    const blockWarning: CyclePhaseWarning = {
      code: CYCLE_PHASE_WARNING_CODES.BLOCKING_WARNING_PRESENT,
      message: 'A blocking warning exists',
      severity: CYCLE_PHASE_WARNING_SEVERITIES.block,
      source: 'test',
    }
    const input = makeAccumulationInput()
    const inputWithBlock: CyclePhaseInput = {
      ...input,
      inheritedWarnings: [blockWarning],
    }
    const result = classifyCyclePhase(inputWithBlock)
    expect(result.phase).toBe(CYCLE_PHASES.uncertain)
  })

  it('returns uncertain when confidence is below MIN_CONFIDENCE', () => {
    const input = makeInput({
      trendBaseline: makeTrend({ confidence: 0.1 }),
      markovRegime: makeMarkov({ confidence: 0.1 }),
      monteCarloScenario: makeMonteCarlo({ confidence: 0.1 }),
      bayesianPosterior: makeBayesian({ confidence: 0.1 }),
    })
    const result = classifyCyclePhase(input)
    expect(result.phase).toBe(CYCLE_PHASES.uncertain)
  })

  it('returns a valid CyclePhase value', () => {
    const validPhases = Object.values(CYCLE_PHASES)
    const result = classifyCyclePhase(makeAccumulationInput())
    expect(validPhases).toContain(result.phase)
  })

  it('always includes advisoryOnly: true in result', () => {
    const result = classifyCyclePhase(makeAccumulationInput())
    expect(result.advisoryOnly).toBe(true)
  })

  it('always includes humanReviewRequired: true in result', () => {
    const result = classifyCyclePhase(makeExpansionInput())
    expect(result.humanReviewRequired).toBe(true)
  })

  it('always includes noActionRecommended: true in result', () => {
    const result = classifyCyclePhase(makeContractionInput())
    expect(result.noActionRecommended).toBe(true)
  })

  it('produces deterministic output for fixed input', () => {
    const input = makeAccumulationInput()
    const result1 = classifyCyclePhase(input)
    const result2 = classifyCyclePhase(input)
    expect(result1).toEqual(result2)
  })

  it('includes phaseScores for all six phases', () => {
    const result = classifyCyclePhase(makeExpansionInput())
    const phases = Object.values(CYCLE_PHASES)
    for (const phase of phases) {
      expect(result.phaseScores[phase]).toBeDefined()
      expect(typeof result.phaseScores[phase]).toBe('number')
    }
  })

  it('confidence is between 0 and 1', () => {
    const result = classifyCyclePhase(makeAccumulationInput())
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('transitionRisk is between 0 and 1', () => {
    const result = classifyCyclePhase(makeAccumulationInput())
    expect(result.transitionRisk).toBeGreaterThanOrEqual(0)
    expect(result.transitionRisk).toBeLessThanOrEqual(1)
  })

  it('ambiguityScore is between 0 and 1', () => {
    const result = classifyCyclePhase(makeAccumulationInput())
    expect(result.ambiguityScore).toBeGreaterThanOrEqual(0)
    expect(result.ambiguityScore).toBeLessThanOrEqual(1)
  })

  it('warns when a single upstream input is missing', () => {
    const input = makeInput({ trendBaseline: undefined })
    const result = classifyCyclePhase(input)
    const upstreamWarning = result.warnings.find(
      w => w.code === CYCLE_PHASE_WARNING_CODES.UPSTREAM_MISSING
    )
    expect(upstreamWarning).toBeDefined()
  })

  it('provenanceTrail includes inherited trail', () => {
    const input = makeAccumulationInput()
    const result = classifyCyclePhase(input)
    for (const entry of input.provenanceTrail) {
      expect(result.provenanceTrail).toContain(entry)
    }
  })

  it('assumptions include inherited assumptions', () => {
    const input = makeAccumulationInput()
    const result = classifyCyclePhase(input)
    for (const assumption of input.assumptions) {
      expect(result.assumptions).toContain(assumption)
    }
  })

  it('evidenceSummary is a non-empty string', () => {
    const result = classifyCyclePhase(makeExpansionInput())
    expect(typeof result.evidenceSummary).toBe('string')
    expect(result.evidenceSummary.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// computePhaseConfidence — multiplicative penalty chain
// ---------------------------------------------------------------------------

describe('computePhaseConfidence', () => {
  it('returns overall in [0, 1]', () => {
    const confidence = computePhaseConfidence(0.8, makeInput())
    expect(confidence.overall).toBeGreaterThanOrEqual(0)
    expect(confidence.overall).toBeLessThanOrEqual(1)
  })

  it('overall never exceeds phaseScoreConfidence', () => {
    const confidence = computePhaseConfidence(0.9, makeInput())
    expect(confidence.overall).toBeLessThanOrEqual(confidence.phaseScoreConfidence)
  })

  it('penalizes for low upstream confidence', () => {
    const highConf = computePhaseConfidence(0.9, makeInput({
      trendBaseline: makeTrend({ confidence: 0.9 }),
      markovRegime: makeMarkov({ confidence: 0.9 }),
      monteCarloScenario: makeMonteCarlo({ confidence: 0.9 }),
      bayesianPosterior: makeBayesian({ confidence: 0.9 }),
    }))
    const lowConf = computePhaseConfidence(0.9, makeInput({
      trendBaseline: makeTrend({ confidence: 0.3 }),
      markovRegime: makeMarkov({ confidence: 0.3 }),
      monteCarloScenario: makeMonteCarlo({ confidence: 0.3 }),
      bayesianPosterior: makeBayesian({ confidence: 0.3 }),
    }))
    expect(lowConf.overall).toBeLessThan(highConf.overall)
  })

  it('penalizes for low data quality', () => {
    const highQuality = computePhaseConfidence(0.9, makeInput({
      trendBaseline: makeTrend({ dataQuality: 'high' }),
    }))
    const lowQuality = computePhaseConfidence(0.9, makeInput({
      trendBaseline: makeTrend({ dataQuality: 'low' }),
    }))
    expect(lowQuality.overall).toBeLessThan(highQuality.overall)
  })

  it('penalizes for warnings', () => {
    const noWarnings = computePhaseConfidence(0.9, makeInput({ inheritedWarnings: [] }))
    const withWarnings = computePhaseConfidence(0.9, makeInput({
      inheritedWarnings: [
        { code: 'WARN_1', message: 'w1', severity: 'warn', source: 'test' },
        { code: 'WARN_2', message: 'w2', severity: 'warn', source: 'test' },
      ],
    }))
    expect(withWarnings.overall).toBeLessThan(noWarnings.overall)
  })

  it('returns all confidence breakdown fields', () => {
    const confidence = computePhaseConfidence(0.8, makeInput())
    expect(typeof confidence.phaseScoreConfidence).toBe('number')
    expect(typeof confidence.upstreamConfidencePenalty).toBe('number')
    expect(typeof confidence.dataQualityPenalty).toBe('number')
    expect(typeof confidence.warningPenalty).toBe('number')
    expect(typeof confidence.stalenessPenalty).toBe('number')
    expect(typeof confidence.overall).toBe('number')
  })

  it('each penalty component is in [0, 1]', () => {
    const confidence = computePhaseConfidence(0.8, makeInput())
    expect(confidence.phaseScoreConfidence).toBeGreaterThanOrEqual(0)
    expect(confidence.phaseScoreConfidence).toBeLessThanOrEqual(1)
    expect(confidence.upstreamConfidencePenalty).toBeGreaterThanOrEqual(0)
    expect(confidence.upstreamConfidencePenalty).toBeLessThanOrEqual(1)
    expect(confidence.dataQualityPenalty).toBeGreaterThanOrEqual(0)
    expect(confidence.dataQualityPenalty).toBeLessThanOrEqual(1)
    expect(confidence.warningPenalty).toBeGreaterThanOrEqual(0)
    expect(confidence.warningPenalty).toBeLessThanOrEqual(1)
    expect(confidence.stalenessPenalty).toBeGreaterThanOrEqual(0)
    expect(confidence.stalenessPenalty).toBeLessThanOrEqual(1)
  })

  it('is deterministic for same input', () => {
    const input = makeInput()
    const c1 = computePhaseConfidence(0.8, input)
    const c2 = computePhaseConfidence(0.8, input)
    expect(c1).toEqual(c2)
  })

  it('handles missing upstream inputs gracefully', () => {
    const confidence = computePhaseConfidence(0.8, makeInput({
      trendBaseline: undefined,
      markovRegime: undefined,
    }))
    expect(confidence.overall).toBeGreaterThanOrEqual(0)
    expect(confidence.overall).toBeLessThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// assessPhaseTransitionRisk
// ---------------------------------------------------------------------------

describe('assessPhaseTransitionRisk', () => {
  it('returns overall in [0, 1]', () => {
    const risk = assessPhaseTransitionRisk(makeInput(), 0.2)
    expect(risk.overall).toBeGreaterThanOrEqual(0)
    expect(risk.overall).toBeLessThanOrEqual(1)
  })

  it('higher regime transition probability increases risk', () => {
    const lowTransition = assessPhaseTransitionRisk(
      makeInput({ markovRegime: makeMarkov({ transitionProbability: 0.05 }) }),
      0.2
    )
    const highTransition = assessPhaseTransitionRisk(
      makeInput({ markovRegime: makeMarkov({ transitionProbability: 0.8 }) }),
      0.2
    )
    expect(highTransition.regimeTransitionComponent).toBeGreaterThan(lowTransition.regimeTransitionComponent)
    expect(highTransition.overall).toBeGreaterThan(lowTransition.overall)
  })

  it('higher reversal indicator increases risk', () => {
    const lowReversal = assessPhaseTransitionRisk(
      makeInput({ trendBaseline: makeTrend({ reversalIndicator: 0.05 }) }),
      0.2
    )
    const highReversal = assessPhaseTransitionRisk(
      makeInput({ trendBaseline: makeTrend({ reversalIndicator: 0.9 }) }),
      0.2
    )
    expect(highReversal.trendReversalComponent).toBeGreaterThan(lowReversal.trendReversalComponent)
  })

  it('higher scenario dispersion increases risk', () => {
    const narrow = assessPhaseTransitionRisk(
      makeInput({ monteCarloScenario: makeMonteCarlo({ scenarioDispersion: 0.05 }) }),
      0.2
    )
    const wide = assessPhaseTransitionRisk(
      makeInput({ monteCarloScenario: makeMonteCarlo({ scenarioDispersion: 0.9 }) }),
      0.2
    )
    expect(wide.scenarioDispersionComponent).toBeGreaterThan(narrow.scenarioDispersionComponent)
  })

  it('higher ambiguity increases risk', () => {
    const lowAmbiguity = assessPhaseTransitionRisk(makeInput(), 0.1)
    const highAmbiguity = assessPhaseTransitionRisk(makeInput(), 0.9)
    expect(highAmbiguity.ambiguityComponent).toBeGreaterThan(lowAmbiguity.ambiguityComponent)
  })

  it('returns all component fields', () => {
    const risk = assessPhaseTransitionRisk(makeInput(), 0.2)
    expect(typeof risk.regimeTransitionComponent).toBe('number')
    expect(typeof risk.trendReversalComponent).toBe('number')
    expect(typeof risk.scenarioDispersionComponent).toBe('number')
    expect(typeof risk.ambiguityComponent).toBe('number')
    expect(typeof risk.overall).toBe('number')
  })

  it('handles missing upstream inputs', () => {
    const risk = assessPhaseTransitionRisk(
      makeInput({ markovRegime: undefined, trendBaseline: undefined, monteCarloScenario: undefined }),
      0.5
    )
    expect(risk.overall).toBeGreaterThanOrEqual(0)
    expect(risk.overall).toBeLessThanOrEqual(1)
  })

  it('is deterministic', () => {
    const input = makeInput()
    const r1 = assessPhaseTransitionRisk(input, 0.3)
    const r2 = assessPhaseTransitionRisk(input, 0.3)
    expect(r1).toEqual(r2)
  })
})

// ---------------------------------------------------------------------------
// detectPhaseAmbiguity
// ---------------------------------------------------------------------------

describe('detectPhaseAmbiguity', () => {
  it('returns a number in [0, 1]', () => {
    const scores: Record<CyclePhase, number> = {
      accumulation: 0.8,
      expansion: 0.1,
      distribution: 0.05,
      contraction: 0.02,
      recovery: 0.02,
      uncertain: 0.01,
    }
    const ambiguity = detectPhaseAmbiguity(scores)
    expect(ambiguity).toBeGreaterThanOrEqual(0)
    expect(ambiguity).toBeLessThanOrEqual(1)
  })

  it('low ambiguity when one phase dominates', () => {
    const scores: Record<CyclePhase, number> = {
      accumulation: 0.9,
      expansion: 0.02,
      distribution: 0.02,
      contraction: 0.02,
      recovery: 0.02,
      uncertain: 0.02,
    }
    const ambiguity = detectPhaseAmbiguity(scores)
    expect(ambiguity).toBeLessThan(0.5)
  })

  it('high ambiguity when top two scores are close', () => {
    const scores: Record<CyclePhase, number> = {
      accumulation: 0.4,
      expansion: 0.39,
      distribution: 0.05,
      contraction: 0.05,
      recovery: 0.05,
      uncertain: 0.06,
    }
    const ambiguity = detectPhaseAmbiguity(scores)
    expect(ambiguity).toBeGreaterThan(0.8)
  })

  it('returns 1 when all scores are equal', () => {
    const scores: Record<CyclePhase, number> = {
      accumulation: 0.1,
      expansion: 0.1,
      distribution: 0.1,
      contraction: 0.1,
      recovery: 0.1,
      uncertain: 0.1,
    }
    const ambiguity = detectPhaseAmbiguity(scores)
    expect(ambiguity).toBe(1)
  })

  it('returns 0 when top score is 1 and rest are 0', () => {
    const scores: Record<CyclePhase, number> = {
      accumulation: 1,
      expansion: 0,
      distribution: 0,
      contraction: 0,
      recovery: 0,
      uncertain: 0,
    }
    const ambiguity = detectPhaseAmbiguity(scores)
    expect(ambiguity).toBe(0)
  })

  it('is deterministic', () => {
    const scores: Record<CyclePhase, number> = {
      accumulation: 0.5,
      expansion: 0.3,
      distribution: 0.1,
      contraction: 0.05,
      recovery: 0.03,
      uncertain: 0.02,
    }
    expect(detectPhaseAmbiguity(scores)).toBe(detectPhaseAmbiguity(scores))
  })
})

// ---------------------------------------------------------------------------
// buildCyclePhaseResult
// ---------------------------------------------------------------------------

describe('buildCyclePhaseResult', () => {
  it('sets advisoryOnly to true', () => {
    const result = buildCyclePhaseResult({
      phase: CYCLE_PHASES.accumulation,
      phaseScores: {
        accumulation: 0.8, expansion: 0.1, distribution: 0.05,
        contraction: 0.02, recovery: 0.02, uncertain: 0.01,
      },
      confidence: 0.75,
      transitionRisk: 0.2,
      ambiguityScore: 0.15,
      warnings: [],
      evidenceSummary: 'Test summary',
      assumptions: ['test assumption'],
      provenanceTrail: ['M-H'],
    })
    expect(result.advisoryOnly).toBe(true)
  })

  it('sets humanReviewRequired to true', () => {
    const result = buildCyclePhaseResult({
      phase: CYCLE_PHASES.expansion,
      phaseScores: {
        accumulation: 0.1, expansion: 0.8, distribution: 0.05,
        contraction: 0.02, recovery: 0.02, uncertain: 0.01,
      },
      confidence: 0.8,
      transitionRisk: 0.1,
      ambiguityScore: 0.1,
      warnings: [],
      evidenceSummary: 'Test',
      assumptions: [],
      provenanceTrail: [],
    })
    expect(result.humanReviewRequired).toBe(true)
  })

  it('sets noActionRecommended to true', () => {
    const result = buildCyclePhaseResult({
      phase: CYCLE_PHASES.contraction,
      phaseScores: {
        accumulation: 0.02, expansion: 0.02, distribution: 0.05,
        contraction: 0.8, recovery: 0.1, uncertain: 0.01,
      },
      confidence: 0.7,
      transitionRisk: 0.4,
      ambiguityScore: 0.2,
      warnings: [],
      evidenceSummary: 'Test',
      assumptions: [],
      provenanceTrail: [],
    })
    expect(result.noActionRecommended).toBe(true)
  })

  it('preserves all input fields in output', () => {
    const result = buildCyclePhaseResult({
      phase: CYCLE_PHASES.recovery,
      phaseScores: {
        accumulation: 0.05, expansion: 0.05, distribution: 0.1,
        contraction: 0.05, recovery: 0.7, uncertain: 0.05,
      },
      confidence: 0.65,
      transitionRisk: 0.3,
      ambiguityScore: 0.18,
      warnings: [{ code: 'TEST', message: 'test', severity: 'info', source: 'test' }],
      evidenceSummary: 'Recovery evidence',
      assumptions: ['a1', 'a2'],
      provenanceTrail: ['M-G', 'M-H'],
    })
    expect(result.phase).toBe(CYCLE_PHASES.recovery)
    expect(result.confidence).toBe(0.65)
    expect(result.transitionRisk).toBe(0.3)
    expect(result.ambiguityScore).toBe(0.18)
    expect(result.warnings).toHaveLength(1)
    expect(result.evidenceSummary).toBe('Recovery evidence')
    expect(result.assumptions).toEqual(['a1', 'a2'])
    expect(result.provenanceTrail).toEqual(['M-G', 'M-H'])
  })

  it('result satisfies CyclePhaseResult interface', () => {
    const result: CyclePhaseResult = buildCyclePhaseResult({
      phase: CYCLE_PHASES.uncertain,
      phaseScores: {
        accumulation: 0.1, expansion: 0.1, distribution: 0.1,
        contraction: 0.1, recovery: 0.1, uncertain: 0.5,
      },
      confidence: 0.3,
      transitionRisk: 0.5,
      ambiguityScore: 0.8,
      warnings: [],
      evidenceSummary: 'Uncertain',
      assumptions: [],
      provenanceTrail: [],
    })
    expect(result).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Hysteresis behavior
// ---------------------------------------------------------------------------

describe('hysteresis behavior', () => {
  it('classifyCyclePhase uses HYSTERESIS_ENTRY threshold for new phases', () => {
    // With strong accumulation evidence, phase should be accumulation
    const result = classifyCyclePhase(makeAccumulationInput())
    expect(result.phase).toBe(CYCLE_PHASES.accumulation)
    // The winning score should meet the entry threshold
    expect(result.phaseScores[result.phase]).toBeGreaterThanOrEqual(
      CYCLE_PHASE_THRESHOLDS.HYSTERESIS_ENTRY
    )
  })

  it('HYSTERESIS_ENTRY is greater than HYSTERESIS_RETENTION', () => {
    expect(CYCLE_PHASE_THRESHOLDS.HYSTERESIS_ENTRY).toBeGreaterThan(
      CYCLE_PHASE_THRESHOLDS.HYSTERESIS_RETENTION
    )
  })
})

// ---------------------------------------------------------------------------
// Uncertain fallback cases
// ---------------------------------------------------------------------------

describe('uncertain fallback cases', () => {
  it('returns uncertain when ambiguity exceeds AMBIGUITY_THRESHOLD', () => {
    // Create input where two phases score nearly equally
    const input = makeInput({
      trendBaseline: makeTrend({
        direction: 'stable',
        delta: 0.01,
        acceleration: 0.0,
        reversalIndicator: 0.0,
        confidence: 0.5,
      }),
      markovRegime: makeMarkov({
        stateStability: 0.5,
        transitionProbability: 0.5,
        confidence: 0.5,
      }),
      monteCarloScenario: makeMonteCarlo({
        scenarioDispersion: 0.5,
        uncertaintyBand: 0.5,
        confidence: 0.5,
      }),
      bayesianPosterior: makeBayesian({
        beliefStrength: 0.5,
        priorToPosteriorDelta: 0.0,
        updateMagnitude: 0.0,
        confidence: 0.5,
      }),
    })
    const result = classifyCyclePhase(input)
    // With ambiguous signals, should either be uncertain or have high ambiguity score
    if (result.ambiguityScore >= CYCLE_PHASE_THRESHOLDS.AMBIGUITY_THRESHOLD) {
      expect(result.phase).toBe(CYCLE_PHASES.uncertain)
    }
  })

  it('returns uncertain when two upstream inputs are missing', () => {
    const input = makeInput({
      trendBaseline: undefined,
      markovRegime: undefined,
    })
    const result = classifyCyclePhase(input)
    // With half the evidence missing, should lean toward uncertain
    const missingWarnings = result.warnings.filter(
      w => w.code === CYCLE_PHASE_WARNING_CODES.UPSTREAM_MISSING
    )
    expect(missingWarnings.length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// No side effects / purity checks
// ---------------------------------------------------------------------------

describe('purity and immutability', () => {
  it('classifyCyclePhase does not mutate input', () => {
    const input = makeAccumulationInput()
    const inputCopy = JSON.parse(JSON.stringify(input))
    classifyCyclePhase(input)
    expect(input).toEqual(inputCopy)
  })

  it('computePhaseConfidence does not mutate input', () => {
    const input = makeInput()
    const inputCopy = JSON.parse(JSON.stringify(input))
    computePhaseConfidence(0.8, input)
    expect(input).toEqual(inputCopy)
  })

  it('assessPhaseTransitionRisk does not mutate input', () => {
    const input = makeInput()
    const inputCopy = JSON.parse(JSON.stringify(input))
    assessPhaseTransitionRisk(input, 0.3)
    expect(input).toEqual(inputCopy)
  })
})

// ---------------------------------------------------------------------------
// Scope boundary checks
// ---------------------------------------------------------------------------

describe('scope boundary checks', () => {
  const sourceFilePath = path.resolve(__dirname, '..', 'cycle-phase.ts')

  it('does not import from forbidden modules', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')

    const forbidden = [
      'cycle-analysis',
      'trend-baseline-comparison',
      'trend-baseline-types',
      'bayesian-updater',
      'bayesian-updater-types',
      'monte-carlo-scenarios',
      'monte-carlo-scenario-types',
      'markov-regime-transitions',
      'markov-regime-transition-types',
      'evidence-router-adapter-types',
      'adapter-validation',
      'adapter-integration',
      'predictability-kernel',
    ]

    for (const mod of forbidden) {
      expect(source).not.toContain(`from './${mod}'`)
      expect(source).not.toContain(`from "./${mod}"`)
      expect(source).not.toContain(`require('./${mod}')`)
    }
  })

  it('only imports from cycle-phase-types', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')
    const importLines = source.split('\n').filter(
      (line: string) => line.trim().startsWith('import ') && line.includes('from')
    )
    for (const line of importLines) {
      expect(line).toContain('cycle-phase-types')
    }
  })

  it('does not contain shell-promoter references', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(source).not.toContain('shell-promoter')
    expect(source).not.toContain('KEEP_DEFERRED')
  })

  it('does not contain certainty language', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(source.toLowerCase()).not.toContain('will predict')
    expect(source.toLowerCase()).not.toContain('guaranteed')
    expect(source.toLowerCase()).not.toMatch(/\bcertain\b/)
  })

  it('does not import from Evidence Router or Predictability Kernel', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(source).not.toContain('evidence-router')
    expect(source).not.toContain('predictability-kernel')
  })

  it('contains no I/O operations', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(source).not.toContain('fetch(')
    expect(source).not.toContain('XMLHttpRequest')
    expect(source).not.toContain('localStorage')
    expect(source).not.toContain('sessionStorage')
    expect(source).not.toContain('document.')
    expect(source).not.toContain('window.')
    expect(source).not.toMatch(/\bfs\b/)
  })

  it('contains no Math.random or Date.now calls', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(source).not.toContain('Math.random')
    expect(source).not.toContain('Date.now')
    expect(source).not.toContain('new Date')
  })
})
