/**
 * forecast-audit-types.test.ts
 *
 * Gate F: Type contract tests for Forecast Authorization and Audit Boundary.
 * Tests verify structural correctness, literal unions, safety flag enforcement,
 * fixture validity, and contract invariants.
 *
 * No kernel calls. No Evidence Router wiring. No model-stage orchestration.
 * All tests use hardcoded fixtures from the type contracts file.
 */

import path from 'path'

import {
  FORECAST_AUDIT_TYPE_CONTRACT_VERSION,
  FORECAST_AUDIT_AUTHORIZATION_STATES,
  FORECAST_AUDIT_PERSISTENCE_STATES,
  FORECAST_AUDIT_INPUT_TYPE_PATHS,
  FORECAST_AUDIT_FAILURE_SEVERITIES,
  FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF,
  FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE,
  FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE,
  FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE,
  FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE,
  FORECAST_AUDIT_EXAMPLE_MODEL_STAGE_LINEAGE,
  FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS,
  FORECAST_AUDIT_EXAMPLE_ASSUMPTION,
  FORECAST_AUDIT_EXAMPLE_FAILURE_MODE,
  FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM,
  FORECAST_AUDIT_EXAMPLE_ENTRY,
} from '../forecast-audit-types'

import type {
  ForecastAuditTypeContractVersion,
  ForecastAuditAuthorizationState,
  ForecastAuditPersistenceState,
  ForecastAuditInputTypePath,
  ForecastAuditFailureSeverity,
  ForecastAuditSafetyFlags,
  ForecastAuditEvidenceLineage,
  ForecastAuditAdapterPacketLineage,
  ForecastAuditValidationLineage,
  ForecastAuditKernelInputLineage,
  ForecastAuditModelStageLineage,
  ForecastAuditAssumption,
  ForecastAuditFailureMode,
  ForecastAuditForbiddenClaim,
  ForecastAuditProvenanceRef,
  ForecastAuditEntry,
} from '../forecast-audit-types'

// ============================================================================
// 1. TYPE CONTRACT VERSION
// ============================================================================

describe('ForecastAuditTypeContractVersion', () => {
  it('should be gate-f-v1', () => {
    expect(FORECAST_AUDIT_TYPE_CONTRACT_VERSION).toBe('gate-f-v1')
  })

  it('should be assignable to the version type', () => {
    const version: ForecastAuditTypeContractVersion = FORECAST_AUDIT_TYPE_CONTRACT_VERSION
    expect(version).toBe('gate-f-v1')
  })
})

// ============================================================================
// 2. AUTHORIZATION STATES
// ============================================================================

describe('ForecastAuditAuthorizationStates', () => {
  it('should contain exactly 5 states', () => {
    expect(FORECAST_AUDIT_AUTHORIZATION_STATES).toHaveLength(5)
  })

  it('should include not_requested', () => {
    expect(FORECAST_AUDIT_AUTHORIZATION_STATES).toContain('not_requested')
  })

  it('should include pending_user_acknowledgment', () => {
    expect(FORECAST_AUDIT_AUTHORIZATION_STATES).toContain('pending_user_acknowledgment')
  })

  it('should include acknowledged', () => {
    expect(FORECAST_AUDIT_AUTHORIZATION_STATES).toContain('acknowledged')
  })

  it('should include rejected', () => {
    expect(FORECAST_AUDIT_AUTHORIZATION_STATES).toContain('rejected')
  })

  it('should include expired', () => {
    expect(FORECAST_AUDIT_AUTHORIZATION_STATES).toContain('expired')
  })

  it('should be assignable to the union type', () => {
    const state: ForecastAuditAuthorizationState = 'pending_user_acknowledgment'
    expect(state).toBe('pending_user_acknowledgment')
  })
})

// ============================================================================
// 3. PERSISTENCE STATES
// ============================================================================

describe('ForecastAuditPersistenceStates', () => {
  it('should contain exactly 4 states', () => {
    expect(FORECAST_AUDIT_PERSISTENCE_STATES).toHaveLength(4)
  })

  it('should include not_persisted', () => {
    expect(FORECAST_AUDIT_PERSISTENCE_STATES).toContain('not_persisted')
  })

  it('should include persistence_not_authorized', () => {
    expect(FORECAST_AUDIT_PERSISTENCE_STATES).toContain('persistence_not_authorized')
  })

  it('should include pending_future_gate', () => {
    expect(FORECAST_AUDIT_PERSISTENCE_STATES).toContain('pending_future_gate')
  })

  it('should include persisted_by_future_gate', () => {
    expect(FORECAST_AUDIT_PERSISTENCE_STATES).toContain('persisted_by_future_gate')
  })

  it('should be assignable to the union type', () => {
    const state: ForecastAuditPersistenceState = 'not_persisted'
    expect(state).toBe('not_persisted')
  })
})

