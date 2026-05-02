/**
 * model-stage-orchestration-types.test.ts
 *
 * Gate G-1: Type contract tests for Model Stage Orchestration Boundary.
 * Validates structural correctness of all exported types, constants,
 * enumerations, fixtures, and contract invariants.
 *
 * No imports from sealed modules.
 * No imports from forecast-audit-types.ts or forecast-audit.ts.
 * Tests type contracts only — no pure function logic.
 */

import { describe, it, expect } from 'vitest'
import {
  MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION,
  MODEL_STAGE_IDS,
  MODEL_STAGE_NAMES,
  MODEL_STAGE_DEPENDENCY_EDGES,
  ADAPTER_KERNEL_BRIDGE_STATUSES,
  STAGE_EXECUTION_STATUSES,
  ORCHESTRATION_FAILURE_SEVERITIES,
  ORCHESTRATION_RISK_LIKELIHOODS,
  ORCHESTRATION_RISK_IMPACTS,
  ORCHESTRATION_EXAMPLE_STAGE_REFERENCE,
  ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
  ORCHESTRATION_EXAMPLE_DEPENDENCY_EDGE,
  ORCHESTRATION_EXAMPLE_SAFETY_FLAGS,
  ORCHESTRATION_EXAMPLE_EXECUTION_RECORD,
  ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
  ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
  ORCHESTRATION_EXAMPLE_FAILURE_MODE,
  ORCHESTRATION_EXAMPLE_RISK,
  ORCHESTRATION_EXAMPLE_PLAN,
  ORCHESTRATION_EXAMPLE_INPUT,
  ORCHESTRATION_EXAMPLE_RESULT,
  type ModelStageId,
  type AdapterKernelBridgeStatus,
  type ModelStageOrchestrationContractVersion,
  type ModelStageReference,
  type AdapterToKernelBridgeContract,
  type BridgeFieldAudit,
  type BridgeResult,
  type LossyTransformRecord,
  type ModelStageDependencyEdge,
  type ModelStageOrchestrationSafetyFlags,
  type ModelStageOrchestrationInput,
  type ModelStageOrchestrationPlan,
  type StageExecutionRecord,
  type StageExecutionStatus,
  type ForecastAssemblyContract,
  type GateFAuditCompatibilityContract,
  type ModelStageOrchestrationFailureMode,
  type ModelStageOrchestrationRisk,
  type ModelStageOrchestrationResult,
  type OrchestrationFailureSeverity,
  type OrchestrationRiskLikelihood,
  type OrchestrationRiskImpact,
} from '../model-stage-orchestration-types'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// CONTRACT VERSION
// ============================================================================

describe('ModelStageOrchestrationContractVersion', () => {
  it('has the correct version string', () => {
    expect(MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION).toBe('gate-g-v1')
  })

  it('is a string literal type', () => {
    const version: ModelStageOrchestrationContractVersion = 'gate-g-v1'
    expect(version).toBe(MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION)
  })
})

// ============================================================================
// MODEL STAGE IDs
// ============================================================================

describe('ModelStageIds', () => {
  it('has exactly 9 stage IDs', () => {
    expect(MODEL_STAGE_IDS).toHaveLength(9)
  })

  it('contains all expected stage IDs', () => {
    const expected = ['M-A', 'M-B', 'M-C', 'M-D', 'M-E', 'M-F', 'M-G', 'M-H', 'M-I']
    expect([...MODEL_STAGE_IDS]).toEqual(expected)
  })

  it('has a name for every stage ID', () => {
    for (const id of MODEL_STAGE_IDS) {
      expect(MODEL_STAGE_NAMES[id]).toBeDefined()
      expect(typeof MODEL_STAGE_NAMES[id]).toBe('string')
      expect(MODEL_STAGE_NAMES[id].length).toBeGreaterThan(0)
    }
  })

  it('has unique names for each stage', () => {
    const names = Object.values(MODEL_STAGE_NAMES)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })
})

// ============================================================================
// ADAPTER-TO-KERNEL BRIDGE STATUS
// ============================================================================

