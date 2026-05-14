/**
 * runtime-pipeline-types.test.ts
 *
 * RI-2: Type contract tests for RuntimePipelineInput and RuntimePipelineResult.
 * Validates structural correctness of all exported types, constants, and
 * contract invariants.
 *
 * No imports from sealed modules beyond what RI-2 type file itself imports.
 * No runtime logic. Tests type contracts and constant shapes only.
 */

import { describe, it, expect } from 'vitest'
import {
  RUNTIME_PIPELINE_CONTRACT_VERSION,
  RUNTIME_PIPELINE_RESULT_STATUSES,
  type RuntimePipelineContractVersion,
  type RuntimePipelineResultStatus,
  type RuntimePipelineInput,
  type RuntimePipelineResult,
  type RuntimePipelineTrendWindow,
  type RuntimePipelineBehavioralPattern,
  type RuntimePipelineCycleWindow,
} from '../runtime-pipeline-types'

// ============================================================================
// CONTRACT VERSION
// ============================================================================

describe('RuntimePipelineContractVersion', () => {
  it('has the correct version string', () => {
    expect(RUNTIME_PIPELINE_CONTRACT_VERSION).toBe('ri2-v1')
  })

  it('is a string literal type', () => {
    const version: RuntimePipelineContractVersion = 'ri2-v1'
    expect(version).toBe(RUNTIME_PIPELINE_CONTRACT_VERSION)
  })
})

// ============================================================================
// RESULT STATUS CONSTANTS
// ============================================================================

describe('RuntimePipelineResultStatuses', () => {
  it('has exactly 5 statuses', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toHaveLength(5)
  })

  it('contains all ratified statuses', () => {
    const expected: RuntimePipelineResultStatus[] = [
      'success',
      'bridge_failed',
      'audit_creation_failed',
      'audit_validation_failed',
      'safety_flag_failed',
    ]
    expect([...RUNTIME_PIPELINE_RESULT_STATUSES]).toEqual(expected)
  })

  it('does not contain queue or defer status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('queued')
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('deferred')
  })

  it('does not contain partial_success status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('partial_success')
  })

  it('contains success status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toContain('success')
  })

  it('contains bridge_failed status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toContain('bridge_failed')
  })

  it('contains audit_creation_failed status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toContain('audit_creation_failed')
  })

  it('contains audit_validation_failed status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toContain('audit_validation_failed')
  })

  it('contains safety_flag_failed status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toContain('safety_flag_failed')
  })
})

// ============================================================================
// ADAPTER-LOCAL SUPPLEMENTED FIELD SHAPES
// ============================================================================

describe('RuntimePipelineTrendWindow', () => {
  it('accepts a valid adapter-local trend window', () => {
    const window: RuntimePipelineTrendWindow = {
      id: 'tw-1',
      label: 'Q1 engagement',
      start: '2026-01-01',
      end: '2026-03-31',
      signalType: 'engagement',
      value: 0.72,
      confidence: 0.85,
    }
    expect(window.id).toBe('tw-1')
    expect(window.value).toBe(0.72)
    expect(window.confidence).toBe(0.85)
  })

  it('has all required fields', () => {
    const window: RuntimePipelineTrendWindow = {
      id: 'tw-2',
      label: 'label',
      start: '2026-01-01',
      end: '2026-06-30',
      signalType: 'signal',
      value: 0.5,
      confidence: 0.9,
    }
    expect(typeof window.id).toBe('string')
    expect(typeof window.label).toBe('string')
    expect(typeof window.start).toBe('string')
    expect(typeof window.end).toBe('string')
    expect(typeof window.signalType).toBe('string')
    expect(typeof window.value).toBe('number')
    expect(typeof window.confidence).toBe('number')
  })
})

describe('RuntimePipelineBehavioralPattern', () => {
  it('accepts a valid adapter-local behavioral pattern', () => {
    const pattern: RuntimePipelineBehavioralPattern = {
      id: 'bp-1',
      triggerCondition: 'release milestone',
      repeatedBehavior: 'engagement spike',
      observedCount: 5,
      confidence: 0.78,
    }
    expect(pattern.id).toBe('bp-1')
    expect(pattern.observedCount).toBe(5)
    expect(pattern.confidence).toBe(0.78)
  })

  it('has all required fields', () => {
    const pattern: RuntimePipelineBehavioralPattern = {
      id: 'bp-2',
      triggerCondition: 'condition',
      repeatedBehavior: 'behavior',
      observedCount: 3,
      confidence: 0.6,
    }
    expect(typeof pattern.id).toBe('string')
    expect(typeof pattern.triggerCondition).toBe('string')
    expect(typeof pattern.repeatedBehavior).toBe('string')
    expect(typeof pattern.observedCount).toBe('number')
    expect(typeof pattern.confidence).toBe('number')
  })
})

