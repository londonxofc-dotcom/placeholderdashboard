// ============================================================================
// Monte Carlo Deterministic Fixture Simulation — Stage M-D
// Pure functions only. No side effects. No mutation. No uncontrolled Math.random.
// No filesystem. No API. No UI. No DB. No Evidence Router. No Predictability
// Kernel. No Bayesian updater imports.
// ============================================================================

import type {
  MonteCarloVariable,
  MonteCarloAssumption,
  MonteCarloScenarioInput,
  MonteCarloScenarioResult,
  MonteCarloScenarioBand,
  MonteCarloWarning,
} from './monte-carlo-scenario-types'

// ============================================================================
// Types — local to this module
// ============================================================================

interface ScenarioIterationResult {
  readonly sampledValues: Record<string, number>
  readonly score: number
}

interface ScenarioDistributionSummary {
  readonly medianEstimate: number
  readonly downsideEstimate: number
  readonly upsideEstimate: number
  readonly tailRiskEstimate: number
}

interface TailRiskResult {
  readonly estimate: number
}

interface MonteCarloOptions {
  readonly seed: number
  readonly iterations: number
}

// ============================================================================
// 1. Deterministic random source — Mulberry32 PRNG
// ============================================================================

export function createDeterministicRandomSource(seed: number): () => number {
  let state = seed | 0
  return (): number => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ============================================================================
// 2. sampleVariable — draw from distribution, bounded by min/max
// ============================================================================

export function sampleVariable(
  variable: MonteCarloVariable,
  randomSource: () => number,
): number {
  const { min, max, distributionShape } = variable
  const range = max - min

  switch (distributionShape) {
    case 'uniform': {
      return min + randomSource() * range
    }
    case 'triangular': {
      const u = randomSource()
      const mode = (min + max) / 2
      const fc = (mode - min) / range
      if (u < fc) {
        return min + Math.sqrt(u * range * (mode - min))
      }
      return max - Math.sqrt((1 - u) * range * (max - mode))
    }
    case 'normal_like': {
      // Box-Muller approximation, clamped to [min, max]
      const u1 = randomSource()
      const u2 = randomSource()
      const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2)
      const mid = (min + max) / 2
      const sigma = range / 6
      const raw = mid + z * sigma
      return Math.max(min, Math.min(max, raw))
    }
    case 'skewed_positive': {
      // Beta(2,5)-like: concentrate toward min
      const u = randomSource()
      const skewed = Math.pow(u, 2)
      return min + skewed * range
    }
    case 'skewed_negative': {
      // Beta(5,2)-like: concentrate toward max
      const u = randomSource()
      const skewed = 1 - Math.pow(1 - u, 2)
      return min + skewed * range
    }
    case 'discrete': {
      const steps = Math.max(1, Math.round(range))
      const step = Math.floor(randomSource() * (steps + 1))
      return Math.min(min + step, max)
    }
    default: {
      return min + randomSource() * range
    }
  }
}

// ============================================================================
// 3. runScenarioIteration — single pass, no mutation
// ============================================================================

export function runScenarioIteration(
  input: MonteCarloScenarioInput,
  randomSource: () => number,
): ScenarioIterationResult {
  const sampledValues: Record<string, number> = {}

  for (const variable of input.variables) {
    sampledValues[variable.id] = sampleVariable(variable, randomSource)
  }

  // Score: blend base probability with sampled variable deviations
  let deviationSum = 0
  for (const variable of input.variables) {
    const sampled = sampledValues[variable.id]
    const range = variable.max - variable.min
    if (range > 0) {
      const normalizedDeviation = (sampled - variable.min) / range
      deviationSum += normalizedDeviation
    } else {
      deviationSum += 0.5
    }
  }

  const avgDeviation = input.variables.length > 0
    ? deviationSum / input.variables.length
    : 0.5

  // Blend base probability with average deviation
  const score = Math.max(0, Math.min(1, input.baseProbability * 0.6 + avgDeviation * 0.4))

  return { sampledValues, score }
}

// ============================================================================
// 4. summarizeScenarioDistribution
// ============================================================================

export function summarizeScenarioDistribution(
  iterations: readonly ScenarioIterationResult[],
): ScenarioDistributionSummary {
  const scores = iterations.map(i => i.score).sort((a, b) => a - b)
  const len = scores.length

  const medianEstimate = len % 2 === 0
    ? (scores[len / 2 - 1] + scores[len / 2]) / 2
    : scores[Math.floor(len / 2)]

  // P10 downside, P90 upside, P5 tail risk
  const downsideEstimate = scores[Math.max(0, Math.floor(len * 0.1))]
  const upsideEstimate = scores[Math.min(len - 1, Math.floor(len * 0.9))]
  const tailRiskEstimate = scores[Math.max(0, Math.floor(len * 0.05))]

  return {
    medianEstimate,
    downsideEstimate,
    upsideEstimate,
    tailRiskEstimate,
  }
}

