/**
 * evidence-router-adapter-types.ts
 *
 * Gate B: Type contracts only. No adapter logic, no Evidence Router wiring, no kernel integration.
 * This file defines the vocabulary of the bridge between Evidence Router and Predictability Kernel.
 * No imports. No I/O. Pure type definitions and contract constants.
 *
 * Status: Specification-only. Gates C/D unlock implementation.
 */

// ============================================================================
// SOURCE TIER AUTHORITY
// ============================================================================

export const ADAPTER_SOURCE_TIERS = {
  T0_USER_DIRECT: 'T0_USER_DIRECT',
  T1_CANON_LOCKED: 'T1_CANON_LOCKED',
  T2_VERIFIED_MODULE: 'T2_VERIFIED_MODULE',
  T3_SCAFFOLD: 'T3_SCAFFOLD',
  T4_INFERENCE: 'T4_INFERENCE',
  T5_UNTRUSTED: 'T5_UNTRUSTED',
} as const

export type AdapterEvidenceSourceTier = typeof ADAPTER_SOURCE_TIERS[keyof typeof ADAPTER_SOURCE_TIERS]

// ============================================================================
// CONFIDENCE LABELS
// ============================================================================

export const ADAPTER_CONFIDENCE_LABELS = {
  VERIFIED: 'VERIFIED',
  LIKELY: 'LIKELY',
  INFERRED: 'INFERRED',
  STALE: 'STALE',
  CONFLICTED: 'CONFLICTED',
  UNVERIFIED: 'UNVERIFIED',
  BLOCKED: 'BLOCKED',
} as const

export type AdapterConfidenceLabel = typeof ADAPTER_CONFIDENCE_LABELS[keyof typeof ADAPTER_CONFIDENCE_LABELS]

// ============================================================================
// EVIDENCE STATUS
// ============================================================================

export const ADAPTER_EVIDENCE_STATUSES = {
  active: 'active',
  scaffold: 'scaffold',
  deferred: 'deferred',
  quarantined: 'quarantined',
  blocked: 'blocked',
} as const

export type AdapterEvidenceStatus = typeof ADAPTER_EVIDENCE_STATUSES[keyof typeof ADAPTER_EVIDENCE_STATUSES]

// ============================================================================
// DOMAINS
// ============================================================================

export const ADAPTER_DOMAINS = {
  BATMAN: 'BATMAN',
  WAKANDA: 'WAKANDA',
  JARVIS: 'JARVIS',
  ORACLE: 'ORACLE',
  GLOBAL: 'GLOBAL',
} as const

export type AdapterDomain = typeof ADAPTER_DOMAINS[keyof typeof ADAPTER_DOMAINS]

// ============================================================================
// WARNING SEVERITY
// ============================================================================

export const ADAPTER_WARNING_SEVERITIES = {
  info: 'info',
  warn: 'warn',
  block: 'block',
} as const

export type AdapterWarningSeverity = typeof ADAPTER_WARNING_SEVERITIES[keyof typeof ADAPTER_WARNING_SEVERITIES]

// ============================================================================
// PROVENANCE REFERENCE
// ============================================================================

export interface AdapterProvenanceRef {
  readonly sourceId: string
  readonly sourceType: string
  readonly path?: string
  readonly lineRange?: string
  readonly commit?: string
  readonly observedAt?: string
  readonly notes?: string
}

// ============================================================================
// EVIDENCE ITEM (from Evidence Router)
// ============================================================================

export interface AdapterEvidenceItem {
  readonly id: string
  readonly domain: AdapterDomain
  readonly claim: string
  readonly sourceTier: AdapterEvidenceSourceTier
  readonly confidence: number // 0.0–1.0
  readonly status: AdapterEvidenceStatus
  readonly provenance: AdapterProvenanceRef
  readonly tags?: readonly string[]
  readonly observedAt?: string
  readonly notes?: string
}

// ============================================================================
// WARNING
// ============================================================================

export interface AdapterWarning {
  readonly code: string
  readonly message: string
  readonly severity: AdapterWarningSeverity
  readonly evidenceId?: string
}

// ============================================================================
// PROMPT CONTEXT PACKET (to Predictability Kernel)
// ============================================================================

