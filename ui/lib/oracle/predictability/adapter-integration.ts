/**
 * adapter-integration.ts
 *
 * Gate D: Adapter integration layer (pure functions only)
 * Transforms validated Evidence Router packets into Predictability Kernel inputs
 * and Predictability Kernel outputs into advisory forecast explanations.
 *
 * Authorization: Gate D fixture-based adapter implementation only
 * Status: Pure, synchronous, immutable transformations. No I/O, no kernel calls, no live Evidence Router wiring.
 */

import {
  type AdapterPromptContextPacket,
  type AdapterEvidenceItem,
  type AdapterWarning,
  ADAPTER_SOURCE_TIERS,
  ADAPTER_EVIDENCE_STATUSES,
} from './evidence-router-adapter-types'
import { evaluateAdapterGate, shouldTriggerMathematicalCriticalThinking } from './adapter-validation'
import type { AdapterValidationResult, ValidationItemResult } from './adapter-validation'

// ============================================================================
// KERNEL INPUT TYPES (Fixture structures for transformation)
// ============================================================================

export interface HistoricalEvidenceEvent {
  readonly sourceId: string
  readonly claim: string
  readonly sourceReliability: string
  readonly originalConfidence: number
  readonly adjustedConfidence: number
  readonly observedAt: string
}

export interface PredictabilityInput {
  readonly objective: string
  readonly historicalEvents: readonly HistoricalEvidenceEvent[]
  readonly excludedEvidenceIds: readonly string[]
  readonly validationWarnings: readonly AdapterWarning[]
  readonly hardConstraints: readonly string[]
  readonly outputConstraints: { readonly forbidAutonomousAction: boolean }
  readonly provenanceTrail: readonly string[]
  readonly shouldTriggerMCT: boolean
}

export interface PredictabilityForecast {
  readonly signal: number
  readonly confidence: number
}

export interface AdapterForecastExplanation {
  readonly forecast: PredictabilityForecast
  readonly disclaimers: readonly string[]
  readonly warnings: readonly AdapterWarning[]
  readonly provenanceTrail: readonly string[]
  readonly assumptionsBoundary: readonly string[]
}

export interface AdapterIntegrationResult {
  readonly allowed: boolean
  readonly decision: 'allow' | 'allow_with_warnings' | 'quarantine' | 'block'
  readonly validation: AdapterValidationResult
  readonly adaptedInput?: PredictabilityInput
  readonly blockedEvidenceIds: readonly string[]
  readonly warnings: readonly AdapterWarning[]
  readonly reasons: readonly string[]
}

// ============================================================================
// HELPER: Map source tier to reliability label
// ============================================================================

function mapSourceTierToReliability(tier: string): string {
  switch (tier) {
    case ADAPTER_SOURCE_TIERS.T0_USER_DIRECT:
      return 'direct_user_assertion'
    case ADAPTER_SOURCE_TIERS.T1_CANON_LOCKED:
      return 'direct_observation'
    case ADAPTER_SOURCE_TIERS.T2_VERIFIED_MODULE:
      return 'verified_source'
    case ADAPTER_SOURCE_TIERS.T3_SCAFFOLD:
      return 'scaffold_reasoning'
    case ADAPTER_SOURCE_TIERS.T4_INFERENCE:
      return 'derived_inference'
    case ADAPTER_SOURCE_TIERS.T5_UNTRUSTED:
      return 'untrusted_source'
    default:
      return 'unknown_tier'
  }
}

// ============================================================================
// HELPER: Extract confidence multiplier from validation result
// ============================================================================

function getConfidenceMultiplier(
  evidenceId: string,
  validation: AdapterValidationResult
): number {
  if (validation.downgradedEvidenceIds.includes(evidenceId)) {
    // Check validation warnings for this evidence to infer multiplier
    const warnings = validation.warnings.filter(w => w.evidenceId === evidenceId)
    if (warnings.some(w => w.code === 'BLOCKED_ZERO_CONTRIBUTION')) {
      return 0
    }
    if (warnings.some(w => w.code === 'SCAFFOLD_STRENGTH_VIOLATION')) {
      return 0.6
    }
    if (warnings.some(w => w.code === 'UNTRUSTED_STRENGTH_VIOLATION')) {
      return 0.5
    }
    if (warnings.some(w => w.code === 'UNVERIFIED_STRENGTH_VIOLATION')) {
      return 0.4
    }
    if (warnings.some(w => w.code === 'CONFLICTED_EVIDENCE')) {
      return 0.8
    }
    if (warnings.some(w => w.code === 'STALE_EVIDENCE')) {
      return 0.7
    }
    // Default downgrade if no specific code found
    return 0.8
  }
  return 1.0
}

