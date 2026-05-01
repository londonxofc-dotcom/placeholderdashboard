// ============================================================================
// Bayesian Updater Pure Functions — Stage M-B
// Stateless computation only. Fixture-tested. No side effects.
// No Evidence Router. No Predictability Kernel. No UI/API/DB/auth.
// ============================================================================

import type {
  BayesianProbability,
  BayesianEvidenceItem,
  BayesianUpdateInput,
  BayesianUpdateResult,
  BayesianUpdateWarning,
} from './bayesian-updater-types'

const LIKELIHOOD_EPSILON = 0.0001

// --- 1. clampProbability ---

/**
 * Enforces PRIOR_MUST_BE_BOUNDED and POSTERIOR_MUST_BE_BOUNDED:
 * probability values must be in [0, 1].
 */
export function clampProbability(value: number): BayesianProbability {
  if (value < 0) return 0 as BayesianProbability
  if (value > 1) return 1 as BayesianProbability
  return value as BayesianProbability
}

// --- 2. normalizeLikelihood ---

/**
 * Ensures likelihood values are in (EPSILON, 1 - EPSILON].
 * Zero or negative likelihoods are floored to a small epsilon.
 * Values >= 1 are capped to 1 - EPSILON (0.9999) to prevent
 * degenerate certainty in Bayes' theorem.
 */
export function normalizeLikelihood(value: number): number {
  if (value <= 0) return LIKELIHOOD_EPSILON
  if (value >= 1) return 1 - LIKELIHOOD_EPSILON
  return value
}

// --- 3. calculateBayesianPosterior ---

/**
 * P(H|E) = P(E|H) × P(H) / [P(E|H) × P(H) + P(E|¬H) × P(¬H)]
 *
 * All inputs are normalized before calculation.
 * Result is clamped to [0, 1].
 */
export function calculateBayesianPosterior(
  prior: number,
  likelihoodGivenHypothesis: number,
  likelihoodGivenNotHypothesis: number,
): BayesianProbability {
  const p = clampProbability(prior)
  const lH = normalizeLikelihood(likelihoodGivenHypothesis)
  const lNotH = normalizeLikelihood(likelihoodGivenNotHypothesis)

  const numerator = lH * p
  const denominator = numerator + lNotH * (1 - p)

  if (denominator === 0) return p

  return clampProbability(numerator / denominator)
}

// --- 4. calculateProbabilityDelta ---

/**
 * Simple difference: posterior - prior.
 * Positive = evidence supports hypothesis.
 * Negative = evidence opposes hypothesis.
 */
export function calculateProbabilityDelta(
  posterior: number,
  prior: number,
): number {
  return posterior - prior
}

// --- 5. classifyBayesianEvidenceWeight ---

/**
 * Classifies the magnitude of a probability shift.
 * Uses absolute value of delta.
 *
 * Thresholds:
 *   |delta| < 0.02  → negligible
 *   |delta| < 0.10  → weak
 *   |delta| < 0.25  → moderate
 *   |delta| >= 0.25 → strong
 */
export function classifyBayesianEvidenceWeight(
  delta: number,
): 'negligible' | 'weak' | 'moderate' | 'strong' {
  const abs = Math.abs(delta)
  if (abs < 0.02) return 'negligible'
  if (abs < 0.10) return 'weak'
  if (abs < 0.25) return 'moderate'
  return 'strong'
}

// --- 6. updateBayesianBelief ---

/**
 * Orchestrates a full Bayesian update pipeline:
 * 1. Validate and clamp prior
 * 2. Apply each evidence item sequentially via Bayes' theorem
 * 3. Detect conflicting evidence and emit warnings
 * 4. Compute delta and classify weight
 * 5. Assemble BayesianUpdateResult with advisoryOnly: true
 *
 * Pure function. No side effects. No external dependencies.
 */
export function updateBayesianBelief(
  input: BayesianUpdateInput,
): BayesianUpdateResult {
  const { hypothesis, prior, evidence, mode: _mode } = input

  const clampedPrior = clampProbability(prior.priorProbability)
  const warnings: BayesianUpdateWarning[] = []

  // Apply evidence sequentially
  let currentProbability: number = clampedPrior

  for (const item of evidence) {
    currentProbability = calculateBayesianPosterior(
      currentProbability,
      normalizeLikelihood(item.likelihoodGivenHypothesis),
      normalizeLikelihood(item.likelihoodGivenNotHypothesis),
    )
  }

  const posterior = clampProbability(currentProbability)
  const delta = calculateProbabilityDelta(posterior, clampedPrior)
  const weight = classifyBayesianEvidenceWeight(delta)

  // Detect conflicting evidence directions
  const directions = new Set(evidence.map(e => e.direction))
  if (directions.has('supports') && directions.has('opposes')) {
    warnings.push({
      code: 'CONFLICTED_EVIDENCE_MUST_WARN',
      message: 'Evidence contains both supporting and opposing signals.',
      severity: 'warn',
    })
  }

  // Build uncertainty label
  const uncertaintyLabel = evidence.length === 0
    ? 'No evidence applied'
    : weight === 'negligible'
      ? 'Low — evidence produced negligible shift'
      : weight === 'weak'
        ? 'Low — evidence produced weak shift'
        : weight === 'moderate'
          ? 'Medium — moderate evidence shift'
          : 'High — strong evidence shift'

  // Build explanation
  const explanation = evidence.length === 0
    ? 'No evidence provided; posterior equals prior.'
    : `Prior ${clampedPrior.toFixed(3)} updated to ${posterior.toFixed(3)} (delta ${delta >= 0 ? '+' : ''}${delta.toFixed(3)}) using ${evidence.length} evidence item${evidence.length === 1 ? '' : 's'}. Weight: ${weight}.`

  return {
    hypothesis,
    priorProbability: clampedPrior,
    posteriorProbability: posterior,
    probabilityDelta: delta,
    evidenceUsed: evidence,
    evidenceWarnings: warnings,
    assumptions: prior.assumptions as string[],
    uncertainty: uncertaintyLabel,
    explanation,
    advisoryOnly: true,
  }
}
