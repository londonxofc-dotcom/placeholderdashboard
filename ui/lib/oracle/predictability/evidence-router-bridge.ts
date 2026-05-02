/**
 * evidence-router-bridge.ts
 *
 * Gate E: Pure functions that bridge Evidence Router output-shaped data
 * into the existing Gate B/C/D adapter pipeline.
 *
 * This is fixture-first. No live Evidence Router import. No I/O.
 * No Predictability Kernel import. No model-stage imports.
 * No mutation. No side effects.
 *
 * Imports only from:
 * - ./evidence-router-bridge-types (Gate E type contracts)
 * - ./evidence-router-adapter-types (Gate B type contracts, read-only)
 *
 * Status: Gate E implementation.
 */

import type {
  EvidenceRouterOutput,
  RouterOutputValidationResult,
  ValidateAndMapResult,
} from './evidence-router-bridge-types'

import {
  EVIDENCE_ROUTER_SOURCE_TIERS,
  EVIDENCE_ROUTER_CONFIDENCE_LABELS,
  EVIDENCE_ROUTER_STATUSES,
} from './evidence-router-bridge-types'

import type {
  AdapterPromptContextPacket,
  AdapterEvidenceItem,
  AdapterEvidenceSourceTier,
  AdapterEvidenceStatus,
  AdapterDomain,
  AdapterProvenanceRef,
  AdapterWarning,
} from './evidence-router-adapter-types'

import {
  ADAPTER_SOURCE_TIERS,
  ADAPTER_DOMAINS,
} from './evidence-router-adapter-types'

// ============================================================================
// MAPPING CONSTANTS
// ============================================================================

const SOURCE_TIER_MAP: Record<string, AdapterEvidenceSourceTier> = {
  canonical: ADAPTER_SOURCE_TIERS.T1_CANON_LOCKED,
  verified: ADAPTER_SOURCE_TIERS.T2_VERIFIED_MODULE,
  scaffold: ADAPTER_SOURCE_TIERS.T3_SCAFFOLD,
  unverified: ADAPTER_SOURCE_TIERS.T4_INFERENCE,
  untrusted: ADAPTER_SOURCE_TIERS.T5_UNTRUSTED,
}

const CONFIDENCE_LABEL_TO_NUMERIC: Record<string, number> = {
  high: 0.85,
  medium: 0.6,
  low: 0.35,
  uncertain: 0.15,
}

const STATUS_TO_ADAPTER: Record<string, AdapterEvidenceStatus> = {
  active: 'active',
  warning: 'active',
  blocked: 'blocked',
  quarantined: 'quarantined',
}

const KNOWN_DOMAINS: ReadonlySet<string> = new Set(
  Object.values(ADAPTER_DOMAINS),
)

// ============================================================================
// mapRouterOutputToAdapterPacket
// ============================================================================

export function mapRouterOutputToAdapterPacket(
  routerOutput: EvidenceRouterOutput,
): AdapterPromptContextPacket {
  const domain: AdapterDomain = KNOWN_DOMAINS.has(routerOutput.domain)
    ? (routerOutput.domain as AdapterDomain)
    : ADAPTER_DOMAINS.GLOBAL

  const sourceTier = SOURCE_TIER_MAP[routerOutput.sourceTier]
  const confidence = CONFIDENCE_LABEL_TO_NUMERIC[routerOutput.confidenceLabel]
  const adapterStatus = STATUS_TO_ADAPTER[routerOutput.status]

  const provenance: AdapterProvenanceRef = {
    sourceId: routerOutput.provenanceRefs[0]?.source ?? 'unknown',
    sourceType: routerOutput.provenanceRefs[0]?.verificationMethod ?? 'unspecified',
    path: routerOutput.provenanceRefs[0]?.url,
    observedAt: routerOutput.provenanceRefs[0]?.timestamp,
    notes: routerOutput.provenanceRefs.length > 1
      ? `${routerOutput.provenanceRefs.length} provenance refs; additional refs available`
      : undefined,
  }

  const evidenceItem: AdapterEvidenceItem = {
    id: routerOutput.evidenceId,
    domain,
    claim: routerOutput.claim,
    sourceTier,
    confidence,
    status: adapterStatus,
    provenance,
    tags: routerOutput.tags,
    observedAt: routerOutput.observedTimestamp,
    notes: routerOutput.riskFlags && routerOutput.riskFlags.length > 0
      ? `Risk flags: ${routerOutput.riskFlags.join(', ')}`
      : undefined,
  }

  const isBlocked = routerOutput.status === 'blocked' || routerOutput.status === 'quarantined'

  const warnings: readonly AdapterWarning[] = (routerOutput.warnings ?? []).map(
    (warningText, index): AdapterWarning => ({
      code: `ROUTER_WARNING_${index}`,
      message: warningText,
      severity: 'warn',
      evidenceId: routerOutput.evidenceId,
    }),
  )

  return {
    task: `Process evidence: ${routerOutput.claim}`,
    allowedEvidence: isBlocked ? [] : [evidenceItem],
    blockedEvidence: isBlocked ? [evidenceItem] : [],
    warnings,
    canonBoundaries: routerOutput.canonBoundaries ?? [],
    outputContract: {
      requireProvenanceTrail: true,
      requireFailureModes: true,
      requireAssumptions: true,
      forbidCertaintyLanguage: true,
      forbidAutonomousAction: true,
    },
  }
}