// ============================================================================
// 4. INPUT TYPE PATHS
// ============================================================================

describe('ForecastAuditInputTypePaths', () => {
  it('should contain exactly 3 paths', () => {
    expect(FORECAST_AUDIT_INPUT_TYPE_PATHS).toHaveLength(3)
  })

  it('should include adapter_local, kernel_native, and bridged', () => {
    expect(FORECAST_AUDIT_INPUT_TYPE_PATHS).toContain('adapter_local')
    expect(FORECAST_AUDIT_INPUT_TYPE_PATHS).toContain('kernel_native')
    expect(FORECAST_AUDIT_INPUT_TYPE_PATHS).toContain('bridged')
  })

  it('should be assignable to the union type', () => {
    const path: ForecastAuditInputTypePath = 'adapter_local'
    expect(path).toBe('adapter_local')
  })
})

// ============================================================================
// 5. FAILURE SEVERITIES
// ============================================================================

describe('ForecastAuditFailureSeverities', () => {
  it('should contain exactly 3 severities', () => {
    expect(FORECAST_AUDIT_FAILURE_SEVERITIES).toHaveLength(3)
  })

  it('should include CRITICAL, HIGH, and MEDIUM', () => {
    expect(FORECAST_AUDIT_FAILURE_SEVERITIES).toContain('CRITICAL')
    expect(FORECAST_AUDIT_FAILURE_SEVERITIES).toContain('HIGH')
    expect(FORECAST_AUDIT_FAILURE_SEVERITIES).toContain('MEDIUM')
  })

  it('should be assignable to the union type', () => {
    const severity: ForecastAuditFailureSeverity = 'HIGH'
    expect(severity).toBe('HIGH')
  })
})

// ============================================================================
// 6. SAFETY FLAGS
// ============================================================================

describe('ForecastAuditSafetyFlags', () => {
  it('should have all 9 flags set to true', () => {
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.advisoryOnly).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.humanReviewRequired).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.userAcknowledgmentRequired).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.forbidAutonomousAction).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.forbidCertaintyLanguage).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.requireAssumptions).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.requireFailureModes).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.requireProvenanceTrail).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS.noActionRecommended).toBe(true)
  })

  it('should have exactly 9 keys', () => {
    expect(Object.keys(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS)).toHaveLength(9)
  })

  it('should be assignable to the interface type', () => {
    const flags: ForecastAuditSafetyFlags = FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS
    expect(flags.advisoryOnly).toBe(true)
  })
})

// ============================================================================
// 7. EVIDENCE LINEAGE
// ============================================================================

describe('ForecastAuditEvidenceLineage', () => {
  it('should have required fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.evidenceId).toBe('ev-001')
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.claim).toBe('Signal rose 15% over 3 windows')
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.sourceTier).toBe('T1_CANON_LOCKED')
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.domain).toBe('BATMAN')
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.confidenceLabel).toBe('high')
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.observedTimestamp).toBe('2026-05-02T00:00:00Z')
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.gateEMappingApplied).toBe(true)
  })

  it('should have provenance refs array', () => {
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.provenanceRefs).toHaveLength(1)
    expect(FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE.provenanceRefs[0].source).toBe('src-001')
  })

  it('should be assignable to the interface type', () => {
    const lineage: ForecastAuditEvidenceLineage = FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE
    expect(lineage.evidenceId).toBeDefined()
  })
})

// ============================================================================
// 8. PROVENANCE REF
// ============================================================================

describe('ForecastAuditProvenanceRef', () => {
  it('should have required source field', () => {
    expect(FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF.source).toBe('src-001')
  })

  it('should have optional fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF.url).toBe('/evidence/index')
    expect(FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF.timestamp).toBe('2026-05-02T00:00:00Z')
    expect(FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF.verificationMethod).toBe('direct-observation')
  })

  it('should be assignable to the interface type', () => {
    const ref: ForecastAuditProvenanceRef = FORECAST_AUDIT_EXAMPLE_PROVENANCE_REF
    expect(ref.source).toBeDefined()
  })
})

// ============================================================================
// 9. ADAPTER PACKET LINEAGE
// ============================================================================

