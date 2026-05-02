import { describe, test, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  mapRouterOutputToAdapterPacket,
  validateRouterOutput,
  validateAndMapRouterOutput,
} from '../evidence-router-bridge'
import type { EvidenceRouterOutput } from '../evidence-router-bridge-types'
import { evaluateAdapterGate } from '../adapter-validation'

// ============================================================================
// FIXTURES
// ============================================================================

function makeValidRouterOutput(overrides: Partial<EvidenceRouterOutput> = {}): EvidenceRouterOutput {
  return {
    evidenceId: 'ev-test-001',
    claim: 'Signal rose 15% over 3 windows',
    domain: 'BATMAN',
    sourceTier: 'canonical',
    confidenceLabel: 'high',
    status: 'active',
    provenanceRefs: [
      {
        source: 'direct-observation',
        url: 'https://example.com/evidence/1',
        timestamp: '2026-05-02T12:00:00Z',
        verificationMethod: 'manual-review',
      },
    ],
    warnings: [],
    canonBoundaries: ['No certainty claims', 'No autonomous action'],
    observedTimestamp: '2026-05-02T12:00:00Z',
    tags: ['trend', 'verified'],
    riskFlags: [],
    ...overrides,
  }
}

// ============================================================================
// mapRouterOutputToAdapterPacket
// ============================================================================

