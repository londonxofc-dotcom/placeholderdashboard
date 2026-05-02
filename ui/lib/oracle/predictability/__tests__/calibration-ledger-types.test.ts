// ============================================================================
// Calibration Ledger Type Contract Tests — Stage M-I
// Type-contract verification only. No implementation functions tested.
// ============================================================================

import {
  CALIBRATION_LEDGER_STATUSES,
  CALIBRATION_LEDGER_WARNING_CODES,
  CALIBRATION_LEDGER_WARNING_SEVERITIES,
  CALIBRATION_OUTCOME_LABELS,
  CALIBRATION_DEFAULT_SAFETY_FLAGS,
  type CalibrationLedgerEntry,
  type CalibrationLedgerInput,
  type CalibrationLedgerResult,
  type CalibrationLedgerWarning,
  type CalibrationLedgerStatus,
  type CalibrationObservation,
  type CalibrationConfidenceAdjustment,
  type CalibrationOutcomeLabel,
  type CalibrationAuditMetadata,
} from '../calibration-ledger-types'

import * as calibrationModule from '../calibration-ledger-types'

// ---------------------------------------------------------------------------
// 1. All expected constants are exported
// ---------------------------------------------------------------------------
describe('calibration-ledger-types exports', () => {
  it('exports CALIBRATION_LEDGER_STATUSES constant', () => {
    expect(CALIBRATION_LEDGER_STATUSES).toBeDefined()
    expect(typeof CALIBRATION_LEDGER_STATUSES).toBe('object')
  })

  it('exports CALIBRATION_LEDGER_WARNING_CODES constant', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES).toBeDefined()
    expect(typeof CALIBRATION_LEDGER_WARNING_CODES).toBe('object')
  })

  it('exports CALIBRATION_LEDGER_WARNING_SEVERITIES constant', () => {
    expect(CALIBRATION_LEDGER_WARNING_SEVERITIES).toBeDefined()
    expect(typeof CALIBRATION_LEDGER_WARNING_SEVERITIES).toBe('object')
  })

  it('exports CALIBRATION_OUTCOME_LABELS constant', () => {
    expect(CALIBRATION_OUTCOME_LABELS).toBeDefined()
    expect(typeof CALIBRATION_OUTCOME_LABELS).toBe('object')
  })

  it('exports CALIBRATION_DEFAULT_SAFETY_FLAGS constant', () => {
    expect(CALIBRATION_DEFAULT_SAFETY_FLAGS).toBeDefined()
    expect(typeof CALIBRATION_DEFAULT_SAFETY_FLAGS).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// 2. Ledger status literal values
// ---------------------------------------------------------------------------
describe('CalibrationLedgerStatus literals', () => {
  it('includes all four required status values', () => {
    expect(CALIBRATION_LEDGER_STATUSES.pending).toBe('pending')
    expect(CALIBRATION_LEDGER_STATUSES.resolved).toBe('resolved')
    expect(CALIBRATION_LEDGER_STATUSES.expired).toBe('expired')
    expect(CALIBRATION_LEDGER_STATUSES.invalidated).toBe('invalidated')
  })

  it('has exactly four status values', () => {
    expect(Object.keys(CALIBRATION_LEDGER_STATUSES)).toHaveLength(4)
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CALIBRATION_LEDGER_STATUSES)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Warning severity values
// ---------------------------------------------------------------------------
describe('CalibrationLedgerWarningSeverity', () => {
  it('includes info, warn, and block', () => {
    expect(CALIBRATION_LEDGER_WARNING_SEVERITIES.info).toBe('info')
    expect(CALIBRATION_LEDGER_WARNING_SEVERITIES.warn).toBe('warn')
    expect(CALIBRATION_LEDGER_WARNING_SEVERITIES.block).toBe('block')
  })

  it('has exactly three severity values', () => {
    expect(Object.keys(CALIBRATION_LEDGER_WARNING_SEVERITIES)).toHaveLength(3)
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CALIBRATION_LEDGER_WARNING_SEVERITIES)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. Warning codes
// ---------------------------------------------------------------------------
describe('CalibrationLedgerWarningCodes', () => {
  it('includes INSUFFICIENT_DATA code', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES.INSUFFICIENT_DATA).toBeDefined()
    expect(typeof CALIBRATION_LEDGER_WARNING_CODES.INSUFFICIENT_DATA).toBe('string')
  })

  it('includes OVERCONFIDENT code', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES.OVERCONFIDENT).toBeDefined()
  })

  it('includes UNDERCONFIDENT code', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES.UNDERCONFIDENT).toBeDefined()
  })

  it('includes STALE_PENDING code', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES.STALE_PENDING).toBeDefined()
  })

  it('includes BIN_SPARSITY code', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES.BIN_SPARSITY).toBeDefined()
  })

  it('includes UPSTREAM_MISSING code', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES.UPSTREAM_MISSING).toBeDefined()
  })

  it('includes HIGH_SURPRISE code', () => {
    expect(CALIBRATION_LEDGER_WARNING_CODES.HIGH_SURPRISE).toBeDefined()
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CALIBRATION_LEDGER_WARNING_CODES)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Outcome labels
// ---------------------------------------------------------------------------
describe('CalibrationOutcomeLabel literals', () => {
  it('includes occurred and did_not_occur', () => {
    expect(CALIBRATION_OUTCOME_LABELS.occurred).toBe('occurred')
    expect(CALIBRATION_OUTCOME_LABELS.did_not_occur).toBe('did_not_occur')
  })

  it('includes ambiguous and not_yet_observed', () => {
    expect(CALIBRATION_OUTCOME_LABELS.ambiguous).toBe('ambiguous')
    expect(CALIBRATION_OUTCOME_LABELS.not_yet_observed).toBe('not_yet_observed')
  })

  it('has exactly four outcome labels', () => {
    expect(Object.keys(CALIBRATION_OUTCOME_LABELS)).toHaveLength(4)
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CALIBRATION_OUTCOME_LABELS)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. Default safety flags
// ---------------------------------------------------------------------------
describe('CALIBRATION_DEFAULT_SAFETY_FLAGS', () => {
  it('has advisoryOnly as true', () => {
    expect(CALIBRATION_DEFAULT_SAFETY_FLAGS.advisoryOnly).toBe(true)
  })

  it('has humanReviewRequired as true', () => {
    expect(CALIBRATION_DEFAULT_SAFETY_FLAGS.humanReviewRequired).toBe(true)
  })

  it('has noActionRecommended as true', () => {
    expect(CALIBRATION_DEFAULT_SAFETY_FLAGS.noActionRecommended).toBe(true)
  })

  it('is frozen', () => {
    expect(Object.isFrozen(CALIBRATION_DEFAULT_SAFETY_FLAGS)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 7. CalibrationLedgerInput type structure (spec Section 5.1)
// ---------------------------------------------------------------------------
describe('CalibrationLedgerInput type', () => {
  it('compiles with all required forecast fields', () => {
    const input: CalibrationLedgerInput = {
      forecastId: 'fc-001',
      sourceModule: 'bayesian-updater',
      forecastedProbability: 0.75,
      confidenceLabel: 'moderate',
      scenario: 'Engagement will increase by 10% within 7 days',
      evidenceBasis: ['trend-delta-rising', 'regime-stable'],
      assumptions: ['no external shocks', 'data pipeline operational'],
      evaluationWindowMs: 604_800_000,
      timestamp: Date.now(),
    }
    expect(input.forecastId).toBe('fc-001')
    expect(input.sourceModule).toBe('bayesian-updater')
    expect(typeof input.forecastedProbability).toBe('number')
    expect(input.confidenceLabel).toBe('moderate')
    expect(input.scenario).toBeDefined()
    expect(input.evidenceBasis).toHaveLength(2)
    expect(input.assumptions).toHaveLength(2)
    expect(typeof input.evaluationWindowMs).toBe('number')
    expect(typeof input.timestamp).toBe('number')
  })

  it('accepts all four confidence labels', () => {
    const labels = ['speculative', 'low', 'moderate', 'high'] as const
    for (const label of labels) {
      const input: CalibrationLedgerInput = {
        forecastId: `fc-${label}`,
        sourceModule: 'monte-carlo-scenarios',
        forecastedProbability: 0.5,
        confidenceLabel: label,
        scenario: 'test scenario',
        evidenceBasis: [],
        assumptions: [],
        evaluationWindowMs: 86_400_000,
        timestamp: Date.now(),
      }
      expect(input.confidenceLabel).toBe(label)
    }
  })
})

// ---------------------------------------------------------------------------
// 8. CalibrationObservation type structure (spec Section 5.2)
// ---------------------------------------------------------------------------
describe('CalibrationObservation type', () => {
  it('compiles with all required outcome fields', () => {
    const observation: CalibrationObservation = {
      forecastId: 'fc-001',
      occurred: true,
      observedAt: Date.now(),
      verificationMethod: 'manual data review',
      humanReviewedBy: 'nick-london',
      notes: 'Engagement increase confirmed via analytics dashboard',
    }
    expect(observation.forecastId).toBe('fc-001')
    expect(observation.occurred).toBe(true)
    expect(typeof observation.observedAt).toBe('number')
    expect(observation.verificationMethod).toBeDefined()
    expect(observation.humanReviewedBy).toBe('nick-london')
    expect(observation.notes).toBeDefined()
  })

  it('allows notes to be undefined', () => {
    const observation: CalibrationObservation = {
      forecastId: 'fc-002',
      occurred: false,
      observedAt: Date.now(),
      verificationMethod: 'automated check',
      humanReviewedBy: 'reviewer-1',
    }
    expect(observation.notes).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 9. CalibrationLedgerEntry type structure (spec Section 7)
// ---------------------------------------------------------------------------
describe('CalibrationLedgerEntry type', () => {
  it('compiles with pending status and null outcome/metrics fields', () => {
    const entry: CalibrationLedgerEntry = {
      forecastId: 'fc-001',
      sourceModule: 'bayesian-updater',
      forecastedProbability: 0.75,
      confidenceLabel: 'moderate',
      scenario: 'Engagement increase expected',
      evidenceBasis: ['trend-rising'],
      assumptions: ['no external shocks'],
      evaluationWindowMs: 604_800_000,
      forecastTimestamp: Date.now(),
      status: 'pending',
      occurred: null,
      observedAt: null,
      verificationMethod: null,
      humanReviewedBy: null,
      notes: null,
      absoluteError: null,
      squaredError: null,
      surpriseScore: null,
    }
    expect(entry.status).toBe('pending')
    expect(entry.occurred).toBeNull()
    expect(entry.absoluteError).toBeNull()
    expect(entry.squaredError).toBeNull()
    expect(entry.surpriseScore).toBeNull()
  })

  it('compiles with resolved status and populated outcome/metrics', () => {
    const entry: CalibrationLedgerEntry = {
      forecastId: 'fc-001',
      sourceModule: 'markov-regime-transitions',
      forecastedProbability: 0.8,
      confidenceLabel: 'high',
      scenario: 'Regime transition to expansion',
      evidenceBasis: ['regime-shift-detected'],
      assumptions: ['sufficient observation history'],
      evaluationWindowMs: 86_400_000,
      forecastTimestamp: 1_700_000_000_000,
      status: 'resolved',
      occurred: true,
      observedAt: 1_700_086_400_000,
      verificationMethod: 'manual data review',
      humanReviewedBy: 'nick-london',
      notes: 'Transition confirmed',
      absoluteError: 0.2,
      squaredError: 0.04,
      surpriseScore: 0.32,
    }
    expect(entry.status).toBe('resolved')
    expect(entry.occurred).toBe(true)
    expect(entry.absoluteError).toBe(0.2)
    expect(entry.squaredError).toBe(0.04)
    expect(entry.surpriseScore).toBe(0.32)
  })

  it('compiles with expired status', () => {
    const entry: CalibrationLedgerEntry = {
      forecastId: 'fc-003',
      sourceModule: 'trend-baseline-comparison',
      forecastedProbability: 0.6,
      confidenceLabel: 'low',
      scenario: 'Reversal expected',
      evidenceBasis: [],
      assumptions: [],
      evaluationWindowMs: 86_400_000,
      forecastTimestamp: 1_700_000_000_000,
      status: 'expired',
      occurred: null,
      observedAt: null,
      verificationMethod: null,
      humanReviewedBy: null,
      notes: null,
      absoluteError: null,
      squaredError: null,
      surpriseScore: null,
    }
    expect(entry.status).toBe('expired')
  })

  it('compiles with invalidated status', () => {
    const entry: CalibrationLedgerEntry = {
      forecastId: 'fc-004',
      sourceModule: 'cycle-phase-model',
      forecastedProbability: 0.55,
      confidenceLabel: 'speculative',
      scenario: 'Phase transition to contraction',
      evidenceBasis: [],
      assumptions: ['upstream data fresh'],
      evaluationWindowMs: 604_800_000,
      forecastTimestamp: 1_700_000_000_000,
      status: 'invalidated',
      occurred: null,
      observedAt: null,
      verificationMethod: null,
      humanReviewedBy: null,
      notes: 'Assumptions violated — upstream data pipeline was down',
      absoluteError: null,
      squaredError: null,
      surpriseScore: null,
    }
    expect(entry.status).toBe('invalidated')
  })
})

// ---------------------------------------------------------------------------
// 10. CalibrationLedgerWarning type structure
// ---------------------------------------------------------------------------
describe('CalibrationLedgerWarning type', () => {
  it('compiles with required fields: code, message, severity, source', () => {
    const warning: CalibrationLedgerWarning = {
      code: CALIBRATION_LEDGER_WARNING_CODES.INSUFFICIENT_DATA,
      message: 'Not enough resolved forecasts for reliable calibration',
      severity: CALIBRATION_LEDGER_WARNING_SEVERITIES.warn,
      source: 'calibration-ledger',
    }
    expect(warning.code).toBeDefined()
    expect(warning.message).toBeDefined()
    expect(warning.severity).toBe('warn')
    expect(warning.source).toBe('calibration-ledger')
  })
})

// ---------------------------------------------------------------------------
// 11. CalibrationConfidenceAdjustment type structure
// ---------------------------------------------------------------------------
describe('CalibrationConfidenceAdjustment type', () => {
  it('compiles with required fields', () => {
    const adjustment: CalibrationConfidenceAdjustment = {
      adjustmentFactor: 0.85,
      direction: 'decrease',
      magnitude: 0.15,
      basedOnCount: 42,
      rationale: 'System is overconfident in the 0.7-0.9 range',
    }
    expect(adjustment.adjustmentFactor).toBe(0.85)
    expect(adjustment.direction).toBe('decrease')
    expect(typeof adjustment.magnitude).toBe('number')
    expect(adjustment.basedOnCount).toBe(42)
    expect(adjustment.rationale).toBeDefined()
  })

  it('accepts increase direction', () => {
    const adjustment: CalibrationConfidenceAdjustment = {
      adjustmentFactor: 1.15,
      direction: 'increase',
      magnitude: 0.15,
      basedOnCount: 30,
      rationale: 'System is underconfident across all bins',
    }
    expect(adjustment.direction).toBe('increase')
  })

  it('accepts none direction for well-calibrated systems', () => {
    const adjustment: CalibrationConfidenceAdjustment = {
      adjustmentFactor: 1.0,
      direction: 'none',
      magnitude: 0,
      basedOnCount: 50,
      rationale: 'Calibration within acceptable tolerance',
    }
    expect(adjustment.direction).toBe('none')
    expect(adjustment.adjustmentFactor).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// 12. CalibrationAuditMetadata type structure
// ---------------------------------------------------------------------------
describe('CalibrationAuditMetadata type', () => {
  it('compiles with required audit fields', () => {
    const audit: CalibrationAuditMetadata = {
      ledgerVersion: '1.0.0',
      computedAt: Date.now(),
      resolvedCount: 45,
      pendingCount: 12,
      expiredCount: 3,
      invalidatedCount: 2,
      totalEntries: 62,
      oldestEntryTimestamp: 1_700_000_000_000,
      newestEntryTimestamp: 1_710_000_000_000,
    }
    expect(audit.ledgerVersion).toBe('1.0.0')
    expect(audit.resolvedCount).toBe(45)
    expect(audit.totalEntries).toBe(62)
    expect(typeof audit.computedAt).toBe('number')
    expect(typeof audit.oldestEntryTimestamp).toBe('number')
    expect(typeof audit.newestEntryTimestamp).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// 13. CalibrationLedgerResult type structure (spec Section 6.2)
// ---------------------------------------------------------------------------
describe('CalibrationLedgerResult type', () => {
  it('compiles with all required aggregate fields', () => {
    const result: CalibrationLedgerResult = {
      brierScore: 0.18,
      expectedCalibrationError: 0.05,
      calibrationCurve: [
        {
          binLower: 0.0,
          binUpper: 0.1,
          meanPredictedProbability: 0.05,
          observedFrequency: 0.04,
          count: 8,
        },
      ],
      overconfidenceDetected: false,
      underconfidenceDetected: false,
      recommendedAdjustment: 1.0,
      totalForecasts: 50,
      resolvedForecasts: 45,
      pendingForecasts: 5,
      minimumCountMet: true,
      confidenceAdjustment: {
        adjustmentFactor: 1.0,
        direction: 'none',
        magnitude: 0,
        basedOnCount: 45,
        rationale: 'Well-calibrated',
      },
      warnings: [],
      auditMetadata: {
        ledgerVersion: '1.0.0',
        computedAt: Date.now(),
        resolvedCount: 45,
        pendingCount: 5,
        expiredCount: 0,
        invalidatedCount: 0,
        totalEntries: 50,
        oldestEntryTimestamp: 1_700_000_000_000,
        newestEntryTimestamp: 1_710_000_000_000,
      },
      advisoryOnly: true,
      humanReviewRequired: true,
      noActionRecommended: true,
    }
    expect(result.brierScore).toBe(0.18)
    expect(result.expectedCalibrationError).toBe(0.05)
    expect(result.calibrationCurve).toHaveLength(1)
    expect(result.overconfidenceDetected).toBe(false)
    expect(result.underconfidenceDetected).toBe(false)
    expect(result.recommendedAdjustment).toBe(1.0)
    expect(result.totalForecasts).toBe(50)
    expect(result.resolvedForecasts).toBe(45)
    expect(result.pendingForecasts).toBe(5)
    expect(result.minimumCountMet).toBe(true)
  })

  it('safety flags are literal true', () => {
    const result = {
      brierScore: 0,
      expectedCalibrationError: 0,
      calibrationCurve: [],
      overconfidenceDetected: false,
      underconfidenceDetected: false,
      recommendedAdjustment: 1.0,
      totalForecasts: 0,
      resolvedForecasts: 0,
      pendingForecasts: 0,
      minimumCountMet: false,
      confidenceAdjustment: {
        adjustmentFactor: 1.0,
        direction: 'none' as const,
        magnitude: 0,
        basedOnCount: 0,
        rationale: 'No data',
      },
      warnings: [],
      auditMetadata: {
        ledgerVersion: '1.0.0',
        computedAt: Date.now(),
        resolvedCount: 0,
        pendingCount: 0,
        expiredCount: 0,
        invalidatedCount: 0,
        totalEntries: 0,
        oldestEntryTimestamp: 0,
        newestEntryTimestamp: 0,
      },
      advisoryOnly: true as const,
      humanReviewRequired: true as const,
      noActionRecommended: true as const,
    } satisfies CalibrationLedgerResult
    expect(result.advisoryOnly).toBe(true)
    expect(result.humanReviewRequired).toBe(true)
    expect(result.noActionRecommended).toBe(true)
  })

  it('includes confidenceAdjustment in result', () => {
    const result: CalibrationLedgerResult = {
      brierScore: 0.25,
      expectedCalibrationError: 0.12,
      calibrationCurve: [],
      overconfidenceDetected: true,
      underconfidenceDetected: false,
      recommendedAdjustment: 0.85,
      totalForecasts: 60,
      resolvedForecasts: 50,
      pendingForecasts: 10,
      minimumCountMet: true,
      confidenceAdjustment: {
        adjustmentFactor: 0.85,
        direction: 'decrease',
        magnitude: 0.15,
        basedOnCount: 50,
        rationale: 'Systematic overconfidence detected',
      },
      warnings: [
        {
          code: CALIBRATION_LEDGER_WARNING_CODES.OVERCONFIDENT,
          message: 'Predicted probabilities exceed observed frequencies',
          severity: CALIBRATION_LEDGER_WARNING_SEVERITIES.warn,
          source: 'calibration-ledger',
        },
      ],
      auditMetadata: {
        ledgerVersion: '1.0.0',
        computedAt: Date.now(),
        resolvedCount: 50,
        pendingCount: 10,
        expiredCount: 0,
        invalidatedCount: 0,
        totalEntries: 60,
        oldestEntryTimestamp: 1_700_000_000_000,
        newestEntryTimestamp: 1_710_000_000_000,
      },
      advisoryOnly: true,
      humanReviewRequired: true,
      noActionRecommended: true,
    }
    expect(result.confidenceAdjustment.adjustmentFactor).toBe(0.85)
    expect(result.confidenceAdjustment.direction).toBe('decrease')
  })
})

// ---------------------------------------------------------------------------
// 14. Calibration curve bucket structure
// ---------------------------------------------------------------------------
describe('calibration curve bucket in CalibrationLedgerResult', () => {
  it('bucket has binLower, binUpper, meanPredictedProbability, observedFrequency, count', () => {
    const result: CalibrationLedgerResult = {
      brierScore: 0.15,
      expectedCalibrationError: 0.04,
      calibrationCurve: [
        {
          binLower: 0.0,
          binUpper: 0.1,
          meanPredictedProbability: 0.05,
          observedFrequency: 0.06,
          count: 10,
        },
        {
          binLower: 0.1,
          binUpper: 0.2,
          meanPredictedProbability: 0.15,
          observedFrequency: 0.14,
          count: 8,
        },
      ],
      overconfidenceDetected: false,
      underconfidenceDetected: false,
      recommendedAdjustment: 1.0,
      totalForecasts: 18,
      resolvedForecasts: 18,
      pendingForecasts: 0,
      minimumCountMet: false,
      confidenceAdjustment: {
        adjustmentFactor: 1.0,
        direction: 'none',
        magnitude: 0,
        basedOnCount: 18,
        rationale: 'Well-calibrated',
      },
      warnings: [],
      auditMetadata: {
        ledgerVersion: '1.0.0',
        computedAt: Date.now(),
        resolvedCount: 18,
        pendingCount: 0,
        expiredCount: 0,
        invalidatedCount: 0,
        totalEntries: 18,
        oldestEntryTimestamp: 1_700_000_000_000,
        newestEntryTimestamp: 1_710_000_000_000,
      },
      advisoryOnly: true,
      humanReviewRequired: true,
      noActionRecommended: true,
    }
    const bucket = result.calibrationCurve[0]
    expect(typeof bucket.binLower).toBe('number')
    expect(typeof bucket.binUpper).toBe('number')
    expect(typeof bucket.meanPredictedProbability).toBe('number')
    expect(typeof bucket.observedFrequency).toBe('number')
    expect(typeof bucket.count).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// 15. No implementation functions exported
// ---------------------------------------------------------------------------
describe('scope boundary checks', () => {
  const sourceFilePath = 'lib/oracle/predictability/calibration-ledger-types.ts'

  it('does not export any implementation functions', () => {
    const exportedKeys = Object.keys(calibrationModule)
    const functions = exportedKeys.filter(
      (key) => typeof (calibrationModule as Record<string, unknown>)[key] === 'function'
    )
    expect(functions).toHaveLength(0)
  })

  it('does not import from forbidden modules', async () => {
    const fs = await import('fs')
    const source = fs.readFileSync(sourceFilePath, 'utf-8')

    const forbidden = [
      'cycle-analysis',
      'cycle-phase',
      'trend-baseline-comparison',
      'bayesian-updater',
      'monte-carlo-scenarios',
      'markov-regime-transitions',
      'trend-baseline-types',
      'cycle-phase-types',
      'bayesian-updater-types',
      'monte-carlo-scenario-types',
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
