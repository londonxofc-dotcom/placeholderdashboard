/**
 * model-stage-orchestration-types.ts
 *
 * Gate G-1: Type contracts for Model Stage Orchestration Boundary.
 * Defines the shape of orchestration input, bridge contracts, pipeline plans,
 * stage references, dependency edges, safety flags, forecast assembly,
 * Gate F audit compatibility, failure modes, and risk contracts.
 *
 * No imports from sealed modules (adapter-validation, adapter-integration,
 * evidence-router-bridge, forecast-audit, predictability-kernel, or any
 * model stage M-A through M-I implementation file).
 *
 * No imports from forecast-audit-types.ts or forecast-audit.ts.
 * Gate F compatibility is expressed structurally — not by import.
 *
 * No I/O. No mutation. No side effects.
 *
 * Status: Gate G-1 type contracts.
 */

// ============================================================================
// TYPE CONTRACT VERSION
// ============================================================================

export const MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION = 'gate-g-v1' as const

export type ModelStageOrchestrationContractVersion =
  typeof MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION

// ============================================================================
// MODEL STAGE IDs
// ============================================================================

export const MODEL_STAGE_IDS = [
  'M-A',
  'M-B',
  'M-C',
  'M-D',
  'M-E',
  'M-F',
  'M-G',
  'M-H',
  'M-I',
] as const

export type ModelStageId = typeof MODEL_STAGE_IDS[number]

// ============================================================================
// MODEL STAGE REFERENCE
// ============================================================================

export const MODEL_STAGE_NAMES: Record<ModelStageId, string> = {
  'M-A': 'Bayesian Updater Contracts',
  'M-B': 'Bayesian Updater Functions',
  'M-C': 'Monte Carlo Scenario Contracts',
  'M-D': 'Monte Carlo Scenario Functions',
  'M-E': 'Markov Regime Transition Contracts',
  'M-F': 'Markov Regime Transition Functions',
  'M-G': 'Trend Baseline Comparison',
  'M-H': 'Cycle Phase',
  'M-I': 'Calibration Ledger',
} as const

export interface ModelStageReference {
  readonly id: ModelStageId
  readonly name: string
  readonly pipelinePosition: number
  readonly dependsOn: readonly ModelStageId[]
}

// ============================================================================
// ADAPTER-TO-KERNEL BRIDGE STATUS
// ============================================================================

export const ADAPTER_KERNEL_BRIDGE_STATUSES = [
  'not_required',
  'pending',
  'applied',
  'failed',
  'bypassed',
  'degraded',
] as const

export type AdapterKernelBridgeStatus =
  typeof ADAPTER_KERNEL_BRIDGE_STATUSES[number]

// ============================================================================
// ADAPTER-TO-KERNEL BRIDGE CONTRACT
// ============================================================================

/**
 * Records the result of bridging adapter-local PredictabilityInput
 * to the orchestration-native format. The bridge does NOT modify either
 * source type — it creates a new object.
 *
 * `derivedFields` — fields successfully mapped from adapter-local input.
 * `supplementedFields` — fields provided via supplementary input (not in adapter).
 * `defaultedFields` — fields filled with reasonable defaults.
 * `unmappableFields` — fields that could not be derived, supplemented, or defaulted.
 */
export interface AdapterToKernelBridgeContract {
  readonly bridgeStatus: AdapterKernelBridgeStatus
  readonly bridgeVersion: string
  readonly inputTypePath: 'adapter_local' | 'kernel_native' | 'bridged'
  readonly derivedFields: readonly string[]
  readonly supplementedFields: readonly string[]
  readonly defaultedFields: readonly string[]
  readonly unmappableFields: readonly string[]
  readonly unbridgedWarning: boolean
  readonly bridgeApplied: boolean
}

// ============================================================================
// G-3.1 BRIDGE RESULT CONTRACTS
// ============================================================================

export interface LossyTransformRecord {
  readonly targetField: string
  readonly sourceField: string
  readonly transformRule: string
  readonly informationLost: string
}

