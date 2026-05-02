/**
 * forecast-audit.ts
 *
 * Gate F: Pure functions for Forecast Authorization and Audit Boundary.
 * Construction, validation, authorization, persistence boundary, and consumability checks
 * for forecast audit entries.
 *
 * No imports from Evidence Router source code.
 * No imports from Predictability Kernel.
 * No imports from model stages M-A through M-I.
 * No imports from adapter-validation, adapter-integration, or evidence-router-bridge.
 * No I/O. No mutation. No side effects.
 *
 * Status: Gate F pure functions.
 */

import type {
  ForecastAuditEntry,
  ForecastAuditSafetyFlags,
  ForecastAuditAuthorizationState,
  ForecastAuditPersistenceState,
} from './forecast-audit-types'

import {
  FORECAST_AUDIT_TYPE_CONTRACT_VERSION,
  FORECAST_AUDIT_AUTHORIZATION_STATES,
  FORECAST_AUDIT_PERSISTENCE_STATES,
} from './forecast-audit-types'

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

interface AuthorizationResult {
  readonly valid: boolean
  readonly consumableEligible: boolean
}

interface PersistenceBoundaryResult {
  readonly valid: boolean
  readonly futureMarkerOnly?: boolean
}

// ============================================================================
// SAFETY FLAGS (sealed — all true)
// ============================================================================

const SEALED_SAFETY_FLAGS: ForecastAuditSafetyFlags = {
  advisoryOnly: true,
  humanReviewRequired: true,
  userAcknowledgmentRequired: true,
  forbidAutonomousAction: true,
  forbidCertaintyLanguage: true,
  requireAssumptions: true,
  requireFailureModes: true,
  requireProvenanceTrail: true,
  noActionRecommended: true,
} as const

const SAFETY_FLAG_KEYS: ReadonlyArray<keyof ForecastAuditSafetyFlags> = [
  'advisoryOnly',
  'humanReviewRequired',
  'userAcknowledgmentRequired',
  'forbidAutonomousAction',
  'forbidCertaintyLanguage',
  'requireAssumptions',
  'requireFailureModes',
  'requireProvenanceTrail',
  'noActionRecommended',
] as const

// ============================================================================
// ISO TIMESTAMP VALIDATION
// ============================================================================

function isValidISOTimestamp(value: string): boolean {
  const date = new Date(value)
  return !isNaN(date.getTime()) && value.includes('T')
}

// ============================================================================
// createForecastAuditEntry
// ============================================================================

/**
 * Constructs a ForecastAuditEntry from input data.
 * Forces all safety flags to true. Defaults authorization to pending_user_acknowledgment
 * and persistence to not_persisted if not provided.
 * Pure — does not mutate input.
 */
export function createForecastAuditEntry(input: {
  readonly auditEntryId: string
  readonly forecastId: string
  readonly createdAt: string
  readonly evidenceLineage: ForecastAuditEntry['evidenceLineage']
  readonly adapterPacketLineage: ForecastAuditEntry['adapterPacketLineage']
  readonly validationLineage: ForecastAuditEntry['validationLineage']
  readonly kernelInputLineage: ForecastAuditEntry['kernelInputLineage']
  readonly modelStageLineage: ForecastAuditEntry['modelStageLineage']
  readonly assumptions: ForecastAuditEntry['assumptions']
  readonly failureModes: ForecastAuditEntry['failureModes']
  readonly uncertaintyStatement: string
  readonly forbiddenClaims: ForecastAuditEntry['forbiddenClaims']
  readonly authorizationState?: ForecastAuditAuthorizationState
  readonly persistenceState?: ForecastAuditPersistenceState
  readonly lineageComplete?: boolean
  readonly lineageGaps?: readonly string[]
}): ForecastAuditEntry {
  return {
    auditEntryId: input.auditEntryId,
    forecastId: input.forecastId,
    createdAt: input.createdAt,
    typeContractVersion: FORECAST_AUDIT_TYPE_CONTRACT_VERSION,
    safetyFlags: { ...SEALED_SAFETY_FLAGS },
    evidenceLineage: [...input.evidenceLineage],
    adapterPacketLineage: { ...input.adapterPacketLineage },
    validationLineage: { ...input.validationLineage },
    kernelInputLineage: { ...input.kernelInputLineage },
    modelStageLineage: { ...input.modelStageLineage },
    assumptions: [...input.assumptions],
    failureModes: [...input.failureModes],
    uncertaintyStatement: input.uncertaintyStatement,
    forbiddenClaims: [...input.forbiddenClaims],
    authorizationState: input.authorizationState ?? 'pending_user_acknowledgment',
    persistenceState: input.persistenceState ?? 'not_persisted',
    lineageComplete: input.lineageComplete ?? false,
    lineageGaps: input.lineageGaps ? [...input.lineageGaps] : [],
  }
}

// ============================================================================
// assertForecastAuditSafetyFlags
// ============================================================================

/**
 * Validates that all 9 safety flags are set to true.
 * Returns errors for any flag that is not true.
 */
