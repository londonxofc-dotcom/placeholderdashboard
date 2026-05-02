/**
 * model-stage-orchestration-bridge.test.ts
 *
 * Gate G-3.2: Pure adapter-to-kernel bridge function tests.
 *
 * Covers the G-3.0 required unit tests T-1 through T-13 and
 * determinism tests T-22 through T-24. No runtime wiring.
 */

import { describe, it, expect } from 'vitest'
import {
  bridgeAdapterToKernelInput,
  createKernelNativeBridgeResult,
} from '../model-stage-orchestration-bridge'
import {
  MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION,
  type BridgeResult,
  type ModelStageOrchestrationInput,
  type ModelStageOrchestrationSafetyFlags,
} from '../model-stage-orchestration-types'
import * as fs from 'fs'
import * as path from 'path'

const SAFE_FLAGS: ModelStageOrchestrationSafetyFlags = {
  advisoryOnly: true,
  humanReviewRequired: true,
  userAcknowledgmentRequired: true,
  forbidAutonomousAction: true,
  forbidCertaintyLanguage: true,
  requireAssumptions: true,
  requireFailureModes: true,
  requireProvenanceTrail: true,
  noActionRecommended: true,
  requireDeterministicSeed: true,
  forbidStageSkipping: true,
  requireLineageCompleteness: true,
  failOpenToSafeState: true,
}

function makeInput(
  overrides: Partial<ModelStageOrchestrationInput> = {}
): ModelStageOrchestrationInput {
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
    ...overrides,
  }
}

function expectAppliedBridge(result: BridgeResult): asserts result is BridgeResult & {
  kernelInput: NonNullable<BridgeResult['kernelInput']>
} {
  expect(result.success).toBe(true)
  expect(result.kernelInput).toBeDefined()
  expect(result.bridgeContract.bridgeStatus).toBe('applied')
  expect(result.bridgeContract.bridgeApplied).toBe(true)
  expect(result.bridgeContract.unbridgedWarning).toBe(false)
  expect(result.errors).toHaveLength(0)
}