describe('AdapterKernelBridgeStatus', () => {
  it('has exactly 6 statuses', () => {
    expect(ADAPTER_KERNEL_BRIDGE_STATUSES).toHaveLength(6)
  })

  it('contains all expected statuses', () => {
    const expected: AdapterKernelBridgeStatus[] = [
      'not_required',
      'pending',
      'applied',
      'failed',
      'bypassed',
      'degraded',
    ]
    expect([...ADAPTER_KERNEL_BRIDGE_STATUSES]).toEqual(expected)
  })
})

// ============================================================================
// STAGE EXECUTION STATUSES
// ============================================================================

describe('StageExecutionStatus', () => {
  it('has exactly 5 statuses', () => {
    expect(STAGE_EXECUTION_STATUSES).toHaveLength(5)
  })

  it('contains all expected statuses', () => {
    const expected: StageExecutionStatus[] = [
      'not_started',
      'running',
      'completed',
      'failed',
      'skipped',
    ]
    expect([...STAGE_EXECUTION_STATUSES]).toEqual(expected)
  })
})

// ============================================================================
// FAILURE SEVERITIES
// ============================================================================

describe('OrchestrationFailureSeverity', () => {
  it('has exactly 3 severities', () => {
    expect(ORCHESTRATION_FAILURE_SEVERITIES).toHaveLength(3)
  })

  it('contains CRITICAL, HIGH, MEDIUM', () => {
    const expected: OrchestrationFailureSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM']
    expect([...ORCHESTRATION_FAILURE_SEVERITIES]).toEqual(expected)
  })
})

// ============================================================================
// RISK ENUMERATIONS
// ============================================================================

describe('OrchestrationRiskEnumerations', () => {
  it('has exactly 3 likelihoods', () => {
    expect(ORCHESTRATION_RISK_LIKELIHOODS).toHaveLength(3)
  })

  it('contains low, medium, high likelihoods', () => {
    const expected: OrchestrationRiskLikelihood[] = ['low', 'medium', 'high']
    expect([...ORCHESTRATION_RISK_LIKELIHOODS]).toEqual(expected)
  })

  it('has exactly 3 impacts', () => {
    expect(ORCHESTRATION_RISK_IMPACTS).toHaveLength(3)
  })

  it('contains low, medium, high impacts', () => {
    const expected: OrchestrationRiskImpact[] = ['low', 'medium', 'high']
    expect([...ORCHESTRATION_RISK_IMPACTS]).toEqual(expected)
  })
})

// ============================================================================
// DEPENDENCY EDGES
// ============================================================================

describe('ModelStageDependencyEdges', () => {
  it('has exactly 8 edges', () => {
    expect(MODEL_STAGE_DEPENDENCY_EDGES).toHaveLength(8)
  })

  it('all edges have valid from/to stage IDs', () => {
    const validIds = new Set<string>(MODEL_STAGE_IDS)
    for (const edge of MODEL_STAGE_DEPENDENCY_EDGES) {
      expect(validIds.has(edge.from)).toBe(true)
      expect(validIds.has(edge.to)).toBe(true)
    }
  })

  it('all edges are required', () => {
    for (const edge of MODEL_STAGE_DEPENDENCY_EDGES) {
      expect(edge.required).toBe(true)
    }
  })

  it('M-A depends on nothing (root node)', () => {
    const edgesTo_MA = MODEL_STAGE_DEPENDENCY_EDGES.filter(e => e.to === 'M-A')
    expect(edgesTo_MA).toHaveLength(0)
  })

  it('M-G depends on nothing (parallel root)', () => {
    const edgesTo_MG = MODEL_STAGE_DEPENDENCY_EDGES.filter(e => e.to === 'M-G')
    expect(edgesTo_MG).toHaveLength(0)
  })

  it('M-H depends on nothing (independent root)', () => {
    const edgesTo_MH = MODEL_STAGE_DEPENDENCY_EDGES.filter(e => e.to === 'M-H')
    expect(edgesTo_MH).toHaveLength(0)
  })

  it('M-E depends on both M-B and M-G', () => {
    const edgesTo_ME = MODEL_STAGE_DEPENDENCY_EDGES.filter(e => e.to === 'M-E')
    const sources = edgesTo_ME.map(e => e.from).sort()
    expect(sources).toEqual(['M-B', 'M-G'])
  })

  it('M-I is a leaf node (nothing depends on it)', () => {
    const edgesFrom_MI = MODEL_STAGE_DEPENDENCY_EDGES.filter(e => e.from === 'M-I')
    expect(edgesFrom_MI).toHaveLength(0)
  })

  it('has no self-referencing edges', () => {
    for (const edge of MODEL_STAGE_DEPENDENCY_EDGES) {
      expect(edge.from).not.toBe(edge.to)
    }
  })
})

