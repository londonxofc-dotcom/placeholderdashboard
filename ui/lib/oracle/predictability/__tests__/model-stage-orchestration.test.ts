/**
 * model-stage-orchestration.test.ts
 *
 * Gate G-2: Tests for pipeline plan pure functions.
 * Tests written FIRST (TDD RED phase).
 *
 * Tests only import from:
 *   - model-stage-orchestration.ts (the implementation under test)
 *   - model-stage-orchestration-types.ts (type contracts from Gate G-1)
 *
 * No imports from sealed modules.
 * No I/O. No mutation. No side effects.
 */

import {
  createModelStageOrchestrationPlan,
  validateModelStageOrchestrationPlan,
  validateAdapterToKernelBridgeContract,
  validateModelStageDependencyGraph,
  assertModelStageOrchestrationSafetyFlags,
  validateForecastAssemblyContract,
  validateGateFAuditCompatibility,
  isModelStageOrchestrationPlanExecutable,
} from '../model-stage-orchestration'

import {
  MODEL_STAGE_IDS,
  MODEL_STAGE_NAMES,
  MODEL_STAGE_DEPENDENCY_EDGES,
  ORCHESTRATION_EXAMPLE_INPUT,
  ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
  ORCHESTRATION_EXAMPLE_SAFETY_FLAGS,
  ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
  ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
  ORCHESTRATION_EXAMPLE_PLAN,
  type ModelStageOrchestrationInput,
  type ModelStageOrchestrationPlan,
  type AdapterToKernelBridgeContract,
  type ModelStageOrchestrationSafetyFlags,
  type ForecastAssemblyContract,
  type GateFAuditCompatibilityContract,
  type ModelStageDependencyEdge,
} from '../model-stage-orchestration-types'

// ============================================================================
// 1. createModelStageOrchestrationPlan
// ============================================================================

describe('createModelStageOrchestrationPlan', () => {
  it('should return a valid ModelStageOrchestrationPlan from fixture input', () => {
    const plan = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    expect(plan.plannedStages).toBeDefined()
    expect(plan.plannedEdges).toBeDefined()
    expect(plan.parallelGroups).toBeDefined()
    expect(plan.estimatedStageCount).toBe(9)
    expect(plan.compositionMethod).toBe('sequential-pipeline-v1')
    expect(plan.orchestrationGateId).toBe('gate-g')
  })

  it('should include all 9 model stages in plannedStages', () => {
    const plan = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    const stageIds = plan.plannedStages.map((s) => s.id)
    for (const id of MODEL_STAGE_IDS) {
      expect(stageIds).toContain(id)
    }
  })

  it('should assign correct names from MODEL_STAGE_NAMES', () => {
    const plan = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    for (const stage of plan.plannedStages) {
      expect(stage.name).toBe(MODEL_STAGE_NAMES[stage.id])
    }
  })

  it('should include all 8 canonical dependency edges', () => {
    const plan = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    expect(plan.plannedEdges).toHaveLength(8)
    for (const edge of MODEL_STAGE_DEPENDENCY_EDGES) {
      expect(plan.plannedEdges).toContainEqual(edge)
    }
  })

  it('should produce parallel groups where root stages are in the first group', () => {
    const plan = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    const firstGroup = plan.parallelGroups[0]
    // M-A, M-G, M-H have no dependencies (roots)
    expect(firstGroup).toContain('M-A')
    expect(firstGroup).toContain('M-G')
    expect(firstGroup).toContain('M-H')
  })

  it('should be deterministic — same input produces identical output', () => {
    const plan1 = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    const plan2 = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    expect(plan1).toEqual(plan2)
  })

  it('should not mutate the input', () => {
    const inputCopy = JSON.parse(JSON.stringify(ORCHESTRATION_EXAMPLE_INPUT))
    createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    expect(ORCHESTRATION_EXAMPLE_INPUT).toEqual(inputCopy)
  })

  it('should assign pipeline positions reflecting dependency ordering', () => {
    const plan = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    const positionMap = new Map(plan.plannedStages.map((s) => [s.id, s.pipelinePosition]))
    // M-A must come before M-B
    expect(positionMap.get('M-A')!).toBeLessThan(positionMap.get('M-B')!)
    // M-B must come before M-E
    expect(positionMap.get('M-B')!).toBeLessThan(positionMap.get('M-E')!)
    // M-D must come before M-I
    expect(positionMap.get('M-D')!).toBeLessThan(positionMap.get('M-I')!)
  })

  it('should set dependsOn correctly for each stage', () => {
    const plan = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    const stageMap = new Map(plan.plannedStages.map((s) => [s.id, s]))
    // M-A depends on nothing
    expect(stageMap.get('M-A')!.dependsOn).toEqual([])
    // M-E depends on M-B and M-G
    expect(stageMap.get('M-E')!.dependsOn).toContain('M-B')
    expect(stageMap.get('M-E')!.dependsOn).toContain('M-G')
    // M-C depends on M-F and M-H
    expect(stageMap.get('M-C')!.dependsOn).toContain('M-F')
    expect(stageMap.get('M-C')!.dependsOn).toContain('M-H')
  })
})