describe('bridgeAdapterToKernelInput', () => {
  it('T-1 bridges with all derived and supplemented fields provided', () => {
    const result = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)

    expectAppliedBridge(result)
    expect(result.kernelInput.targetDate).toBe('2026-06-01')
    expect(result.kernelInput.domain).toBe('BATMAN')
    expect(result.kernelInput.objective).toBe('Forecast signal X trend direction')
    expect(result.kernelInput.horizon).toBe('medium')
    expect(result.kernelInput.historicalEvents).toHaveLength(1)
    expect(result.kernelInput.landmarkEvents).toHaveLength(1)
    expect(result.kernelInput.trendWindows).toHaveLength(1)
    expect(result.kernelInput.behavioralPatterns).toHaveLength(1)
    expect(result.kernelInput.cycleWindows).toHaveLength(1)
    expect(result.fieldAudit.derivedFields).toEqual([
      'objective',
      'historicalEvents',
      'landmarkEvents',
    ])
    expect(result.fieldAudit.supplementedFields).toEqual([
      'targetDate',
      'domain',
      'horizon',
      'trendWindows',
      'behavioralPatterns',
      'cycleWindows',
    ])
  })

  it('T-2 fails closed when a required supplemented field is missing', () => {
    const result = bridgeAdapterToKernelInput(makeInput({ targetDate: undefined }), SAFE_FLAGS)

    expect(result.success).toBe(false)
    expect(result.kernelInput).toBeUndefined()
    expect(result.bridgeContract.bridgeStatus).toBe('failed')
    expect(result.errors).toContain('Missing required supplemented field: targetDate')
    expect(result.fieldAudit.unmappableFields).toContain('targetDate')
  })

  it('T-3 fails closed when a required array is empty', () => {
    const result = bridgeAdapterToKernelInput(makeInput({ trendWindows: [] }), SAFE_FLAGS)

    expect(result.success).toBe(false)
    expect(result.kernelInput).toBeUndefined()
    expect(result.errors).toContain('Required supplemented array trendWindows must not be empty')
    expect(result.fieldAudit.unmappableFields).toContain('trendWindows')
  })

  it('T-4 fails closed for invalid historical evidence events', () => {
    const result = bridgeAdapterToKernelInput(
      makeInput({
        historicalEvents: [
          {
            sourceId: '',
            claim: '',
            sourceReliability: '',
            originalConfidence: 0.5,
            adjustedConfidence: 0.5,
            observedAt: '',
          },
        ],
      }),
      SAFE_FLAGS
    )

    expect(result.success).toBe(false)
    expect(result.errors).toContain('historicalEvents.0.sourceId must not be empty')
    expect(result.errors).toContain('historicalEvents.0.claim must not be empty')
    expect(result.errors).toContain('historicalEvents.0.sourceReliability must not be empty')
    expect(result.errors).toContain('historicalEvents.0.observedAt must not be empty')
  })

  it('T-5 fails closed for out-of-range confidence values', () => {
    const result = bridgeAdapterToKernelInput(
      makeInput({
        historicalEvents: [
          {
            sourceId: 'ev-001',
            claim: 'Signal X moved',
            sourceReliability: 'direct_observation',
            originalConfidence: 1.2,
            adjustedConfidence: -0.1,
            observedAt: '2026-05-02T00:00:00Z',
          },
        ],
      }),
      SAFE_FLAGS
    )

    expect(result.success).toBe(false)
    expect(result.errors).toContain('historicalEvents.0.originalConfidence must be between 0 and 1')
    expect(result.errors).toContain('historicalEvents.0.adjustedConfidence must be between 0 and 1')
  })

  it('T-6 fails closed for bridge version mismatch', () => {
    const result = bridgeAdapterToKernelInput(
      makeInput({
        bridgeContract: {
          bridgeStatus: 'pending',
          bridgeVersion: 'wrong-version',
          inputTypePath: 'adapter_local',
          derivedFields: [],
          supplementedFields: [],
          defaultedFields: [],
          unmappableFields: [],
          unbridgedWarning: true,
          bridgeApplied: false,
        },
      }),
      SAFE_FLAGS
    )

    expect(result.success).toBe(false)
    expect(result.errors).toContain(
      `Bridge version mismatch: expected ${MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION}, got wrong-version`
    )
  })

  it('T-7 does not execute when a safety flag is false', () => {
    const unsafeFlags = {
      ...SAFE_FLAGS,
      forbidStageSkipping: false,
    } as unknown as ModelStageOrchestrationSafetyFlags

    const result = bridgeAdapterToKernelInput(makeInput(), unsafeFlags)

    expect(result.success).toBe(false)
    expect(result.kernelInput).toBeUndefined()
    expect(result.errors).toContain('Safety flag forbidStageSkipping must be true, got false')
    expect(result.fieldAudit.derivedFields).toHaveLength(0)
  })

  it('T-8 passes through kernel-native input when bridge is not required', () => {
    const bridged = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)
    expectAppliedBridge(bridged)

    const passThrough = createKernelNativeBridgeResult(bridged.kernelInput)

    expect(passThrough.success).toBe(true)
    expect(passThrough.kernelInput).toBe(bridged.kernelInput)
    expect(passThrough.bridgeContract.bridgeStatus).toBe('not_required')
    expect(passThrough.bridgeContract.inputTypePath).toBe('kernel_native')
    expect(passThrough.bridgeContract.bridgeApplied).toBe(false)
    expect(passThrough.bridgeContract.unbridgedWarning).toBe(true)
    expect(passThrough.fieldAudit.lossyTransforms).toHaveLength(0)
  })
})

