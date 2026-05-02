/**
 * forecast-audit-types.ts
 *
 * Gate F: Type contracts for Forecast Authorization and Audit Boundary.
 * Defines the shape of audit entries, lineage records, authorization states,
 * persistence states, safety flags, and failure mode contracts.
 *
 * No imports from Evidence Router source code.
 * No imports from Predictability Kernel.
 * No imports from model stages M-A through M-I.
 * No imports from adapter-validation, adapter-integration, or evidence-router-bridge.
 * No I/O. No mutation. No side effects.
 *
 * Status: Gate F type contracts.
 */

// ============================================================================
// TYPE CONTRACT VERSION
// ============================================================================

export const FORECAST_AUDIT_TYPE_CONTRACT_VERSION = 'gate-f-v1' as const

export type ForecastAuditTypeContractVersion = typeof FORECAST_AUDIT_TYPE_CONTRACT_VERSION

// ============================================================================
// AUTHORIZATION STATES
// ============================================================================

export const FORECAST_AUDIT_AUTHORIZATION_STATES = [
  'not_requested',
  'pending_user_acknowledgment',
  'acknowledged',
  'rejected',
  'expired',
] as const

export type ForecastAuditAuthorizationState = typeof FORECAST_AUDIT_AUTHORIZATION_STATES[number]

// ============================================================================
// PERSISTENCE STATES
// ============================================================================

export const FORECAST_AUDIT_PERSISTENCE_STATES = [
  'not_persisted',
  'persistence_not_authorized',
  'pending_future_gate',
  'persisted_by_future_gate',
] as const

export type ForecastAuditPersistenceState = typeof FORECAST_AUDIT_PERSISTENCE_STATES[number]

// ============================================================================
// INPUT TYPE PATH
// ============================================================================

export const FORECAST_AUDIT_INPUT_TYPE_PATHS = [
  'adapter_local',
  'kernel_native',
  'bridged',
] as const

export type ForecastAuditInputTypePath = typeof FORECAST_AUDIT_INPUT_TYPE_PATHS[number]

// ============================================================================
// FAILURE MODE SEVERITY
// ============================================================================

export const FORECAST_AUDIT_FAILURE_SEVERITIES = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
] as const

export type ForecastAuditFailureSeverity = typeof FORECAST_AUDIT_FAILURE_SEVERITIES[number]

// ============================================================================
// SAFETY FLAGS
// ============================================================================

/**
 * All 9 safety flags hardcoded to `true`.
 * These flags are structural — they cannot be set to `false` at the type level.
 * A forecast audit entry with any flag set to false is invalid by contract.
 */
export interface ForecastAuditSafetyFlags {
  readonly advisoryOnly: true
  readonly humanReviewRequired: true
  readonly userAcknowledgmentRequired: true
  readonly forbidAutonomousAction: true
  readonly forbidCertaintyLanguage: true
  readonly requireAssumptions: true
  readonly requireFailureModes: true
  readonly requireProvenanceTrail: true
  readonly noActionRecommended: true
}

// ============================================================================
// EVIDENCE LINEAGE (from Evidence Router / Gate E)
// ============================================================================

export interface ForecastAuditEvidenceLineage {
  readonly evidenceId: string
  readonly claim: string
  readonly sourceTier: string
  readonly domain: string
  readonly confidenceLabel: string
  readonly provenanceRefs: readonly ForecastAuditProvenanceRef[]
  readonly observedTimestamp: string
  readonly gateEMappingApplied: boolean
}

export interface ForecastAuditProvenanceRef {
  readonly source: string
  readonly url?: string
  readonly timestamp?: string
  readonly verificationMethod?: string
}

// ============================================================================
// ADAPTER PACKET LINEAGE (from AdapterPromptContextPacket / Gate C)
// ============================================================================

export interface ForecastAuditAdapterPacketLineage {
  readonly task: string
  readonly allowedEvidenceCount: number
  readonly blockedEvidenceCount: number
  readonly warningCount: number
  readonly canonBoundaries: readonly string[]
  readonly outputContractSnapshot: {
    readonly requireProvenanceTrail: boolean
    readonly requireFailureModes: boolean
    readonly requireAssumptions: boolean
    readonly forbidCertaintyLanguage: boolean
    readonly forbidAutonomousAction: boolean
  }
}

