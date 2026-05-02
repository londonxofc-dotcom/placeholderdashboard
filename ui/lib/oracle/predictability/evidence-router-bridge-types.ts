/**
 * evidence-router-bridge-types.ts
 *
 * Gate E: Type contracts for the Evidence Router → Adapter bridge.
 * Defines the shape of Evidence Router output and validation/mapping result types.
 *
 * No imports from live Evidence Router source code.
 * No imports from Predictability Kernel.
 * No imports from model stages M-A through M-I.
 * No I/O. No mutation. No side effects.
 *
 * Status: Gate E type contracts.
 */

// ============================================================================
// EVIDENCE ROUTER OUTPUT CONTRACT
// ============================================================================

/**
 * Standalone contract defining the expected shape of Evidence Router output.
 * This does NOT import from the Evidence Router — it is a boundary contract
 * that router output must conform to before entering the adapter pipeline.
 */
export interface EvidenceRouterOutput {
  readonly evidenceId: string
  readonly claim: string
  readonly domain: string
  readonly sourceTier: 'canonical' | 'verified' | 'scaffold' | 'unverified' | 'untrusted'
  readonly confidenceLabel: 'high' | 'medium' | 'low' | 'uncertain'
  readonly status: 'active' | 'blocked' | 'quarantined' | 'warning'
  readonly provenanceRefs: readonly EvidenceRouterProvenanceRef[]
  readonly warnings?: readonly string[]
  readonly canonBoundaries?: readonly string[]
  readonly observedTimestamp: string
  readonly tags?: readonly string[]
  readonly riskFlags?: readonly string[]
}

export interface EvidenceRouterProvenanceRef {
  readonly source: string
  readonly url?: string
  readonly timestamp?: string
  readonly verificationMethod?: string
}

// ============================================================================
// SOURCE TIER VALUES
// ============================================================================

export const EVIDENCE_ROUTER_SOURCE_TIERS = [
  'canonical',
  'verified',
  'scaffold',
  'unverified',
  'untrusted',
] as const

export type EvidenceRouterSourceTier = typeof EVIDENCE_ROUTER_SOURCE_TIERS[number]

// ============================================================================
// CONFIDENCE LABEL VALUES
// ============================================================================

export const EVIDENCE_ROUTER_CONFIDENCE_LABELS = [
  'high',
  'medium',
  'low',
  'uncertain',
] as const

export type EvidenceRouterConfidenceLabel = typeof EVIDENCE_ROUTER_CONFIDENCE_LABELS[number]

// ============================================================================
// STATUS VALUES
// ============================================================================

export const EVIDENCE_ROUTER_STATUSES = [
  'active',
  'blocked',
  'quarantined',
  'warning',
] as const

export type EvidenceRouterStatus = typeof EVIDENCE_ROUTER_STATUSES[number]

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export type RouterOutputValidationResult =
  | { readonly valid: true; readonly errors: readonly [] }
  | { readonly valid: false; readonly errors: readonly string[] }

// ============================================================================
// VALIDATE-AND-MAP RESULT
// ============================================================================

import type { AdapterPromptContextPacket } from './evidence-router-adapter-types'

export type ValidateAndMapResult =
  | { readonly success: true; readonly packet: AdapterPromptContextPacket }
  | { readonly success: false; readonly errors: readonly string[] }
