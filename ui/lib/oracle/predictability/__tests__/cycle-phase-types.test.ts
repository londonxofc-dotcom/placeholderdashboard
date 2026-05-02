// ============================================================================
// Cycle Phase Type Contract Tests — Stage M-H
// Type-contract verification only. No implementation functions tested.
// ============================================================================

import {
  CYCLE_PHASES,
  CYCLE_PHASE_WARNING_CODES,
  CYCLE_PHASE_WARNING_SEVERITIES,
  CYCLE_PHASE_DEFAULT_SAFETY_FLAGS,
  CYCLE_PHASE_THRESHOLDS,
  type CyclePhase,
  type CyclePhaseInput,
  type CyclePhaseResult,
  type CyclePhaseWarning,
  type CyclePhaseEvidence,
  type CyclePhaseConfidence,
  type CyclePhaseTransitionRisk,
} from '../cycle-phase-types'

import * as cyclePhaseModule from '../cycle-phase-types'

// ---------------------------------------------------------------------------
// 1. All expected types are exported and compile
// ---------------------------------------------------------------------------
describe('cycle-phase-types exports', () => {
  it('exports CYCLE_PHASES constant', () => {
    expect(CYCLE_PHASES).toBeDefined()
    expect(typeof CYCLE_PHASES).toBe('object')
  })

  it('exports CYCLE_PHASE_WARNING_CODES constant', () => {
    expect(CYCLE_PHASE_WARNING_CODES).toBeDefined()
    expect(typeof CYCLE_PHASE_WARNING_CODES).toBe('object')
  })

  it('exports CYCLE_PHASE_WARNING_SEVERITIES constant', () => {
    expect(CYCLE_PHASE_WARNING_SEVERITIES).toBeDefined()
    expect(typeof CYCLE_PHASE_WARNING_SEVERITIES).toBe('object')
  })

  it('exports CYCLE_PHASE_DEFAULT_SAFETY_FLAGS constant', () => {
    expect(CYCLE_PHASE_DEFAULT_SAFETY_FLAGS).toBeDefined()
    expect(typeof CYCLE_PHASE_DEFAULT_SAFETY_FLAGS).toBe('object')
  })

  it('exports CYCLE_PHASE_THRESHOLDS constant', () => {
    expect(CYCLE_PHASE_THRESHOLDS).toBeDefined()
    expect(typeof CYCLE_PHASE_THRESHOLDS).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// 2. Phase literal values
// ---------------------------------------------------------------------------
describe('CyclePhase literals', () => {
  it('includes all six required phase values', () => {
    expect(CYCLE_PHASES.accumulation).toBe('accumulation')
    expect(CYCLE_PHASES.expansion).toBe('expansion')
    expect(CYCLE_PHASES.distribution).toBe('distribution')
    expect(CYCLE_PHASES.contraction).toBe('contraction')
    expect(CYCLE_PHASES.recovery).toBe('recovery')
    expect(CYCLE_PHASES.uncertain).toBe('uncertain')
  })

  it('has exactly six phase values', () => {
    expect(Object.keys(CYCLE_PHASES)).toHaveLength(6)
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CYCLE_PHASES)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Warning severity values
// ---------------------------------------------------------------------------
describe('CyclePhaseWarningSeverity', () => {
  it('includes info, warn, and block', () => {
    expect(CYCLE_PHASE_WARNING_SEVERITIES.info).toBe('info')
    expect(CYCLE_PHASE_WARNING_SEVERITIES.warn).toBe('warn')
    expect(CYCLE_PHASE_WARNING_SEVERITIES.block).toBe('block')
  })

  it('has exactly three severity values', () => {
    expect(Object.keys(CYCLE_PHASE_WARNING_SEVERITIES)).toHaveLength(3)
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CYCLE_PHASE_WARNING_SEVERITIES)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. Warning codes
// ---------------------------------------------------------------------------
describe('CyclePhaseWarningCodes', () => {
  it('includes upstream-missing code', () => {
    expect(CYCLE_PHASE_WARNING_CODES.UPSTREAM_MISSING).toBeDefined()
    expect(typeof CYCLE_PHASE_WARNING_CODES.UPSTREAM_MISSING).toBe('string')
  })

  it('includes low-confidence code', () => {
    expect(CYCLE_PHASE_WARNING_CODES.LOW_CONFIDENCE).toBeDefined()
  })

  it('includes stale-evidence code', () => {
    expect(CYCLE_PHASE_WARNING_CODES.STALE_EVIDENCE).toBeDefined()
  })

  it('includes high-ambiguity code', () => {
    expect(CYCLE_PHASE_WARNING_CODES.HIGH_AMBIGUITY).toBeDefined()
  })

  it('includes model-disagreement code', () => {
    expect(CYCLE_PHASE_WARNING_CODES.MODEL_DISAGREEMENT).toBeDefined()
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CYCLE_PHASE_WARNING_CODES)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Default safety flags
// ---------------------------------------------------------------------------
describe('CYCLE_PHASE_DEFAULT_SAFETY_FLAGS', () => {
  it('has advisoryOnly as true', () => {
    expect(CYCLE_PHASE_DEFAULT_SAFETY_FLAGS.advisoryOnly).toBe(true)
  })

  it('has humanReviewRequired as true', () => {
    expect(CYCLE_PHASE_DEFAULT_SAFETY_FLAGS.humanReviewRequired).toBe(true)
  })

  it('has noActionRecommended as true', () => {
    expect(CYCLE_PHASE_DEFAULT_SAFETY_FLAGS.noActionRecommended).toBe(true)
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CYCLE_PHASE_DEFAULT_SAFETY_FLAGS)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. Thresholds
// ---------------------------------------------------------------------------
describe('CYCLE_PHASE_THRESHOLDS', () => {
  it('includes minimum confidence threshold', () => {
    expect(typeof CYCLE_PHASE_THRESHOLDS.MIN_CONFIDENCE).toBe('number')
    expect(CYCLE_PHASE_THRESHOLDS.MIN_CONFIDENCE).toBeGreaterThan(0)
    expect(CYCLE_PHASE_THRESHOLDS.MIN_CONFIDENCE).toBeLessThanOrEqual(1)
  })

  it('includes ambiguity threshold', () => {
    expect(typeof CYCLE_PHASE_THRESHOLDS.AMBIGUITY_THRESHOLD).toBe('number')
  })

  it('includes hysteresis entry threshold', () => {
    expect(typeof CYCLE_PHASE_THRESHOLDS.HYSTERESIS_ENTRY).toBe('number')
  })

  it('includes hysteresis retention threshold', () => {
    expect(typeof CYCLE_PHASE_THRESHOLDS.HYSTERESIS_RETENTION).toBe('number')
  })

  it('entry threshold is higher than retention threshold', () => {
    expect(CYCLE_PHASE_THRESHOLDS.HYSTERESIS_ENTRY).toBeGreaterThan(
      CYCLE_PHASE_THRESHOLDS.HYSTERESIS_RETENTION
    )
  })

  it('includes quality penalty values', () => {
    expect(typeof CYCLE_PHASE_THRESHOLDS.QUALITY_PENALTY_LOW).toBe('number')
    expect(typeof CYCLE_PHASE_THRESHOLDS.QUALITY_PENALTY_MODERATE).toBe('number')
  })

  it('includes staleness window', () => {
    expect(typeof CYCLE_PHASE_THRESHOLDS.STALENESS_WINDOW_MS).toBe('number')
  })

  it('includes warning penalty factor', () => {
    expect(typeof CYCLE_PHASE_THRESHOLDS.WARNING_PENALTY_FACTOR).toBe('number')
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CYCLE_PHASE_THRESHOLDS)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 7. CyclePhaseWarning type structure
// ---------------------------------------------------------------------------
describe('CyclePhaseWarning type', () => {
  it('compiles with required fields: code, message, severity, source', () => {
    const warning: CyclePhaseWarning = {
      code: CYCLE_PHASE_WARNING_CODES.UPSTREAM_MISSING,
      message: 'Upstream model result is missing',
      severity: CYCLE_PHASE_WARNING_SEVERITIES.block,
      source: 'trend-baseline',
    }
    expect(warning.code).toBeDefined()
    expect(warning.message).toBeDefined()
    expect(warning.severity).toBeDefined()
    expect(warning.source).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 8. CyclePhaseEvidence type structure
// ---------------------------------------------------------------------------
describe('CyclePhaseEvidence type', () => {
  it('compiles with required fields', () => {
    const evidence: CyclePhaseEvidence = {
      trendSignal: 'stable direction, near-zero slope',
      regimeSignal: 'high stability in current state',
      scenarioSignal: 'narrowing dispersion',
      beliefSignal: 'strengthening posterior',
      dominantSignals: ['trend-baseline', 'markov-regime'],
      summary: 'Evidence consistent with accumulation phase',
    }
    expect(evidence.trendSignal).toBeDefined()
    expect(evidence.regimeSignal).toBeDefined()
    expect(evidence.scenarioSignal).toBeDefined()
    expect(evidence.beliefSignal).toBeDefined()
    expect(evidence.dominantSignals).toBeDefined()
    expect(evidence.summary).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 9. CyclePhaseResult safety fields
// ---------------------------------------------------------------------------
describe('CyclePhaseResult safety fields', () => {
  it('advisoryOnly is literal true', () => {
    const result = {
      phase: CYCLE_PHASES.uncertain,
      confidence: 0,
      phaseScores: {
        accumulation: 0,
        expansion: 0,
        distribution: 0,
        contraction: 0,
        recovery: 0,
        uncertain: 1,
      },
      transitionRisk: 0,
      ambiguityScore: 1,
      warnings: [],
      evidenceSummary: '',
      assumptions: [],
      provenanceTrail: [],
      advisoryOnly: true as const,
      humanReviewRequired: true as const,
      noActionRecommended: true as const,
    } satisfies CyclePhaseResult
    expect(result.advisoryOnly).toBe(true)
  })

  it('humanReviewRequired is literal true', () => {
    const result = {
      phase: CYCLE_PHASES.uncertain,
      confidence: 0,
      phaseScores: {
        accumulation: 0,
        expansion: 0,
        distribution: 0,
        contraction: 0,
        recovery: 0,
        uncertain: 1,
      },
      transitionRisk: 0,
      ambiguityScore: 1,
      warnings: [],
      evidenceSummary: '',
      assumptions: [],
      provenanceTrail: [],
      advisoryOnly: true as const,
      humanReviewRequired: true as const,
      noActionRecommended: true as const,
    } satisfies CyclePhaseResult
    expect(result.humanReviewRequired).toBe(true)
  })

  it('noActionRecommended is literal true', () => {
    const result = {
      phase: CYCLE_PHASES.uncertain,
      confidence: 0,
      phaseScores: {
        accumulation: 0,
        expansion: 0,
        distribution: 0,
        contraction: 0,
        recovery: 0,
        uncertain: 1,
      },
      transitionRisk: 0,
      ambiguityScore: 1,
      warnings: [],
      evidenceSummary: '',
      assumptions: [],
      provenanceTrail: [],
      advisoryOnly: true as const,
      humanReviewRequired: true as const,
      noActionRecommended: true as const,
    } satisfies CyclePhaseResult
    expect(result.noActionRecommended).toBe(true)
  })

  it('result includes confidence as a number', () => {
    const result = {
      phase: CYCLE_PHASES.accumulation,
      confidence: 0.75,
      phaseScores: {
        accumulation: 0.75,
        expansion: 0.1,
        distribution: 0.05,
        contraction: 0.03,
        recovery: 0.02,
        uncertain: 0.05,
      },
      transitionRisk: 0.2,
      ambiguityScore: 0.3,
      warnings: [],
      evidenceSummary: 'Evidence consistent with accumulation',
      assumptions: ['upstream models are current'],
      provenanceTrail: ['bayesian-updater', 'markov-regime'],
      advisoryOnly: true as const,
      humanReviewRequired: true as const,
      noActionRecommended: true as const,
    } satisfies CyclePhaseResult
    expect(typeof result.confidence).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// 10. CyclePhaseConfidence type
// ---------------------------------------------------------------------------
describe('CyclePhaseConfidence type', () => {
  it('compiles with required fields', () => {
    const confidence: CyclePhaseConfidence = {
      phaseScoreConfidence: 0.8,
      upstreamConfidencePenalty: 0.9,
      dataQualityPenalty: 0.8,
      warningPenalty: 1.0,
      stalenessPenalty: 1.0,
      overall: 0.576,
    }
    expect(confidence.overall).toBeDefined()
    expect(confidence.phaseScoreConfidence).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 11. CyclePhaseTransitionRisk type
// ---------------------------------------------------------------------------
describe('CyclePhaseTransitionRisk type', () => {
  it('compiles with required fields', () => {
    const risk: CyclePhaseTransitionRisk = {
      regimeTransitionComponent: 0.3,
      trendReversalComponent: 0.2,
      scenarioDispersionComponent: 0.4,
      ambiguityComponent: 0.1,
      overall: 0.25,
    }
    expect(risk.overall).toBeDefined()
    expect(risk.regimeTransitionComponent).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 12. CyclePhaseInput type
// ---------------------------------------------------------------------------
describe('CyclePhaseInput type', () => {
  it('compiles with required upstream fields', () => {
    const input: CyclePhaseInput = {
      trendBaseline: {
        direction: 'stable',
        delta: 0.01,
        acceleration: 0.001,
        reversalIndicator: 0.05,
        baselineDeviation: 0.02,
        confidence: 0.9,
        dataQuality: 'high',
      },
      markovRegime: {
        dominantState: 'stable',
        stateStability: 0.95,
        transitionProbability: 0.05,
        confidence: 0.88,
      },
      monteCarloScenario: {
        scenarioDispersion: 0.12,
        medianOutcome: 0.5,
        confidenceInterval: [0.3, 0.7],
        uncertaintyBand: 0.15,
        confidence: 0.82,
      },
      bayesianPosterior: {
        beliefStrength: 0.85,
        priorToPosteriorDelta: 0.02,
        updateMagnitude: 0.03,
        confidence: 0.91,
      },
      signalType: 'engagement',
      assumptions: ['all upstream models ran within freshness window'],
      inheritedWarnings: [],
      provenanceTrail: ['bayesian-updater', 'monte-carlo', 'markov-regime', 'trend-baseline'],
    }
    expect(input.trendBaseline).toBeDefined()
    expect(input.markovRegime).toBeDefined()
    expect(input.monteCarloScenario).toBeDefined()
    expect(input.bayesianPosterior).toBeDefined()
    expect(input.signalType).toBeDefined()
  })

  it('allows optional upstream inputs to be undefined', () => {
    const input: CyclePhaseInput = {
      signalType: 'streams',
      assumptions: [],
      inheritedWarnings: [],
      provenanceTrail: [],
    }
    expect(input.trendBaseline).toBeUndefined()
    expect(input.markovRegime).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 13. No implementation functions exported
// ---------------------------------------------------------------------------
describe('scope boundary checks', () => {
  const sourceFilePath = 'lib/oracle/predictability/cycle-phase-types.ts'

  it('does not export any implementation functions', () => {
    const exportedKeys = Object.keys(cyclePhaseModule)
    const functions = exportedKeys.filter(
      (key) => typeof (cyclePhaseModule as Record<string, unknown>)[key] === 'function'
    )
    expect(functions).toHaveLength(0)
  })

  it('does not import from forbidden modules', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')

    const forbidden = [
      'cycle-analysis',
      'trend-baseline-comparison',
      'bayesian-updater',
      'monte-carlo-scenarios',
      'markov-regime-transitions',
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
})