// ============================================================================
// VALIDATION LINEAGE (from Gate C validation)
// ============================================================================

export interface ForecastAuditValidationLineage {
  readonly validationPassed: boolean
  readonly validationErrors: readonly string[]
  readonly validatedAt: string
}

// ============================================================================
// KERNEL INPUT LINEAGE (future — adapter-local vs kernel-native gap)
// ============================================================================

/**
 * Records which PredictabilityInput type was used.
 * This contract makes the adapter/kernel input gap explicit.
 *
 * - `inputTypePath: 'adapter_local'` — input came from adapter-integration.ts
 * - `inputTypePath: 'kernel_native'` — input came directly as kernel-native type
 * - `inputTypePath: 'bridged'` — input was mapped via a future type bridge
 *
 * When `inputTypePath` is 'kernel_native' and `bridgeApplied` is false,
 * `unbridgedWarning` must be true — this means the adapter pipeline was bypassed.
 */
export interface ForecastAuditKernelInputLineage {
  readonly inputTypePath: ForecastAuditInputTypePath
  readonly bridgeApplied: boolean
  readonly unbridgedWarning: boolean
  readonly bridgeGateId?: string
}

// ============================================================================
// MODEL STAGE LINEAGE (future — M-A through M-I)
// ============================================================================

/**
 * Future placeholder for model stage lineage.
 * No orchestration composes M-A through M-I today.
 * When orchestration is authorized, this records which stages contributed.
 */
export interface ForecastAuditModelStageLineage {
  readonly stagesExecuted: readonly string[]
  readonly orchestrationGateId?: string
  readonly compositionMethod?: string
}

// ============================================================================
// ASSUMPTION
// ============================================================================

export interface ForecastAuditAssumption {
  readonly assumption: string
  readonly ifWrongBy: string
  readonly forecastFlips: boolean
}

// ============================================================================
// FAILURE MODE
// ============================================================================

export interface ForecastAuditFailureMode {
  readonly id: string
  readonly mode: string
  readonly severity: ForecastAuditFailureSeverity
  readonly detection: string
  readonly mitigation: string
}

// ============================================================================
// FORBIDDEN CLAIM
// ============================================================================

export interface ForecastAuditForbiddenClaim {
  readonly claim: string
  readonly reason: string
}

// ============================================================================
// FORECAST AUDIT ENTRY — Main Record
// ============================================================================

/**
 * The main audit record for a forecast.
 * Every forecast must produce exactly one audit entry.
 * Advisory-only status is enforced structurally via `safetyFlags`.
 * User acknowledgment is enforced via `authorizationState`.
 * Persistence state is explicit — no silent persistence allowed.
 */
export interface ForecastAuditEntry {
  readonly auditEntryId: string
  readonly forecastId: string
  readonly createdAt: string
  readonly typeContractVersion: ForecastAuditTypeContractVersion

  // Safety — all flags hardcoded true
  readonly safetyFlags: ForecastAuditSafetyFlags

  // Lineage chain
  readonly evidenceLineage: readonly ForecastAuditEvidenceLineage[]
  readonly adapterPacketLineage: ForecastAuditAdapterPacketLineage
  readonly validationLineage: ForecastAuditValidationLineage
  readonly kernelInputLineage: ForecastAuditKernelInputLineage
  readonly modelStageLineage: ForecastAuditModelStageLineage

  // Forecast content
  readonly assumptions: readonly ForecastAuditAssumption[]
  readonly failureModes: readonly ForecastAuditFailureMode[]
  readonly uncertaintyStatement: string
  readonly forbiddenClaims: readonly ForecastAuditForbiddenClaim[]

  // Authorization and persistence
  readonly authorizationState: ForecastAuditAuthorizationState
  readonly persistenceState: ForecastAuditPersistenceState

  // Lineage completeness
  readonly lineageComplete: boolean
  readonly lineageGaps: readonly string[]
}

// ============================================================================
// EXAMPLE FIXTURES (type-safe, non-functional)
// ============================================================================

