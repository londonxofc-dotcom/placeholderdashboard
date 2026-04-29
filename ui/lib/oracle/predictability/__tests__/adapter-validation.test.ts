/**
 * adapter-validation.test.ts
 *
 * Test suite for Gate C validation logic. 21 minimum tests covering all 8 rules,
 * packet-level validation, edge cases, and contract enforcement.
 *
 * Pure functions only — no mocks, no I/O, no side effects.
 */

import { describe, test, expect } from 'vitest'

import {
  validateEvidenceItem,
  validatePromptContextPacket,
  evaluateAdapterGate,
  shouldTriggerMathematicalCriticalThinking,
} from '../adapter-validation'

import {
  AdapterEvidenceItem,
  AdapterPromptContextPacket,
  ADAPTER_SOURCE_TIERS,
  ADAPTER_EVIDENCE_STATUSES,
  ADAPTER_CONFIDENCE_LABELS,
} from '../evidence-router-adapter-types'

// ============================================================================
// FIXTURES
// ============================================================================

function makeEvidence(overrides: Partial<AdapterEvidenceItem> = {}): AdapterEvidenceItem {
  return {
    id: 'ev-001',
    domain: 'BATMAN' as const,
    claim: 'Test claim',
    sourceTier: ADAPTER_SOURCE_TIERS.T1_CANON_LOCKED,
    confidence: 0.75,
    status: ADAPTER_EVIDENCE_STATUSES.active,
    provenance: {
      sourceId: 'src-001',
      sourceType: 'direct-observation',
      observedAt: '2026-04-29T17:00:00Z',
    },
    tags: [],
    ...overrides,
  }
}

function makePacket(overrides: Partial<AdapterPromptContextPacket> = {}): AdapterPromptContextPacket {
  return {
    task: 'Test task',
    allowedEvidence: [makeEvidence()],
    blockedEvidence: [],
    warnings: [],
    canonBoundaries: ['No certainty claims (>99%)', 'No autonomous action'],
    outputContract: {
      requireProvenanceTrail: true,
      requireFailureModes: true,
      requireAssumptions: true,
      forbidCertaintyLanguage: true,
      forbidAutonomousAction: true,
    },
    ...overrides,
  }
}

// ============================================================================
// RULE 1: BLOCKED_ZERO_CONTRIBUTION
// ============================================================================

describe('RULE 1: BLOCKED_ZERO_CONTRIBUTION', () => {
  test('evidence with status blocked triggers block decision', () => {
    const evidence = makeEvidence({ status: ADAPTER_EVIDENCE_STATUSES.blocked })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('block')
    expect(result.blockedEvidenceIds).toContain(evidence.id)
    expect(result.reasons).toContainEqual(expect.stringContaining('BLOCKED_ZERO_CONTRIBUTION'))
  })

  test('blocked evidence in blockedEvidence array triggers block decision', () => {
    const evidence = makeEvidence({ status: ADAPTER_EVIDENCE_STATUSES.blocked })
    const packet = makePacket({
      allowedEvidence: [],
      blockedEvidence: [evidence],
    })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('block')
    expect(result.blockedEvidenceIds).toContain(evidence.id)
  })
})

// ============================================================================
// RULE 2: SCAFFOLD_NO_STRONG_FORECAST_ALONE
// ============================================================================

describe('RULE 2: SCAFFOLD_NO_STRONG_FORECAST_ALONE', () => {
  test('T3_SCAFFOLD with high confidence triggers downgrade warning', () => {
    const evidence = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T3_SCAFFOLD,
      confidence: 0.85,
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow_with_warnings')
    expect(result.downgradedEvidenceIds).toContain(evidence.id)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'SCAFFOLD_STRENGTH_VIOLATION',
      })
    )
  })

  test('T3_SCAFFOLD with low confidence allowed without downgrade', () => {
    const evidence = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T3_SCAFFOLD,
      confidence: 0.5,
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.downgradedEvidenceIds).not.toContain(evidence.id)
  })
})

// ============================================================================
// RULE 3: UNTRUSTED_NO_STRONG_FORECAST_ALONE
// ============================================================================

describe('RULE 3: UNTRUSTED_NO_STRONG_FORECAST_ALONE', () => {
  test('T5_UNTRUSTED with high confidence triggers downgrade warning', () => {
    const evidence = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T5_UNTRUSTED,
      confidence: 0.85,
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow_with_warnings')
    expect(result.downgradedEvidenceIds).toContain(evidence.id)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'UNTRUSTED_STRENGTH_VIOLATION',
      })
    )
  })
})

// ============================================================================
// RULE 4: UNVERIFIED_NO_STRONG_FORECAST_ALONE
// ============================================================================

