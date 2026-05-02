/**
 * forecast-audit.test.ts
 *
 * Gate F: Tests for forecast audit pure functions.
 * Fixture-first. No kernel calls. No Evidence Router wiring. No model-stage orchestration.
 * No I/O. No mutation. No side effects.
 *
 * Status: Gate F pure function tests.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

import {
  createForecastAuditEntry,
  validateForecastAuditEntry,
  assertForecastAuditSafetyFlags,
  validateForecastAuditLineage,
  validateForecastAuditAuthorization,
  validateForecastAuditPersistenceBoundary,
  isForecastAuditConsumable,
} from '../forecast-audit'

import type {
  ForecastAuditEntry,
  ForecastAuditSafetyFlags,
} from '../forecast-audit-types'

import {
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

// ============================================================================
// FIXTURE HELPERS
// ============================================================================

function makeValidInput() {
  return {
    auditEntryId: 'audit-test-001',
    forecastId: 'forecast-test-001',
    createdAt: '2026-05-02T12:00:00Z',
    evidenceLineage: [FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE],
    adapterPacketLineage: FORECAST_AUDIT_EXAMPLE_ADAPTER_PACKET_LINEAGE,
    validationLineage: FORECAST_AUDIT_EXAMPLE_VALIDATION_LINEAGE,
    kernelInputLineage: FORECAST_AUDIT_EXAMPLE_KERNEL_INPUT_LINEAGE,
    modelStageLineage: FORECAST_AUDIT_EXAMPLE_MODEL_STAGE_LINEAGE,
    assumptions: [FORECAST_AUDIT_EXAMPLE_ASSUMPTION],
    failureModes: [FORECAST_AUDIT_EXAMPLE_FAILURE_MODE],
    uncertaintyStatement: 'This forecast carries inherent uncertainty.',
    forbiddenClaims: [FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM],
    authorizationState: 'pending_user_acknowledgment' as const,
    persistenceState: 'not_persisted' as const,
    lineageComplete: false,
    lineageGaps: ['kernel execution not available'],
  }
}

function makeAcknowledgedEntry(): ForecastAuditEntry {
  return {
    ...FORECAST_AUDIT_EXAMPLE_ENTRY,
    authorizationState: 'acknowledged',
  }
}

// ============================================================================
// createForecastAuditEntry
// ============================================================================

describe('createForecastAuditEntry', () => {
  it('should return a valid ForecastAuditEntry from fixture input', () => {
    const input = makeValidInput()
    const entry = createForecastAuditEntry(input)

    expect(entry.auditEntryId).toBe('audit-test-001')
    expect(entry.forecastId).toBe('forecast-test-001')
    expect(entry.createdAt).toBe('2026-05-02T12:00:00Z')
    expect(entry.typeContractVersion).toBe('gate-f-v1')
    expect(entry.safetyFlags.advisoryOnly).toBe(true)
    expect(entry.safetyFlags.humanReviewRequired).toBe(true)
    expect(entry.evidenceLineage).toEqual([FORECAST_AUDIT_EXAMPLE_EVIDENCE_LINEAGE])
    expect(entry.assumptions).toEqual([FORECAST_AUDIT_EXAMPLE_ASSUMPTION])
    expect(entry.failureModes).toEqual([FORECAST_AUDIT_EXAMPLE_FAILURE_MODE])
    expect(entry.uncertaintyStatement).toBe('This forecast carries inherent uncertainty.')
    expect(entry.forbiddenClaims).toEqual([FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM])
  })

  it('should not mutate input', () => {
    const input = makeValidInput()
    const inputCopy = JSON.parse(JSON.stringify(input))
    createForecastAuditEntry(input)
    expect(input).toEqual(inputCopy)
  })

  it('should force all safety flags to true regardless of input', () => {
    const input = makeValidInput()
    const entry = createForecastAuditEntry(input)

    expect(entry.safetyFlags.advisoryOnly).toBe(true)
    expect(entry.safetyFlags.humanReviewRequired).toBe(true)
    expect(entry.safetyFlags.userAcknowledgmentRequired).toBe(true)
    expect(entry.safetyFlags.forbidAutonomousAction).toBe(true)
    expect(entry.safetyFlags.forbidCertaintyLanguage).toBe(true)
    expect(entry.safetyFlags.requireAssumptions).toBe(true)
    expect(entry.safetyFlags.requireFailureModes).toBe(true)
    expect(entry.safetyFlags.requireProvenanceTrail).toBe(true)
    expect(entry.safetyFlags.noActionRecommended).toBe(true)
  })

  it('should default authorizationState to pending_user_acknowledgment', () => {
    const input = makeValidInput()
    const { authorizationState: _, ...inputWithout } = input
    const entry = createForecastAuditEntry(inputWithout as any)
    expect(entry.authorizationState).toBe('pending_user_acknowledgment')
  })

  it('should default persistenceState to not_persisted', () => {
    const input = makeValidInput()
    const { persistenceState: _, ...inputWithout } = input
    const entry = createForecastAuditEntry(inputWithout as any)
    expect(entry.persistenceState).toBe('not_persisted')
  })
})

// ============================================================================
// validateForecastAuditEntry
// ============================================================================

describe('validateForecastAuditEntry', () => {
  it('should accept a valid fixture', () => {
    const result = validateForecastAuditEntry(FORECAST_AUDIT_EXAMPLE_ENTRY)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should reject missing auditEntryId', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, auditEntryId: '' }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('auditEntryId is required')
  })

  it('should reject missing forecastId', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, forecastId: '' }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('forecastId is required')
  })

  it('should reject malformed createdAt', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, createdAt: 'not-a-date' }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('createdAt must be a valid ISO timestamp')
  })

  it('should reject advisoryOnly false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, advisoryOnly: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.advisoryOnly must be true')
  })

  it('should reject humanReviewRequired false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, humanReviewRequired: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.humanReviewRequired must be true')
  })

  it('should reject userAcknowledgmentRequired false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, userAcknowledgmentRequired: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.userAcknowledgmentRequired must be true')
  })

  it('should reject forbidAutonomousAction false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, forbidAutonomousAction: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.forbidAutonomousAction must be true')
  })

  it('should reject forbidCertaintyLanguage false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, forbidCertaintyLanguage: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.forbidCertaintyLanguage must be true')
  })

  it('should reject requireAssumptions false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, requireAssumptions: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.requireAssumptions must be true')
  })

  it('should reject requireFailureModes false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, requireFailureModes: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.requireFailureModes must be true')
  })

  it('should reject requireProvenanceTrail false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, requireProvenanceTrail: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.requireProvenanceTrail must be true')
  })

  it('should reject noActionRecommended false', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, noActionRecommended: false as any },
    }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.noActionRecommended must be true')
  })

  it('should reject missing evidenceLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, evidenceLineage: undefined as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('evidenceLineage is required')
  })

  it('should reject missing adapterPacketLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, adapterPacketLineage: undefined as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('adapterPacketLineage is required')
  })

  it('should reject missing validationLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, validationLineage: undefined as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('validationLineage is required')
  })

  it('should reject missing kernelInputLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, kernelInputLineage: undefined as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('kernelInputLineage is required')
  })

  it('should reject missing modelStageLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, modelStageLineage: undefined as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('modelStageLineage is required')
  })

  it('should reject missing assumptions', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, assumptions: undefined as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('assumptions is required')
  })

  it('should reject empty assumptions', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, assumptions: [] }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('assumptions must not be empty')
  })

  it('should reject missing failureModes', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, failureModes: undefined as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('failureModes is required')
  })

  it('should reject empty failureModes', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, failureModes: [] }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('failureModes must not be empty')
  })

  it('should reject missing uncertaintyStatement', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, uncertaintyStatement: '' }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('uncertaintyStatement is required')
  })

  it('should reject invalid authorizationState', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, authorizationState: 'invalid_state' as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('authorizationState is not a valid state')
  })

  it('should reject invalid persistenceState', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, persistenceState: 'written_to_db' as any }
    const result = validateForecastAuditEntry(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('persistenceState is not a valid state')
  })
})

// ============================================================================
// assertForecastAuditSafetyFlags
// ============================================================================

describe('assertForecastAuditSafetyFlags', () => {
  it('should accept all-true safety flags', () => {
    const result = assertForecastAuditSafetyFlags(FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should reject advisoryOnly false', () => {
    const flags = { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, advisoryOnly: false as any }
    const result = assertForecastAuditSafetyFlags(flags)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.advisoryOnly must be true')
  })

  it('should reject forbidAutonomousAction false', () => {
    const flags = { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, forbidAutonomousAction: false as any }
    const result = assertForecastAuditSafetyFlags(flags)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('safetyFlags.forbidAutonomousAction must be true')
  })

  it('should reject multiple false flags', () => {
    const flags = {
      ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS,
      advisoryOnly: false as any,
      humanReviewRequired: false as any,
    }
    const result = assertForecastAuditSafetyFlags(flags)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBe(2)
  })
})

// ============================================================================
// validateForecastAuditLineage
// ============================================================================

describe('validateForecastAuditLineage', () => {
  it('should accept valid lineage', () => {
    const result = validateForecastAuditLineage(FORECAST_AUDIT_EXAMPLE_ENTRY)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should reject missing evidenceLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, evidenceLineage: undefined as any }
    const result = validateForecastAuditLineage(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('evidenceLineage is required')
  })

  it('should reject missing adapterPacketLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, adapterPacketLineage: undefined as any }
    const result = validateForecastAuditLineage(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('adapterPacketLineage is required')
  })

  it('should reject missing validationLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, validationLineage: undefined as any }
    const result = validateForecastAuditLineage(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('validationLineage is required')
  })

  it('should reject missing kernelInputLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, kernelInputLineage: undefined as any }
    const result = validateForecastAuditLineage(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('kernelInputLineage is required')
  })

  it('should reject missing modelStageLineage', () => {
    const entry = { ...FORECAST_AUDIT_EXAMPLE_ENTRY, modelStageLineage: undefined as any }
    const result = validateForecastAuditLineage(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('modelStageLineage is required')
  })

  it('should detect missing adapter/kernel bridge status', () => {
    const entry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      kernelInputLineage: {
        inputTypePath: 'kernel_native' as const,
        bridgeApplied: false,
        unbridgedWarning: false,
      },
    }
    const result = validateForecastAuditLineage(entry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'kernelInputLineage: kernel_native input without bridge requires unbridgedWarning to be true'
    )
  })
})

// ============================================================================
// validateForecastAuditAuthorization
// ============================================================================

describe('validateForecastAuditAuthorization', () => {
  it('should mark acknowledged as consumable-eligible', () => {
    const result = validateForecastAuditAuthorization('acknowledged')
    expect(result.valid).toBe(true)
    expect(result.consumableEligible).toBe(true)
  })

  it('should mark pending_user_acknowledgment as not consumable', () => {
    const result = validateForecastAuditAuthorization('pending_user_acknowledgment')
    expect(result.valid).toBe(true)
    expect(result.consumableEligible).toBe(false)
  })

  it('should mark rejected as not consumable', () => {
    const result = validateForecastAuditAuthorization('rejected')
    expect(result.valid).toBe(true)
    expect(result.consumableEligible).toBe(false)
  })

  it('should mark expired as not consumable', () => {
    const result = validateForecastAuditAuthorization('expired')
    expect(result.valid).toBe(true)
    expect(result.consumableEligible).toBe(false)
  })

  it('should mark not_requested as not consumable', () => {
    const result = validateForecastAuditAuthorization('not_requested')
    expect(result.valid).toBe(true)
    expect(result.consumableEligible).toBe(false)
  })

  it('should reject invalid authorization state', () => {
    const result = validateForecastAuditAuthorization('auto_approved' as any)
    expect(result.valid).toBe(false)
    expect(result.consumableEligible).toBe(false)
  })
})

// ============================================================================
// validateForecastAuditPersistenceBoundary
// ============================================================================

describe('validateForecastAuditPersistenceBoundary', () => {
  it('should accept not_persisted', () => {
    const result = validateForecastAuditPersistenceBoundary('not_persisted')
    expect(result.valid).toBe(true)
  })

  it('should accept persistence_not_authorized', () => {
    const result = validateForecastAuditPersistenceBoundary('persistence_not_authorized')
    expect(result.valid).toBe(true)
  })

  it('should accept pending_future_gate', () => {
    const result = validateForecastAuditPersistenceBoundary('pending_future_gate')
    expect(result.valid).toBe(true)
  })

  it('should accept persisted_by_future_gate as future marker', () => {
    const result = validateForecastAuditPersistenceBoundary('persisted_by_future_gate')
    expect(result.valid).toBe(true)
    expect(result.futureMarkerOnly).toBe(true)
  })

  it('should not perform persistence (no side effects)', () => {
    const before = Date.now()
    const result = validateForecastAuditPersistenceBoundary('not_persisted')
    const after = Date.now()
    expect(result.valid).toBe(true)
    expect(after - before).toBeLessThan(50)
  })

  it('should reject invalid persistence state', () => {
    const result = validateForecastAuditPersistenceBoundary('written_to_database' as any)
    expect(result.valid).toBe(false)
  })
})

// ============================================================================
// isForecastAuditConsumable
// ============================================================================

describe('isForecastAuditConsumable', () => {
  it('should return true only for valid + acknowledged + safe fixture', () => {
    const entry = makeAcknowledgedEntry()
    expect(isForecastAuditConsumable(entry)).toBe(true)
  })

  it('should return false for valid but pending acknowledgment fixture', () => {
    expect(isForecastAuditConsumable(FORECAST_AUDIT_EXAMPLE_ENTRY)).toBe(false)
  })

  it('should return false for unsafe flags', () => {
    const entry: ForecastAuditEntry = {
      ...makeAcknowledgedEntry(),
      safetyFlags: { ...FORECAST_AUDIT_EXAMPLE_SAFETY_FLAGS, advisoryOnly: false as any },
    }
    expect(isForecastAuditConsumable(entry)).toBe(false)
  })

  it('should return false for rejected authorization', () => {
    const entry: ForecastAuditEntry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      authorizationState: 'rejected',
    }
    expect(isForecastAuditConsumable(entry)).toBe(false)
  })

  it('should return false for expired authorization', () => {
    const entry: ForecastAuditEntry = {
      ...FORECAST_AUDIT_EXAMPLE_ENTRY,
      authorizationState: 'expired',
    }
    expect(isForecastAuditConsumable(entry)).toBe(false)
  })

  it('should return false for missing assumptions', () => {
    const entry: ForecastAuditEntry = {
      ...makeAcknowledgedEntry(),
      assumptions: [],
    }
    expect(isForecastAuditConsumable(entry)).toBe(false)
  })

  it('should return false for missing failureModes', () => {
    const entry: ForecastAuditEntry = {
      ...makeAcknowledgedEntry(),
      failureModes: [],
    }
    expect(isForecastAuditConsumable(entry)).toBe(false)
  })

  it('should return false for empty uncertaintyStatement', () => {
    const entry: ForecastAuditEntry = {
      ...makeAcknowledgedEntry(),
      uncertaintyStatement: '',
    }
    expect(isForecastAuditConsumable(entry)).toBe(false)
  })
})

// ============================================================================
// Data preservation
// ============================================================================

describe('data preservation', () => {
  it('should preserve forbiddenClaims', () => {
    const input = makeValidInput()
    const entry = createForecastAuditEntry(input)
    expect(entry.forbiddenClaims).toEqual([FORECAST_AUDIT_EXAMPLE_FORBIDDEN_CLAIM])
  })

  it('should preserve assumptions', () => {
    const input = makeValidInput()
    const entry = createForecastAuditEntry(input)
    expect(entry.assumptions).toEqual([FORECAST_AUDIT_EXAMPLE_ASSUMPTION])
  })

  it('should preserve failureModes', () => {
    const input = makeValidInput()
    const entry = createForecastAuditEntry(input)
    expect(entry.failureModes).toEqual([FORECAST_AUDIT_EXAMPLE_FAILURE_MODE])
  })

  it('should preserve uncertaintyStatement', () => {
    const input = makeValidInput()
    const entry = createForecastAuditEntry(input)
    expect(entry.uncertaintyStatement).toBe('This forecast carries inherent uncertainty.')
  })
})

// ============================================================================
// Determinism
// ============================================================================

describe('determinism', () => {
  it('should produce identical output for identical input', () => {
    const input = makeValidInput()
    const entry1 = createForecastAuditEntry(input)
    const entry2 = createForecastAuditEntry(input)
    expect(entry1).toEqual(entry2)
  })

  it('should produce identical validation results for identical input', () => {
    const result1 = validateForecastAuditEntry(FORECAST_AUDIT_EXAMPLE_ENTRY)
    const result2 = validateForecastAuditEntry(FORECAST_AUDIT_EXAMPLE_ENTRY)
    expect(result1).toEqual(result2)
  })
})

// ============================================================================
// Fixture-only verification
// ============================================================================

describe('fixture-only verification', () => {
  it('should not require live router/kernel/model data', () => {
    const input = makeValidInput()
    const entry = createForecastAuditEntry(input)
    const validation = validateForecastAuditEntry(entry)
    expect(validation.valid).toBe(true)
  })
})

// ============================================================================
// Forbidden import detection
// ============================================================================

describe('forbidden import detection', () => {
  const sourceFilePath = path.resolve(__dirname, '..', 'forecast-audit.ts')

  it('should not import from predictability-kernel', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*predictability-kernel['"]/)
  })

  it('should not import from M-A through M-I model stages', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    const modelStagePatterns = [
      'bayesian-updater', 'monte-carlo', 'markov-regime',
      'trend-baseline', 'cycle-phase', 'calibration-ledger',
      'trend-delta', 'regime-shift', 'behavioral-repetition',
    ]
    for (const pattern of modelStagePatterns) {
      expect(content).not.toMatch(new RegExp(`from\\s+['"].*${pattern}['"]`))
    }
  })

  it('should not import from adapter-integration', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*adapter-integration['"]/)
  })

  it('should not import from adapter-validation', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*adapter-validation['"]/)
  })

  it('should not import from evidence-router-bridge', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*evidence-router-bridge['"]/)
  })

  it('should not use fetch, fs, localStorage, or sessionStorage', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/\bfetch\s*\(/)
    expect(content).not.toMatch(/\bfs\b/)
    expect(content).not.toMatch(/\blocalStorage\b/)
    expect(content).not.toMatch(/\bsessionStorage\b/)
  })

  it('should not import persistence/UI/API/auth modules', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*database['"]/)
    expect(content).not.toMatch(/from\s+['"].*schema['"]/)
    expect(content).not.toMatch(/from\s+['"].*storage['"]/)
    expect(content).not.toMatch(/from\s+['"].*\/api\/['"]/)
    expect(content).not.toMatch(/from\s+['"].*\/auth\/['"]/)
  })

  it('should not import from calibration-ledger', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/from\s+['"].*calibration-ledger['"]/)
  })

  it('should not contain runtime prediction language', () => {
    const content = fs.readFileSync(sourceFilePath, 'utf-8')
    expect(content).not.toMatch(/calculatePredictabilityForecast/)
    expect(content).not.toMatch(/\bwriteFile\b/)
  })
})
