/**
 * model-stage-orchestration.ts
 *
 * Gate G-2: Pipeline plan pure functions.
 *
 * 8 pure functions for constructing, validating, and evaluating
 * model stage orchestration plans. No I/O. No mutation. No side effects.
 * No Date.now(). No UUID generation. No external imports except
 * model-stage-orchestration-types.ts.
 *
 * Status: Gate G-2 pipeline plan pure functions.
 */

import {
  MODEL_STAGE_IDS,
  MODEL_STAGE_NAMES,
  MODEL_STAGE_DEPENDENCY_EDGES,
  type ModelStageId,
  type ModelStageReference,
  type ModelStageOrchestrationInput,
  type ModelStageOrchestrationPlan,
  type AdapterToKernelBridgeContract,
  type ModelStageOrchestrationSafetyFlags,
  type ForecastAssemblyContract,
  type GateFAuditCompatibilityContract,
  type ModelStageDependencyEdge,
} from './model-stage-orchestration-types'

// ============================================================================
// SHARED RESULT TYPE
// ============================================================================

interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

interface DependencyGraphResult extends ValidationResult {
  readonly topologicalOrder?: readonly string[]
}

// ============================================================================
// 1. createModelStageOrchestrationPlan
// ============================================================================

/**
 * Construct a ModelStageOrchestrationPlan from input.
 * Builds stage references, dependency edges, and parallel groups
 * from the canonical constants.
 */
export function createModelStageOrchestrationPlan(
  _input: ModelStageOrchestrationInput
): ModelStageOrchestrationPlan {
  // Build dependency map: stageId → list of stages it depends on
  const dependsOnMap: Record<string, readonly ModelStageId[]> = {}
  for (const id of MODEL_STAGE_IDS) {
    const deps = MODEL_STAGE_DEPENDENCY_EDGES
      .filter((e) => e.to === id)
      .map((e) => e.from)
    dependsOnMap[id] = deps
  }

  // Compute pipeline positions via topological sort
  const positionMap = computePositions(
    [...MODEL_STAGE_IDS],
    [...MODEL_STAGE_DEPENDENCY_EDGES]
  )

  // Build stage references
  const plannedStages: readonly ModelStageReference[] = MODEL_STAGE_IDS.map(
    (id) => ({
      id,
      name: MODEL_STAGE_NAMES[id],
      pipelinePosition: positionMap.get(id)!,
      dependsOn: dependsOnMap[id],
    })
  )

  // Build parallel groups from positions
  const maxPosition = Math.max(...[...positionMap.values()])
  const parallelGroups: readonly (readonly ModelStageId[])[] = Array.from(
    { length: maxPosition },
    (_, i) => {
      const position = i + 1
      return MODEL_STAGE_IDS.filter((id) => positionMap.get(id) === position)
    }
  ).filter((group) => group.length > 0)

  return {
    plannedStages,
    plannedEdges: [...MODEL_STAGE_DEPENDENCY_EDGES],
    parallelGroups,
    estimatedStageCount: MODEL_STAGE_IDS.length,
    compositionMethod: 'sequential-pipeline-v1',
    orchestrationGateId: 'gate-g',
  }
}

// ============================================================================
// 2. validateModelStageOrchestrationPlan
// ============================================================================

/**
 * Validate a fixture-only plan. Returns { valid, errors }.
 */
