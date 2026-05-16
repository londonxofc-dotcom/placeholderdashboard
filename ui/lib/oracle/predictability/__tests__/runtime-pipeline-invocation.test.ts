/**
 * runtime-pipeline-invocation.test.ts
 *
 * RI-5: Tests for the thin runtime pipeline invocation boundary.
 *
 * Mocks only the locked RI-3 runtime pipeline function to prove that
 * missing input fails before runtime execution.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invokePredictabilityRuntimePipeline } from '../runtime-pipeline-invocation'
import { RUNTIME_PIPELINE_RESULT_STATUSES } from '../runtime-pipeline-types'
import type { RuntimePipelineInput } from '../runtime-pipeline-types'

vi.mock('../runtime-pipeline', () => ({
  runPredictabilityRuntimePipeline: vi.fn(),
}))

import { runPredictabilityRuntimePipeline } from '../runtime-pipeline'

const validInput: RuntimePipelineInput = {
  objective: 'assess RI-5 invocation boundary',
  targetDate: '2026-09-01',
  domain: 'music-release',
  horizon: 'medium',
  trendWindows: [
    {
      id: 'ri5-trend-1',
      label: 'Q2 engagement trend',
      start: '2026-04-01',
      end: '2026-06-30',
      signalType: 'engagement',
      value: 0.72,
      confidence: 0.85,
    },
  ],
  behavioralPatterns: [
    {
      id: 'ri5-pattern-1',
      triggerCondition: 'release milestone reached',
      repeatedBehavior: 'engagement lift',
      observedCount: 5,
      confidence: 0.78,
    },
  ],
  cycleWindows: [
    {
      period: 90,
      confidence: 0.82,
      lastObserved: '2026-03-15',
    },
  ],
}

const successResult = {
  status: 'success',
  forecast: {
    scenario: 'baseline',
    forecastBand: { low: 0.6, mid: 0.72, high: 0.84 },
    score: 0.72,
    confidence: 0.85,
    trendDeltas: [],
    activeRegime: 'growth',
    supportingEvidence: [],
    opposingEvidence: [],
    behavioralSignals: [],
    assumptions: ['Fixture assumptions remain stable'],
    warnings: [],
    recommendedNextMove: 'Proceed with human review',
  },
  auditEntry: {
    persistenceState: 'persisted_by_future_gate',
  },
} as const

function makeCandidate(overrides: Partial<RuntimePipelineInput> = {}): RuntimePipelineInput {
  return {
    ...validInput,
    trendWindows: [...validInput.trendWindows],
    behavioralPatterns: [...validInput.behavioralPatterns],
    cycleWindows: [...validInput.cycleWindows],
    ...overrides,
  }
}

function expectBridgeFailedWithoutInvocation(candidate: unknown, fieldName: string) {
  const result = invokePredictabilityRuntimePipeline(candidate)

  expect(result.status).toBe('bridge_failed')
  if (result.status === 'bridge_failed') {
    expect(result.bridgeError).toContain(fieldName)
  }
  expect(result.forecast).toBeNull()
  expect(result.auditEntry).toBeNull()
  expect(runPredictabilityRuntimePipeline).not.toHaveBeenCalled()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(runPredictabilityRuntimePipeline).mockReturnValue(successResult as never)
})

describe('invokePredictabilityRuntimePipeline — valid input', () => {
  it('returns success for a complete candidate input', () => {
    const result = invokePredictabilityRuntimePipeline(makeCandidate())

    expect(result.status).toBe('success')
  })

  it('calls the locked RI-3 runtime pipeline for complete input', () => {
    const candidate = makeCandidate()
    invokePredictabilityRuntimePipeline(candidate)

    expect(runPredictabilityRuntimePipeline).toHaveBeenCalledTimes(1)
    expect(runPredictabilityRuntimePipeline).toHaveBeenCalledWith(candidate)
  })
})

describe('invokePredictabilityRuntimePipeline — missing scalar input', () => {
  it('returns bridge_failed when objective is missing', () => {
    const { objective: _objective, ...candidate } = makeCandidate()
    expectBridgeFailedWithoutInvocation(candidate, 'objective')
  })

  it('returns bridge_failed when targetDate is missing', () => {
    const { targetDate: _targetDate, ...candidate } = makeCandidate()
    expectBridgeFailedWithoutInvocation(candidate, 'targetDate')
  })

  it('returns bridge_failed when domain is missing', () => {
    const { domain: _domain, ...candidate } = makeCandidate()
    expectBridgeFailedWithoutInvocation(candidate, 'domain')
  })

  it('returns bridge_failed when horizon is missing', () => {
    const { horizon: _horizon, ...candidate } = makeCandidate()
    expectBridgeFailedWithoutInvocation(candidate, 'horizon')
  })
})

describe('invokePredictabilityRuntimePipeline — empty scalar input', () => {
  it('returns bridge_failed when objective is empty', () => {
    expectBridgeFailedWithoutInvocation(makeCandidate({ objective: '   ' }), 'objective')
  })

  it('returns bridge_failed when targetDate is empty', () => {
    expectBridgeFailedWithoutInvocation(makeCandidate({ targetDate: '' }), 'targetDate')
  })

  it('returns bridge_failed when domain is empty', () => {
    expectBridgeFailedWithoutInvocation(makeCandidate({ domain: '' }), 'domain')
  })
})

describe('invokePredictabilityRuntimePipeline — missing array input', () => {
  it('returns bridge_failed when trendWindows is missing', () => {
    const { trendWindows: _trendWindows, ...candidate } = makeCandidate()
    expectBridgeFailedWithoutInvocation(candidate, 'trendWindows')
  })

  it('returns bridge_failed when behavioralPatterns is missing', () => {
    const { behavioralPatterns: _behavioralPatterns, ...candidate } = makeCandidate()
    expectBridgeFailedWithoutInvocation(candidate, 'behavioralPatterns')
  })

  it('returns bridge_failed when cycleWindows is missing', () => {
    const { cycleWindows: _cycleWindows, ...candidate } = makeCandidate()
    expectBridgeFailedWithoutInvocation(candidate, 'cycleWindows')
  })
})

describe('invokePredictabilityRuntimePipeline — empty array input', () => {
  it('returns bridge_failed when trendWindows is empty', () => {
    expectBridgeFailedWithoutInvocation(makeCandidate({ trendWindows: [] }), 'trendWindows')
  })

  it('returns bridge_failed when behavioralPatterns is empty', () => {
    expectBridgeFailedWithoutInvocation(makeCandidate({ behavioralPatterns: [] }), 'behavioralPatterns')
  })

  it('returns bridge_failed when cycleWindows is empty', () => {
    expectBridgeFailedWithoutInvocation(makeCandidate({ cycleWindows: [] }), 'cycleWindows')
  })
})

describe('invokePredictabilityRuntimePipeline — fail-closed invariants', () => {
  it('returns bridge_failed for a non-object candidate without runtime invocation', () => {
    expectBridgeFailedWithoutInvocation(null, 'expected object')
  })

  it('does not introduce queued, deferred, partial, background, or persistence statuses', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toEqual([
      'success',
      'bridge_failed',
      'audit_creation_failed',
      'audit_validation_failed',
      'safety_flag_failed',
    ])
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('queued')
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('deferred')
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('partial_success')
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('background')
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('persisted')
  })
})