// ============================================================================
// SAFETY FLAGS
// ============================================================================

describe('ModelStageOrchestrationSafetyFlags', () => {
  it('has all 9 Gate F inherited flags set to true', () => {
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.advisoryOnly).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.humanReviewRequired).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.userAcknowledgmentRequired).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.forbidAutonomousAction).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.forbidCertaintyLanguage).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.requireAssumptions).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.requireFailureModes).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.requireProvenanceTrail).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.noActionRecommended).toBe(true)
  })

  it('has all 4 orchestration-specific flags set to true', () => {
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.requireDeterministicSeed).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.forbidStageSkipping).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.requireLineageCompleteness).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS.failOpenToSafeState).toBe(true)
  })

  it('has exactly 13 flags total', () => {
    const flagCount = Object.keys(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS).length
    expect(flagCount).toBe(13)
  })

  it('has no flag set to false', () => {
    const flags = ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    for (const [key, value] of Object.entries(flags)) {
      expect(value).toBe(true)
    }
  })
})

// ============================================================================
// FIXTURE: STAGE REFERENCE
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_STAGE_REFERENCE', () => {
  it('has a valid stage ID', () => {
    expect(MODEL_STAGE_IDS).toContain(ORCHESTRATION_EXAMPLE_STAGE_REFERENCE.id)
  })

  it('has a non-empty name', () => {
    expect(ORCHESTRATION_EXAMPLE_STAGE_REFERENCE.name.length).toBeGreaterThan(0)
  })

  it('has a positive pipeline position', () => {
    expect(ORCHESTRATION_EXAMPLE_STAGE_REFERENCE.pipelinePosition).toBeGreaterThan(0)
  })

  it('dependsOn is an array', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_STAGE_REFERENCE.dependsOn)).toBe(true)
  })
})

// ============================================================================
// FIXTURE: BRIDGE CONTRACT
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT', () => {
  it('has a valid bridge status', () => {
    expect(ADAPTER_KERNEL_BRIDGE_STATUSES).toContain(
      ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.bridgeStatus
    )
  })

  it('has a non-empty bridge version', () => {
    expect(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.bridgeVersion.length).toBeGreaterThan(0)
  })

  it('has a valid input type path', () => {
    expect(['adapter_local', 'kernel_native', 'bridged']).toContain(
      ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.inputTypePath
    )
  })

  it('derivedFields, supplementedFields, defaultedFields are arrays', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.derivedFields)).toBe(true)
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.supplementedFields)).toBe(true)
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.defaultedFields)).toBe(true)
  })

  it('unmappableFields is an array', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.unmappableFields)).toBe(true)
  })

  it('bridgeApplied matches inputTypePath', () => {
    if (ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.inputTypePath === 'bridged') {
      expect(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.bridgeApplied).toBe(true)
    }
  })

  it('unbridgedWarning is false when bridge is applied', () => {
    if (ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.bridgeApplied) {
      expect(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.unbridgedWarning).toBe(false)
    }
  })
})

// ============================================================================
// G-3.1 BRIDGE RESULT CONTRACTS
// ============================================================================

describe('LossyTransformRecord', () => {
  it('captures target field, source field, transform rule, and information loss', () => {
    const record: LossyTransformRecord = {
      targetField: 'historicalEvents.0.sourceTier',
      sourceField: 'historicalEvents.0.sourceReliability',
      transformRule: 'sourceReliability mapped to conservative kernel tier',
      informationLost: 'adapter source reliability label does not preserve raw source tier',
    }

    expect(record.targetField).toBe('historicalEvents.0.sourceTier')
    expect(record.sourceField).toBe('historicalEvents.0.sourceReliability')
    expect(record.transformRule.length).toBeGreaterThan(0)
    expect(record.informationLost.length).toBeGreaterThan(0)
  })
})