describe('mapRouterOutputToAdapterPacket', () => {
  test('1. valid router output maps to AdapterPromptContextPacket', () => {
    const input = makeValidRouterOutput()
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet).toBeDefined()
    expect(packet.task).toBeDefined()
    expect(packet.allowedEvidence).toBeDefined()
    expect(packet.blockedEvidence).toBeDefined()
    expect(packet.warnings).toBeDefined()
    expect(packet.canonBoundaries).toBeDefined()
    expect(packet.outputContract).toBeDefined()
  })

  test('2. evidenceId maps correctly', () => {
    const input = makeValidRouterOutput({ evidenceId: 'ev-map-id-test' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].id).toBe('ev-map-id-test')
  })

  test('3. claim maps correctly', () => {
    const input = makeValidRouterOutput({ claim: 'Test claim content' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].claim).toBe('Test claim content')
  })

  test('4. sourceTier canonical maps to T1_CANON_LOCKED', () => {
    const input = makeValidRouterOutput({ sourceTier: 'canonical' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].sourceTier).toBe('T1_CANON_LOCKED')
  })

  test('5. sourceTier verified maps to T2_VERIFIED_MODULE', () => {
    const input = makeValidRouterOutput({ sourceTier: 'verified' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].sourceTier).toBe('T2_VERIFIED_MODULE')
  })

  test('6. sourceTier scaffold maps to T3_SCAFFOLD', () => {
    const input = makeValidRouterOutput({ sourceTier: 'scaffold' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].sourceTier).toBe('T3_SCAFFOLD')
  })

  test('7. sourceTier unverified maps to T4_INFERENCE', () => {
    const input = makeValidRouterOutput({ sourceTier: 'unverified' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].sourceTier).toBe('T4_INFERENCE')
  })

  test('8. sourceTier untrusted maps to T5_UNTRUSTED', () => {
    const input = makeValidRouterOutput({ sourceTier: 'untrusted' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].sourceTier).toBe('T5_UNTRUSTED')
  })

  test('9. confidence high maps to 0.85', () => {
    const input = makeValidRouterOutput({ confidenceLabel: 'high' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].confidence).toBe(0.85)
  })

  test('10. confidence medium maps to 0.6', () => {
    const input = makeValidRouterOutput({ confidenceLabel: 'medium' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].confidence).toBe(0.6)
  })

  test('11. confidence low maps to 0.35', () => {
    const input = makeValidRouterOutput({ confidenceLabel: 'low' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].confidence).toBe(0.35)
  })

  test('12. confidence uncertain maps to 0.15', () => {
    const input = makeValidRouterOutput({ confidenceLabel: 'uncertain' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence[0].confidence).toBe(0.15)
  })

  test('13. active evidence lands in allowedEvidence', () => {
    const input = makeValidRouterOutput({ status: 'active' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence.length).toBe(1)
    expect(packet.blockedEvidence.length).toBe(0)
  })

  test('14. warning evidence lands in allowedEvidence and preserves warning metadata', () => {
    const input = makeValidRouterOutput({
      status: 'warning',
      warnings: ['Evidence may be stale'],
    })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence.length).toBe(1)
    expect(packet.blockedEvidence.length).toBe(0)
    expect(packet.warnings.length).toBeGreaterThan(0)
    expect(packet.warnings.some(w => w.message.includes('Evidence may be stale'))).toBe(true)
  })

  test('15. blocked evidence lands in blockedEvidence, not allowedEvidence', () => {
    const input = makeValidRouterOutput({ status: 'blocked' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence.length).toBe(0)
    expect(packet.blockedEvidence.length).toBe(1)
  })

  test('16. quarantined evidence lands in blockedEvidence, not allowedEvidence', () => {
    const input = makeValidRouterOutput({ status: 'quarantined' })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.allowedEvidence.length).toBe(0)
    expect(packet.blockedEvidence.length).toBe(1)
  })

  test('17. provenanceRefs are preserved', () => {
    const input = makeValidRouterOutput({
      provenanceRefs: [
        { source: 'obs-1', url: 'https://a.com', timestamp: '2026-01-01T00:00:00Z', verificationMethod: 'auto' },
        { source: 'obs-2' },
      ],
    })
    const packet = mapRouterOutputToAdapterPacket(input)
    const item = packet.allowedEvidence[0] ?? packet.blockedEvidence[0]
    expect(item.provenance.sourceId).toBeDefined()
    expect(item.provenance.sourceType).toBeDefined()
  })

  test('18. canonBoundaries are preserved', () => {
    const input = makeValidRouterOutput({
      canonBoundaries: ['No certainty claims', 'No autonomous action', 'Expose provenance'],
    })
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.canonBoundaries).toContain('No certainty claims')
    expect(packet.canonBoundaries).toContain('No autonomous action')
    expect(packet.canonBoundaries).toContain('Expose provenance')
  })

  test('19. outputContract preserves Gate D safety defaults', () => {
    const input = makeValidRouterOutput()
    const packet = mapRouterOutputToAdapterPacket(input)
    expect(packet.outputContract.requireProvenanceTrail).toBe(true)
    expect(packet.outputContract.requireFailureModes).toBe(true)
    expect(packet.outputContract.requireAssumptions).toBe(true)
    expect(packet.outputContract.forbidCertaintyLanguage).toBe(true)
    expect(packet.outputContract.forbidAutonomousAction).toBe(true)
  })

  test('20. outputContract has forbidCertaintyLanguage: true', () => {
    const packet = mapRouterOutputToAdapterPacket(makeValidRouterOutput())
    expect(packet.outputContract.forbidCertaintyLanguage).toBe(true)
  })

  test('21. outputContract has forbidAutonomousAction: true', () => {
    const packet = mapRouterOutputToAdapterPacket(makeValidRouterOutput())
    expect(packet.outputContract.forbidAutonomousAction).toBe(true)
  })

  test('22. outputContract has requireAssumptions: true', () => {
    const packet = mapRouterOutputToAdapterPacket(makeValidRouterOutput())
    expect(packet.outputContract.requireAssumptions).toBe(true)
  })

  test('23. outputContract has requireFailureModes: true', () => {
    const packet = mapRouterOutputToAdapterPacket(makeValidRouterOutput())
    expect(packet.outputContract.requireFailureModes).toBe(true)
  })

  test('35. input object is not mutated', () => {
    const input = makeValidRouterOutput()
    const frozen = JSON.parse(JSON.stringify(input))
    mapRouterOutputToAdapterPacket(input)
    expect(input).toEqual(frozen)
  })

  test('domain string maps to AdapterDomain or defaults to GLOBAL', () => {
    const knownDomain = makeValidRouterOutput({ domain: 'BATMAN' })
    const packetKnown = mapRouterOutputToAdapterPacket(knownDomain)
    expect(packetKnown.allowedEvidence[0].domain).toBe('BATMAN')

    const unknownDomain = makeValidRouterOutput({ domain: 'UNKNOWN_DOMAIN' })
    const packetUnknown = mapRouterOutputToAdapterPacket(unknownDomain)
    expect(packetUnknown.allowedEvidence[0].domain).toBe('GLOBAL')
  })
})

// ============================================================================
// validateRouterOutput
// ============================================================================