export interface BridgeFieldAudit {
  readonly derivedFields: readonly string[]
  readonly supplementedFields: readonly string[]
  readonly defaultedFields: readonly string[]
  readonly unmappableFields: readonly string[]
  readonly lossyTransforms: readonly LossyTransformRecord[]
}

export interface BridgeResult {
  readonly success: boolean
  readonly kernelInput?: {
    readonly targetDate: string
    readonly domain: string
    readonly objective: string
    readonly horizon: 'short' | 'medium' | 'long'
    readonly historicalEvents: readonly {
      readonly id: string
      readonly timestamp: string
      readonly domain: string
      readonly eventType: string
      readonly description: string
      readonly impact: 'positive' | 'negative' | 'mixed' | 'unknown'
      readonly magnitude: number
      readonly affectedSignals: readonly string[]
      readonly createsRegimeShift: boolean
      readonly confidence: number
      readonly sourceTier: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
      readonly tags: readonly string[]
    }[]
    readonly trendWindows: readonly {
      readonly id: string
      readonly label: string
      readonly start: string
      readonly end: string
      readonly scale: 'micro' | 'meso' | 'macro'
      readonly signalType: string
      readonly value: number
      readonly confidence: number
      readonly sourceTier: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
    }[]
    readonly landmarkEvents: readonly {
      readonly id: string
      readonly timestamp: string
      readonly domain: string
      readonly eventType: string
      readonly description: string
      readonly impact: 'positive' | 'negative' | 'mixed' | 'unknown'
      readonly magnitude: number
      readonly affectedSignals: readonly string[]
      readonly createsRegimeShift: boolean
      readonly confidence: number
      readonly sourceTier: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
      readonly tags: readonly string[]
    }[]
    readonly behavioralPatterns: readonly {
      readonly id: string
      readonly actorScope: 'self' | 'contact' | 'organization' | 'market' | 'system'
      readonly triggerCondition: string
      readonly repeatedBehavior: string
      readonly observedCount: number
      readonly positiveOutcomes: number
      readonly negativeOutcomes: number
      readonly neutralOutcomes: number
      readonly confidence: number
      readonly sourceTier: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
      readonly tags: readonly string[]
    }[]
    readonly cycleWindows: readonly {
      readonly period: number
      readonly scale: 'micro' | 'meso' | 'macro'
      readonly confidence: number
      readonly lastObserved: string
    }[]
  }
  readonly bridgeContract: AdapterToKernelBridgeContract
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly fieldAudit: BridgeFieldAudit
}

// ============================================================================
// MODEL STAGE DEPENDENCY EDGE
// ============================================================================

/**
 * A directed edge in the model stage dependency DAG.
 * `from` must execute before `to`.
 */
export interface ModelStageDependencyEdge {
  readonly from: ModelStageId
  readonly to: ModelStageId
  readonly required: boolean
}

// ============================================================================
// PIPELINE DEPENDENCY GRAPH (canonical edges)
// ============================================================================

/**
 * The canonical dependency edges for the model stage pipeline.
 *
 * Bayesian (M-A/M-B) + Trend (M-G) → Markov (M-E/M-F)
 * Markov (M-E/M-F) + Cycle (M-H) → Monte Carlo (M-C/M-D)
 * Monte Carlo (M-C/M-D) → Calibration (M-I)
 *
 * Cycle (M-H) is independent of Bayesian, Trend, and Markov.
 * Bayesian and Trend can run in parallel.
 */
export const MODEL_STAGE_DEPENDENCY_EDGES: readonly ModelStageDependencyEdge[] = [
  { from: 'M-A', to: 'M-B', required: true },
  { from: 'M-B', to: 'M-E', required: true },
  { from: 'M-G', to: 'M-E', required: true },
  { from: 'M-E', to: 'M-F', required: true },
  { from: 'M-F', to: 'M-C', required: true },
  { from: 'M-H', to: 'M-C', required: true },
  { from: 'M-C', to: 'M-D', required: true },
  { from: 'M-D', to: 'M-I', required: true },
] as const