describe('BridgeFieldAudit', () => {
  it('tracks derived, supplemented, defaulted, unmappable, and lossy fields', () => {
    const audit: BridgeFieldAudit = {
      derivedFields: ['objective', 'historicalEvents', 'landmarkEvents'],
      supplementedFields: [
        'targetDate',
        'domain',
        'horizon',
        'trendWindows',
        'behavioralPatterns',
        'cycleWindows',
      ],
      defaultedFields: [
        'historicalEvents.0.eventType',
        'historicalEvents.0.magnitude',
        'historicalEvents.0.affectedSignals',
        'historicalEvents.0.createsRegimeShift',
        'historicalEvents.0.tags',
      ],
      unmappableFields: [],
      lossyTransforms: [
        {
          targetField: 'historicalEvents.0.sourceTier',
          sourceField: 'historicalEvents.0.sourceReliability',
          transformRule: 'sourceReliability mapped to conservative kernel tier',
          informationLost: 'adapter source reliability label does not preserve raw source tier',
        },
      ],
    }

    expect(audit.derivedFields).toHaveLength(3)
    expect(audit.supplementedFields).toHaveLength(6)
    expect(audit.defaultedFields.length).toBeGreaterThan(0)
    expect(audit.unmappableFields).toHaveLength(0)
    expect(audit.lossyTransforms).toHaveLength(1)
  })
})

describe('BridgeResult', () => {
  const fieldAudit: BridgeFieldAudit = {
    derivedFields: ['objective', 'historicalEvents', 'landmarkEvents'],
    supplementedFields: [
      'targetDate',
      'domain',
      'horizon',
      'trendWindows',
      'behavioralPatterns',
      'cycleWindows',
    ],
    defaultedFields: [
      'historicalEvents.0.eventType',
      'historicalEvents.0.magnitude',
      'historicalEvents.0.affectedSignals',
      'historicalEvents.0.createsRegimeShift',
      'historicalEvents.0.tags',
    ],
    unmappableFields: [],
    lossyTransforms: [
      {
        targetField: 'historicalEvents.0.sourceTier',
        sourceField: 'historicalEvents.0.sourceReliability',
        transformRule: 'sourceReliability mapped to conservative kernel tier',
        informationLost: 'adapter source reliability label does not preserve raw source tier',
      },
    ],
  }

  it('represents a successful bridged kernel-native output shape', () => {
    const result: BridgeResult = {
      success: true,
      kernelInput: {
        targetDate: '2026-06-01',
        domain: 'BATMAN',
        objective: 'Forecast trend direction for signal X',
        horizon: 'medium',
        historicalEvents: [
          {
            id: 'ev-001',
            timestamp: '2026-05-02T00:00:00Z',
            domain: 'BATMAN',
            eventType: 'adapter_historical_event',
            description: 'Signal rose 15% over 3 windows',
            impact: 'positive',
            magnitude: 0.8,
            affectedSignals: ['signal-x'],
            createsRegimeShift: false,
            confidence: 0.8,
            sourceTier: 'T2',
            tags: ['bridged'],
          },
        ],
        trendWindows: [
          {
            id: 'trend-001',
            label: 'Signal X 30-day trend',
            start: '2026-05-01',
            end: '2026-05-31',
            scale: 'meso',
            signalType: 'signal-x',
            value: 0.64,
            confidence: 0.72,
            sourceTier: 'T2',
          },
        ],
        landmarkEvents: [
          {
            id: 'ev-001',
            timestamp: '2026-05-02T00:00:00Z',
            domain: 'BATMAN',
            eventType: 'adapter_historical_event',
            description: 'Signal rose 15% over 3 windows',
            impact: 'positive',
            magnitude: 0.8,
            affectedSignals: ['signal-x'],
            createsRegimeShift: false,
            confidence: 0.8,
            sourceTier: 'T2',
            tags: ['bridged'],
          },
        ],
        behavioralPatterns: [
          {
            id: 'pattern-001',
            actorScope: 'organization',
            triggerCondition: 'Signal X exceeds baseline',
            repeatedBehavior: 'Response cadence increases',
            observedCount: 3,
            positiveOutcomes: 2,
            negativeOutcomes: 0,
            neutralOutcomes: 1,
            confidence: 0.7,
            sourceTier: 'T2',
            tags: ['supplemented'],
          },
        ],
        cycleWindows: [
          {
            period: 30,
            scale: 'meso',
            confidence: 0.66,
            lastObserved: '2026-05-31',
          },
        ],
      },
      bridgeContract: ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      errors: [],
      warnings: [],
      fieldAudit,
    }

    expect(result.success).toBe(true)
    expect(result.kernelInput?.historicalEvents).toHaveLength(1)
    expect(result.kernelInput?.landmarkEvents).toHaveLength(1)
    expect(result.bridgeContract.bridgeStatus).toBe('applied')
    expect(result.fieldAudit.lossyTransforms).toHaveLength(1)
  })

  it('allows failed bridge results to omit kernelInput and retain audit data', () => {
    const failedContract: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'failed',
      inputTypePath: 'adapter_local',
      supplementedFields: ['targetDate', 'domain'],
      unmappableFields: ['trendWindows'],
      unbridgedWarning: true,
      bridgeApplied: false,
    }

    const result: BridgeResult = {
      success: false,
      bridgeContract: failedContract,
      errors: ['Missing required supplemented field: trendWindows'],
      warnings: ['Bridge failed closed before kernel execution'],
      fieldAudit: {
        ...fieldAudit,
        unmappableFields: ['trendWindows'],
      },
    }

    expect(result.success).toBe(false)
    expect(result.kernelInput).toBeUndefined()
    expect(result.bridgeContract.bridgeApplied).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.fieldAudit.unmappableFields).toEqual(['trendWindows'])
  })

  it('keeps bridge contract field buckets aligned with field audit buckets', () => {
    const result: BridgeResult = {
      success: true,
      bridgeContract: ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      errors: [],
      warnings: [],
      fieldAudit: {
        derivedFields: ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.derivedFields,
        supplementedFields: ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.supplementedFields,
        defaultedFields: ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.defaultedFields,
        unmappableFields: ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT.unmappableFields,
        lossyTransforms: [],
      },
    }

    expect(result.fieldAudit.derivedFields).toEqual(result.bridgeContract.derivedFields)
    expect(result.fieldAudit.supplementedFields).toEqual(result.bridgeContract.supplementedFields)
    expect(result.fieldAudit.defaultedFields).toEqual(result.bridgeContract.defaultedFields)
    expect(result.fieldAudit.unmappableFields).toEqual(result.bridgeContract.unmappableFields)
  })
})