export function validateModelStageOrchestrationPlan(
  plan: ModelStageOrchestrationPlan
): ValidationResult {
  const errors: string[] = []

  if (plan.plannedStages.length === 0) {
    errors.push('plannedStages must not be empty')
  }

  if (plan.estimatedStageCount !== plan.plannedStages.length) {
    errors.push(
      `estimatedStageCount (${plan.estimatedStageCount}) does not match plannedStages.length (${plan.plannedStages.length})`
    )
  }

  if (!plan.orchestrationGateId) {
    errors.push('orchestrationGateId must not be empty')
  }

  if (!plan.compositionMethod) {
    errors.push('compositionMethod must not be empty')
  }

  // Check for duplicate stage IDs
  const stageIds = plan.plannedStages.map((s) => s.id)
  const uniqueIds = new Set(stageIds)
  if (uniqueIds.size !== stageIds.length) {
    errors.push('plannedStages contains duplicate stage IDs')
  }

  // Check that all edge references exist in plannedStages
  for (const edge of plan.plannedEdges) {
    if (!uniqueIds.has(edge.from)) {
      errors.push(`Edge references non-existent stage: ${edge.from}`)
    }
    if (!uniqueIds.has(edge.to as ModelStageId)) {
      errors.push(`Edge references non-existent stage: ${edge.to}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// 3. validateAdapterToKernelBridgeContract
// ============================================================================

/**
 * Validate a design-only bridge contract.
 */
export function validateAdapterToKernelBridgeContract(
  bridge: AdapterToKernelBridgeContract
): ValidationResult {
  const errors: string[] = []

  if (!bridge.bridgeVersion) {
    errors.push('bridgeVersion must not be empty')
  }

  // If status is 'applied', bridgeApplied must be true
  if (bridge.bridgeStatus === 'applied' && !bridge.bridgeApplied) {
    errors.push(
      'bridgeApplied must be true when bridgeStatus is applied'
    )
  }

  // If status is 'failed' or 'degraded', unbridgedWarning must be true
  if (
    (bridge.bridgeStatus === 'failed' || bridge.bridgeStatus === 'degraded') &&
    !bridge.unbridgedWarning
  ) {
    errors.push(
      `unbridgedWarning must be true when bridgeStatus is ${bridge.bridgeStatus}`
    )
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// 4. validateModelStageDependencyGraph
// ============================================================================

/**
 * Validate DAG (no cycles). Returns topological order if valid.
 * Uses Kahn's algorithm for cycle detection and topological sort.
 */
export function validateModelStageDependencyGraph(
  stageIds: readonly string[],
  edges: readonly ModelStageDependencyEdge[]
): DependencyGraphResult {
  const errors: string[] = []
  const idSet = new Set(stageIds)

  // Validate edge references
  for (const edge of edges) {
    if (!idSet.has(edge.from)) {
      errors.push(`Edge references non-existent stage: ${edge.from}`)
    }
    if (!idSet.has(edge.to)) {
      errors.push(`Edge references non-existent stage: ${edge.to}`)
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, topologicalOrder: undefined }
  }

  // Kahn's algorithm
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const id of stageIds) {
    inDegree.set(id, 0)
    adjacency.set(id, [])
  }

  for (const edge of edges) {
    adjacency.get(edge.from)!.push(edge.to)
    inDegree.set(edge.to, inDegree.get(edge.to)! + 1)
  }

  const queue: string[] = []
  for (const id of stageIds) {
    if (inDegree.get(id) === 0) {
      queue.push(id)
    }
  }

  const topologicalOrder: string[] = []
  while (queue.length > 0) {
    const node = queue.shift()!
    topologicalOrder.push(node)
    for (const neighbor of adjacency.get(node)!) {
      const newDegree = inDegree.get(neighbor)! - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) {
        queue.push(neighbor)
      }
    }
  }

  if (topologicalOrder.length !== stageIds.length) {
    errors.push('Dependency graph contains a cycle')
    return { valid: false, errors, topologicalOrder: undefined }
  }

  return { valid: true, errors: [], topologicalOrder }
}

// ============================================================================
// 5. assertModelStageOrchestrationSafetyFlags
// ============================================================================

/**
 * Validate all 13 safety flags are literal true.
 */
export function assertModelStageOrchestrationSafetyFlags(
  flags: ModelStageOrchestrationSafetyFlags
): ValidationResult {
  const errors: string[] = []

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

  for (const name of flagNames) {
    if ((flags as Record<string, unknown>)[name] !== true) {
      errors.push(`Safety flag ${name} must be true, got ${(flags as Record<string, unknown>)[name]}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// 6. validateForecastAssemblyContract
// ============================================================================

/**
 * Validate forecast assembly: assumptions, failure modes, uncertainty,
 * provenance, forbidden claims, score range, weights.
 */
export function validateForecastAssemblyContract(
  assembly: ForecastAssemblyContract
): ValidationResult {
  const errors: string[] = []

  if (assembly.assumptions.length === 0) {
    errors.push('assumptions must not be empty')
  }

  if (assembly.failureModes.length === 0) {
    errors.push('failureModes must not be empty')
  }

  if (!assembly.uncertaintyStatement) {
    errors.push('uncertaintyStatement must not be empty')
  }

  if (assembly.forbiddenClaims.length === 0) {
    errors.push('forbiddenClaims must not be empty')
  }

  if (assembly.assembledScore < 0 || assembly.assembledScore > 1) {
    errors.push(
      `assembledScore must be between 0 and 1, got ${assembly.assembledScore}`
    )
  }

  if (!assembly.forecastBand) {
    errors.push('forecastBand must not be empty')
  }

  if (Object.keys(assembly.stageWeights).length === 0) {
    errors.push('stageWeights must not be empty')
  }

  if (!assembly.assemblyComplete && assembly.assemblyErrors.length === 0) {
    errors.push(
      'assemblyErrors must not be empty when assemblyComplete is false'
    )
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// 7. validateGateFAuditCompatibility
// ============================================================================

/**
 * Validate Gate F audit compatibility contract.
 */
export function validateGateFAuditCompatibility(
  compat: GateFAuditCompatibilityContract
): ValidationResult {
  const errors: string[] = []

  if (compat.stagesExecuted.length === 0) {
    errors.push('stagesExecuted must not be empty')
  }

  if (!compat.orchestrationGateId) {
    errors.push('orchestrationGateId must not be empty')
  }

  if (!compat.compositionMethod) {
    errors.push('compositionMethod must not be empty')
  }

  if (compat.stageCount !== compat.stagesExecuted.length) {
    errors.push(
      `stageCount (${compat.stageCount}) does not match stagesExecuted.length (${compat.stagesExecuted.length})`
    )
  }

  if (!compat.finalStageId) {
    errors.push('finalStageId must not be empty')
  }

  if (!compat.hasAssumptions) {
    errors.push('hasAssumptions must be true for Gate F compatibility')
  }

  if (!compat.hasFailureModes) {
    errors.push('hasFailureModes must be true for Gate F compatibility')
  }

  if (!compat.hasUncertaintyStatement) {
    errors.push(
      'hasUncertaintyStatement must be true for Gate F compatibility'
    )
  }

  if (!compat.hasForbiddenClaims) {
    errors.push('hasForbiddenClaims must be true for Gate F compatibility')
  }

  if (!compat.lineageComplete && compat.lineageGaps.length === 0) {
    errors.push(
      'lineageGaps must not be empty when lineageComplete is false'
    )
  }

  if (compat.bridgeApplied && !compat.bridgeVersion) {
    errors.push('bridgeVersion must be set when bridgeApplied is true')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// 8. isModelStageOrchestrationPlanExecutable
// ============================================================================

/**
 * Return boolean: plan is executable only when plan validates,
 * bridge is ready, and safety flags are all true.
 * Returns false unless all three pass.
 */
export function isModelStageOrchestrationPlanExecutable(
  plan: ModelStageOrchestrationPlan,
  bridge: AdapterToKernelBridgeContract,
  safetyFlags: ModelStageOrchestrationSafetyFlags
): boolean {
  const planResult = validateModelStageOrchestrationPlan(plan)
  if (!planResult.valid) return false

  const bridgeResult = validateAdapterToKernelBridgeContract(bridge)
  if (!bridgeResult.valid) return false

  const safetyResult = assertModelStageOrchestrationSafetyFlags(safetyFlags)
  if (!safetyResult.valid) return false

  // Bridge must be in a ready state (applied or not_required)
  if (
    bridge.bridgeStatus !== 'applied' &&
    bridge.bridgeStatus !== 'not_required'
  ) {
    return false
  }

  return true
}

// ============================================================================
// INTERNAL HELPER
// ============================================================================

/**
 * Compute pipeline positions from a DAG using topological sort.
 * Position = 1 + max position of dependencies.
 */
function computePositions(
  stageIds: readonly string[],
  edges: readonly ModelStageDependencyEdge[]
): Map<string, number> {
  // Build dependency map
  const depsMap = new Map<string, string[]>()
  for (const id of stageIds) {
    depsMap.set(id, [])
  }
  for (const edge of edges) {
    depsMap.get(edge.to)!.push(edge.from)
  }

  // Compute positions recursively with memoization
  const positions = new Map<string, number>()

  function getPosition(id: string): number {
    if (positions.has(id)) return positions.get(id)!
    const deps = depsMap.get(id)!
    if (deps.length === 0) {
      positions.set(id, 1)
      return 1
    }
    const maxDepPosition = Math.max(...deps.map(getPosition))
    const pos = maxDepPosition + 1
    positions.set(id, pos)
    return pos
  }

  for (const id of stageIds) {
    getPosition(id)
  }

  return positions
}
