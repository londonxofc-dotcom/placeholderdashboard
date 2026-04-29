/**
 * adapter-validation.ts
 *
 * Gate C: Validation logic implementation. Pure functions only.
 * Enforces all 8 core validation rules before evidence packets can adapt forecasts.
 *
 * Authorization: Gate C implementation only — no Evidence Router, kernel, I/O, mutations.
 * Status: Pure, synchronous, immutable transformations.
 */

import {
  AdapterEvidenceItem,
  AdapterPromptContextPacket,
  AdapterWarning,
  AdapterWarningSeverity,
  AdapterConfidenceLabel,
  ADAPTER_CONFIDENCE_LABELS,
  ADAPTER_SOURCE_TIERS,
  ADAPTER_EVIDENCE_STATUSES,
} from './evidence-router-adapter-types'

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationItemResult {
  readonly id: string
  readonly valid: boolean
  readonly violations: readonly string[]
  readonly downgradeRequired: boolean
  readonly confidenceMultiplier: number
  readonly warningsToAdd: readonly AdapterWarning[]
}

export interface AdapterValidationResult {
  readonly allowed: boolean
  readonly decision: 'allow' | 'allow_with_warnings' | 'quarantine' | 'block'
  readonly warnings: readonly AdapterWarning[]
  readonly blockedEvidenceIds: readonly string[]
  readonly downgradedEvidenceIds: readonly string[]
  readonly requiredNextGate?: string
  readonly reasons: readonly string[]
}

// ============================================================================
// HELPER: Create warning
// ============================================================================

function createWarning(
  code: string,
  message: string,
  severity: AdapterWarningSeverity,
  evidenceId?: string
): AdapterWarning {
  return { code, message, severity, evidenceId }
}

// ============================================================================
// RULE 1: BLOCKED_ZERO_CONTRIBUTION
// ============================================================================

function checkBlockedStatus(item: AdapterEvidenceItem): ValidationItemResult {
  const violations: string[] = []
  const warningsToAdd: AdapterWarning[] = []

  if (item.status === ADAPTER_EVIDENCE_STATUSES.blocked) {
    violations.push('BLOCKED_ZERO_CONTRIBUTION: evidence status is blocked')
  }

  if (item.confidence === 0.0 && item.status === ADAPTER_EVIDENCE_STATUSES.blocked) {
    violations.push('BLOCKED_ZERO_CONTRIBUTION: blocked evidence has zero confidence')
  }

  return {
    id: item.id,
    valid: violations.length === 0,
    violations: violations as readonly string[],
    downgradeRequired: violations.length > 0,
    confidenceMultiplier: violations.length > 0 ? 0 : 1,
    warningsToAdd: warningsToAdd as readonly AdapterWarning[],
  }
}

// ============================================================================
// RULE 2: SCAFFOLD_NO_STRONG_FORECAST_ALONE
// ============================================================================

function checkScaffoldDowngrade(item: AdapterEvidenceItem): ValidationItemResult {
  const warningsToAdd: AdapterWarning[] = []
  let downgradeRequired = false
  let multiplier = 1

  if (item.sourceTier === ADAPTER_SOURCE_TIERS.T3_SCAFFOLD && item.confidence > 0.8) {
    downgradeRequired = true
    multiplier = 0.6
    warningsToAdd.push(
      createWarning(
        'SCAFFOLD_STRENGTH_VIOLATION',
        'T3_SCAFFOLD evidence cannot contribute to STRONG forecasts (>80%) alone. Requires pairing with T0–T2 evidence.',
        'warn',
        item.id
      )
    )
  }

  return {
    id: item.id,
    valid: true,
    violations: [] as readonly string[],
    downgradeRequired,
    confidenceMultiplier: multiplier,
    warningsToAdd: warningsToAdd as readonly AdapterWarning[],
  }
}

// ============================================================================
// RULE 3: UNTRUSTED_NO_STRONG_FORECAST_ALONE
// ============================================================================