// ============================================================================
// 5. detectTailRisk
// ============================================================================

export function detectTailRisk(
  iterations: readonly ScenarioIterationResult[],
): TailRiskResult {
  const scores = iterations.map(i => i.score).sort((a, b) => a - b)
  const idx = Math.max(0, Math.floor(scores.length * 0.05))
  return { estimate: scores[idx] }
}

// ============================================================================
// 6. calculateUncertaintyBand
// ============================================================================

export function calculateUncertaintyBand(
  iterations: readonly ScenarioIterationResult[],
): [number, number] {
  const scores = iterations.map(i => i.score).sort((a, b) => a - b)
  const len = scores.length
  const lower = scores[Math.max(0, Math.floor(len * 0.05))]
  const upper = scores[Math.min(len - 1, Math.floor(len * 0.95))]
  return [
    Math.max(0, Math.min(1, lower)),
    Math.max(0, Math.min(1, upper)),
  ]
}

// ============================================================================
// 7. runMonteCarloScenario — orchestrator
// ============================================================================

function confidenceWidthMultiplier(confidence: string): number {
  switch (confidence) {
    case 'CONFIRMED': return 0.6
    case 'LIKELY': return 1.0
    case 'PLAUSIBLE': return 1.3
    case 'SPECULATIVE': return 1.6
    case 'UNLIKELY': return 2.0
    default: return 1.0
  }
}

function classifyBand(median: number): MonteCarloScenarioBand {
  if (median < 0.2) return 'tail_risk'
  if (median < 0.4) return 'downside'
  if (median < 0.7) return 'base'
  if (median < 0.85) return 'upside'
  return 'breakout'
}

function generateWarnings(
  input: MonteCarloScenarioInput,
  summary: ScenarioDistributionSummary,
): MonteCarloWarning[] {
  const warnings: MonteCarloWarning[] = []

  if (summary.upsideEstimate - summary.downsideEstimate > 0.5) {
    warnings.push({
      code: 'WIDE_RANGE',
      message: 'Scenario shows a wide probability spread — estimates may vary significantly.',
      severity: 'warn',
    })
  }

  if (summary.tailRiskEstimate < 0.15) {
    warnings.push({
      code: 'NOTABLE_TAIL_RISK',
      message: 'Tail risk is notable — downside scenarios should be reviewed.',
      severity: 'warn',
    })
  }

  const highSensVars = input.variables.filter(
    v => v.sensitivity === 'high' || v.sensitivity === 'critical',
  )
  if (highSensVars.length > 0) {
    warnings.push({
      code: 'HIGH_SENSITIVITY_VARIABLES',
      message: `${highSensVars.length} variable(s) have high or critical sensitivity — results are sensitive to these inputs.`,
      severity: 'info',
    })
  }

  warnings.push({
    code: 'ADVISORY_ONLY',
    message: 'All estimates are advisory — human review is required before action.',
    severity: 'info',
  })

  return warnings
}

export function runMonteCarloScenario(
  input: MonteCarloScenarioInput,
  options: MonteCarloOptions,
): MonteCarloScenarioResult & { readonly humanReviewRequired: true } {
  const rng = createDeterministicRandomSource(options.seed)
  const iterations: ScenarioIterationResult[] = []

  for (let i = 0; i < options.iterations; i++) {
    iterations.push(runScenarioIteration(input, rng))
  }

  const summary = summarizeScenarioDistribution(iterations)
  const tailRisk = detectTailRisk(iterations)
  const rawBand = calculateUncertaintyBand(iterations)

  // Widen band based on confidence
  const multiplier = confidenceWidthMultiplier(input.confidence)
  const midpoint = (rawBand[0] + rawBand[1]) / 2
  const halfWidth = ((rawBand[1] - rawBand[0]) / 2) * multiplier
  const probabilityRange: [number, number] = [
    Math.max(0, Math.min(1, midpoint - halfWidth)),
    Math.max(0, Math.min(1, midpoint + halfWidth)),
  ]

  const sensitiveVariables = input.variables.filter(
    v => v.sensitivity === 'high' || v.sensitivity === 'critical',
  )

  const warnings = generateWarnings(input, summary)
  const band = classifyBand(summary.medianEstimate)

  return {
    scenarioId: input.id,
    band,
    probabilityRange,
    medianEstimate: summary.medianEstimate,
    downsideEstimate: summary.downsideEstimate,
    upsideEstimate: summary.upsideEstimate,
    tailRiskEstimate: tailRisk.estimate,
    assumptionsUsed: [...input.assumptions],
    sensitiveVariables: [...sensitiveVariables],
    warnings,
    advisoryOnly: true,
    humanReviewRequired: true,
  }
}
