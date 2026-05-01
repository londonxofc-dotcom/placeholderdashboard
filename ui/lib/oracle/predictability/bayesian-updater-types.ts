// ============================================================================
// Bayesian Updater Type Contracts — Stage M-A
// Spec only. No implementation functions. No Bayesian calculation logic.
// No Evidence Router imports. No Predictability Kernel imports.
// ============================================================================

// --- Constrained scalar ---

/**
 * A probability value constrained to [0, 1].
 * Enforced by contract rules, not by the type system.
 * Any function consuming this type must validate bounds at runtime.
 */
export type BayesianProbability = number

// --- Enum-like constants ---

export const BAYESIAN_EVIDENCE_DIRECTIONS = {
  supports: 'supports',
  opposes: 'opposes',
  neutral: 'neutral',
  mixed: 'mixed',
} as const

export type BayesianEvidenceDirection =
  typeof BAYESIAN_EVIDENCE_DIRECTIONS[keyof typeof BAYESIAN_EVIDENCE_DIRECTIONS]

export const BAYESIAN_EVIDENCE_STRENGTHS = {
  weak: 'weak',
  moderate: 'moderate',
  strong: 'strong',
  decisive: 'decisive',
} as const

export type BayesianEvidenceStrength =
  typeof BAYESIAN_EVIDENCE_STRENGTHS[keyof typeof BAYESIAN_EVIDENCE_STRENGTHS]

export const BAYESIAN_UPDATE_MODES = {
  conservative: 'conservative',
  balanced: 'balanced',
  aggressive: 'aggressive',
} as const

export type BayesianUpdateMode =
  typeof BAYESIAN_UPDATE_MODES[keyof typeof BAYESIAN_UPDATE_MODES]

export const BAYESIAN_WARNING_SEVERITIES = {
  info: 'info',
  warn: 'warn',
  block: 'block',
} as const

export type BayesianWarningSeverity =
  typeof BAYESIAN_WARNING_SEVERITIES[keyof typeof BAYESIAN_WARNING_SEVERITIES]

// --- Interfaces ---

export interface BayesianPrior {
  readonly id: string
  readonly hypothesis: string
  readonly priorProbability: BayesianProbability
  readonly sourceTier: string
  readonly confidence: string
  readonly assumptions: readonly string[]
  readonly createdAt?: string
  readonly notes?: string
}

export interface BayesianEvidenceItem {
  readonly id: string
  readonly claim: string
  readonly direction: BayesianEvidenceDirection
  readonly strength: BayesianEvidenceStrength
  readonly likelihoodGivenHypothesis: BayesianProbability
  readonly likelihoodGivenNotHypothesis: BayesianProbability
  readonly sourceTier: string
  readonly confidence: string
  readonly provenance: string
  readonly tags?: readonly string[]
  readonly notes?: string
}

export interface BayesianUpdateInput {
  readonly hypothesis: string
  readonly prior: BayesianPrior
  readonly evidence: readonly BayesianEvidenceItem[]
  readonly mode: BayesianUpdateMode
  readonly objective?: string
  readonly canonBoundaries?: readonly string[]
  readonly outputContract?: readonly string[]
}

export interface BayesianUpdateWarning {
  readonly code: string
  readonly message: string
  readonly severity: BayesianWarningSeverity
  readonly evidenceId?: string
}

export interface BayesianUpdateResult {
  readonly hypothesis: string
  readonly priorProbability: BayesianProbability
  readonly posteriorProbability: BayesianProbability
  readonly probabilityDelta: number
  readonly evidenceUsed: readonly BayesianEvidenceItem[]
  readonly evidenceWarnings: readonly BayesianUpdateWarning[]
  readonly assumptions: readonly string[]
  readonly uncertainty: string
  readonly explanation: string
  readonly advisoryOnly: true
}

// --- Contract Rules ---

export interface BayesianContractRule {
  readonly id: string
  readonly description: string
  readonly severity: BayesianWarningSeverity
  readonly appliesTo: string
}

export const BAYESIAN_CONTRACT_RULES: readonly BayesianContractRule[] = [
  {
    id: 'PRIOR_MUST_BE_BOUNDED',
    description: 'Prior probability must be between 0 and 1.',
    severity: 'block',
    appliesTo: 'BayesianPrior.priorProbability',
  },
  {
    id: 'POSTERIOR_MUST_BE_BOUNDED',
    description: 'Future posterior must be between 0 and 1.',
    severity: 'block',
    appliesTo: 'BayesianUpdateResult.posteriorProbability',
  },
  {
    id: 'EVIDENCE_REQUIRES_PROVENANCE',
    description: 'Evidence must preserve provenance.',
    severity: 'block',
    appliesTo: 'BayesianEvidenceItem.provenance',
  },
  {
    id: 'WEAK_EVIDENCE_CANNOT_FORCE_DECISIVE_UPDATE',
    description: 'Weak evidence cannot create extreme posterior alone.',
    severity: 'warn',
    appliesTo: 'BayesianUpdateResult.posteriorProbability',
  },
  {
    id: 'CONFLICTED_EVIDENCE_MUST_WARN',
    description: 'Mixed or opposing evidence must produce warning.',
    severity: 'warn',
    appliesTo: 'BayesianUpdateResult.evidenceWarnings',
  },
  {
    id: 'SOURCE_TIER_AFFECTS_WEIGHT',
    description: 'Source tier must influence future update strength.',
    severity: 'info',
    appliesTo: 'BayesianEvidenceItem.sourceTier',
  },
  {
    id: 'ADVISORY_ONLY_OUTPUT',
    description: 'Bayesian result remains advisory, not canon.',
    severity: 'block',
    appliesTo: 'BayesianUpdateResult.advisoryOnly',
  },
  {
    id: 'NO_CERTAINTY_CLAIMS',
    description: 'Result cannot claim guaranteed truth.',
    severity: 'block',
    appliesTo: 'BayesianUpdateResult.explanation',
  },
  {
    id: 'HUMAN_REVIEW_REQUIRED_FOR_STRATEGIC_USE',
    description: 'Strategic forecasts require human review.',
    severity: 'block',
    appliesTo: 'BayesianUpdateResult',
  },
  {
    id: 'NO_AUTONOMOUS_ACTION',
    description: 'Output cannot trigger action.',
    severity: 'block',
    appliesTo: 'BayesianUpdateResult',
  },
] as const
