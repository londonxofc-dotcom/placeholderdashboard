// ============================================================================
// Markov Regime Transition Type Contracts — Stage M-E
// Spec only. No implementation functions. No transition logic.
// No matrix calculations. No Evidence Router imports. No Predictability Kernel
// imports. No Bayesian updater imports. No Monte Carlo imports.
// ============================================================================

// --- Enum-like constants ---

export const MARKOV_REGIME_STATES = {
  unknown: 'unknown',
  stable: 'stable',
  accelerating: 'accelerating',
  decelerating: 'decelerating',
  volatile: 'volatile',
  recovering: 'recovering',
  declining: 'declining',
  breakout: 'breakout',
  constrained: 'constrained',
  quarantined: 'quarantined',
} as const

export type MarkovRegimeState =
  typeof MARKOV_REGIME_STATES[keyof typeof MARKOV_REGIME_STATES]

export const MARKOV_TRANSITION_CONFIDENCES = {
  weak: 'weak',
  moderate: 'moderate',
  strong: 'strong',
  verified: 'verified',
} as const

export type MarkovTransitionConfidence =
  typeof MARKOV_TRANSITION_CONFIDENCES[keyof typeof MARKOV_TRANSITION_CONFIDENCES]

export const MARKOV_TIME_HORIZONS = {
  short: 'short',
  medium: 'medium',
  long: 'long',
  strategic: 'strategic',
} as const

export type MarkovTimeHorizon =
  typeof MARKOV_TIME_HORIZONS[keyof typeof MARKOV_TIME_HORIZONS]

export const MARKOV_TRANSITION_SEVERITIES = {
  info: 'info',
  warn: 'warn',
  block: 'block',
} as const

export type MarkovTransitionSeverity =
  typeof MARKOV_TRANSITION_SEVERITIES[keyof typeof MARKOV_TRANSITION_SEVERITIES]

// --- Interfaces ---

export interface MarkovStateObservation {
  readonly id: string
  readonly state: MarkovRegimeState
  readonly observedAt: string
  readonly confidence: MarkovTransitionConfidence
  readonly sourceTier: string
  readonly provenance: string
  readonly tags?: readonly string[]
  readonly notes?: string
}

export interface MarkovTransitionCell {
  readonly fromState: MarkovRegimeState
  readonly toState: MarkovRegimeState
  readonly probability: number
  readonly confidence: MarkovTransitionConfidence
  readonly provenance?: string
  readonly notes?: string
}

export interface MarkovTransitionMatrix {
  readonly id: string
  readonly states: readonly MarkovRegimeState[]
  readonly cells: readonly MarkovTransitionCell[]
  readonly sourceTier: string
  readonly confidence: MarkovTransitionConfidence
  readonly createdAt?: string
  readonly assumptions: readonly string[]
  readonly provenance: string
  readonly notes?: string
}

export interface MarkovStateVector {
  readonly horizon: MarkovTimeHorizon
  readonly probabilities: Readonly<Record<string, number>>
  readonly confidence: MarkovTransitionConfidence
  readonly assumptions: readonly string[]
  readonly warnings: readonly MarkovTransitionWarning[]
  readonly provenance: string
}

export interface MarkovTransitionWarning {
  readonly code: string
  readonly message: string
  readonly severity: MarkovTransitionSeverity
  readonly state?: MarkovRegimeState
  readonly transition?: string
  readonly observationId?: string
}

export interface MarkovTransitionInput {
  readonly currentState: MarkovRegimeState
  readonly candidateStates: readonly MarkovRegimeState[]
  readonly transitionMatrix: MarkovTransitionMatrix
  readonly observations: readonly MarkovStateObservation[]
  readonly horizon: MarkovTimeHorizon
  readonly assumptions: readonly string[]
  readonly sourceTier: string
  readonly confidence: MarkovTransitionConfidence
  readonly provenance: string
  readonly warnings?: readonly MarkovTransitionWarning[]
}

export interface MarkovTransitionResult {
  readonly currentState: MarkovRegimeState
  readonly mostLikelyNextState: MarkovRegimeState
  readonly nextStateDistribution: Readonly<Record<string, number>>
  readonly transitionPath: readonly MarkovRegimeState[]
  readonly confidence: MarkovTransitionConfidence
  readonly assumptions: readonly string[]
  readonly warnings: readonly MarkovTransitionWarning[]
  readonly provenanceTrail: readonly string[]
  readonly advisoryOnly: true
  readonly humanReviewRequired: true
}

// --- Contract Rules ---

export interface MarkovContractRule {
  readonly id: string
  readonly description: string
  readonly severity: MarkovTransitionSeverity
  readonly appliesTo: string
}

export const MARKOV_CONTRACT_RULES: readonly MarkovContractRule[] = [
  {
    id: 'TRANSITION_PROBABILITIES_BOUNDED',
    description: 'Transition probabilities must stay within [0, 1].',
    severity: 'block',
    appliesTo: 'MarkovTransitionCell.probability',
  },
  {
    id: 'MATRIX_ROWS_MUST_NORMALIZE',
    description: 'Each transition row must sum to 1.',
    severity: 'block',
    appliesTo: 'MarkovTransitionMatrix.cells',
  },
  {
    id: 'STATE_LABELS_ARE_OPERATIONAL',
    description: 'States are operational forecast states, not diagnoses.',
    severity: 'block',
    appliesTo: 'MarkovRegimeState',
  },
  {
    id: 'QUARANTINED_CANNOT_STRONG_POSITIVE',
    description: 'Quarantined state cannot produce strong positive forecast alone.',
    severity: 'block',
    appliesTo: 'MarkovTransitionResult.nextStateDistribution',
  },
  {
    id: 'WEAK_CONFIDENCE_WIDENS_UNCERTAINTY',
    description: 'Weak confidence must widen uncertainty.',
    severity: 'warn',
    appliesTo: 'MarkovTransitionResult.nextStateDistribution',
  },
  {
    id: 'PROVENANCE_REQUIRED',
    description: 'Matrix, observations, and result require provenance.',
    severity: 'block',
    appliesTo: 'MarkovTransitionResult.provenanceTrail',
  },
  {
    id: 'ADVISORY_ONLY_OUTPUT',
    description: 'Result remains advisory.',
    severity: 'block',
    appliesTo: 'MarkovTransitionResult.advisoryOnly',
  },
  {
    id: 'HUMAN_REVIEW_REQUIRED',
    description: 'Strategic state transitions require human review.',
    severity: 'block',
    appliesTo: 'MarkovTransitionResult.humanReviewRequired',
  },
  {
    id: 'NO_CERTAINTY_CLAIMS',
    description: 'No state transition can be stated as guaranteed.',
    severity: 'block',
    appliesTo: 'MarkovTransitionResult',
  },
  {
    id: 'NO_AUTONOMOUS_ACTION',
    description: 'Output cannot trigger autonomous action.',
    severity: 'block',
    appliesTo: 'MarkovTransitionResult',
  },
] as const
