// ============================================================================
// Markov Regime Transition Pure Functions — Stage M-F
// Pure functions only. Deterministic. No side effects. No I/O. No network.
// No filesystem. No Evidence Router. No Predictability Kernel. No Monte Carlo.
// No Bayesian updater. No UI/API/DB/auth. No shell-promoter.
// Allowed import: markov-regime-transition-types.ts only (Stage M-E contracts).
// ============================================================================

import type {
  MarkovTransitionMatrix,
  MarkovTransitionCell,
  MarkovTransitionInput,
  MarkovTransitionResult,
  MarkovTransitionWarning,
  MarkovRegimeState,
  MarkovTransitionConfidence,
} from './markov-regime-transition-types'

// ============================================================================
// Constants
// ============================================================================

const EPSILON = 1e-10

const POSITIVE_STATES: readonly MarkovRegimeState[] = [
  'accelerating',
  'breakout',
  'recovering',
]

const QUARANTINE_POSITIVE_CAP = 0.3

const CONFIDENCE_ALPHA: Record<MarkovTransitionConfidence, number> = {
  weak: 0.4,
  moderate: 0.7,
  strong: 0.9,
  verified: 1.0,
}

// ============================================================================
// 1. normalizeMatrixRow
// ============================================================================

export function normalizeMatrixRow(
  cells: readonly MarkovTransitionCell[],
  _fromState: MarkovRegimeState,
): MarkovTransitionCell[] {
  const sum = cells.reduce((s, c) => s + c.probability, 0)
  if (sum === 0) {
    const uniform = 1 / cells.length
    return cells.map(c => ({ ...c, probability: uniform }))
  }
  return cells.map(c => ({ ...c, probability: c.probability / sum }))
}

// ============================================================================
// 2. validateTransitionMatrix
// ============================================================================

export function validateTransitionMatrix(matrix: MarkovTransitionMatrix): {
  valid: boolean
  warnings: MarkovTransitionWarning[]
  normalizedMatrix: MarkovTransitionMatrix
} {
  const warnings: MarkovTransitionWarning[] = []
  let clampedCells: MarkovTransitionCell[] = []

  // Clamp out-of-bounds probabilities
  for (const cell of matrix.cells) {
    if (cell.probability < 0 || cell.probability > 1) {
      warnings.push({
        code: 'TRANSITION_PROBABILITIES_BOUNDED',
        message: `Probability for ${cell.fromState} -> ${cell.toState} was ${cell.probability}, clamped to [0, 1]`,
        severity: 'block',
        state: cell.fromState,
      })
      clampedCells.push({
        ...cell,
        probability: Math.max(0, Math.min(1, cell.probability)),
      })
    } else {
      clampedCells.push({ ...cell })
    }
  }

  // Group by fromState and normalize each row
  const normalizedCells: MarkovTransitionCell[] = []

  for (const state of matrix.states) {
    const rowCells = clampedCells.filter(c => c.fromState === state)
    if (rowCells.length === 0) continue

    const rowSum = rowCells.reduce((s, c) => s + c.probability, 0)

    if (Math.abs(rowSum - 1.0) >= EPSILON) {
      warnings.push({
        code: 'MATRIX_ROWS_MUST_NORMALIZE',
        message: `Row for state "${state}" summed to ${rowSum}, normalized to 1.0`,
        severity: 'block',
        state,
      })
      normalizedCells.push(...normalizeMatrixRow(rowCells, state))
    } else {
      normalizedCells.push(...rowCells)
    }
  }

  return {
    valid: true,
    warnings,
    normalizedMatrix: {
      ...matrix,
      cells: normalizedCells,
    },
  }
}

// ============================================================================
// 3. getTransitionRow
// ============================================================================

export function getTransitionRow(
  matrix: MarkovTransitionMatrix,
  fromState: MarkovRegimeState,
): MarkovTransitionCell[] {
  return matrix.cells.filter(c => c.fromState === fromState)
}

// ============================================================================
// 4. computeNextStateDistribution
// ============================================================================

export function computeNextStateDistribution(
  currentState: MarkovRegimeState,
  matrix: MarkovTransitionMatrix,
): Record<string, number> {
  const row = getTransitionRow(matrix, currentState)

  if (row.length === 0) {
    // Uniform fallback for missing state
    const uniform = 1 / matrix.states.length
    const dist: Record<string, number> = {}
    for (const state of matrix.states) {
      dist[state] = uniform
    }
    return dist
  }

  const dist: Record<string, number> = {}
  for (const cell of row) {
    dist[cell.toState] = cell.probability
  }
  return dist
}

// ============================================================================
// 5. applyConfidenceWidening
// ============================================================================

export function applyConfidenceWidening(
  distribution: Record<string, number>,
  confidence: MarkovTransitionConfidence,
): Record<string, number> {
  const alpha = CONFIDENCE_ALPHA[confidence]
  const keys = Object.keys(distribution)
  const n = keys.length
  const uniform = 1 / n

  const result: Record<string, number> = {}
  for (const key of keys) {
    result[key] = alpha * distribution[key] + (1 - alpha) * uniform
  }
  return result
}