describe('ForecastAuditAdapterPacketLineage', () => {
  it('should have required fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE.task).toBe('Forecast trend direction for signal X')
    expect(FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE.allowedEvidenceCount).toBe(3)
    expect(FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE.blockedEvidenceCount).toBe(0)
    expect(FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE.warningCount).toBe(1)
  })

  it('should have output contract snapshot with all 5 flags', () => {
    const snapshot = FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE.outputContractSnapshot
    expect(snapshot.requireProvenanceTrail).toBe(true)
    expect(snapshot.requireFailureModes).toBe(true)
    expect(snapshot.requireAssumptions).toBe(true)
    expect(snapshot.forbidCertaintyLanguage).toBe(true)
    expect(snapshot.forbidAutonomousAction).toBe(true)
  })

  it('should have canon boundaries array', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE.canonBoundaries).toHaveLength(2)
  })

  it('should be assignable to the interface type', () => {
    const lineage: ForecastAuditAdapterPacketLineage = FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE
    expect(lineage.task).toBeDefined()
  })
})

// ============================================================================
// 10. VALIDATION LINEAGE
// ============================================================================

describe('ForecastAuditValidationLineage', () => {
  it('should have required fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE.validationPassed).toBe(true)
    expect(FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE.validationErrors).toHaveLength(0)
    expect(FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE.validatedAt).toBe('2026-05-02T00:00:00Z')
  })

  it('should be assignable to the interface type', () => {
    const lineage: ForecastAuditValidationLineage = FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE
    expect(lineage.validationPassed).toBeDefined()
  })
})

// ============================================================================
// 11. KERNEL INPUT LINEAGE
// ============================================================================

describe('ForecastAuditKernelInputLineage', () => {
  it('should record adapter_local input type path', () => {
    expect(FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE.inputTypePath).toBe('adapter_local')
  })

  it('should record bridge not applied', () => {
    expect(FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE.bridgeApplied).toBe(false)
  })

  it('should have no unbridged warning for adapter_local path', () => {
    expect(FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE.unbridgedWarning).toBe(false)
  })

  it('should require unbridgedWarning when kernel_native without bridge', () => {
    const unbridgedKernelInput: ForecastAuditKernelInputLineage = {
      inputTypePath: 'kernel_native',
      bridgeApplied: false,
      unbridgedWarning: true,
    }
    expect(unbridgedKernelInput.unbridgedWarning).toBe(true)
    expect(unbridgedKernelInput.inputTypePath).toBe('kernel_native')
  })

  it('should be assignable to the interface type', () => {
    const lineage: ForecastAuditKernelInputLineage = FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE
    expect(lineage.inputTypePath).toBeDefined()
  })
})

// ============================================================================
// 12. MODEL STAGE LINEAGE
// ============================================================================

describe('ForecastAuditModelStageLineage', () => {
  it('should have empty stagesExecuted (no orchestration exists)', () => {
    expect(FORECAST_AUDIT_EXAMPLE_MODEL_STAGE_LINEAGE.stagesExecuted).toHaveLength(0)
  })

  it('should have undefined orchestrationGateId', () => {
    expect(FORECAST_AUDIT_EXAMPLE_MODEL_STAGE_LINEAGE.orchestrationGateId).toBeUndefined()
  })

  it('should be assignable to the interface type', () => {
    const lineage: ForecastAuditModelStageLineage = FORECAST_AUDIT_EXAMPLE_MODEL_STAGE_LINEAGE
    expect(lineage.stagesExecuted).toBeDefined()
  })
})

// ============================================================================
// 13. ASSUMPTION
// ============================================================================

describe('ForecastAuditAssumption', () => {
  it('should have required fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ASSUMPTION.assumption).toBe('Historical regime remains stable')
    expect(FORECAST_AUDIT_EXAMPLE_ASSUMPTION.ifWrongBy).toBe('±10%')
    expect(FORECAST_AUDIT_EXAMPLE_ASSUMPTION.forecastFlips).toBe(false)
  })

  it('should be assignable to the interface type', () => {
    const assumption: ForecastAuditAssumption = FORECAST_AUDIT_EXAMPLE_ASSUMPTION
    expect(assumption.assumption).toBeDefined()
  })
})

// ============================================================================
// 14. FAILURE MODE
// ============================================================================

describe('ForecastAuditFailureMode', () => {
  it('should have required fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_FAILURE_MODE.id).toBe('F-1')
    expect(FORECAST_AUDIT_EXAMPLE_FAILURE_MODE.mode).toBe('Missing evidence lineage')
    expect(FORECAST_AUDIT_EXAMPLE_FAILURE_MODE.severity).toBe('HIGH')
    expect(FORECAST_AUDIT_EXAMPLE_FAILURE_MODE.detection).toBeDefined()
    expect(FORECAST_AUDIT_EXAMPLE_FAILURE_MODE.mitigation).toBeDefined()
  })

  it('should be assignable to the interface type', () => {
    const fm: ForecastAuditFailureMode = FORECAST_AUDIT_EXAMPLE_FAILURE_MODE
    expect(fm.id).toBeDefined()
  })
})