// ============================================================================
// FIXTURE: EXECUTION RECORD
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_EXECUTION_RECORD', () => {
  it('has a valid stage ID', () => {
    expect(MODEL_STAGE_IDS).toContain(ORCHESTRATION_EXAMPLE_EXECUTION_RECORD.stageId)
  })

  it('has a valid status', () => {
    expect(STAGE_EXECUTION_STATUSES).toContain(ORCHESTRATION_EXAMPLE_EXECUTION_RECORD.status)
  })

  it('has a positive execution order', () => {
    expect(ORCHESTRATION_EXAMPLE_EXECUTION_RECORD.executionOrder).toBeGreaterThan(0)
  })

  it('errors is an array', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_EXECUTION_RECORD.errors)).toBe(true)
  })

  it('assumptions is an array', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_EXECUTION_RECORD.assumptions)).toBe(true)
  })

  it('failureModes is an array', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_EXECUTION_RECORD.failureModes)).toBe(true)
  })
})

// ============================================================================
// FIXTURE: FORECAST ASSEMBLY
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY', () => {
  it('has explicit stage weights', () => {
    expect(Object.keys(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.stageWeights).length).toBeGreaterThan(0)
  })

  it('stage weights sum to approximately 1.0', () => {
    const sum = Object.values(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.stageWeights).reduce(
      (a, b) => a + b,
      0
    )
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.01)
  })

  it('has a score between 0 and 1', () => {
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.assembledScore).toBeGreaterThanOrEqual(0)
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.assembledScore).toBeLessThanOrEqual(1)
  })

  it('has a non-empty forecast band', () => {
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.forecastBand.length).toBeGreaterThan(0)
  })

  it('has a non-empty uncertainty statement', () => {
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.uncertaintyStatement.length).toBeGreaterThan(0)
  })

  it('has non-empty assumptions', () => {
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.assumptions.length).toBeGreaterThan(0)
  })

  it('has non-empty failure modes', () => {
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.failureModes.length).toBeGreaterThan(0)
  })

  it('has non-empty forbidden claims', () => {
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.forbiddenClaims.length).toBeGreaterThan(0)
  })

  it('forbidden claims have claim and reason fields', () => {
    for (const fc of ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.forbiddenClaims) {
      expect(fc.claim.length).toBeGreaterThan(0)
      expect(fc.reason.length).toBeGreaterThan(0)
    }
  })

  it('assemblyComplete is true when no errors', () => {
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.assemblyComplete).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY.assemblyErrors).toHaveLength(0)
  })
})