export interface AdapterPromptContextPacket {
  readonly task: string
  readonly allowedEvidence: readonly AdapterEvidenceItem[]
  readonly blockedEvidence: readonly AdapterEvidenceItem[]
  readonly warnings: readonly AdapterWarning[]
  readonly canonBoundaries: readonly string[]
  readonly outputContract: {
    readonly requireProvenanceTrail: boolean
    readonly requireFailureModes: boolean
    readonly requireAssumptions: boolean
    readonly forbidCertaintyLanguage: boolean
    readonly forbidAutonomousAction: boolean
  }
}

// ============================================================================
// FORECAST EXPLANATION (from Predictability Kernel)
// ============================================================================

export interface AdapterForecastExplanation {
  readonly scenario: string
  readonly forecastBand: 'unlikely' | 'possible' | 'likely' | 'strong'
  readonly confidence: number // 0.0–1.0
  readonly evidenceBasis: readonly string[]
  readonly supportingEvidence: readonly Array<{
    readonly evidenceId: string
    readonly weight: number
  }>
  readonly opposingEvidence: readonly Array<{
    readonly evidenceId: string
    readonly weight: number
  }>
  readonly assumptions: readonly Array<{
    readonly assumption: string
    readonly if_wrong_by: string
    readonly forecast_flips: boolean
  }>
  readonly warnings: readonly AdapterWarning[]
  readonly failureModes: readonly Array<{
    readonly mode: string
    readonly detection: string
  }>
  readonly recommendedNextAction: string
  readonly provenanceTrail: readonly Array<{
    readonly step: string
    readonly lensUsed: string
    readonly confidenceContribution: number
  }>
}

// ============================================================================
// GATE DECISION
// ============================================================================

export interface AdapterGateDecision {
  readonly allowed: boolean
  readonly reason: string
  readonly requiredNextGate?: string
}

// ============================================================================
// CONTRACT RULES (Safety & Governance)
// ============================================================================

export interface AdapterContractRule {
  readonly id: string
  readonly description: string
  readonly severity: 'info' | 'warn' | 'block'
  readonly appliesTo: readonly string[]
}

export const ADAPTER_CONTRACT_RULES: readonly AdapterContractRule[] = [
  {
    id: 'BLOCKED_ZERO_CONTRIBUTION',
    description: 'BLOCKED evidence must contribute zero in future adapter logic. Blocked items are isolated and excluded entirely.',
    severity: 'block',
    appliesTo: ['Evidence Router consumption', 'Adapter logic', 'Kernel integration'],
  },
  {
    id: 'SCAFFOLD_NO_STRONG_FORECAST_ALONE',
    description: 'T3_SCAFFOLD cannot create STRONG forecasts (>80% confidence) alone. Must be paired with T0–T2 evidence.',
    severity: 'block',
    appliesTo: ['Confidence calibration', 'Kernel output validation'],
  },
  {
    id: 'UNTRUSTED_NO_STRONG_FORECAST_ALONE',
    description: 'T5_UNTRUSTED cannot create STRONG forecasts (>80% confidence) alone. Must be paired with T0–T2 evidence.',
    severity: 'block',
    appliesTo: ['Confidence calibration', 'Kernel output validation'],
  },
  {
    id: 'UNVERIFIED_NO_STRONG_FORECAST_ALONE',
    description: 'UNVERIFIED status cannot create STRONG forecasts (>80% confidence) alone. Must be paired with verified evidence.',
    severity: 'block',
    appliesTo: ['Confidence calibration', 'Kernel output validation'],
  },
  {
    id: 'CONFLICTED_MUST_WARN',
    description: 'CONFLICTED evidence must produce warning propagation. Conflicted items are included with warning metadata.',
    severity: 'warn',
    appliesTo: ['Prompt packet assembly', 'Forecast explanation', 'User display'],
  },
  {
    id: 'STALE_MUST_DECAY_OR_WARN',
    description: 'STALE evidence must be decayed in confidence weight or labeled with warning. Do not use at full confidence.',
    severity: 'warn',
    appliesTo: ['Confidence calibration', 'Prompt packet assembly'],
  },
  {
    id: 'INFERENCE_MUST_RETAIN_LABEL',
    description: 'T4_INFERENCE must remain labeled as inference in forecast explanation and provenance trail.',
    severity: 'warn',
    appliesTo: ['Forecast explanation', 'Provenance trail'],
  },
  {
    id: 'USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES',
    description: 'T0_USER_DIRECT can define task and objective but cannot override hard boundaries (BLOCKED isolation, no certainty claims, no autonomous action).',
    severity: 'block',
    appliesTo: ['Prompt packet validation', 'Output contract enforcement'],
  },
] as const