// ============================================================================
// 15. FORBIDDEN CLAIM
// ============================================================================

describe('ForecastAuditForbiddenClaim', () => {
  it('should have required fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM.claim).toBeDefined()
    expect(FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM.reason).toBeDefined()
  })

  it('should be assignable to the interface type', () => {
    const fc: ForecastAuditForbiddenClaim = FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM
    expect(fc.claim).toBeDefined()
  })
})

// ============================================================================
// 16. FORECAST AUDIT ENTRY — Main Record
// ============================================================================

describe('ForecastAuditEntry', () => {
  it('should have identity fields', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.auditEntryId).toBe('audit-001')
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.forecastId).toBe('forecast-001')
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.createdAt).toBe('2026-05-02T00:00:00Z')
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.typeContractVersion).toBe('gate-f-v1')
  })

  it('should have safety flags with all 9 flags true', () => {
    const flags = FORECAST_AUDIT_EXAMPLE_ENTRY.safetyFlags
    expect(flags.advisoryOnly).toBe(true)
    expect(flags.humanReviewRequired).toBe(true)
    expect(flags.userAcknowledgmentRequired).toBe(true)
    expect(flags.forbidAutonomousAction).toBe(true)
    expect(flags.forbidCertaintyLanguage).toBe(true)
    expect(flags.requireAssumptions).toBe(true)
    expect(flags.requireFailureModes).toBe(true)
    expect(flags.requireProvenanceTrail).toBe(true)
    expect(flags.noActionRecommended).toBe(true)
  })

  it('should have evidence lineage array', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.evidenceLineage).toHaveLength(1)
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.evidenceLineage[0].evidenceId).toBe('ev-001')
  })

  it('should have adapter packet lineage', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.adapterPacketLineage.task).toBeDefined()
  })

  it('should have validation lineage', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.validationLineage.validationPassed).toBe(true)
  })

  it('should have kernel input lineage with explicit input type path', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.kernelInputLineage.inputTypePath).toBe('adapter_local')
  })

  it('should have model stage lineage (empty — no orchestration)', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.modelStageLineage.stagesExecuted).toHaveLength(0)
  })

  it('should have assumptions array', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.assumptions).toHaveLength(1)
  })

  it('should have failure modes array', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.failureModes).toHaveLength(1)
  })

  it('should have uncertainty statement', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.uncertaintyStatement).toBeDefined()
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.uncertaintyStatement.length).toBeGreaterThan(0)
  })

  it('should have forbidden claims array', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.forbiddenClaims).toHaveLength(1)
  })

  it('should have authorization state as pending_user_acknowledgment', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.authorizationState).toBe('pending_user_acknowledgment')
  })

  it('should have persistence state as not_persisted', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.persistenceState).toBe('not_persisted')
  })

  it('should have lineage completeness tracking', () => {
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.lineageComplete).toBe(false)
    expect(FORECAST_AUDIT_EXAMPLE_ENTRY.lineageGaps).toHaveLength(2)
  })

  it('should be assignable to the interface type', () => {
    const entry: ForecastAuditEntry = FORECAST_AUDIT_EXAMPLE_ENTRY
    expect(entry.auditEntryId).toBeDefined()
  })
})

// ============================================================================
// 17. NO FORBIDDEN IMPORTS
// ============================================================================

describe('Forbidden import detection', () => {
  const sourceFilePath = path.resolve(__dirname, '..', 'forecast-audit-types.ts')

  it('should not import from evidence-router-bridge', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"]\.\/evidence-router-bridge['"]/)
    expect(content).not.toMatch(/from\s+['"]\.\.\/evidence-router-bridge['"]/)
  })

  it('should not import from predictability-kernel', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*predictability-kernel['"]/)
  })

  it('should not import from adapter-validation or adapter-integration', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*adapter-validation['"]/)
    expect(content).not.toMatch(/from\s+['"].*adapter-integration['"]/)
  })

  it('should not import from any model stage (M-A through M-I)', async () => {
    const fs = await import('fs')
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    const modelStagePatterns = [
      'bayesian-updater', 'monte-carlo', 'markov-regime',
      'trend-baseline', 'cycle-phase', 'calibration-ledger',
      'trend-delta', 'regime-shift', 'behavioral-repetition',
      'landmark-response', 'trend-velocity', 'cycle-analysis',
    ]
    for (const pattern of modelStagePatterns) {
      expect(content).not.toMatch(new RegExp(`from\\s+['"].*${pattern}['"]`))
    }
  })
})