// ============================================================================
// MAIN INTEGRATION FUNCTIONS
// ============================================================================

export function validateThenAdaptPacket(
  packet: AdapterPromptContextPacket
): AdapterIntegrationResult {
  const validation = evaluateAdapterGate(packet)

  if (!validation.allowed) {
    return {
      allowed: false,
      decision: validation.decision,
      validation,
      blockedEvidenceIds: validation.blockedEvidenceIds,
      warnings: validation.warnings,
      reasons: validation.reasons,
    }
  }

  const adaptedInput = adapterPacketToPredictabilityInput(packet, validation)

  return {
    allowed: true,
    decision: validation.decision,
    validation,
    adaptedInput,
    blockedEvidenceIds: validation.blockedEvidenceIds,
    warnings: validation.warnings,
    reasons: validation.reasons,
  }
}

export function adapterPacketToPredictabilityInput(
  packet: AdapterPromptContextPacket,
  validation: AdapterValidationResult
): PredictabilityInput {
  // Map allowed evidence to historical events
  const historicalEvents: HistoricalEvidenceEvent[] = packet.allowedEvidence.map(evidence => {
    const multiplier = getConfidenceMultiplier(evidence.id, validation)
    return {
      sourceId: evidence.id,
      claim: evidence.claim,
      sourceReliability: mapSourceTierToReliability(evidence.sourceTier),
      originalConfidence: evidence.confidence,
      adjustedConfidence: evidence.confidence * multiplier,
      observedAt: evidence.observedAt ?? evidence.provenance?.observedAt ?? '',
    }
  })

  // Preserve blocked evidence IDs separately
  const excludedEvidenceIds = packet.blockedEvidence.map(e => e.id)

  // Preserve validation warnings
  const validationWarnings = validation.warnings

  // Map canon boundaries to hard constraints
  const hardConstraints = packet.canonBoundaries

  // Map output contract to output constraints
  const outputConstraints = packet.outputContract

  // Build provenance trail from evidence and warnings
  const provenanceTrail: string[] = packet.allowedEvidence.map(
    e => `${e.id}: ${e.claim} (tier=${e.sourceTier}, confidence=${e.confidence})`
  )
  if (validation.warnings.length > 0) {
    provenanceTrail.push(
      ...validation.warnings.map(w => `${w.code}: ${w.message}`)
    )
  }

  // Check if MCT should trigger
  const shouldTriggerMCT = shouldTriggerMathematicalCriticalThinking(packet)

  return {
    objective: packet.task,
    historicalEvents: historicalEvents as readonly HistoricalEvidenceEvent[],
    excludedEvidenceIds: excludedEvidenceIds as readonly string[],
    validationWarnings: validationWarnings,
    hardConstraints: hardConstraints,
    outputConstraints,
    provenanceTrail: provenanceTrail as readonly string[],
    shouldTriggerMCT,
  }
}

export function predictabilityForecastToAdapterExplanation(
  forecast: PredictabilityForecast,
  input: PredictabilityInput,
  validation: AdapterValidationResult,
  packet: AdapterPromptContextPacket
): AdapterForecastExplanation {
  // Build disclaimers emphasizing advisory nature
  const disclaimers: string[] = [
    'This forecast is advisory only and does not constitute a recommendation or prediction of future events.',
    'All forecasts carry inherent uncertainty. Human judgment and review are required before any action.',
    'Evidence quality varies by source tier. Lower-tier evidence has been downgraded and should be weighted accordingly.',
  ]

  // Preserve all validation warnings
  const warnings = validation.warnings

  // Preserve provenance trail from input
  const provenanceTrail = input.provenanceTrail

  // Map canon boundaries to assumptions and boundary statements
  const assumptionsBoundary = packet.canonBoundaries

  return {
    forecast,
    disclaimers: disclaimers as readonly string[],
    warnings,
    provenanceTrail,
    assumptionsBoundary,
  }
}