// ============================================================================
// ORCHESTRATION SAFETY FLAGS
// ============================================================================

/**
 * All 13 safety flags hardcoded to literal `true`.
 * The first 9 are inherited from Gate F's ForecastAuditSafetyFlags.
 * The last 4 are orchestration-specific.
 *
 * These flags are structural — they cannot be set to `false` at the type level.
 */
export interface ModelStageOrchestrationSafetyFlags {
  // Gate F inherited (9 flags)
  readonly advisoryOnly: true
  readonly humanReviewRequired: true
  readonly userAcknowledgmentRequired: true
  readonly forbidAutonomousAction: true
  readonly forbidCertaintyLanguage: true
  readonly requireAssumptions: true
  readonly requireFailureModes: true
  readonly requireProvenanceTrail: true
  readonly noActionRecommended: true
  // Orchestration-specific (4 flags)
  readonly requireDeterministicSeed: true
  readonly forbidStageSkipping: true
  readonly requireLineageCompleteness: true
  readonly failOpenToSafeState: true
}

// ============================================================================
// ORCHESTRATION INPUT
// ============================================================================

/**
 * Root input for model stage orchestration.
 * Accepts adapter-local payload + optional supplementary fields.
 * Does NOT import PredictabilityInput from either source — defines
 * the shape inline to avoid sealed module imports.
 */
export interface ModelStageOrchestrationInput {
  readonly objective: string
  readonly historicalEvents: readonly {
    readonly sourceId: string
    readonly claim: string
    readonly sourceReliability: string
    readonly originalConfidence: number
    readonly adjustedConfidence: number
    readonly observedAt: string
  }[]
  readonly excludedEvidenceIds: readonly string[]
  readonly validationWarnings: readonly string[]
  readonly hardConstraints: readonly string[]
  readonly outputConstraints: { readonly forbidAutonomousAction: boolean }
  readonly provenanceTrail: readonly string[]
  readonly shouldTriggerMCT: boolean

  // Supplementary fields (not in adapter-local, required for kernel stages)
  readonly targetDate?: string
  readonly domain?: string
  readonly horizon?: 'short' | 'medium' | 'long'
  readonly trendWindows?: readonly {
    readonly id: string
    readonly label: string
    readonly start: string
    readonly end: string
    readonly signalType: string
    readonly value: number
    readonly confidence: number
  }[]
  readonly cycleWindows?: readonly {
    readonly period: number
    readonly confidence: number
    readonly lastObserved: string
  }[]
  readonly behavioralPatterns?: readonly {
    readonly id: string
    readonly triggerCondition: string
    readonly repeatedBehavior: string
    readonly observedCount: number
    readonly confidence: number
  }[]

  // Determinism
  readonly monteCarloSeed?: number

  // Bridge metadata
  readonly bridgeContract?: AdapterToKernelBridgeContract
}

// ============================================================================
// MODEL STAGE ORCHESTRATION PLAN
// ============================================================================

/**
 * Conceptual execution plan for the pipeline.
 * Produced before execution; validated against actual execution in lineage.
 */
export interface ModelStageOrchestrationPlan {
  readonly plannedStages: readonly ModelStageReference[]
  readonly plannedEdges: readonly ModelStageDependencyEdge[]
  readonly parallelGroups: readonly (readonly ModelStageId[])[]
  readonly estimatedStageCount: number
  readonly compositionMethod: string
  readonly orchestrationGateId: string
}

// ============================================================================
// STAGE EXECUTION RECORD
// ============================================================================

export const STAGE_EXECUTION_STATUSES = [
  'not_started',
  'running',
  'completed',
  'failed',
  'skipped',
] as const

export type StageExecutionStatus = typeof STAGE_EXECUTION_STATUSES[number]

