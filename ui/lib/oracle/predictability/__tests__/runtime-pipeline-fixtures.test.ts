/**
 * runtime-pipeline-fixtures.test.ts
 *
 * RI-4: Fixture-based runtime pipeline tests against the locked RI-3 contract.
 *
 * No mocks. No live Evidence Router. No persistence. No UI/API/runtime wiring.
 */

import { describe, expect, it } from 'vitest'
import { runPredictabilityRuntimePipeline } from '../runtime-pipeline'
import {
  RUNTIME_PIPELINE_RESULT_STATUSES,
  type RuntimePipelineInput,
} from '../runtime-pipeline-types'

const validFixture: RuntimePipelineInput = {
  objective: 'assess fixture-only release readiness window',
  targetDate: '2026-09-01',
  domain: 'music-release',
  horizon: 'medium',
  trendWindows: [
    {
      id: 'fixture-trend-1',
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
      id: 'fixture-pattern-1',
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

function makeFixture(overrides: Partial<RuntimePipelineInput> = {}): RuntimePipelineInput {
  return {
    ...validFixture,
    trendWindows: [...validFixture.trendWindows],
    behavioralPatterns: [...validFixture.behavioralPatterns],
    cycleWindows: [...validFixture.cycleWindows],
    ...overrides,
  }
}

describe('RI-4 runtime pipeline fixture contract', () => {
  it('returns success for a valid full fixture', () => {
    const result = runPredictabilityRuntimePipeline(makeFixture())

    expect(result.status).toBe('success')
    expect(result.forecast).not.toBeNull()
    expect(result.auditEntry).not.toBeNull()

    if (result.status === 'success') {
      expect(result.auditEntry.persistenceState).toBe('persisted_by_future_gate')
      expect(result.forecast.scenario).toBeTruthy()
    }
  })

  it('returns bridge_failed when targetDate is missing', () => {
    const { targetDate: _targetDate, ...fixture } = makeFixture()
    const result = runPredictabilityRuntimePipeline(fixture as RuntimePipelineInput)

    expect(result.status).toBe('bridge_failed')
    if (result.status === 'bridge_failed') {
      expect(result.bridgeError).toContain('targetDate')
    }
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
  })

  it('returns bridge_failed when domain is missing', () => {
    const { domain: _domain, ...fixture } = makeFixture()
    const result = runPredictabilityRuntimePipeline(fixture as RuntimePipelineInput)

    expect(result.status).toBe('bridge_failed')
    if (result.status === 'bridge_failed') {
      expect(result.bridgeError).toContain('domain')
    }
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
  })

  it('returns bridge_failed when horizon is missing', () => {
    const { horizon: _horizon, ...fixture } = makeFixture()
    const result = runPredictabilityRuntimePipeline(fixture as RuntimePipelineInput)

    expect(result.status).toBe('bridge_failed')
    if (result.status === 'bridge_failed') {
      expect(result.bridgeError).toContain('horizon')
    }
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
  })

  it('returns bridge_failed when trendWindows is empty', () => {
    const result = runPredictabilityRuntimePipeline(makeFixture({ trendWindows: [] }))

    expect(result.status).toBe('bridge_failed')
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
  })

  it('returns bridge_failed when behavioralPatterns is empty', () => {
    const result = runPredictabilityRuntimePipeline(makeFixture({ behavioralPatterns: [] }))

    expect(result.status).toBe('bridge_failed')
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
  })

  it('returns bridge_failed when cycleWindows is empty', () => {
    const result = runPredictabilityRuntimePipeline(makeFixture({ cycleWindows: [] }))

    expect(result.status).toBe('bridge_failed')
    expect(result.forecast).toBeNull()
    expect(result.auditEntry).toBeNull()
  })

  it('defines exactly the five locked result statuses', () => {
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).toEqual([
      'success',
      'bridge_failed',
      'audit_creation_failed',
      'audit_validation_failed',
      'safety_flag_failed',
    ])
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('queued')
    expect(RUNTIME_PIPELINE_RESULT_STATUSES).not.toContain('deferred')
  })

  it('narrows the success branch to non-null forecast and auditEntry', () => {
    const result = runPredictabilityRuntimePipeline(makeFixture())

    if (result.status !== 'success') {
      throw new Error(`expected success fixture, received ${result.status}`)
    }

    expect(result.forecast.score).toEqual(expect.any(Number))
    expect(result.auditEntry.persistenceState).toBe('persisted_by_future_gate')
  })

  it('keeps forecast null on fixture-driven failure branches', () => {
    const failureResults = [
      runPredictabilityRuntimePipeline(makeFixture({ trendWindows: [] })),
      runPredictabilityRuntimePipeline(makeFixture({ behavioralPatterns: [] })),
      runPredictabilityRuntimePipeline(makeFixture({ cycleWindows: [] })),
    ]

    for (const result of failureResults) {
      const { forecast, auditEntry } = result
      expect(result.status).toBe('bridge_failed')
      expect(forecast).toBeNull()
      expect(auditEntry).toBeNull()
    }
  })
})