function checkUntrustedDowngrade(item: AdapterEvidenceItem): ValidationItemResult {
  const warningsToAdd: AdapterWarning[] = []
  let downgradeRequired = false
  let multiplier = 1

  if (item.sourceTier === ADAPTER_SOURCE_TIERS.T5_UNTRUSTED && item.confidence > 0.8) {
    downgradeRequired = true
    multiplier = 0.5
    warningsToAdd.push(
      createWarning(
        'UNTRUSTED_STRENGTH_VIOLATION',
        'T5_UNTRUSTED evidence cannot contribute to STRONG forecasts (>80%) alone. Requires pairing with verified evidence.',
        'warn',
        item.id
      )
    )
  }

  return {
    id: item.id,
    valid: true,
    violations: [] as readonly string[],
    downgradeRequired,
    confidenceMultiplier: multiplier,
    warningsToAdd: warningsToAdd as readonly AdapterWarning[],
  }
}

// ============================================================================
// RULE 4: UNVERIFIED_NO_STRONG_FORECAST_ALONE
// ============================================================================

function checkUnverifiedDowngrade(item: AdapterEvidenceItem): ValidationItemResult {
  const warningsToAdd: AdapterWarning[] = []
  let downgradeRequired = false
  let multiplier = 1

  if (item.confidence === 0.0 && item.status === ADAPTER_EVIDENCE_STATUSES.deferred) {
    downgradeRequired = true
    multiplier = 0.4
    warningsToAdd.push(
      createWarning(
        'UNVERIFIED_STRENGTH_VIOLATION',
        'UNVERIFIED evidence cannot create STRONG forecasts (>80%) alone. Must be paired with VERIFIED or LIKELY evidence.',
        'warn',
        item.id
      )
    )
  }

  return {
    id: item.id,
    valid: true,
    violations: [] as readonly string[],
    downgradeRequired,
    confidenceMultiplier: multiplier,
    warningsToAdd: warningsToAdd as readonly AdapterWarning[],
  }
}

// ============================================================================
// RULE 5: CONFLICTED_MUST_WARN
// ============================================================================

function checkConflictedWarning(item: AdapterEvidenceItem): ValidationItemResult {
  const warningsToAdd: AdapterWarning[] = []
  let downgradeRequired = false

  if (item.tags?.includes('conflicted')) {
    downgradeRequired = true
    warningsToAdd.push(
      createWarning(
        'CONFLICTED_EVIDENCE',
        'This evidence contradicts other evidence in the packet. Preserved with warning label.',
        'warn',
        item.id
      )
    )
  }

  return {
    id: item.id,
    valid: true,
    violations: [] as readonly string[],
    downgradeRequired,
    confidenceMultiplier: 0.8,
    warningsToAdd: warningsToAdd as readonly AdapterWarning[],
  }
}

// ============================================================================
// RULE 6: STALE_MUST_DECAY_OR_WARN
// ============================================================================

function checkStaleDecay(item: AdapterEvidenceItem): ValidationItemResult {
  const warningsToAdd: AdapterWarning[] = []
  let downgradeRequired = false

  if (item.status === ADAPTER_EVIDENCE_STATUSES.deferred || item.tags?.includes('stale')) {
    downgradeRequired = true
    warningsToAdd.push(
      createWarning(
        'STALE_EVIDENCE',
        'Evidence is old relative to current session. Confidence decayed and warning applied.',
        'warn',
        item.id
      )
    )
  }

  return {
    id: item.id,
    valid: true,
    violations: [] as readonly string[],
    downgradeRequired,
    confidenceMultiplier: 0.7,
    warningsToAdd: warningsToAdd as readonly AdapterWarning[],
  }
}

// ============================================================================
// RULE 7: INFERENCE_MUST_RETAIN_LABEL
// ============================================================================

function checkInferenceLabel(item: AdapterEvidenceItem): ValidationItemResult {
  const warningsToAdd: AdapterWarning[] = []
  let downgradeRequired = false

  if (item.sourceTier === ADAPTER_SOURCE_TIERS.T4_INFERENCE) {
    downgradeRequired = true
    warningsToAdd.push(
      createWarning(
        'INFERENCE_LABEL',
        'T4_INFERENCE evidence. Derived/computed, not directly observed. Must remain labeled as inference.',
        'warn',
        item.id
      )
    )
  }

  return {
    id: item.id,
    valid: true,
    violations: [] as readonly string[],
    downgradeRequired,
    confidenceMultiplier: 1.0,
    warningsToAdd: warningsToAdd as readonly AdapterWarning[],
  }
}

// ============================================================================
// RULE 8: USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES
// ============================================================================