// ============================================================================
// FIXTURE: GATE F COMPATIBILITY
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY', () => {
  it('stagesExecuted contains all 9 stage IDs', () => {
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.stagesExecuted).toHaveLength(9)
  })

  it('all stagesExecuted are valid stage IDs', () => {
    const validIds = new Set<string>(MODEL_STAGE_IDS)
    for (const id of ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.stagesExecuted) {
      expect(validIds.has(id)).toBe(true)
    }
  })

  it('orchestrationGateId is gate-g', () => {
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.orchestrationGateId).toBe('gate-g')
  })

  it('compositionMethod is defined and non-empty', () => {
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.compositionMethod.length).toBeGreaterThan(0)
  })

  it('stageCount matches stagesExecuted length', () => {
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.stageCount).toBe(
      ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.stagesExecuted.length
    )
  })

  it('finalStageId is M-I', () => {
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.finalStageId).toBe('M-I')
  })

  it('has valid input type path', () => {
    expect(['adapter_local', 'kernel_native', 'bridged']).toContain(
      ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.inputTypePath
    )
  })

  it('lineageComplete is true when lineageGaps is empty', () => {
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.lineageComplete).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.lineageGaps).toHaveLength(0)
  })

  it('content flags are all true for complete orchestration', () => {
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.hasAssumptions).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.hasFailureModes).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.hasUncertaintyStatement).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY.hasForbiddenClaims).toBe(true)
  })
})

// ============================================================================
// FIXTURE: FAILURE MODE
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_FAILURE_MODE', () => {
  it('has a non-empty id', () => {
    expect(ORCHESTRATION_EXAMPLE_FAILURE_MODE.id.length).toBeGreaterThan(0)
  })

  it('has a valid severity', () => {
    expect(ORCHESTRATION_FAILURE_SEVERITIES).toContain(
      ORCHESTRATION_EXAMPLE_FAILURE_MODE.severity
    )
  })

  it('has non-empty mode, detection, mitigation', () => {
    expect(ORCHESTRATION_EXAMPLE_FAILURE_MODE.mode.length).toBeGreaterThan(0)
    expect(ORCHESTRATION_EXAMPLE_FAILURE_MODE.detection.length).toBeGreaterThan(0)
    expect(ORCHESTRATION_EXAMPLE_FAILURE_MODE.mitigation.length).toBeGreaterThan(0)
  })

  it('affectedStages contains valid stage IDs', () => {
    const validIds = new Set<string>(MODEL_STAGE_IDS)
    for (const id of ORCHESTRATION_EXAMPLE_FAILURE_MODE.affectedStages) {
      expect(validIds.has(id)).toBe(true)
    }
  })
})