// ============================================================================
// 2. validateModelStageOrchestrationPlan
// ============================================================================

describe('validateModelStageOrchestrationPlan', () => {
  it('should return valid for the example plan', () => {
    const result = validateModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_PLAN)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject a plan with zero stages', () => {
    const badPlan: ModelStageOrchestrationPlan = {
      ...ORCHESTRATION_EXAMPLE_PLAN,
      plannedStages: [],
      estimatedStageCount: 0,
    }
    const result = validateModelStageOrchestrationPlan(badPlan)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject a plan where estimatedStageCount mismatches actual count', () => {
    const badPlan: ModelStageOrchestrationPlan = {
      ...ORCHESTRATION_EXAMPLE_PLAN,
      estimatedStageCount: 3,
    }
    const result = validateModelStageOrchestrationPlan(badPlan)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.stringContaining('estimatedStageCount')
    )
  })

  it('should reject a plan with empty orchestrationGateId', () => {
    const badPlan: ModelStageOrchestrationPlan = {
      ...ORCHESTRATION_EXAMPLE_PLAN,
      orchestrationGateId: '',
    }
    const result = validateModelStageOrchestrationPlan(badPlan)
    expect(result.valid).toBe(false)
  })

  it('should reject a plan with empty compositionMethod', () => {
    const badPlan: ModelStageOrchestrationPlan = {
      ...ORCHESTRATION_EXAMPLE_PLAN,
      compositionMethod: '',
    }
    const result = validateModelStageOrchestrationPlan(badPlan)
    expect(result.valid).toBe(false)
  })

  it('should reject a plan with duplicate stage IDs', () => {
    const duplicateStages = [
      ...ORCHESTRATION_EXAMPLE_PLAN.plannedStages,
      ORCHESTRATION_EXAMPLE_PLAN.plannedStages[0],
    ]
    const badPlan: ModelStageOrchestrationPlan = {
      ...ORCHESTRATION_EXAMPLE_PLAN,
      plannedStages: duplicateStages,
      estimatedStageCount: duplicateStages.length,
    }
    const result = validateModelStageOrchestrationPlan(badPlan)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.stringContaining('duplicate')
    )
  })

  it('should reject a plan with edges referencing non-existent stages', () => {
    const badPlan: ModelStageOrchestrationPlan = {
      ...ORCHESTRATION_EXAMPLE_PLAN,
      plannedEdges: [
        { from: 'M-A' as const, to: 'M-Z' as never, required: true },
      ],
    }
    const result = validateModelStageOrchestrationPlan(badPlan)
    expect(result.valid).toBe(false)
  })

  it('should be deterministic', () => {
    const r1 = validateModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_PLAN)
    const r2 = validateModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_PLAN)
    expect(r1).toEqual(r2)
  })
})

// ============================================================================
// 3. validateAdapterToKernelBridgeContract
// ============================================================================