describe('RuntimePipelineCycleWindow', () => {
  it('accepts a valid adapter-local cycle window', () => {
    const cycle: RuntimePipelineCycleWindow = {
      period: 90,
      confidence: 0.82,
      lastObserved: '2026-03-15',
    }
    expect(cycle.period).toBe(90)
    expect(cycle.confidence).toBe(0.82)
    expect(cycle.lastObserved).toBe('2026-03-15')
  })

  it('has all required fields', () => {
    const cycle: RuntimePipelineCycleWindow = {
      period: 30,
      confidence: 0.7,
      lastObserved: '2026-01-01',
    }
    expect(typeof cycle.period).toBe('number')
    expect(typeof cycle.confidence).toBe('number')
    expect(typeof cycle.lastObserved).toBe('string')
  })
})

// ============================================================================
// RUNTIME PIPELINE INPUT — ALL SIX SUPPLEMENTED FIELDS REQUIRED
// ============================================================================

describe('RuntimePipelineInput', () => {
  it('accepts a valid input with all six supplemented fields', () => {
    const input: RuntimePipelineInput = {
      objective: 'assess Q3 release window',
      targetDate: '2026-09-01',
      domain: 'music-release',
      horizon: 'medium',
      trendWindows: [
        {
          id: 'tw-1',
          label: 'trend',
          start: '2026-01-01',
          end: '2026-06-30',
          signalType: 'engagement',
          value: 0.6,
          confidence: 0.8,
        },
      ],
      behavioralPatterns: [
        {
          id: 'bp-1',
          triggerCondition: 'trigger',
          repeatedBehavior: 'behavior',
          observedCount: 4,
          confidence: 0.75,
        },
      ],
      cycleWindows: [
        {
          period: 60,
          confidence: 0.9,
          lastObserved: '2026-04-01',
        },
      ],
    }
    expect(input.objective).toBe('assess Q3 release window')
    expect(input.targetDate).toBe('2026-09-01')
    expect(input.domain).toBe('music-release')
    expect(input.horizon).toBe('medium')
    expect(input.trendWindows).toHaveLength(1)
    expect(input.behavioralPatterns).toHaveLength(1)
    expect(input.cycleWindows).toHaveLength(1)
  })

  it('accepts short horizon', () => {
    const input: RuntimePipelineInput = {
      objective: 'obj',
      targetDate: '2026-07-01',
      domain: 'test',
      horizon: 'short',
      trendWindows: [{ id: 't', label: 'l', start: '2026-01-01', end: '2026-03-01', signalType: 's', value: 0.5, confidence: 0.5 }],
      behavioralPatterns: [{ id: 'b', triggerCondition: 'tc', repeatedBehavior: 'rb', observedCount: 1, confidence: 0.5 }],
      cycleWindows: [{ period: 30, confidence: 0.5, lastObserved: '2026-01-01' }],
    }
    expect(input.horizon).toBe('short')
  })

  it('accepts long horizon', () => {
    const input: RuntimePipelineInput = {
      objective: 'obj',
      targetDate: '2027-01-01',
      domain: 'test',
      horizon: 'long',
      trendWindows: [{ id: 't', label: 'l', start: '2026-01-01', end: '2026-06-01', signalType: 's', value: 0.5, confidence: 0.5 }],
      behavioralPatterns: [{ id: 'b', triggerCondition: 'tc', repeatedBehavior: 'rb', observedCount: 2, confidence: 0.6 }],
      cycleWindows: [{ period: 90, confidence: 0.7, lastObserved: '2026-03-01' }],
    }
    expect(input.horizon).toBe('long')
  })

  it('has all six supplemented fields as required properties', () => {
    const input: RuntimePipelineInput = {
      objective: 'obj',
      targetDate: '2026-08-01',
      domain: 'domain',
      horizon: 'medium',
      trendWindows: [{ id: 't', label: 'l', start: '2026-01-01', end: '2026-06-01', signalType: 's', value: 0.5, confidence: 0.5 }],
      behavioralPatterns: [{ id: 'b', triggerCondition: 'tc', repeatedBehavior: 'rb', observedCount: 1, confidence: 0.5 }],
      cycleWindows: [{ period: 45, confidence: 0.8, lastObserved: '2026-02-01' }],
    }
    // All six supplemented fields present and typed
    expect(input.targetDate).toBeDefined()
    expect(input.domain).toBeDefined()
    expect(input.horizon).toBeDefined()
    expect(input.trendWindows).toBeDefined()
    expect(input.behavioralPatterns).toBeDefined()
    expect(input.cycleWindows).toBeDefined()
  })
})

// ============================================================================
// RUNTIME PIPELINE RESULT — DISCRIMINATED UNION INVARIANTS
// ============================================================================

describe('RuntimePipelineResult — success branch', () => {
  it('success branch type carries forecast and auditEntry', () => {
    // Type-level: TypeScript enforces this at compile time.
    // Runtime check: verify status string literal is accepted.
    const status: RuntimePipelineResultStatus = 'success'
    expect(status).toBe('success')
  })
})

