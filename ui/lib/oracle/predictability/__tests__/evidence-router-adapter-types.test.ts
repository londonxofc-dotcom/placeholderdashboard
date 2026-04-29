/**
 * evidence-router-adapter-types.test.ts
 *
 * Gate B: Type contract verification only. Tests verify shape and constants.
 * No adapter logic, no Evidence Router wiring, no kernel integration.
 */

import {
  ADAPTER_SOURCE_TIERS,
  ADAPTER_CONFIDENCE_LABELS,
  ADAPTER_EVIDENCE_STATUSES,
  ADAPTER_DOMAINS,
  ADAPTER_WARNING_SEVERITIES,
  ADAPTER_CONTRACT_RULES,
  ADAPTER_EXAMPLE_PROVENANCE,
  ADAPTER_EXAMPLE_EVIDENCE,
  ADAPTER_EXAMPLE_WARNING,
  ADAPTER_EXAMPLE_PROMPT_PACKET,
  ADAPTER_EXAMPLE_FORECAST,
  type AdapterProvenanceRef,
  type AdapterEvidenceItem,
  type AdapterWarning,
  type AdapterPromptContextPacket,
  type AdapterForecastExplanation,
  type AdapterGateDecision,
  type AdapterContractRule,
  type AdapterEvidenceSourceTier,
  type AdapterConfidenceLabel,
  type AdapterEvidenceStatus,
  type AdapterDomain,
  type AdapterWarningSeverity,
} from '../evidence-router-adapter-types'