describe('RULE 4: UNVERIFIED_NO_STRONG_FORECAST_ALONE', () => {
  test('UNVERIFIED status with zero confidence triggers downgrade warning', () => {
    const evidence = makeEvidence({
      confidence: 0.0,
      status: ADAPTER_EVIDENCE_STATUSES.deferred,
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow_with_warnings')
    expect(result.downgradedEvidenceIds).toContain(evidence.id)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'UNVERIFIED_STRENGTH_VIOLATION',
      })
    )
  })
})

// ============================================================================
// RULE 5: CONFLICTED_MUST_WARN
// ============================================================================

describe('RULE 5: CONFLICTED_MUST_WARN', () => {
  test('evidence with conflicted tag produces warning and is included', () => {
    const evidence = makeEvidence({ tags: ['conflicted'] })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow_with_warnings')
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'CONFLICTED_EVIDENCE',
      })
    )
  })
})

// ============================================================================
// RULE 6: STALE_MUST_DECAY_OR_WARN
// ============================================================================

describe('RULE 6: STALE_MUST_DECAY_OR_WARN', () => {
  test('evidence with stale tag produces warning', () => {
    const evidence = makeEvidence({ tags: ['stale'] })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow_with_warnings')
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'STALE_EVIDENCE',
      })
    )
  })

  test('DEFERRED status produces stale warning', () => {
    const evidence = makeEvidence({ status: ADAPTER_EVIDENCE_STATUSES.deferred })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow_with_warnings')
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'STALE_EVIDENCE',
      })
    )
  })
})

// ============================================================================
// RULE 7: INFERENCE_MUST_RETAIN_LABEL
// ============================================================================

describe('RULE 7: INFERENCE_MUST_RETAIN_LABEL', () => {
  test('T4_INFERENCE evidence produces inference label warning', () => {
    const evidence = makeEvidence({ sourceTier: ADAPTER_SOURCE_TIERS.T4_INFERENCE })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'INFERENCE_LABEL',
      })
    )
  })
})

// ============================================================================
// RULE 8: USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES
// ============================================================================

describe('RULE 8: USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES', () => {
  test('T0_USER_DIRECT with blocked evidence in packet blocks decision', () => {
    const evidence = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T0_USER_DIRECT,
      status: ADAPTER_EVIDENCE_STATUSES.blocked,
    })
    const packet = makePacket({
      allowedEvidence: [evidence],
      blockedEvidence: [],
    })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('block')
  })

  test('T0_USER_DIRECT cannot claim >99% confidence', () => {
    const evidence = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T0_USER_DIRECT,
      confidence: 0.995,
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('block')
    expect(result.reasons).toContainEqual(
      expect.stringContaining('USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES')
    )
  })

  test('T0_USER_DIRECT cannot override autonomous-action boundary', () => {
    const evidence = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T0_USER_DIRECT,
      tags: ['autonomous'],
    })
    const packet = makePacket({
      allowedEvidence: [evidence],
      outputContract: {
        ...makePacket().outputContract,
        forbidAutonomousAction: true,
      },
    })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('block')
  })
})

// ============================================================================
// PACKET-LEVEL VALIDATION
// ============================================================================

describe('Packet-Level Validation', () => {
  test('allowed and blocked evidence separation violation triggers quarantine', () => {
    const evidence = makeEvidence()
    const packet = makePacket({
      allowedEvidence: [evidence],
      blockedEvidence: [evidence],
    })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('quarantine')
    expect(result.reasons).toContainEqual(
      expect.stringContaining('ALLOWED_BLOCKED_SEPARATION_VIOLATION')
    )
  })

  test('empty packet triggers quarantine', () => {
    const packet = makePacket({
      allowedEvidence: [],
      blockedEvidence: [],
    })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('quarantine')
    expect(result.requiredNextGate).toBe('MANUAL_REVIEW')
  })

  test('missing output contract triggers quarantine', () => {
    const packet = makePacket()
    delete (packet as any).outputContract

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe('quarantine')
  })

  test('low-trust-only packet (T4, T5, UNVERIFIED only) triggers downgrade', () => {
    const evidence1 = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T4_INFERENCE,
    })
    const evidence2 = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T5_UNTRUSTED,
    })
    const evidence3 = makeEvidence({
      status: ADAPTER_EVIDENCE_STATUSES.deferred,
    })
    const packet = makePacket({
      allowedEvidence: [evidence1, evidence2, evidence3],
    })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow_with_warnings')
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'LOW_TRUST_ONLY_PACKET',
      })
    )
  })

  test('valid verified packet allows cleanly', () => {
    const evidence = makeEvidence({
      sourceTier: ADAPTER_SOURCE_TIERS.T2_VERIFIED_MODULE,
      status: ADAPTER_EVIDENCE_STATUSES.active,
      confidence: 0.75,
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow')
    expect(result.warnings.length).toBe(0)
    expect(result.blockedEvidenceIds.length).toBe(0)
  })
})

// ============================================================================
// IMMUTABILITY CHECKS
// ============================================================================

