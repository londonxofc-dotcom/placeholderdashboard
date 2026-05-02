/**
 * model-stage-orchestration-bridge-gate-f.test.ts
 *
 * Gate G-3.3: Gate F audit compatibility tests for bridge output.
 *
 * Tests only. No bridge implementation changes and no runtime wiring.
 */

import { describe, it, expect } from 'vitest'
import {
  createForecastAuditEntry,
  validateForecastAuditEntry,
  validateForecastAuditLineage,
} from '../forecast-audit'
import {
  bridgeAdapterToKernelInput,
  createKernelNativeBridgeResult,
} from '../model-stage-orchestration-bridge'
import type { BridgeResult, ModelStageOrchestrationInput, ModelStageOrchestrationSafetyFlags } from '../model-stage-orchestration-types'
import type { ForecastAuditEntry } from '../forecast-audit-types'

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

function buildAuditEntryFromBridge(bridgeResult: BridgeResult): ForecastAuditEntry {
  return createForecastAuditEntry({
    auditEntryId: 'audit-g3-001',
    forecastId: 'forecast-g3-001',
    createdAt: '2026-05-02T00:00:00Z',
    evidenceLineage: [
      {
        evidenceId: 'ev-001',
        claim: 'Signal X increased across the last three windows',
        sourceTier: 'T1',
        domain: 'BATMAN',
        confidenceLabel: 'high',
        provenanceRefs: [
          {
            source: 'adapter-local-input',
            timestamp: '2026-05-02T00:00:00Z',
            verificationMethod: 'g3-bridge-fixture',
          },
        ],
        observedTimestamp: '2026-05-02T00:00:00Z',
        gateEMappingApplied: true,
      },
    ],
    adapterPacketLineage: {
      task: 'Forecast signal X trend direction',
      allowedEvidenceCount: 1,
      blockedEvidenceCount: 1,
      warningCount: 1,
      canonBoundaries: ['No certainty claims'],
      outputContractSnapshot: {
        requireProvenanceTrail: true,
        requireFailureModes: true,
        requireAssumptions: true,
        forbidCertaintyLanguage: true,
        forbidAutonomousAction: true,
      },
    },
    validationLineage: {
      validationPassed: bridgeResult.success,
      validationErrors: bridgeResult.errors,
      validatedAt: '2026-05-02T00:00:00Z',
    },
    kernelInputLineage: {
      inputTypePath: bridgeResult.bridgeContract.inputTypePath,
      bridgeApplied: bridgeResult.bridgeContract.bridgeApplied,
      unbridgedWarning: bridgeResult.bridgeContract.unbridgedWarning,
      bridgeGateId: bridgeResult.bridgeContract.bridgeVersion,
    },
    modelStageLineage: {
      stagesExecuted: [],
      orchestrationGateId: 'gate-g',
      compositionMethod: 'adapter-kernel-bridge-v1',
    },
    assumptions: [
      {
        assumption: 'Supplemented trend, behavior, and cycle context is correct.',
        ifWrongBy: 'Materially wrong supplement data can distort downstream model stages.',
        forecastFlips: true,
      },
    ],
    failureModes: [
      {
        id: 'FM-G3-1',
        mode: 'Bridge supplement data is stale or incomplete.',
        severity: 'HIGH',
        detection: 'Field audit and lineage review before runtime execution.',
        mitigation: 'Fail closed or require new supplementary context.',
      },
    ],
    uncertaintyStatement: 'Bridge output is structurally valid but remains advisory-only.',
    forbiddenClaims: [
      {
        claim: 'The bridged forecast is guaranteed.',
        reason: 'Gate F forbids certainty language.',
      },
    ],
    lineageComplete: true,
    lineageGaps: [],
  })
}

describe('Gate F compatibility for G-3 bridge output', () => {
  it('T-14 bridge-produced lineage passes validateForecastAuditLineage', () => {
    const bridgeResult = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)
    const entry = buildAuditEntryFromBridge(bridgeResult)
    const result = validateForecastAuditLineage(entry)

    expect(bridgeResult.success).toBe(true)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('T-15 bridge-produced lineage passes validateForecastAuditEntry', () => {
    const bridgeResult = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)
    const entry = buildAuditEntryFromBridge(bridgeResult)
    const result = validateForecastAuditEntry(entry)

    expect(bridgeResult.success).toBe(true)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('T-16 applied bridge status produces consistent audit lineage', () => {
    const bridgeResult = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)
    const entry = buildAuditEntryFromBridge(bridgeResult)

    expect(entry.kernelInputLineage.bridgeApplied).toBe(true)
    expect(entry.kernelInputLineage.unbridgedWarning).toBe(false)
    expect(entry.kernelInputLineage.inputTypePath).toBe('bridged')
    expect(entry.kernelInputLineage.bridgeGateId).toBe(bridgeResult.bridgeContract.bridgeVersion)
    expect(validateForecastAuditLineage(entry).valid).toBe(true)
  })

  it('T-17 not_required bridge status produces consistent audit lineage', () => {
    const bridgeResult = bridgeAdapterToKernelInput(makeInput(), SAFE_FLAGS)
    if (!bridgeResult.kernelInput) {
      throw new Error('expected bridge fixture to produce kernel input')
    }

    const passThroughResult = createKernelNativeBridgeResult(bridgeResult.kernelInput)
    const entry = buildAuditEntryFromBridge(passThroughResult)
    const result = validateForecastAuditLineage(entry)

    expect(entry.kernelInputLineage.bridgeApplied).toBe(false)
    expect(entry.kernelInputLineage.unbridgedWarning).toBe(true)
    expect(entry.kernelInputLineage.inputTypePath).toBe('kernel_native')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