export interface StageExecutionRecord {
  readonly stageId: ModelStageId
  readonly status: StageExecutionStatus
  readonly executionOrder: number
  readonly inputHash?: string
  readonly outputHash?: string
  readonly errors: readonly string[]
  readonly assumptions: readonly string[]
  readonly failureModes: readonly string[]
}

// ============================================================================
// FORECAST ASSEMBLY CONTRACT
// ============================================================================

/**
 * Shape of the assembled forecast after all stages complete.
 * Weights are explicit and configurable — not hidden in implementation.
 */
export interface ForecastAssemblyContract {
  readonly stageWeights: Readonly<Record<string, number>>
  readonly assembledScore: number
  readonly forecastBand: string
  readonly uncertaintyStatement: string
  readonly assumptions: readonly string[]
  readonly failureModes: readonly string[]
  readonly forbiddenClaims: readonly { readonly claim: string; readonly reason: string }[]
  readonly assemblyComplete: boolean
  readonly assemblyErrors: readonly string[]
}

// ============================================================================
// GATE F AUDIT COMPATIBILITY CONTRACT
// ============================================================================

/**
 * Structural compatibility layer with Gate F's ForecastAuditEntry.
 * Does NOT import Gate F types — mirrors the required shape.
 *
 * When an orchestration result is produced, this contract ensures
 * the output can be consumed by Gate F validation functions.
 */
export interface GateFAuditCompatibilityContract {
  // Model stage lineage (fills Gate F's ForecastAuditModelStageLineage)
  readonly stagesExecuted: readonly string[]
  readonly orchestrationGateId: string
  readonly compositionMethod: string
  readonly stageCount: number
  readonly finalStageId: string

  // Kernel input lineage (fills Gate F's ForecastAuditKernelInputLineage)
  readonly inputTypePath: 'adapter_local' | 'kernel_native' | 'bridged'
  readonly bridgeApplied: boolean
  readonly bridgeVersion?: string
  readonly unbridgedWarning: boolean

  // Content requirements for consumability
  readonly hasAssumptions: boolean
  readonly hasFailureModes: boolean
  readonly hasUncertaintyStatement: boolean
  readonly hasForbiddenClaims: boolean

  // Lineage completeness
  readonly lineageComplete: boolean
  readonly lineageGaps: readonly string[]
}

// ============================================================================
// FAILURE MODE
// ============================================================================

export const ORCHESTRATION_FAILURE_SEVERITIES = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
] as const

export type OrchestrationFailureSeverity =
  typeof ORCHESTRATION_FAILURE_SEVERITIES[number]

export interface ModelStageOrchestrationFailureMode {
  readonly id: string
  readonly mode: string
  readonly severity: OrchestrationFailureSeverity
  readonly detection: string
  readonly mitigation: string
  readonly affectedStages: readonly ModelStageId[]
}

// ============================================================================
// RISK
// ============================================================================

export const ORCHESTRATION_RISK_LIKELIHOODS = [
  'low',
  'medium',
  'high',
] as const

export type OrchestrationRiskLikelihood =
  typeof ORCHESTRATION_RISK_LIKELIHOODS[number]

export const ORCHESTRATION_RISK_IMPACTS = [
  'low',
  'medium',
  'high',
] as const

export type OrchestrationRiskImpact =
  typeof ORCHESTRATION_RISK_IMPACTS[number]

export interface ModelStageOrchestrationRisk {
  readonly id: string
  readonly risk: string
  readonly likelihood: OrchestrationRiskLikelihood
  readonly impact: OrchestrationRiskImpact
  readonly mitigation: string
}

// ============================================================================
// ORCHESTRATION RESULT
// ============================================================================

/**
 * The complete output of model stage orchestration.
 * Combines stage execution records, forecast assembly, Gate F compatibility,
 * and orchestration-level metadata.
 */