describe('validateAdapterToKernelBridgeContract', () => {
  it('should return valid for the example bridge contract', () => {
    const result = validateAdapterToKernelBridgeContract(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject a bridge with status applied but bridgeApplied false', () => {
    const bad: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'applied',
      bridgeApplied: false,
    }
    const result = validateAdapterToKernelBridgeContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject a bridge with empty bridgeVersion', () => {
    const bad: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeVersion: '',
    }
    const result = validateAdapterToKernelBridgeContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should accept a bridge with status not_required and bridgeApplied false', () => {
    const ok: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'not_required',
      bridgeApplied: false,
      inputTypePath: 'kernel_native',
      unbridgedWarning: false,
    }
    const result = validateAdapterToKernelBridgeContract(ok)
    expect(result.valid).toBe(true)
  })

  it('should reject a bridge with status failed and no unbridgedWarning', () => {
    const bad: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'failed',
      bridgeApplied: false,
      unbridgedWarning: false,
    }
    const result = validateAdapterToKernelBridgeContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject a bridge with status degraded and no unbridgedWarning', () => {
    const bad: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'degraded',
      bridgeApplied: false,
      unbridgedWarning: false,
    }
    const result = validateAdapterToKernelBridgeContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should accept a bridge with unmappableFields when status is degraded and warning is set', () => {
    const ok: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'degraded',
      bridgeApplied: true,
      unmappableFields: ['cycleWindows'],
      unbridgedWarning: true,
    }
    const result = validateAdapterToKernelBridgeContract(ok)
    expect(result.valid).toBe(true)
  })

  it('should be deterministic', () => {
    const r1 = validateAdapterToKernelBridgeContract(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT)
    const r2 = validateAdapterToKernelBridgeContract(ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT)
    expect(r1).toEqual(r2)
  })
})

// ============================================================================
// 4. validateModelStageDependencyGraph
// ============================================================================

describe('validateModelStageDependencyGraph', () => {
  it('should return valid with topological order for canonical edges', () => {
    const stageIds = [...MODEL_STAGE_IDS]
    const result = validateModelStageDependencyGraph(
      stageIds,
      [...MODEL_STAGE_DEPENDENCY_EDGES]
    )
    expect(result.valid).toBe(true)
    expect(result.topologicalOrder).toBeDefined()
    expect(result.topologicalOrder!.length).toBe(9)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect a simple cycle (A→B→A)', () => {
    const edges: ModelStageDependencyEdge[] = [
      { from: 'M-A', to: 'M-B', required: true },
      { from: 'M-B', to: 'M-A', required: true },
    ]
    const result = validateModelStageDependencyGraph(['M-A', 'M-B'], edges)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('cycle'))
  })

  it('should detect a 3-node cycle (A→B→C→A)', () => {
    const edges: ModelStageDependencyEdge[] = [
      { from: 'M-A', to: 'M-B', required: true },
      { from: 'M-B', to: 'M-C', required: true },
      { from: 'M-C', to: 'M-A', required: true },
    ]
    const result = validateModelStageDependencyGraph(['M-A', 'M-B', 'M-C'], edges)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('cycle'))
  })

  it('should reject edges referencing stages not in the ID list', () => {
    const edges: ModelStageDependencyEdge[] = [
      { from: 'M-A', to: 'M-Z' as never, required: true },
    ]
    const result = validateModelStageDependencyGraph(['M-A'], edges)
    expect(result.valid).toBe(false)
  })

  it('should return topological order where from always appears before to', () => {
    const stageIds = [...MODEL_STAGE_IDS]
    const result = validateModelStageDependencyGraph(
      stageIds,
      [...MODEL_STAGE_DEPENDENCY_EDGES]
    )
    expect(result.valid).toBe(true)
    const order = result.topologicalOrder!
    for (const edge of MODEL_STAGE_DEPENDENCY_EDGES) {
      const fromIdx = order.indexOf(edge.from)
      const toIdx = order.indexOf(edge.to)
      expect(fromIdx).toBeLessThan(toIdx)
    }
  })

  it('should handle empty edge list (all stages are independent)', () => {
    const result = validateModelStageDependencyGraph(['M-A', 'M-B'], [])
    expect(result.valid).toBe(true)
    expect(result.topologicalOrder).toHaveLength(2)
  })

  it('should be deterministic', () => {
    const stageIds = [...MODEL_STAGE_IDS]
    const edges = [...MODEL_STAGE_DEPENDENCY_EDGES]
    const r1 = validateModelStageDependencyGraph(stageIds, edges)
    const r2 = validateModelStageDependencyGraph(stageIds, edges)
    expect(r1).toEqual(r2)
  })
})

// ============================================================================
// 5. assertModelStageOrchestrationSafetyFlags
// ============================================================================