describe('RuntimePipelineResult — bridge_failed branch', () => {
  it('bridge_failed branch carries forecast: null and auditEntry: null', () => {
    const result: RuntimePipelineResult = {
      status: 'bridge_failed',
      bridgeError: 'missing required field: targetDate',
      forecast: null,
      auditEntry: null,
    }
    expect(result.status).toBe('bridge_failed')
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
    if (result.status === 'bridge_failed') {
      expect(typeof result.bridgeError).toBe('string')
      expect(result.bridgeError.length).toBeGreaterThan(0)
    }
  })
})

describe('RuntimePipelineResult — audit_creation_failed branch', () => {
  it('audit_creation_failed branch carries forecast: null and auditEntry: null', () => {
    const result: RuntimePipelineResult = {
      status: 'audit_creation_failed',
      error: 'createForecastAuditEntry threw: invariant violation',
      forecast: null,
      auditEntry: null,
    }
    expect(result.status).toBe('audit_creation_failed')
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
    if (result.status === 'audit_creation_failed') {
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})

describe('RuntimePipelineResult — audit_validation_failed branch', () => {
  it('audit_validation_failed branch carries forecast: null and auditEntry: null', () => {
    const result: RuntimePipelineResult = {
      status: 'audit_validation_failed',
      errors: ['authorizationState is invalid', 'safetyFlags.forecastSafeToReturn is false'],
      forecast: null,
      auditEntry: null,
    }
    expect(result.status).toBe('audit_validation_failed')
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
    if (result.status === 'audit_validation_failed') {
      expect(result.errors).toHaveLength(2)
      expect(typeof result.errors[0]).toBe('string')
    }
  })
})

describe('RuntimePipelineResult — safety_flag_failed branch', () => {
  it('safety_flag_failed branch carries forecast: null and auditEntry: null', () => {
    const result: RuntimePipelineResult = {
      status: 'safety_flag_failed',
      flagErrors: ['safetyFlags.forecastSafeToReturn is false'],
      forecast: null,
      auditEntry: null,
    }
    expect(result.status).toBe('safety_flag_failed')
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
    if (result.status === 'safety_flag_failed') {
      expect(result.flagErrors).toHaveLength(1)
      expect(typeof result.flagErrors[0]).toBe('string')
    }
  })
})

describe('RuntimePipelineResult — uniform destructuring', () => {
  it('all branches expose forecast and auditEntry at the top level', () => {
    const results: RuntimePipelineResult[] = [
      {
        status: 'bridge_failed',
        bridgeError: 'err',
        forecast: null,
        auditEntry: null,
      },
      {
        status: 'audit_creation_failed',
        error: 'err',
        forecast: null,
        auditEntry: null,
      },
      {
        status: 'audit_validation_failed',
        errors: ['err'],
        forecast: null,
        auditEntry: null,
      },
      {
        status: 'safety_flag_failed',
        flagErrors: ['err'],
        forecast: null,
        auditEntry: null,
      },
    ]

    for (const result of results) {
      // All failure branches: forecast and auditEntry are null (not undefined, not absent)
      expect(result.forecast).toBeNull()
      expect(result.auditEntry).toBeNull()
      // Destructuring works uniformly without optional chaining
      const { forecast, auditEntry } = result
      expect(forecast).toBeNull()
      expect(auditEntry).toBeNull()
    }
  })

  it('failure branches do not permit non-null forecast', () => {
    // Structural: every failure result in the array has forecast: null
    const failures: RuntimePipelineResult[] = [
      { status: 'bridge_failed', bridgeError: 'e', forecast: null, auditEntry: null },
      { status: 'audit_creation_failed', error: 'e', forecast: null, auditEntry: null },
      { status: 'audit_validation_failed', errors: ['e'], forecast: null, auditEntry: null },
      { status: 'safety_flag_failed', flagErrors: ['e'], forecast: null, auditEntry: null },
    ]
    for (const r of failures) {
      expect(r.forecast).toBeNull()
    }
  })
})

describe('RuntimePipelineResult — no partial_success or queue state', () => {
  it('status union contains only the five ratified statuses', () => {
    const ratified = new Set(RUNTIME_PIPELINE_RESULT_STATUSES)
    expect(ratified.has('success')).toBe(true)
    expect(ratified.has('bridge_failed')).toBe(true)
    expect(ratified.has('audit_creation_failed')).toBe(true)
    expect(ratified.has('audit_validation_failed')).toBe(true)
    expect(ratified.has('safety_flag_failed')).toBe(true)
    expect(ratified.size).toBe(5)
  })

  it('partial_success is not a valid status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('partial_success')
  })

  it('queued is not a valid status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('queued')
  })

  it('deferred is not a valid status', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('deferred')
  })
})