describe('evidence-router-adapter-types', () => {
  test('ADAPTER_SOURCE_TIERS includes all six tiers', () => {
    expect(ADAPTER_SOURCE_TIERS).toEqual({
      T0_USER_DIRECT: 'T0_USER_DIRECT',
      T1_CANON_LOCKED: 'T1_CANON_LOCKED',
      T2_VERIFIED_MODULE: 'T2_VERIFIED_MODULE',
      T3_SCAFFOLD: 'T3_SCAFFOLD',
      T4_INFERENCE: 'T4_INFERENCE',
      T5_UNTRUSTED: 'T5_UNTRUSTED',
    })
  })

  test('ADAPTER_CONFIDENCE_LABELS includes all seven labels', () => {
    expect(ADAPTER_CONFIDENCE_LABELS).toEqual({
      VERIFIED: 'VERIFIED',
      LIKELY: 'LIKELY',
      INFERRED: 'INFERRED',
      STALE: 'STALE',
      CONFLICTED: 'CONFLICTED',
      UNVERIFIED: 'UNVERIFIED',
      BLOCKED: 'BLOCKED',
    })
  })

  test('ADAPTER_EVIDENCE_STATUSES includes all five statuses', () => {
    expect(ADAPTER_EVIDENCE_STATUSES).toEqual({
      active: 'active',
      scaffold: 'scaffold',
      deferred: 'deferred',
      quarantined: 'quarantined',
      blocked: 'blocked',
    })
  })

  test('ADAPTER_DOMAINS includes BATMAN/WAKANDA/JARVIS/ORACLE/GLOBAL', () => {
    expect(ADAPTER_DOMAINS).toEqual({
      BATMAN: 'BATMAN',
      WAKANDA: 'WAKANDA',
      JARVIS: 'JARVIS',
      ORACLE: 'ORACLE',
      GLOBAL: 'GLOBAL',
    })
  })

  test('ADAPTER_WARNING_SEVERITIES includes info/warn/block', () => {
    expect(ADAPTER_WARNING_SEVERITIES).toEqual({
      info: 'info',
      warn: 'warn',
      block: 'block',
    })
  })

  test('ADAPTER_CONTRACT_RULES is array with eight rules', () => {
    expect(Array.isArray(ADAPTER_CONTRACT_RULES)).toBe(true)
    expect(ADAPTER_CONTRACT_RULES.length).toBe(8)
  })

  test('ADAPTER_CONTRACT_RULES includes BLOCKED_ZERO_CONTRIBUTION rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'BLOCKED_ZERO_CONTRIBUTION')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
    expect(rule?.description).toContain('BLOCKED evidence must contribute zero')
  })

  test('ADAPTER_CONTRACT_RULES includes SCAFFOLD_NO_STRONG_FORECAST_ALONE rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'SCAFFOLD_NO_STRONG_FORECAST_ALONE')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
    expect(rule?.description).toContain('T3_SCAFFOLD cannot create STRONG forecasts')
  })

  test('ADAPTER_CONTRACT_RULES includes UNTRUSTED_NO_STRONG_FORECAST_ALONE rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'UNTRUSTED_NO_STRONG_FORECAST_ALONE')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
  })

  test('ADAPTER_CONTRACT_RULES includes UNVERIFIED_NO_STRONG_FORECAST_ALONE rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'UNVERIFIED_NO_STRONG_FORECAST_ALONE')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
  })

  test('ADAPTER_CONTRACT_RULES includes CONFLICTED_MUST_WARN rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'CONFLICTED_MUST_WARN')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('warn')
    expect(rule?.description).toContain('CONFLICTED evidence must produce warning')
  })

  test('ADAPTER_CONTRACT_RULES includes STALE_MUST_DECAY_OR_WARN rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'STALE_MUST_DECAY_OR_WARN')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('warn')
  })

  test('ADAPTER_CONTRACT_RULES includes INFERENCE_MUST_RETAIN_LABEL rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'INFERENCE_MUST_RETAIN_LABEL')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('warn')
  })

  test('ADAPTER_CONTRACT_RULES includes USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES rule', () => {
    const rule = ADAPTER_CONTRACT_RULES.find(r => r.id === 'USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
    expect(rule?.description).toContain('T0_USER_DIRECT can define task')
  })

  test('AdapterProvenanceRef type allows sourceId and sourceType', () => {
    const ref: AdapterProvenanceRef = {
      sourceId: 'test',
      sourceType: 'direct',
    }
    expect(ref.sourceId).toBe('test')
    expect(ref.sourceType).toBe('direct')
  })

  test('AdapterEvidenceItem type includes required fields', () => {
    const item: AdapterEvidenceItem = {
      id: 'ev-001',
      domain: 'ORACLE',
      claim: 'test claim',
      sourceTier: 'T1_CANON_LOCKED',
      confidence: 0.75,
      status: 'active',
      provenance: ADAPTER_EXAMPLE_PROVENANCE,
    }
    expect(item.id).toBe('ev-001')
    expect(item.confidence).toBeGreaterThanOrEqual(0)
    expect(item.confidence).toBeLessThanOrEqual(1)
  })

  test('AdapterWarning type includes code/message/severity', () => {
    const warning: AdapterWarning = {
      code: 'TEST_WARNING',
      message: 'test message',
      severity: 'warn',
    }
    expect(warning.code).toBe('TEST_WARNING')
    expect(['info', 'warn', 'block']).toContain(warning.severity)
  })

  test('AdapterPromptContextPacket includes allowed and blocked evidence arrays', () => {
    const packet: AdapterPromptContextPacket = {
      task: 'test task',
      allowedEvidence: [],
      blockedEvidence: [],
      warnings: [],
      canonBoundaries: [],
      outputContract: {
        requireProvenanceTrail: true,
        requireFailureModes: true,
        requireAssumptions: true,
        forbidCertaintyLanguage: true,
        forbidAutonomousAction: true,
      },
    }
    expect(Array.isArray(packet.allowedEvidence)).toBe(true)
    expect(Array.isArray(packet.blockedEvidence)).toBe(true)
    expect(packet.outputContract.forbidAutonomousAction).toBe(true)
  })

  test('AdapterForecastExplanation includes provenance trail', () => {
    const forecast: AdapterForecastExplanation = {
      scenario: 'test scenario',
      forecastBand: 'likely',
      confidence: 0.72,
      evidenceBasis: [],
      supportingEvidence: [],
      opposingEvidence: [],
      assumptions: [],
      warnings: [],
      failureModes: [],
      recommendedNextAction: 'test',
      provenanceTrail: [
        {
          step: 'test step',
          lensUsed: 'trend-delta',
          confidenceContribution: 0.35,
        },
      ],
    }
    expect(Array.isArray(forecast.provenanceTrail)).toBe(true)
    expect(forecast.provenanceTrail.length).toBeGreaterThan(0)
  })

  test('file does not export adapter implementation functions', () => {
    // Verify only types and constants are exported, no shouldConsume or shouldPromote functions
    const exports = {
      ADAPTER_SOURCE_TIERS,
      ADAPTER_CONFIDENCE_LABELS,
      ADAPTER_EVIDENCE_STATUSES,
      ADAPTER_DOMAINS,
      ADAPTER_WARNING_SEVERITIES,
      ADAPTER_CONTRACT_RULES,
    }
    Object.values(exports).forEach(exp => {
      expect(typeof exp).not.toBe('function')
    })
  })

  test('example fixtures are non-functional type-safety demonstrations', () => {
    expect(ADAPTER_EXAMPLE_PROVENANCE.sourceId).toBe('src-001')
    expect(ADAPTER_EXAMPLE_EVIDENCE.id).toBe('ev-001')
    expect(ADAPTER_EXAMPLE_WARNING.code).toBe('SCAFFOLD_DOWNGRADE')
    expect(ADAPTER_EXAMPLE_PROMPT_PACKET.task).toContain('Forecast')
    expect(ADAPTER_EXAMPLE_FORECAST.scenario).toContain('Signal')
  })
})