// ============================================================================
// FIXTURE: RISK
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_RISK', () => {
  it('has a non-empty id', () => {
    expect(ORCHESTRATION_EXAMPLE_RISK.id.length).toBeGreaterThan(0)
  })

  it('has a valid likelihood', () => {
    expect(ORCHESTRATION_RISK_LIKELIHOODS).toContain(ORCHESTRATION_EXAMPLE_RISK.likelihood)
  })

  it('has a valid impact', () => {
    expect(ORCHESTRATION_RISK_IMPACTS).toContain(ORCHESTRATION_EXAMPLE_RISK.impact)
  })

  it('has non-empty risk and mitigation', () => {
    expect(ORCHESTRATION_EXAMPLE_RISK.risk.length).toBeGreaterThan(0)
    expect(ORCHESTRATION_EXAMPLE_RISK.mitigation.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// FIXTURE: ORCHESTRATION PLAN
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_PLAN', () => {
  it('has exactly 9 planned stages', () => {
    expect(ORCHESTRATION_EXAMPLE_PLAN.plannedStages).toHaveLength(9)
  })

  it('planned stages cover all stage IDs', () => {
    const ids = ORCHESTRATION_EXAMPLE_PLAN.plannedStages.map(s => s.id).sort()
    expect(ids).toEqual([...MODEL_STAGE_IDS].sort())
  })

  it('has planned edges matching canonical edges count', () => {
    expect(ORCHESTRATION_EXAMPLE_PLAN.plannedEdges).toHaveLength(
      MODEL_STAGE_DEPENDENCY_EDGES.length
    )
  })

  it('parallel groups contain valid stage IDs', () => {
    const validIds = new Set<string>(MODEL_STAGE_IDS)
    for (const group of ORCHESTRATION_EXAMPLE_PLAN.parallelGroups) {
      for (const id of group) {
        expect(validIds.has(id)).toBe(true)
      }
    }
  })

  it('estimatedStageCount matches stage IDs', () => {
    expect(ORCHESTRATION_EXAMPLE_PLAN.estimatedStageCount).toBe(9)
  })

  it('orchestrationGateId is gate-g', () => {
    expect(ORCHESTRATION_EXAMPLE_PLAN.orchestrationGateId).toBe('gate-g')
  })
})

// ============================================================================
// FIXTURE: ORCHESTRATION INPUT
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_INPUT', () => {
  it('has a non-empty objective', () => {
    expect(ORCHESTRATION_EXAMPLE_INPUT.objective.length).toBeGreaterThan(0)
  })

  it('has historicalEvents array', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_INPUT.historicalEvents)).toBe(true)
    expect(ORCHESTRATION_EXAMPLE_INPUT.historicalEvents.length).toBeGreaterThan(0)
  })

  it('historical events have required fields', () => {
    const event = ORCHESTRATION_EXAMPLE_INPUT.historicalEvents[0]
    expect(event.sourceId.length).toBeGreaterThan(0)
    expect(event.claim.length).toBeGreaterThan(0)
    expect(typeof event.originalConfidence).toBe('number')
    expect(typeof event.adjustedConfidence).toBe('number')
  })

  it('has outputConstraints with forbidAutonomousAction', () => {
    expect(ORCHESTRATION_EXAMPLE_INPUT.outputConstraints.forbidAutonomousAction).toBe(true)
  })

  it('has supplementary fields for kernel stages', () => {
    expect(ORCHESTRATION_EXAMPLE_INPUT.targetDate).toBeDefined()
    expect(ORCHESTRATION_EXAMPLE_INPUT.domain).toBeDefined()
    expect(ORCHESTRATION_EXAMPLE_INPUT.horizon).toBeDefined()
  })

  it('has a monteCarloSeed for determinism', () => {
    expect(typeof ORCHESTRATION_EXAMPLE_INPUT.monteCarloSeed).toBe('number')
  })
})

// ============================================================================
// FIXTURE: ORCHESTRATION RESULT
// ============================================================================

describe('ORCHESTRATION_EXAMPLE_RESULT', () => {
  it('has correct contract version', () => {
    expect(ORCHESTRATION_EXAMPLE_RESULT.contractVersion).toBe('gate-g-v1')
  })

  it('has orchestrationGateId gate-g', () => {
    expect(ORCHESTRATION_EXAMPLE_RESULT.orchestrationGateId).toBe('gate-g')
  })

  it('has non-empty compositionMethod', () => {
    expect(ORCHESTRATION_EXAMPLE_RESULT.compositionMethod.length).toBeGreaterThan(0)
  })

  it('safetyFlags has 13 flags all true', () => {
    const flags = ORCHESTRATION_EXAMPLE_RESULT.safetyFlags
    expect(Object.keys(flags)).toHaveLength(13)
    for (const value of Object.values(flags)) {
      expect(value).toBe(true)
    }
  })

  it('has stage records array', () => {
    expect(Array.isArray(ORCHESTRATION_EXAMPLE_RESULT.stageRecords)).toBe(true)
  })

  it('has forecast assembly', () => {
    expect(ORCHESTRATION_EXAMPLE_RESULT.forecastAssembly).toBeDefined()
  })

  it('has Gate F compatibility', () => {
    expect(ORCHESTRATION_EXAMPLE_RESULT.gateFCompatibility).toBeDefined()
  })

  it('deterministic flag matches seed presence', () => {
    if (ORCHESTRATION_EXAMPLE_RESULT.monteCarloSeed !== undefined) {
      expect(ORCHESTRATION_EXAMPLE_RESULT.deterministic).toBe(true)
    }
  })

  it('errors is an empty array for successful result', () => {
    expect(ORCHESTRATION_EXAMPLE_RESULT.errors).toHaveLength(0)
  })
})