function checkUserDirectBoundaries(
  item: AdapterEvidenceItem,
  packet: AdapterPromptContextPacket
): ValidationItemResult {
  const violations: string[] = []

  if (item.sourceTier === ADAPTER_SOURCE_TIERS.T0_USER_DIRECT) {
    if (item.status === ADAPTER_EVIDENCE_STATUSES.blocked) {
      violations.push('USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES: user cannot suppress blocked evidence')
    }
    if (item.confidence > 0.99) {
      violations.push('USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES: user cannot claim certainty >99%')
    }
    if (packet.outputContract.forbidAutonomousAction && item.tags?.includes('autonomous')) {
      violations.push('USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES: user cannot disable autonomous-action boundary')
    }
  }

  return {
    id: item.id,
    valid: violations.length === 0,
    violations: violations as readonly string[],
    downgradeRequired: violations.length > 0,
    confidenceMultiplier: 1.0,
    warningsToAdd: [] as readonly AdapterWarning[],
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

export function validateEvidenceItem(item: AdapterEvidenceItem, packet?: AdapterPromptContextPacket): ValidationItemResult {
  const results: ValidationItemResult[] = [
    checkBlockedStatus(item),
    checkScaffoldDowngrade(item),
    checkUntrustedDowngrade(item),
    checkUnverifiedDowngrade(item),
    checkConflictedWarning(item),
    checkStaleDecay(item),
    checkInferenceLabel(item),
  ]

  if (packet) {
    results.push(checkUserDirectBoundaries(item, packet))
  }

  const allViolations = results.flatMap(r => r.violations)
  const allWarnings = results.flatMap(r => r.warningsToAdd)
  const anyDowngrades = results.some(r => r.downgradeRequired)
  const multiplier = results.reduce((acc, r) => acc * r.confidenceMultiplier, 1)

  return {
    id: item.id,
    valid: allViolations.length === 0,
    violations: allViolations as readonly string[],
    downgradeRequired: anyDowngrades,
    confidenceMultiplier: multiplier,
    warningsToAdd: allWarnings as readonly AdapterWarning[],
  }
}

export function validatePromptContextPacket(packet: AdapterPromptContextPacket): readonly string[] {
  const errors: string[] = []

  if (!packet.allowedEvidence || !packet.blockedEvidence) {
    errors.push('PACKET_STRUCTURE_INVALID: allowedEvidence or blockedEvidence missing')
  }

  const allowedIds = new Set(packet.allowedEvidence.map(e => e.id))
  const blockedIds = new Set(packet.blockedEvidence.map(e => e.id))

  const intersection = [...allowedIds].filter(id => blockedIds.has(id))
  if (intersection.length > 0) {
    errors.push(`ALLOWED_BLOCKED_SEPARATION_VIOLATION: evidence appears in both allowed and blocked: ${intersection.join(', ')}`)
  }

  if (!packet.canonBoundaries || packet.canonBoundaries.length === 0) {
    errors.push('CANON_BOUNDARIES_MISSING: packet must preserve canonBoundaries array')
  }

  if (!packet.outputContract) {
    errors.push('OUTPUT_CONTRACT_MISSING: packet must include outputContract')
  }

  if (packet.allowedEvidence.length === 0 && packet.blockedEvidence.length === 0) {
    errors.push('EMPTY_PACKET: packet contains zero evidence, cannot produce STRONG forecast')
  }

  return errors as readonly string[]
}

export function evaluateAdapterGate(packet: AdapterPromptContextPacket): AdapterValidationResult {
  const packetErrors = validatePromptContextPacket(packet)
  const blockedIds: string[] = []
  const downgradedIds: string[] = []
  const allWarnings: AdapterWarning[] = [...packet.warnings]

  if (packetErrors.length > 0) {
    const hasEmptyPacketError = packetErrors.some(e => e.includes('EMPTY_PACKET'))
    if (hasEmptyPacketError) {
      return {
        allowed: false,
        decision: 'quarantine',
        warnings: allWarnings as readonly AdapterWarning[],
        blockedEvidenceIds: [] as readonly string[],
        downgradedEvidenceIds: [] as readonly string[],
        requiredNextGate: 'MANUAL_REVIEW',
        reasons: ['Empty packet cannot be evaluated. No evidence provided for validation.'] as readonly string[],
      }
    }

    return {
      allowed: false,
      decision: 'quarantine',
      warnings: allWarnings as readonly AdapterWarning[],
      blockedEvidenceIds: [] as readonly string[],
      downgradedEvidenceIds: [] as readonly string[],
      requiredNextGate: 'MANUAL_REVIEW',
      reasons: packetErrors as readonly string[],
    }
  }

  for (const evidence of packet.blockedEvidence) {
    blockedIds.push(evidence.id)
  }

  if (blockedIds.length > 0) {
    return {
      allowed: false,
      decision: 'block',
      warnings: allWarnings as readonly AdapterWarning[],
      blockedEvidenceIds: blockedIds as readonly string[],
      downgradedEvidenceIds: [] as readonly string[],
      reasons: [`Blocked evidence present: ${blockedIds.join(', ')}. Cannot adapt forecast.`] as readonly string[],
    }
  }

  for (const evidence of packet.allowedEvidence) {
    const validation = validateEvidenceItem(evidence, packet)

    if (!validation.valid) {
      return {
        allowed: false,
        decision: 'block',
        warnings: [...allWarnings, ...validation.warningsToAdd] as readonly AdapterWarning[],
        blockedEvidenceIds: [evidence.id] as readonly string[],
        downgradedEvidenceIds: [] as readonly string[],
        reasons: validation.violations as readonly string[],
      }
    }

    if (validation.downgradeRequired) {
      downgradedIds.push(evidence.id)
    }

    allWarnings.push(...validation.warningsToAdd)
  }

  const lowTrustOnly = packet.allowedEvidence.every(
    e =>
      e.sourceTier === ADAPTER_SOURCE_TIERS.T4_INFERENCE ||
      e.sourceTier === ADAPTER_SOURCE_TIERS.T5_UNTRUSTED ||
      e.status === ADAPTER_EVIDENCE_STATUSES.deferred
  )

  if (lowTrustOnly && packet.allowedEvidence.length > 0) {
    allWarnings.push(
      createWarning(
        'LOW_TRUST_ONLY_PACKET',
        'Packet contains only low-confidence evidence (T4_INFERENCE, T5_UNTRUSTED, UNVERIFIED). Forecast strength is capped. Recommend pairing with higher-tier evidence.',
        'warn'
      )
    )
  }

  if (packet.blockedEvidence.length > 0 && allWarnings.length === 0) {
    allWarnings.push(
      createWarning(
        'BLOCKED_VISIBILITY_VIOLATION',
        'Blocked evidence present but no warnings were generated during validation. Ensure blockers are visible to the user.',
        'error'
      )
    )
  }

  const decision = allWarnings.length > 0 ? 'allow_with_warnings' : 'allow'

  return {
    allowed: true,
    decision,
    warnings: allWarnings as readonly AdapterWarning[],
    blockedEvidenceIds: [] as readonly string[],
    downgradedEvidenceIds: downgradedIds as readonly string[],
    reasons: [
      decision === 'allow'
        ? 'All evidence validated. Packet approved for adaptation.'
        : 'Evidence validated with warnings. Packet approved for adaptation with caution.',
    ] as readonly string[],
  }
}

export function shouldTriggerMathematicalCriticalThinking(packet: AdapterPromptContextPacket): boolean {
  if (packet.allowedEvidence.length === 0) {
    return false
  }

  const highConfidenceNarrowEvidence =
    packet.allowedEvidence.length <= 2 &&
    packet.allowedEvidence.some(e => e.confidence > 0.8)

  const opposingEvidenceExists =
    packet.allowedEvidence.some(e => e.tags?.includes('supporting')) &&
    packet.allowedEvidence.some(e => e.tags?.includes('opposing'))

  const conflictedEvidenceExists = packet.allowedEvidence.some(e => e.tags?.includes('conflicted'))

  const canonBoundaryAtRisk = packet.canonBoundaries.some(
    b => b.includes('certainty') || b.includes('canon') || b.includes('autonomous')
  )

  const trendDivergence = packet.allowedEvidence.some(
    e =>
      e.tags?.includes('trend-divergence') ||
      (e.tags?.includes('current-trend') && e.tags?.includes('historical-pattern'))
  )

  const highDownsideRisk = packet.task.toLowerCase().includes('release') ||
    packet.task.toLowerCase().includes('public') ||
    packet.task.toLowerCase().includes('spend') ||
    packet.task.toLowerCase().includes('timing')

  return (
    highConfidenceNarrowEvidence ||
    opposingEvidenceExists ||
    conflictedEvidenceExists ||
    canonBoundaryAtRisk ||
    trendDivergence ||
    highDownsideRisk
  )
}