describe('assertModelStageOrchestrationSafetyFlags', () => {
  it('should return valid for the example safety flags (all true)', () => {
    const result = assertModelStageOrchestrationSafetyFlags(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // Individual flag rejection tests — 13 flags
  const flagNames: (keyof ModelStageOrchestrationSafetyFlags)[] = [
    'advisoryOnly',
    'humanReviewRequired',
    'userAcknowledgmentRequired',
    'forbidAutonomousAction',
    'forbidCertaintyLanguage',
    'requireAssumptions',
    'requireFailureModes',
    'requireProvenanceTrail',
    'noActionRecommended',
    'requireDeterministicSeed',
    'forbidStageSkipping',
    'requireLineageCompleteness',
    'failOpenToSafeState',
  ]

  for (const flag of flagNames) {
    it(`should reject when ${flag} is false`, () => {
      const bad = { ...ORCHESTRATION_EXAMPLE_SAFETY_FLAGS, [flag]: false } as unknown as ModelStageOrchestrationSafetyFlags
      const result = assertModelStageOrchestrationSafetyFlags(bad)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(expect.stringContaining(flag))
    })
  }

  it('should reject when multiple flags are false', () => {
    const bad = {
      ...ORCHESTRATION_EXAMPLE_SAFETY_FLAGS,
      advisoryOnly: false,
      forbidStageSkipping: false,
    } as unknown as ModelStageOrchestrationSafetyFlags
    const result = assertModelStageOrchestrationSafetyFlags(bad)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('should be deterministic', () => {
    const r1 = assertModelStageOrchestrationSafetyFlags(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS)
    const r2 = assertModelStageOrchestrationSafetyFlags(ORCHESTRATION_EXAMPLE_SAFETY_FLAGS)
    expect(r1).toEqual(r2)
  })
})

// ============================================================================
// 6. validateForecastAssemblyContract
// ============================================================================

describe('validateForecastAssemblyContract', () => {
  it('should return valid for the example forecast assembly', () => {
    const result = validateForecastAssemblyContract(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject when assumptions is empty', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      assumptions: [],
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('assumptions'))
  })

  it('should reject when failureModes is empty', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      failureModes: [],
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('failureModes'))
  })

  it('should reject when uncertaintyStatement is empty', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      uncertaintyStatement: '',
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('uncertaintyStatement'))
  })

  it('should reject when forbiddenClaims is empty', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      forbiddenClaims: [],
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining('forbiddenClaims'))
  })

  it('should reject when assembledScore is below 0', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      assembledScore: -0.1,
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when assembledScore is above 1', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      assembledScore: 1.1,
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when forecastBand is empty', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      forecastBand: '',
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when stageWeights is empty', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      stageWeights: {},
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should accept when assemblyComplete is false if assemblyErrors is non-empty', () => {
    const ok: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      assemblyComplete: false,
      assemblyErrors: ['Stage M-F failed'],
    }
    const result = validateForecastAssemblyContract(ok)
    expect(result.valid).toBe(true)
  })

  it('should reject when assemblyComplete is false but assemblyErrors is empty', () => {
    const bad: ForecastAssemblyContract = {
      ...ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
      assemblyComplete: false,
      assemblyErrors: [],
    }
    const result = validateForecastAssemblyContract(bad)
    expect(result.valid).toBe(false)
  })

  it('should be deterministic', () => {
    const r1 = validateForecastAssemblyContract(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY)
    const r2 = validateForecastAssemblyContract(ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY)
    expect(r1).toEqual(r2)
  })
})

// ============================================================================
// 7. validateGateFAuditCompatibility
// ============================================================================

describe('validateGateFAuditCompatibility', () => {
  it('should return valid for the example Gate F compatibility contract', () => {
    const result = validateGateFAuditCompatibility(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject when stagesExecuted is empty', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      stagesExecuted: [],
      stageCount: 0,
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when orchestrationGateId is empty', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      orchestrationGateId: '',
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when compositionMethod is empty', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      compositionMethod: '',
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when stageCount does not match stagesExecuted.length', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      stageCount: 3,
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when hasAssumptions is false', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      hasAssumptions: false,
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when hasFailureModes is false', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      hasFailureModes: false,
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when hasUncertaintyStatement is false', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      hasUncertaintyStatement: false,
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when hasForbiddenClaims is false', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      hasForbiddenClaims: false,
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when lineageComplete is false but lineageGaps is empty', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      lineageComplete: false,
      lineageGaps: [],
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should accept when lineageComplete is false and lineageGaps is non-empty', () => {
    const ok: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      lineageComplete: false,
      lineageGaps: ['M-H stage skipped'],
    }
    const result = validateGateFAuditCompatibility(ok)
    expect(result.valid).toBe(true)
  })

  it('should reject when finalStageId is empty', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      finalStageId: '',
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should reject when bridgeApplied is true but bridgeVersion is missing', () => {
    const bad: GateFAuditCompatibilityContract = {
      ...ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
      bridgeApplied: true,
      bridgeVersion: undefined,
    }
    const result = validateGateFAuditCompatibility(bad)
    expect(result.valid).toBe(false)
  })

  it('should be deterministic', () => {
    const r1 = validateGateFAuditCompatibility(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY)
    const r2 = validateGateFAuditCompatibility(ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY)
    expect(r1).toEqual(r2)
  })
})

