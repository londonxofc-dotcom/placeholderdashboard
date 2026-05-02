/**
 * model-stage-orchestration-bridge-gate-g2.test.ts
 *
 * Gate G-3.4: Gate G-2 plan executability compatibility tests.
 *
 * Tests only. No bridge implementation changes and no runtime wiring.
 */

import { describe, it, expect } from 'vitest'
import { isModelStageOrchestrationPlanExecutable } from '../model-stage-orchestration'
import { bridgeAdapterToKernelInput } from '../model-stage-orchestration-bridge'
import {
  ORCHESTRATION_EXAMPLE_PLAN,
  ORCHESTRATION_EXAMPLE_SAFETY_FLAGS,
  type AdapterToKernelBridgeContract,
  type ModelStageOrchestrationInput,
  type ModelStageOrchestrationSafetyFlags,
} from '../model-stage-orchestration-types'

function makeInput(): ModelStageOrchestrationInput {
  return {
    objective: 'Forecast signal X trend direction',
    historicalEvents: [
      {
        sourceId: 'ev-001',
        claim: 'Signal X increased across the last three windows',
        sourceReliability: 'direct_observation',
        originalConfidence: 0.83,
        adjustedConfidence: 0.78,
        observedAt: '2026-05-02T00:00:00Z',
      },
    ],
    excludedEvidenceIds: ['blocked-001'],
    validationWarnings: ['stale evidence excluded'],
    hardConstraints: ['No certainty claims'],
    outputConstraints: { forbidAutonomousAction: true },
    provenanceTrail: ['adapter-integration -> model-stage-orchestration'],
    shouldTriggerMCT: false,
    targetDate: '2026-06-01',
    domain: 'BATMAN',
    horizon: 'medium',
    trendWindows: [
      {
        id: 'trend-001',
        label: 'Signal X 30-day trend',
        start: '2026-05-01',
        end: '2026-05-31',
        signalType: 'signal-x',
        value: 0.64,
        confidence: 0.72,
      },
    ],
    behavioralPatterns: [
      {
        id: 'pattern-001',
        triggerCondition: 'Signal X exceeds baseline',
        repeatedBehavior: 'Response cadence increases',
        observedCount: 3,
        confidence: 0.7,
      },
    ],
    cycleWindows: [
      {
        period: 30,
        confidence: 0.66,
        lastObserved: '2026-05-31',
      },
    ],
    monteCarloSeed: 42,
  }
}

function createBridgeContract(
  status: AdapterToKernelBridgeContract['bridgeStatus']
): AdapterToKernelBridgeContract {
  const result = bridgeAdapterToKernelInput(makeInput(), ORCHESTRATION_EXAMPLE_SAFETY_FLAGS)
  if (!result.success) {
    throw new Error('expected bridge fixture to produce applied bridge contract')
  }

  return {
    ...result.bridgeContract,
    bridgeStatus: status,
    bridgeApplied: status === 'applied',
    unbridgedWarning: status === 'failed' || status === 'degraded',
    inputTypePath: status === 'applied' ? 'bridged' : 'adapter_local',
  }
}

describe('Gate G-2 executability compatibility for G-3 bridge output', () => {
  it('T-18 applied bridge plus valid plan and safety flags is executable', () => {
    const bridge = createBridgeContract('applied')

    const executable = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      bridge,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )

    expect(executable).toBe(true)
  })

  it('T-19 degraded bridge plus valid plan and safety flags is not executable', () => {
    const bridge = createBridgeContract('degraded')

    const executable = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      bridge,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )

    expect(executable).toBe(false)
  })

  it('T-20 failed bridge plus valid plan and safety flags is not executable', () => {
    const bridge = createBridgeContract('failed')

    const executable = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      bridge,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )

    expect(executable).toBe(false)
  })

  it('T-21 applied bridge plus invalid safety flag is not executable', () => {
    const bridge = createBridgeContract('applied')
    const unsafeFlags = {
      ...ORCHESTRATION_EXAMPLE_SAFETY_FLAGS,
      forbidStageSkipping: false,
    } as unknown as ModelStageOrchestrationSafetyFlags

    const executable = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      bridge,
      unsafeFlags
    )

    expect(executable).toBe(false)
  })
})