describe('lossy transform audit', () => {
  it('T-9 records sourceReliability to sourceTier as lossy', () => {
    const result = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)

    expectAppliedBridge(result)
    expect(result.fieldAudit.lossyTransforms).toContainEqual({
      targetField: 'historicalEvents.0.sourceTier',
      sourceField: 'historicalEvents.0.sourceReliability',
      transformRule: 'sourceReliability label mapped to conservative kernel SourceTier',
      informationLost: 'adapter reliability label does not preserve full kernel source tier provenance',
    })
  })

  it('T-10 records adjustedConfidence to impact as lossy', () => {
    const result = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)

    expectAppliedBridge(result)
    expect(result.kernelInput.historicalEvents[0].impact).toBe('positive')
    expect(result.fieldAudit.lossyTransforms).toContainEqual({
      targetField: 'historicalEvents.0.impact',
      sourceField: 'historicalEvents.0.adjustedConfidence',
      transformRule: 'adjustedConfidence thresholded into kernel EventImpact',
      informationLost: 'numeric confidence becomes a coarse event impact label',
    })
  })

  it('T-11 records originalConfidence to magnitude as lossy against the sealed kernel shape', () => {
    const result = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)

    expectAppliedBridge(result)
    expect(result.kernelInput.historicalEvents[0].magnitude).toBe(0.83)
    expect(result.fieldAudit.lossyTransforms).toContainEqual({
      targetField: 'historicalEvents.0.magnitude',
      sourceField: 'historicalEvents.0.originalConfidence',
      transformRule: 'originalConfidence copied into kernel magnitude',
      informationLost: 'confidence magnitude is used as event magnitude without independent scale data',
    })
  })

  it('T-12 records conservative defaulted kernel fields', () => {
    const result = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)

    expectAppliedBridge(result)
    expect(result.fieldAudit.defaultedFields).toEqual(
      expect.arrayContaining([
        'historicalEvents.0.eventType',
        'historicalEvents.0.createsRegimeShift',
        'trendWindows.0.scale',
        'behavioralPatterns.0.actorScope',
        'cycleWindows.0.scale',
      ])
    )
  })

  it('T-13 records domain as supplemented external context', () => {
    const result = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)

    expectAppliedBridge(result)
    expect(result.kernelInput.domain).toBe('BATMAN')
    expect(result.kernelInput.historicalEvents[0].domain).toBe('BATMAN')
    expect(result.fieldAudit.supplementedFields).toContain('domain')
  })
})

describe('determinism', () => {
  it('T-22 produces byte-identical kernel output for the same input', () => {
    const input = makeInput()
    const outputs = Array.from({ length: 100 }, () =>
      JSON.stringify(bridgeAdapterToKernelInput(input, SAFE_FLAGS).kernelInput)
    )

    expect(new Set(outputs).size).toBe(1)
  })

  it('T-23 produces byte-identical bridge contracts for the same input', () => {
    const input = makeInput()
    const contracts = Array.from({ length: 100 }, () =>
      JSON.stringify(bridgeAdapterToKernelInput(input, SAFE_FLAGS).bridgeContract)
    )

    expect(new Set(contracts).size).toBe(1)
  })

  it('T-24 produces byte-identical field audits for the same input', () => {
    const input = makeInput()
    const audits = Array.from({ length: 100 }, () =>
      JSON.stringify(bridgeAdapterToKernelInput(input, SAFE_FLAGS).fieldAudit)
    )

    expect(new Set(audits).size).toBe(1)
  })
})

describe('forbidden import detection', () => {
  const bridgeFilePath = path.resolve(
    __dirname,
    '..',
    'model-stage-orchestration-bridge.ts'
  )
  const sourceCode = fs.readFileSync(bridgeFilePath, 'utf-8')

  const forbiddenModules = [
    'evidence-router-bridge',
    'evidence-router-bridge-types',
    'adapter-validation',
    'adapter-integration',
    'forecast-audit-types',
    'forecast-audit',
    'predictability-kernel',
    'types',
    'bayesian-updater',
    'bayesian-updater-types',
    'monte-carlo-scenario',
    'monte-carlo-scenarios',
    'monte-carlo-scenario-types',
    'markov-regime-transition',
    'markov-regime-transitions',
    'markov-regime-transition-types',
    'trend-baseline-comparison',
    'trend-baseline-types',
    'cycle-phase',
    'cycle-phase-types',
    'calibration-ledger',
    'calibration-ledger-types',
  ]

  for (const mod of forbiddenModules) {
    it(`does not import from ${mod}`, () => {
      const importPattern =
        mod === 'types'
          ? /from\s+['"](?:\.\/types|\.\.\/types|.*\/types)['"]/
          : new RegExp(`from\\s+['"].*${mod}['"]`)
      expect(sourceCode).not.toMatch(importPattern)
    })
  }
})