// ============================================================================
// 8. isModelStageOrchestrationPlanExecutable
// ============================================================================

describe('isModelStageOrchestrationPlanExecutable', () => {
  it('should return true for a fully valid plan + bridge + safety flags', () => {
    const result = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )
    expect(result).toBe(true)
  })

  it('should return false when plan validation fails (zero stages)', () => {
    const badPlan: ModelStageOrchestrationPlan = {
      ...ORCHESTRATION_EXAMPLE_PLAN,
      plannedStages: [],
      estimatedStageCount: 0,
    }
    const result = isModelStageOrchestrationPlanExecutable(
      badPlan,
      ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )
    expect(result).toBe(false)
  })

  it('should return false when bridge contract is invalid', () => {
    const badBridge: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'applied',
      bridgeApplied: false,
    }
    const result = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      badBridge,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )
    expect(result).toBe(false)
  })

  it('should return false when safety flags are invalid', () => {
    const badFlags = {
      ...ORCHESTRATION_EXAMPLE_SAFETY_FLAGS,
      advisoryOnly: false,
    } as unknown as ModelStageOrchestrationSafetyFlags
    const result = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      badFlags
    )
    expect(result).toBe(false)
  })

  it('should return false when bridge status is failed', () => {
    const failedBridge: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'failed',
      bridgeApplied: false,
      unbridgedWarning: true,
    }
    const result = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      failedBridge,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )
    expect(result).toBe(false)
  })

  it('should return false when bridge status is bypassed', () => {
    const bypassedBridge: AdapterToKernelBridgeContract = {
      ...ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      bridgeStatus: 'bypassed',
      bridgeApplied: false,
    }
    const result = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      bypassedBridge,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )
    expect(result).toBe(false)
  })

  it('should be deterministic', () => {
    const r1 = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )
    const r2 = isModelStageOrchestrationPlanExecutable(
      ORCHESTRATION_EXAMPLE_PLAN,
      ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT,
      ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
    )
    expect(r1).toEqual(r2)
  })
})

// ============================================================================
// FORBIDDEN IMPORT DETECTION
// ============================================================================

describe('forbidden import detection', () => {
  it('should not import from any sealed module', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.default.resolve(
      __dirname,
      '..',
      'model-stage-orchestration.ts'
    )
    const content = fs.default.readFileSync(filePath, 'utf-8')

    const forbiddenModules = [
      'adapter-validation',
      'adapter-integration',
      'evidence-router-bridge',
      'forecast-audit-types',
      'forecast-audit',
      'predictability-kernel',
      'bayesian-updater',
      'monte-carlo',
      'markov-regime',
      'trend-baseline',
      'cycle-phase',
      'calibration-ledger',
    ]

    for (const mod of forbiddenModules) {
      expect(content).not.toContain(`from './${mod}'`)
      expect(content).not.toContain(`from '../${mod}'`)
      expect(content).not.toContain(`from '${mod}'`)
    }
  })

  it('should only import from model-stage-orchestration-types', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.default.resolve(
      __dirname,
      '..',
      'model-stage-orchestration.ts'
    )
    const content = fs.default.readFileSync(filePath, 'utf-8')

    // Extract all `from '...'` references
    const fromMatches = content.match(/from\s+['"][^'"]+['"]/g) || []

    for (const fromClause of fromMatches) {
      expect(fromClause).toContain('model-stage-orchestration-types')
    }
  })
})

// ============================================================================
// CROSS-CUTTING: IMMUTABILITY
// ============================================================================

describe('immutability', () => {
  it('createModelStageOrchestrationPlan should return a new object each call', () => {
    const plan1 = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    const plan2 = createModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_INPUT)
    expect(plan1).toEqual(plan2)
    expect(plan1).not.toBe(plan2)
  })

  it('validation functions should return new result objects each call', () => {
    const r1 = validateModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_PLAN)
    const r2 = validateModelStageOrchestrationPlan(ORCHESTRATION_EXAMPLE_PLAN)
    expect(r1).toEqual(r2)
    expect(r1).not.toBe(r2)
  })
})