describe('validateRouterOutput', () => {
  test('valid input passes validation', () => {
    const result = validateRouterOutput(makeValidRouterOutput())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test('24. missing evidenceId fails validation', () => {
    const input = { ...makeValidRouterOutput(), evidenceId: '' }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('evidenceId'))).toBe(true)
  })

  test('24b. undefined evidenceId fails validation', () => {
    const input = { ...makeValidRouterOutput() } as Record<string, unknown>
    delete input.evidenceId
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('evidenceId'))).toBe(true)
  })

  test('25. missing claim fails validation', () => {
    const input = { ...makeValidRouterOutput(), claim: '' }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('claim'))).toBe(true)
  })

  test('26. invalid sourceTier fails validation', () => {
    const input = { ...makeValidRouterOutput(), sourceTier: 'INVALID' as never }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('sourceTier'))).toBe(true)
  })

  test('27. invalid confidenceLabel fails validation', () => {
    const input = { ...makeValidRouterOutput(), confidenceLabel: 'WRONG' as never }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('confidenceLabel'))).toBe(true)
  })

  test('28. invalid status fails validation', () => {
    const input = { ...makeValidRouterOutput(), status: 'NOPE' as never }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('status'))).toBe(true)
  })

  test('29. empty provenanceRefs fails validation', () => {
    const input = { ...makeValidRouterOutput(), provenanceRefs: [] }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('provenanceRefs'))).toBe(true)
  })

  test('30. provenanceRefs without source fails validation', () => {
    const input = { ...makeValidRouterOutput(), provenanceRefs: [{ source: '' }] }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('source'))).toBe(true)
  })

  test('31. missing observedTimestamp fails validation', () => {
    const input = { ...makeValidRouterOutput(), observedTimestamp: '' }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('observedTimestamp'))).toBe(true)
  })

  test('32. malformed observedTimestamp fails validation', () => {
    const input = { ...makeValidRouterOutput(), observedTimestamp: 'not-a-date' }
    const result = validateRouterOutput(input)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('observedTimestamp'))).toBe(true)
  })

  test('null input fails validation', () => {
    const result = validateRouterOutput(null)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('undefined input fails validation', () => {
    const result = validateRouterOutput(undefined)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('non-object input fails validation', () => {
    const result = validateRouterOutput('string-input')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// validateAndMapRouterOutput
// ============================================================================

describe('validateAndMapRouterOutput', () => {
  test('33. returns failure for invalid input', () => {
    const input = { ...makeValidRouterOutput(), evidenceId: '' }
    const result = validateAndMapRouterOutput(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  test('34. returns success for valid input', () => {
    const input = makeValidRouterOutput()
    const result = validateAndMapRouterOutput(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.packet).toBeDefined()
      expect(result.packet.allowedEvidence).toBeDefined()
    }
  })

  test('returns success packet compatible with evaluateAdapterGate', () => {
    const input = makeValidRouterOutput()
    const result = validateAndMapRouterOutput(input)
    expect(result.success).toBe(true)
    if (result.success) {
      const gateResult = evaluateAdapterGate(result.packet)
      expect(gateResult.allowed).toBe(true)
    }
  })
})

// ============================================================================
// IMPORT BOUNDARY TESTS
// ============================================================================

describe('import boundary safety', () => {
  const bridgeSource = fs.readFileSync(
    path.resolve(__dirname, '../evidence-router-bridge.ts'),
    'utf-8',
  )

  const bridgeTypesSource = fs.readFileSync(
    path.resolve(__dirname, '../evidence-router-bridge-types.ts'),
    'utf-8',
  )

  test('36. no direct Evidence Router import in bridge', () => {
    expect(bridgeSource).not.toMatch(/from\s+['"].*evidence-router(?!-adapter|-bridge)/)
  })

  test('37. no direct Predictability Kernel import in bridge', () => {
    expect(bridgeSource).not.toMatch(/from\s+['"].*predictability-kernel/)
  })

  test('38. no model-stage import in bridge', () => {
    expect(bridgeSource).not.toMatch(/from\s+['"].*bayesian-updater/)
    expect(bridgeSource).not.toMatch(/from\s+['"].*monte-carlo/)
    expect(bridgeSource).not.toMatch(/from\s+['"].*markov-regime/)
    expect(bridgeSource).not.toMatch(/from\s+['"].*trend-baseline/)
    expect(bridgeSource).not.toMatch(/from\s+['"].*cycle-phase/)
    expect(bridgeSource).not.toMatch(/from\s+['"].*calibration-ledger/)
  })

  test('36b. no direct Evidence Router import in bridge types', () => {
    expect(bridgeTypesSource).not.toMatch(/from\s+['"].*evidence-router(?!-adapter|-bridge)/)
  })

  test('39. no UI/API/DB/auth behavior in bridge', () => {
    expect(bridgeSource).not.toMatch(/fetch\s*\(/)
    expect(bridgeSource).not.toMatch(/XMLHttpRequest/)
    expect(bridgeSource).not.toMatch(/localStorage/)
    expect(bridgeSource).not.toMatch(/sessionStorage/)
    expect(bridgeSource).not.toMatch(/document\./)
    expect(bridgeSource).not.toMatch(/window\./)
    expect(bridgeSource).not.toMatch(/process\.env/)
    expect(bridgeSource).not.toMatch(/require\s*\(\s*['"]fs/)
    expect(bridgeSource).not.toMatch(/require\s*\(\s*['"]http/)
    expect(bridgeSource).not.toMatch(/import\s+.*from\s+['"]fs/)
    expect(bridgeSource).not.toMatch(/import\s+.*from\s+['"]http/)
  })
})