export interface ModelStageOrchestrationResult {
  readonly contractVersion: ModelStageOrchestrationContractVersion
  readonly orchestrationGateId: string
  readonly compositionMethod: string
  readonly safetyFlags: ModelStageOrchestrationSafetyFlags
  readonly stageRecords: readonly StageExecutionRecord[]
  readonly forecastAssembly: ForecastAssemblyContract
  readonly gateFCompatibility: GateFAuditCompatibilityContract
  readonly failureModes: readonly ModelStageOrchestrationFailureMode[]
  readonly risks: readonly ModelStageOrchestrationRisk[]
  readonly deterministic: boolean
  readonly monteCarloSeed?: number
  readonly errors: readonly string[]
}

// ============================================================================
// EXAMPLE FIXTURES (type-safe, non-functional)
// ============================================================================

export const ORCHESTRATION_EXAMPLE_STAGE_REFERENCE: ModelStageReference = {
  id: 'M-A',
  name: 'Bayesian Updater Contracts',
  pipelinePosition: 1,
  dependsOn: [],
}

export const ORCHESTRATION_EXAMPLE_BRIDGE_CONTRACT: AdapterToKernelBridgeContract = {
  bridgeStatus: 'applied',
  bridgeVersion: 'gate-g-v1',
  inputTypePath: 'bridged',
  derivedFields: ['objective', 'historicalEvents'],
  supplementedFields: ['targetDate', 'domain', 'horizon'],
  defaultedFields: ['trendWindows'],
  unmappableFields: [],
  unbridgedWarning: false,
  bridgeApplied: true,
}

export const ORCHESTRATION_EXAMPLE_DEPENDENCY_EDGE: ModelStageDependencyEdge = {
  from: 'M-B',
  to: 'M-E',
  required: true,
}