describe('Immutability', () => {
  test('validateEvidenceItem does not mutate input', () => {
    const evidence = makeEvidence()
    const original = JSON.parse(JSON.stringify(evidence))

    validateEvidenceItem(evidence)

    expect(evidence).toEqual(original)
  })

  test('evaluateAdapterGate does not mutate packet', () => {
    const packet = makePacket()
    const original = JSON.parse(JSON.stringify(packet))

    evaluateAdapterGate(packet)

    expect(packet).toEqual(original)
  })

  test('evaluateAdapterGate does not mutate evidence items', () => {
    const evidence = makeEvidence()
    const packet = makePacket({ allowedEvidence: [evidence] })
    const original = JSON.parse(JSON.stringify(evidence))

    evaluateAdapterGate(packet)

    expect(evidence).toEqual(original)
  })
})

// ============================================================================
// MATHEMATICAL CRITICAL THINKING PROTOCOL TRIGGERS
// ============================================================================

describe('Mathematical Critical Thinking Protocol Triggers', () => {
  test('high confidence narrow evidence triggers protocol', () => {
    const evidence = makeEvidence({ confidence: 0.85 })
    const packet = makePacket({
      allowedEvidence: [evidence],
      task: 'Decide timing for release',
    })

    const shouldTrigger = shouldTriggerMathematicalCriticalThinking(packet)

    expect(shouldTrigger).toBe(true)
  })

  test('opposing evidence triggers protocol', () => {
    const supporting = makeEvidence({
      id: 'ev-supporting',
      tags: ['supporting'],
    })
    const opposing = makeEvidence({
      id: 'ev-opposing',
      tags: ['opposing'],
    })
    const packet = makePacket({
      allowedEvidence: [supporting, opposing],
    })

    const shouldTrigger = shouldTriggerMathematicalCriticalThinking(packet)

    expect(shouldTrigger).toBe(true)
  })

  test('conflicted evidence triggers protocol', () => {
    const evidence = makeEvidence({ tags: ['conflicted'] })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const shouldTrigger = shouldTriggerMathematicalCriticalThinking(packet)

    expect(shouldTrigger).toBe(true)
  })

  test('high downside risk task triggers protocol', () => {
    const evidence = makeEvidence()
    const packet = makePacket({
      allowedEvidence: [evidence],
      task: 'Recommend spend increase for Q3 campaign',
    })

    const shouldTrigger = shouldTriggerMathematicalCriticalThinking(packet)

    expect(shouldTrigger).toBe(true)
  })

  test('canon boundary at risk triggers protocol', () => {
    const evidence = makeEvidence()
    const packet = makePacket({
      allowedEvidence: [evidence],
      canonBoundaries: ['No certainty claims', 'canon-locked'],
    })

    const shouldTrigger = shouldTriggerMathematicalCriticalThinking(packet)

    expect(shouldTrigger).toBe(true)
  })

  test('trend divergence triggers protocol', () => {
    const evidence = makeEvidence({
      tags: ['current-trend', 'historical-pattern'],
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const shouldTrigger = shouldTriggerMathematicalCriticalThinking(packet)

    expect(shouldTrigger).toBe(true)
  })

  test('empty evidence does not trigger protocol', () => {
    const packet = makePacket({ allowedEvidence: [] })

    const shouldTrigger = shouldTriggerMathematicalCriticalThinking(packet)

    expect(shouldTrigger).toBe(false)
  })
})

// ============================================================================
// EDGE CASES & BOUNDARY CONDITIONS
// ============================================================================

describe('Edge Cases', () => {
  test('multiple evidence items all valid produces allow decision', () => {
    const evidence1 = makeEvidence({
      id: 'ev-001',
      sourceTier: ADAPTER_SOURCE_TIERS.T1_CANON_LOCKED,
    })
    const evidence2 = makeEvidence({
      id: 'ev-002',
      sourceTier: ADAPTER_SOURCE_TIERS.T2_VERIFIED_MODULE,
    })
    const packet = makePacket({ allowedEvidence: [evidence1, evidence2] })

    const result = evaluateAdapterGate(packet)

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe('allow')
  })

  test('validation result includes all required fields', () => {
    const packet = makePacket()
    const result = evaluateAdapterGate(packet)

    expect(result).toHaveProperty('allowed')
    expect(result).toHaveProperty('decision')
    expect(result).toHaveProperty('warnings')
    expect(result).toHaveProperty('blockedEvidenceIds')
    expect(result).toHaveProperty('downgradedEvidenceIds')
    expect(result).toHaveProperty('reasons')
  })

  test('warnings preserve evidence IDs for downstream reference', () => {
    const evidence = makeEvidence({
      id: 'ev-specific',
      tags: ['conflicted'],
    })
    const packet = makePacket({ allowedEvidence: [evidence] })

    const result = evaluateAdapterGate(packet)

    const warning = result.warnings.find(w => w.code === 'CONFLICTED_EVIDENCE')
    expect(warning?.evidenceId).toBe('ev-specific')
  })
})
