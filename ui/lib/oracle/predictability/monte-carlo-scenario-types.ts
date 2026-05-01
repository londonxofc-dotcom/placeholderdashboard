// ============================================================================
// Monte Carlo Scenario Type Contracts — Stage M-C
// Spec only. No implementation functions. No simulation logic.
// No random sampling. No Evidence Router imports. No Predictability Kernel
// imports. No Bayesian updater imports.
// ============================================================================

// --- Enum-like constants ---

export const MONTE_CARLO_SCENARIO_BANDS = {
  downside: 'downside',
  base: 'base',
  upside: 'upside',
  tail_risk: 'tail_risk',
  breakout: 'breakout',
} as const

export type MonteCarloScenarioBand =
  typeof MONTE_CARLO_SCENARIO_BANDS[keyof typeof MONTE_CARLO_SCENARIO_BANDS]

export const MONTE_CARLO_ASSUMPTION_SENSITIVITIES = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
} as const

export type MonteCarloAssumptionSensitivity =
  typeof MONTE_CARLO_ASSUMPTION_SENSITIVITIES[keyof typeof MONTE_CARLO_ASSUMPTION_SENSITIVITIES]

export const MONTE_CARLO_DISTRIBUTION_SHAPES = {
  uniform: 'uniform',
  triangular: 'triangular',
  normal_like: 'normal_like',
  skewed_positive: 'skewed_positive',
  skewed_negative: 'skewed_negative',
  discrete: 'discrete',
} as const

export type MonteCarloDistributionShape =
  typeof MONTE_CARLO_DISTRIBUTION_SHAPES[keyof typeof MONTE_CARLO_DISTRIBUTION_SHAPES]

export const MONTE_CARLO_WARNING_SEVERITIES = {
  info: 'info',
  warn: 'warn',
  block: 'block',
} as const

export type MonteCarloWarningSeverity =
  typeof MONTE_CARLO_WARNING_SEVERITIES[keyof typeof MONTE_CARLO_WARNING_SEVERITIES]

// --- Interfaces ---

export interface MonteCarloVariable {
  readonly id: string
  readonly label: string
  readonly baseline: number
  readonly min: number
  readonly max: number
  readonly distributionShape: MonteCarloDistributionShape
  readonly sensitivity: MonteCarloAssumptionSensitivity
  readonly confidence: string
  readonly notes?: string
}

export interface MonteCarloAssumption {
  readonly id: string
  readonly statement: string
  readonly sensitivity: MonteCarloAssumptionSensitivity
  readonly confidence: string
  readonly sourceTier: string
  readonly provenance: string
  readonly notes?: string
}

export interface MonteCarloScenarioInput {
  readonly id: string
  readonly objective: string
  readonly baseProbability: number
  readonly assumptions: readonly MonteCarloAssumption[]
  readonly variables: readonly MonteCarloVariable[]
  readonly constraints: readonly string[]
  readonly horizon: string
  readonly sourceTier: string
  readonly confidence: string
  readonly provenance: string
  readonly notes?: string
}

export interface MonteCarloWarning {
  readonly code: string
  readonly message: string
  readonly severity: MonteCarloWarningSeverity
  readonly variableId?: string
  readonly assumptionId?: string
}

export interface MonteCarloScenarioResult {
  readonly scenarioId: string
  readonly band: MonteCarloScenarioBand
  readonly probabilityRange: readonly [number, number]
  readonly medianEstimate: number
  readonly downsideEstimate: number
  readonly upsideEstimate: number
  readonly tailRiskEstimate: number
  readonly assumptionsUsed: readonly MonteCarloAssumption[]
  readonly sensitiveVariables: readonly MonteCarloVariable[]
  readonly warnings: readonly MonteCarloWarning[]
  readonly advisoryOnly: true
}

// --- Contract Rules ---

export interface MonteCarloContractRule {
  readonly id: string
  readonly description: string
  readonly severity: MonteCarloWarningSeverity
  readonly appliesTo: string
}

export const MONTE_CARLO_CONTRACT_RULES: readonly MonteCarloContractRule[] = [
  {
    id: 'SCENARIO_OUTPUT_MUST_BE_RANGE',
    description: 'Monte Carlo output must be a range, not single-point certainty.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult.probabilityRange',
  },
  {
    id: 'ASSUMPTIONS_MUST_BE_EXPLICIT',
    description: 'All simulated scenarios must expose assumptions.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult.assumptionsUsed',
  },
  {
    id: 'SENSITIVE_VARIABLES_MUST_BE_LISTED',
    description: 'High-sensitivity variables must be surfaced in output.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult.sensitiveVariables',
  },
  {
    id: 'TAIL_RISK_MUST_BE_PRESERVED',
    description: 'Downside and tail risk cannot be hidden or omitted.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult.tailRiskEstimate',
  },
  {
    id: 'WEAK_CONFIDENCE_EXPANDS_RANGE',
    description: 'Weak evidence or confidence widens uncertainty ranges.',
    severity: 'warn',
    appliesTo: 'MonteCarloScenarioResult.probabilityRange',
  },
  {
    id: 'NO_CERTAINTY_CLAIMS',
    description: 'No forecast may claim a guaranteed outcome.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult',
  },
  {
    id: 'ADVISORY_ONLY_OUTPUT',
    description: 'Scenario output remains advisory, not canon.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult.advisoryOnly',
  },
  {
    id: 'HUMAN_REVIEW_REQUIRED_FOR_ACTION',
    description: 'No autonomous decision or outreach based on scenario output.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult',
  },
  {
    id: 'PROVENANCE_REQUIRED',
    description: 'Assumptions and variables require provenance.',
    severity: 'block',
    appliesTo: 'MonteCarloAssumption.provenance',
  },
  {
    id: 'NO_RANDOM_RUNTIME_YET',
    description: 'Stage M-C defines contracts only, not simulation runtime.',
    severity: 'block',
    appliesTo: 'MonteCarloScenarioResult',
  },
] as const