// ============================================================================
// IMMUTABILITY — ARRAY/OBJECT SPREAD SAFETY
// ============================================================================

describe('fixture immutability', () => {
  it('MODEL_STAGE_IDS is a readonly tuple (as const)', () => {
    // as const provides compile-time readonly — verify the array is defined and non-empty
    expect(Array.isArray(MODEL_STAGE_IDS)).toBe(true)
    expect(MODEL_STAGE_IDS.length).toBeGreaterThan(0)
    // Spread into a new array to confirm original is unaffected
    const copy = [...MODEL_STAGE_IDS]
    copy.push('M-Z' as never)
    expect(copy.length).toBe(MODEL_STAGE_IDS.length + 1)
    expect(MODEL_STAGE_IDS).not.toContain('M-Z')
  })

  it('MODEL_STAGE_DEPENDENCY_EDGES is a readonly array (as const)', () => {
    expect(Array.isArray(MODEL_STAGE_DEPENDENCY_EDGES)).toBe(true)
    expect(MODEL_STAGE_DEPENDENCY_EDGES.length).toBeGreaterThan(0)
    const copy = [...MODEL_STAGE_DEPENDENCY_EDGES]
    copy.push({ from: 'M-A', to: 'M-I', required: false } as never)
    expect(copy.length).toBe(MODEL_STAGE_DEPENDENCY_EDGES.length + 1)
  })

  it('ADAPTER_KERNEL_BRIDGE_STATUSES is a readonly tuple (as const)', () => {
    expect(Array.isArray(ADAPTER_KERNEL_BRIDGE_STATUSES)).toBe(true)
    expect(ADAPTER_KERNEL_BRIDGE_STATUSES.length).toBeGreaterThan(0)
    const copy = [...ADAPTER_KERNEL_BRIDGE_STATUSES]
    copy.push('custom' as never)
    expect(copy.length).toBe(ADAPTER_KERNEL_BRIDGE_STATUSES.length + 1)
    expect(ADAPTER_KERNEL_BRIDGE_STATUSES).not.toContain('custom')
  })

  it('STAGE_EXECUTION_STATUSES is a readonly tuple (as const)', () => {
    expect(Array.isArray(STAGE_EXECUTION_STATUSES)).toBe(true)
    expect(STAGE_EXECUTION_STATUSES.length).toBeGreaterThan(0)
    const copy = [...STAGE_EXECUTION_STATUSES]
    copy.push('custom' as never)
    expect(copy.length).toBe(STAGE_EXECUTION_STATUSES.length + 1)
    expect(STAGE_EXECUTION_STATUSES).not.toContain('custom')
  })
})

// ============================================================================
// FORBIDDEN IMPORT DETECTION
// ============================================================================

describe('forbidden import detection', () => {
  const typesFilePath = path.resolve(
    __dirname,
    '..',
    'model-stage-orchestration-types.ts'
  )
  const sourceCode = fs.readFileSync(typesFilePath, 'utf-8')

  const forbiddenModules = [
    'evidence-router-bridge',
    'evidence-router-bridge-types',
    'adapter-validation',
    'adapter-integration',
    'forecast-audit-types',
    'forecast-audit',
    'predictability-kernel',
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
      const importPattern = new RegExp(`from\\s+['\"].*${mod}['\"]`)
      expect(sourceCode).not.toMatch(importPattern)
    })
  }

  it('does not import from shell-promoter', () => {
    expect(sourceCode).not.toContain('shell-promoter')
  })

  it('does not reference KEEP_DEFERRED', () => {
    expect(sourceCode).not.toContain('KEEP_DEFERRED')
  })
})