// ============================================================================
// 6. enforceQuarantineConstraint
// ============================================================================

export function enforceQuarantineConstraint(
  distribution: Record<string, number>,
  currentState: MarkovRegimeState,
): { distribution: Record<string, number>; warnings: MarkovTransitionWarning[] } {
  if (currentState !== 'quarantined') {
    return { distribution: { ...distribution }, warnings: [] }
  }

  const warnings: MarkovTransitionWarning[] = []
  const result: Record<string, number> = { ...distribution }
  let excess = 0

  // Check if any positive state exceeds the cap
  let hasStrongPositive = false
  for (const state of POSITIVE_STATES) {
    if (result[state] !== undefined && result[state] > QUARANTINE_POSITIVE_CAP) {
      hasStrongPositive = true
      break
    }
  }

  if (!hasStrongPositive) {
    return { distribution: result, warnings }
  }

  // Cap positive states and collect excess
  for (const state of POSITIVE_STATES) {
    if (result[state] !== undefined && result[state] > QUARANTINE_POSITIVE_CAP) {
      excess += result[state] - QUARANTINE_POSITIVE_CAP
      result[state] = QUARANTINE_POSITIVE_CAP
    }
  }

  warnings.push({
    code: 'QUARANTINED_CANNOT_STRONG_POSITIVE',
    message: 'Quarantined state had strong positive transitions suppressed',
    severity: 'block',
    state: currentState,
  })

  // Redistribute excess to non-positive states
  const nonPositiveKeys = Object.keys(result).filter(
    k => !POSITIVE_STATES.includes(k as MarkovRegimeState),
  )

  if (nonPositiveKeys.length > 0) {
    const share = excess / nonPositiveKeys.length
    for (const key of nonPositiveKeys) {
      result[key] += share
    }
  }

  return { distribution: result, warnings }
}

// ============================================================================
// 7. findMostLikelyNextState
// ============================================================================

export function findMostLikelyNextState(
  distribution: Record<string, number>,
): MarkovRegimeState {
  let maxProb = -Infinity
  let maxState = ''

  for (const [state, prob] of Object.entries(distribution)) {
    if (prob > maxProb) {
      maxProb = prob
      maxState = state
    }
  }

  return maxState as MarkovRegimeState
}

// ============================================================================
// 8. buildTransitionPath
// ============================================================================

export function buildTransitionPath(
  currentState: MarkovRegimeState,
  mostLikelyNext: MarkovRegimeState,
): MarkovRegimeState[] {
  if (currentState === mostLikelyNext) {
    return [currentState]
  }
  return [currentState, mostLikelyNext]
}

// ============================================================================
// 9. computeMarkovTransition — top-level orchestrator
// ============================================================================

export function computeMarkovTransition(
  input: MarkovTransitionInput,
): MarkovTransitionResult {
  const allWarnings: MarkovTransitionWarning[] = []

  // Propagate input warnings
  if (input.warnings) {
    allWarnings.push(...input.warnings)
  }

  // Step 1: Validate transition matrix
  const validation = validateTransitionMatrix(input.transitionMatrix)
  allWarnings.push(...validation.warnings)

  // Check for missing current state in matrix
  const row = getTransitionRow(validation.normalizedMatrix, input.currentState)
  if (row.length === 0) {
    allWarnings.push({
      code: 'MISSING_STATE_IN_MATRIX',
      message: `Current state "${input.currentState}" not found in transition matrix; using uniform fallback`,
      severity: 'block',
      state: input.currentState,
    })
  }

  // Step 2–3: Compute next state distribution
  const rawDistribution = computeNextStateDistribution(
    input.currentState,
    validation.normalizedMatrix,
  )

  // Step 4: Apply confidence widening
  const widenedDistribution = applyConfidenceWidening(
    rawDistribution,
    input.confidence,
  )

  // Step 5: Enforce quarantine constraint
  const quarantineResult = enforceQuarantineConstraint(
    widenedDistribution,
    input.currentState,
  )
  allWarnings.push(...quarantineResult.warnings)

  // Step 6: Find most likely next state
  const mostLikelyNext = findMostLikelyNextState(quarantineResult.distribution)

  // Step 7: Build transition path
  const transitionPath = buildTransitionPath(input.currentState, mostLikelyNext)

  // Step 8: Assemble result
  const provenanceTrail: string[] = [input.provenance]
  if (input.transitionMatrix.provenance) {
    provenanceTrail.push(input.transitionMatrix.provenance)
  }

  return {
    currentState: input.currentState,
    mostLikelyNextState: mostLikelyNext,
    nextStateDistribution: quarantineResult.distribution,
    transitionPath,
    confidence: input.confidence,
    assumptions: [...input.assumptions],
    warnings: allWarnings,
    provenanceTrail,
    advisoryOnly: true,
    humanReviewRequired: true,
  }
}