export const FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF: ForecastAuditProvenanceRef = {
  source: 'src-001',
  url: '/evidence/index',
  timestamp: '2026-05-02T00:00:00Z',
  verificationMethod: 'direct-observation',
}

export const FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE: ForecastAuditEvidenceLineage = {
  evidenceId: 'ev-001',
  claim: 'Signal rose 15% over 3 windows',
  sourceTier: 'T1_CANON_LOCKED',
  domain: 'BATMAN',
  confidenceLabel: 'high',
  provenanceRefs: [FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF],
  observedTimestamp: '2026-05-02T00:00:00Z',
  gateEMappingApplied: true,
}

export const FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE: ForecastAuditAdapterPacketLineage = {
  task: 'Forecast trend direction for signal X',
  allowedEvidenceCount: 3,
  blockedEvidenceCount: 0,
  warningCount: 1,
  canonBoundaries: ['No certainty claims (>99%)', 'No autonomous action'],
  outputContractSnapshot: {
    requireProvenanceTrail: true,
    requireFailureModes: true,
    requireAssumptions: true,
    forbidCertaintyLanguage: true,
    forbidAutonomousAction: true,
  },
}

export const FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE: ForecastAuditValidationLineage = {
  validationPassed: true,
  validationErrors: [],
  validatedAt: '2026-05-02T00:00:00Z',
}

export const FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE: ForecastAuditKernelInputLineage = {
  inputTypePath: 'adapter_local',
  bridgeApplied: false,
  unbridgedWarning: false,
}

export const FORECAST_AUDIT_EXAMPLE_MODEL_STAGE_LINEAGE: ForecastAuditModelStageLineage = {
  stagesExecuted: [],
  orchestrationGateId: undefined,
  compositionMethod: undefined,
}

export const FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS: ForecastAuditSafetyFlags = {
  advisoryOnly: true,
  humanReviewRequired: true,
  userAcknowledgmentRequired: true,
  forbidAutonomousAction: true,
  forbidCertaintyLanguage: true,
  requireAssumptions: true,
  requireFailureModes: true,
  requireProvenanceTrail: true,
  noActionRecommended: true,
}

export const FORECAST_AUDIT_EXAMPLE_ASSUMPTION: ForecastAuditAssumption = {
  assumption: 'Historical regime remains stable',
  ifWrongBy: '±10%',
  forecastFlips: false,
}

export const FORECAST_AUDIT_EXAMPLE_FAILURE_MODE: ForecastAuditFailureMode = {
  id: 'F-1',
  mode: 'Missing evidence lineage',
  severity: 'HIGH',
  detection: 'Audit entry lineage field is empty',
  mitigation: 'Fail closed — audit entry records gap, forecast flagged lineage_incomplete',
}

export const FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM: ForecastAuditForbiddenClaim = {
  claim: 'This forecast guarantees a specific outcome',
  reason: 'Certainty claims violate forbidCertaintyLanguage safety flag',
}

export const FORECAST_AUDIT_EXAMPLE_ENTRY: ForecastAuditEntry = {
  auditEntryId: 'audit-001',
  forecastId: 'forecast-001',
  createdAt: '2026-05-02T00:00:00Z',
  typeContractVersion: 'gate-f-v1',
  safetyFlags: FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS,
  evidenceLineage: [FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE],
  adapterPacketLineage: FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE,
  validationLineage: FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE,
  kernelInputLineage: FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE,
  modelStageLineage: FORECAST_AUDIT_EXAMPLE_MODEL_STAGE_LINEAGE,
  assumptions: [FORECAST_AUDIT_EXAMPLE_ASSUMPTION],
  failureModes: [FORECAST_AUDIT_EXAMPLE_FAILURE_MODE],
  uncertaintyStatement: 'This forecast carries inherent uncertainty. Historical patterns may not repeat.',
  forbiddenClaims: [FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM],
  authorizationState: 'pending_user_acknowledgment',
  persistenceState: 'not_persisted',
  lineageComplete: false,
  lineageGaps: ['kernel execution not available', 'model stage orchestration not available'],
}