export function assertForecastAuditSafetyFlags(
  flags: ForecastAuditSafetyFlags
): ValidationResult {
  const errors: string[] = []

  for (const key of SAFETY_FLAG_KEYS) {
    if (flags[key] !== true) {
      errors.push(`safetyFlags.${key} must be true`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// validateForecastAuditLineage
// ============================================================================

/**
 * Validates lineage chain completeness.
 * Checks all 5 lineage fields are present and kernel input bridge consistency.
 */
export function validateForecastAuditLineage(
  entry: ForecastAuditEntry
): ValidationResult {
  const errors: string[] = []

  if (!entry.evidenceLineage) {
    errors.push('evidenceLineage is required')
  }

  if (!entry.adapterPacketLineage) {
    errors.push('adapterPacketLineage is required')
  }

  if (!entry.validationLineage) {
    errors.push('validationLineage is required')
  }

  if (!entry.kernelInputLineage) {
    errors.push('kernelInputLineage is required')
  }

  if (!entry.modelStageLineage) {
    errors.push('modelStageLineage is required')
  }

  // Kernel input bridge consistency check
  if (
    entry.kernelInputLineage &&
    entry.kernelInputLineage.inputTypePath === 'kernel_native' &&
    !entry.kernelInputLineage.bridgeApplied &&
    !entry.kernelInputLineage.unbridgedWarning
  ) {
    errors.push(
      'kernelInputLineage: kernel_native input without bridge requires unbridgedWarning to be true'
    )
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// validateForecastAuditEntry
// ============================================================================

/**
 * Full validation of a ForecastAuditEntry.
 * Checks required fields, safety flags, lineage, authorization, persistence.
 * Returns all errors found — does not throw.
 */
export function validateForecastAuditEntry(
  entry: ForecastAuditEntry
): ValidationResult {
  const errors: string[] = []

  // Required string fields
  if (!entry.auditEntryId) {
    errors.push('auditEntryId is required')
  }

  if (!entry.forecastId) {
    errors.push('forecastId is required')
  }

  if (!entry.createdAt || !isValidISOTimestamp(entry.createdAt)) {
    errors.push('createdAt must be a valid ISO timestamp')
  }

  // Safety flags
  const safetyResult = assertForecastAuditSafetyFlags(entry.safetyFlags)
  errors.push(...safetyResult.errors)

  // Lineage
  const lineageResult = validateForecastAuditLineage(entry)
  errors.push(...lineageResult.errors)

  // Content fields
  if (!entry.assumptions) {
    errors.push('assumptions is required')
  } else if (entry.assumptions.length === 0) {
    errors.push('assumptions must not be empty')
  }

  if (!entry.failureModes) {
    errors.push('failureModes is required')
  } else if (entry.failureModes.length === 0) {
    errors.push('failureModes must not be empty')
  }

  if (!entry.uncertaintyStatement) {
    errors.push('uncertaintyStatement is required')
  }

  // Authorization state
  if (
    !(FORECAST_AUDIT_AUTHORIZATION_STATES as readonly string[]).includes(
      entry.authorizationState
    )
  ) {
    errors.push('authorizationState is not a valid state')
  }

  // Persistence state
  if (
    !(FORECAST_AUDIT_PERSISTENCE_STATES as readonly string[]).includes(
      entry.persistenceState
    )
  ) {
    errors.push('persistenceState is not a valid state')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// validateForecastAuditAuthorization
// ============================================================================

/**
 * Validates an authorization state and determines consumable eligibility.
 * Only 'acknowledged' is consumable-eligible.
 */
export function validateForecastAuditAuthorization(
  state: ForecastAuditAuthorizationState
): AuthorizationResult {
  const valid = (FORECAST_AUDIT_AUTHORIZATION_STATES as readonly string[]).includes(state)
  const consumableEligible = valid && state === 'acknowledged'

  return { valid, consumableEligible }
}

// ============================================================================
// validateForecastAuditPersistenceBoundary
// ============================================================================

/**
 * Validates a persistence state.
 * Marks 'persisted_by_future_gate' as a future marker only.
 * No side effects — no actual persistence operations.
 */
export function validateForecastAuditPersistenceBoundary(
  state: ForecastAuditPersistenceState
): PersistenceBoundaryResult {
  const valid = (FORECAST_AUDIT_PERSISTENCE_STATES as readonly string[]).includes(state)

  if (!valid) {
    return { valid: false }
  }

  if (state === 'persisted_by_future_gate') {
    return { valid: true, futureMarkerOnly: true }
  }

  return { valid: true }
}

// ============================================================================
// isForecastAuditConsumable
// ============================================================================

/**
 * Determines if a forecast audit entry is consumable.
 * Requires: acknowledged authorization, all safety flags true,
 * non-empty assumptions, non-empty failureModes, non-empty uncertaintyStatement.
 */
export function isForecastAuditConsumable(entry: ForecastAuditEntry): boolean {
  // Authorization must be acknowledged
  if (entry.authorizationState !== 'acknowledged') {
    return false
  }

  // All safety flags must be true
  const safetyResult = assertForecastAuditSafetyFlags(entry.safetyFlags)
  if (!safetyResult.valid) {
    return false
  }

  // Content must be present
  if (!entry.assumptions || entry.assumptions.length === 0) {
    return false
  }

  if (!entry.failureModes || entry.failureModes.length === 0) {
    return false
  }

  if (!entry.uncertaintyStatement) {
    return false
  }

  return true
}