// ============================================================================
// EXAMPLE FIXTURES (type-safe, non-functional)
// ============================================================================

export const ADAPTER_EXAMPLE_PROVENANCE: AdapterProvenanceRef = {
  sourceId: 'src-001',
  sourceType: 'direct-observation',
  path: '/evidence/index',
  lineRange: '1-5',
  commit: 'abc1234',
  observedAt: '2026-04-29T17:00:00Z',
  notes: 'Type contract example only — not used at runtime',
}

export const ADAPTER_EXAMPLE_EVIDENCE: AdapterEvidenceItem = {
  id: 'ev-001',
  domain: 'BATMAN' as const,
  claim: 'Signal rose 15% over 3 windows',
  sourceTier: 'T1_CANON_LOCKED' as const,
  confidence: 0.85,
  status: 'active' as const,
  provenance: ADAPTER_EXAMPLE_PROVENANCE,
  tags: ['trend', 'verified'],
  observedAt: '2026-04-29T17:00:00Z',
  notes: 'Type contract example only',
}

export const ADAPTER_EXAMPLE_WARNING: AdapterWarning = {
  code: 'SCAFFOLD_DOWNGRADE',
  message: 'Evidence from T3_SCAFFOLD cannot alone support STRONG forecast',
  severity: 'warn' as const,
  evidenceId: 'ev-002',
}

export const ADAPTER_EXAMPLE_PROMPT_PACKET: AdapterPromptContextPacket = {
  task: 'Forecast trend direction for signal X',
  allowedEvidence: [ADAPTER_EXAMPLE_EVIDENCE],
  blockedEvidence: [],
  warnings: [ADAPTER_EXAMPLE_WARNING],
  canonBoundaries: [
    'No certainty claims (>99%)',
    'No autonomous action',
    'Expose provenance',
    'Expose assumptions',
  ],
  outputContract: {
    requireProvenanceTrail: true,
    requireFailureModes: true,
    requireAssumptions: true,
    forbidCertaintyLanguage: true,
    forbidAutonomousAction: true,
  },
}

export const ADAPTER_EXAMPLE_FORECAST: AdapterForecastExplanation = {
  scenario: 'Signal continues rising trend',
  forecastBand: 'likely' as const,
  confidence: 0.72,
  evidenceBasis: ['trend-delta', 'cycle-analysis', 'behavioral-repetition'],
  supportingEvidence: [
    { evidenceId: 'ev-001', weight: 0.35 },
    { evidenceId: 'ev-003', weight: 0.30 },
  ],
  opposingEvidence: [
    { evidenceId: 'ev-004', weight: 0.15 },
  ],
  assumptions: [
    {
      assumption: 'Historical regime remains stable',
      if_wrong_by: '±10%',
      forecast_flips: false,
    },
    {
      assumption: 'Cycle phase does not shift sharply',
      if_wrong_by: '±20%',
      forecast_flips: true,
    },
  ],
  warnings: [ADAPTER_EXAMPLE_WARNING],
  failureModes: [
    {
      mode: 'Regime shift triggered by landmark event',
      detection: 'Signal momentum reverses >50% in one window',
    },
  ],
  recommendedNextAction: 'Monitor for regime-shift signals. Reforecast if landmark event >0.5 magnitude detected.',
  provenanceTrail: [
    {
      step: 'Trend-delta scored rising with momentum 0.72',
      lensUsed: 'trend-delta',
      confidenceContribution: 0.35,
    },
    {
      step: 'Landmark influence low (no recent events)',
      lensUsed: 'regime-shift',
      confidenceContribution: 0.00,
    },
    {
      step: 'Behavioral repetition shows 80% historical win rate',
      lensUsed: 'behavioral-repetition',
      confidenceContribution: 0.25,
    },
  ],
}