// ============================================================================
// validateRouterOutput
// ============================================================================

export function validateRouterOutput(
  input: unknown,
): RouterOutputValidationResult {
  const errors: string[] = []

  if (input === null || input === undefined || typeof input !== 'object') {
    return { valid: false, errors: ['Input must be a non-null object'] }
  }

  const obj = input as Record<string, unknown>

  if (typeof obj.evidenceId !== 'string' || obj.evidenceId.length === 0) {
    errors.push('evidenceId must be a non-empty string')
  }

  if (typeof obj.claim !== 'string' || obj.claim.length === 0) {
    errors.push('claim must be a non-empty string')
  }

  if (typeof obj.domain !== 'string' || obj.domain.length === 0) {
    errors.push('domain must be a non-empty string')
  }

  if (
    typeof obj.sourceTier !== 'string' ||
    !(EVIDENCE_ROUTER_SOURCE_TIERS as readonly string[]).includes(obj.sourceTier)
  ) {
    errors.push(
      `sourceTier must be one of: ${EVIDENCE_ROUTER_SOURCE_TIERS.join(', ')}`,
    )
  }

  if (
    typeof obj.confidenceLabel !== 'string' ||
    !(EVIDENCE_ROUTER_CONFIDENCE_LABELS as readonly string[]).includes(obj.confidenceLabel)
  ) {
    errors.push(
      `confidenceLabel must be one of: ${EVIDENCE_ROUTER_CONFIDENCE_LABELS.join(', ')}`,
    )
  }

  if (
    typeof obj.status !== 'string' ||
    !(EVIDENCE_ROUTER_STATUSES as readonly string[]).includes(obj.status)
  ) {
    errors.push(
      `status must be one of: ${EVIDENCE_ROUTER_STATUSES.join(', ')}`,
    )
  }

  if (!Array.isArray(obj.provenanceRefs) || obj.provenanceRefs.length === 0) {
    errors.push('provenanceRefs must be a non-empty array')
  } else {
    const hasValidSource = obj.provenanceRefs.some(
      (ref: unknown) =>
        ref !== null &&
        typeof ref === 'object' &&
        typeof (ref as Record<string, unknown>).source === 'string' &&
        ((ref as Record<string, unknown>).source as string).length > 0,
    )
    if (!hasValidSource) {
      errors.push('provenanceRefs must contain at least one entry with a non-empty source')
    }
  }

  if (typeof obj.observedTimestamp !== 'string' || obj.observedTimestamp.length === 0) {
    errors.push('observedTimestamp must be a non-empty string')
  } else if (isNaN(Date.parse(obj.observedTimestamp as string))) {
    errors.push('observedTimestamp must be a parseable timestamp')
  }

  if (obj.warnings !== undefined && !Array.isArray(obj.warnings)) {
    errors.push('warnings must be an array if present')
  }

  if (obj.canonBoundaries !== undefined && !Array.isArray(obj.canonBoundaries)) {
    errors.push('canonBoundaries must be an array if present')
  }

  if (obj.tags !== undefined && !Array.isArray(obj.tags)) {
    errors.push('tags must be an array if present')
  }

  if (obj.riskFlags !== undefined && !Array.isArray(obj.riskFlags)) {
    errors.push('riskFlags must be an array if present')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [] as const }
}

// ============================================================================
// validateAndMapRouterOutput
// ============================================================================

export function validateAndMapRouterOutput(
  input: unknown,
): ValidateAndMapResult {
  const validation = validateRouterOutput(input)

  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }

  const packet = mapRouterOutputToAdapterPacket(input as EvidenceRouterOutput)
  return { success: true, packet }
}