export const ORCHESTRATION_EXAMPLE_SAFETY_FLAGS: ModelStageOrchestrationSafetyFlags = {
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

export const ORCHESTRATION_EXAMPLE_EXECUTION_RECORD: StageExecutionRecord = {
  stageId: 'M-A',
  status: 'completed',
  executionOrder: 1,
  inputHash: 'sha256:abc123',
  outputHash: 'sha256:def456',
  errors: [],
  assumptions: ['Prior belief distribution is uniform'],
  failureModes: ['If prior is wrong, posterior diverges'],
}

export const ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY: ForecastAssemblyContract = {
  stageWeights: { 'M-B': 0.25, 'M-G': 0.35, 'M-F': 0.15, 'M-H': 0.10, 'M-D': 0.15 },
  assembledScore: 0.72,
  forecastBand: 'likely',
  uncertaintyStatement: 'This forecast carries inherent uncertainty. Historical patterns may not repeat.',
  assumptions: ['Historical regime remains stable', 'Prior belief distribution is uniform'],
  failureModes: ['If regime shift occurs, Bayesian posterior is stale'],
  forbiddenClaims: [{ claim: 'This outcome is guaranteed', reason: 'Violates forbidCertaintyLanguage' }],
  assemblyComplete: true,
  assemblyErrors: [],
}

export const ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY: GateFAuditCompatibilityContract = {
  stagesExecuted: ['M-A', 'M-B', 'M-G', 'M-E', 'M-F', 'M-H', 'M-C', 'M-D', 'M-I'],
  orchestrationGateId: 'gate-g',
  compositionMethod: 'sequential-pipeline-v1',
  stageCount: 9,
  finalStageId: 'M-I',
  inputTypePath: 'bridged',
  bridgeApplied: true,
  bridgeVersion: 'gate-g-v1',
  unbridgedWarning: false,
  hasAssumptions: true,
  hasFailureModes: true,
  hasUncertaintyStatement: true,
  hasForbiddenClaims: true,
  lineageComplete: true,
  lineageGaps: [],
}

export const ORCHESTRATION_EXAMPLE_FAILURE_MODE: ModelStageOrchestrationFailureMode = {
  id: 'FM-1',
  mode: 'Type bridge produces structurally invalid kernel input',
  severity: 'CRITICAL',
  detection: 'Type-level validation at bridge output',
  mitigation: 'Bridge output validator (future Gate G implementation)',
  affectedStages: ['M-A', 'M-B'],
}

export const ORCHESTRATION_EXAMPLE_RISK: ModelStageOrchestrationRisk = {
  id: 'R-1',
  risk: 'Type bridge becomes a maintenance bottleneck',
  likelihood: 'medium',
  impact: 'high',
  mitigation: 'Bridge should be thin (field mapping only, no business logic)',
}

export const ORCHESTRATION_EXAMPLE_PLAN: ModelStageOrchestrationPlan = {
  plannedStages: [
    { id: 'M-A', name: 'Bayesian Updater Contracts', pipelinePosition: 1, dependsOn: [] },
    { id: 'M-B', name: 'Bayesian Updater Functions', pipelinePosition: 2, dependsOn: ['M-A'] },
    { id: 'M-G', name: 'Trend Baseline Comparison', pipelinePosition: 2, dependsOn: [] },
    { id: 'M-E', name: 'Markov Regime Transition Contracts', pipelinePosition: 3, dependsOn: ['M-B', 'M-G'] },
    { id: 'M-F', name: 'Markov Regime Transition Functions', pipelinePosition: 4, dependsOn: ['M-E'] },
    { id: 'M-H', name: 'Cycle Phase', pipelinePosition: 2, dependsOn: [] },
    { id: 'M-C', name: 'Monte Carlo Scenario Contracts', pipelinePosition: 5, dependsOn: ['M-F', 'M-H'] },
    { id: 'M-D', name: 'Monte Carlo Scenario Functions', pipelinePosition: 6, dependsOn: ['M-C'] },
    { id: 'M-I', name: 'Calibration Ledger', pipelinePosition: 7, dependsOn: ['M-D'] },
  ],
  plannedEdges: [...MODEL_STAGE_DEPENDENCY_EDGES],
  parallelGroups: [['M-A', 'M-G', 'M-H'], ['M-B'], ['M-E'], ['M-F'], ['M-C'], ['M-D'], ['M-I']],
  estimatedStageCount: 9,
  compositionMethod: 'sequential-pipeline-v1',
  orchestrationGateId: 'gate-g',
}

export const ORCHESTRATION_EXAMPLE_INPUT: ModelStageOrchestrationInput = {
  objective: 'Forecast trend direction for signal X',
  historicalEvents: [
    {
      sourceId: 'ev-001',
      claim: 'Signal rose 15% over 3 windows',
      sourceReliability: 'direct_observation',
      originalConfidence: 0.85,
      adjustedConfidence: 0.80,
      observedAt: '2026-05-02T00:00:00Z',
    },
  ],
  excludedEvidenceIds: [],
  validationWarnings: [],
  hardConstraints: ['No certainty claims (>99%)'],
  outputConstraints: { forbidAutonomousAction: true },
  provenanceTrail: ['adapter-integration → orchestration'],
  shouldTriggerMCT: false,
  targetDate: '2026-06-01',
  domain: 'BATMAN',
  horizon: 'medium',
  monteCarloSeed: 42,
}

export const ORCHESTRATION_EXAMPLE_RESULT: ModelStageOrchestrationResult = {
  contractVersion: 'gate-g-v1',
  orchestrationGateId: 'gate-g',
  compositionMethod: 'sequential-pipeline-v1',
  safetyFlags: ORCHESTRATION_EXAMPLE_SAFETY_FLAGS,
  stageRecords: [ORCHESTRATION_EXAMPLE_EXECUTION_RECORD],
  forecastAssembly: ORCHESTRATION_EXAMPLE_FORECAST_ASSEMBLY,
  gateFCompatibility: ORCHESTRATION_EXAMPLE_GATE_F_COMPATIBILITY,
  failureModes: [ORCHESTRATION_EXAMPLE_FAILURE_MODE],
  risks: [ORCHESTRATION_EXAMPLE_RISK],
  deterministic: true,
  monteCarloSeed: 42,
  errors: [],
}
