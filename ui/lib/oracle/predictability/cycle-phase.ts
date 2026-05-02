// ============================================================================
// Cycle Phase Model — Stage M-H Pure Functions
// Pure functions only. No I/O, no side effects, no mutation, no randomness.
// Imports only from ./cycle-phase-types.
// ============================================================================

import {
  CYCLE_PHASES,
  CYCLE_PHASE_THRESHOLDS,
  CYCLE_PHASE_WARNING_CODES,
  CYCLE_PHASE_WARNING_SEVERITIES,
  CYCLE_PHASE_DEFAULT_SAFETY_FLAGS,
  type CyclePhase,
  type CyclePhaseInput,
  type CyclePhaseResult,
  type CyclePhaseWarning,
  type CyclePhaseConfidence,
  type CyclePhaseTransitionRisk,
} from './cycle-phase-types'

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

/**
 * Scores each candidate phase against the current evidence signature.
 * Returns a record of phase -> score in [0, 1].
 */
function computePhaseScores(
  input: CyclePhaseInput
): Record<CyclePhase, number> {
  const scores: Record<string, number> = {
    accumulation: 0,
    expansion: 0,
    distribution: 0,
    contraction: 0,
    recovery: 0,
    uncertain: 0,
  }

  const { trendBaseline, markovRegime, monteCarloScenario, bayesianPosterior } = input

  // Count available upstream inputs
  const availableCount = [trendBaseline, markovRegime, monteCarloScenario, bayesianPosterior]
    .filter(Boolean).length

  if (availableCount === 0) {
    scores.uncertain = 1
    return scores as Record<CyclePhase, number>
  }

  // --- Accumulation: stable, low acceleration, regime stable, narrowing, strengthening ---
  if (trendBaseline) {
    const isStable = trendBaseline.direction === 'stable'
    const lowDelta = Math.abs(trendBaseline.delta) < 0.15
    const lowAccel = Math.abs(trendBaseline.acceleration) < 0.1
    const lowReversal = trendBaseline.reversalIndicator < 0.2
    scores.accumulation += (isStable ? 0.3 : 0) + (lowDelta ? 0.1 : 0) + (lowAccel ? 0.1 : 0) + (lowReversal ? 0.1 : 0)
  }
  if (markovRegime) {
    const stableRegime = markovRegime.stateStability > 0.7 &&
      (markovRegime.dominantState === 'stable' || markovRegime.dominantState === 'settling')
    scores.accumulation += stableRegime ? 0.2 : 0
  }
  if (monteCarloScenario) {
    const narrowing = monteCarloScenario.scenarioDispersion < 0.2
    scores.accumulation += narrowing ? 0.1 : 0
  }
  if (bayesianPosterior) {
    const strengthening = bayesianPosterior.beliefStrength > 0.6 &&
      bayesianPosterior.priorToPosteriorDelta > 0
    scores.accumulation += strengthening ? 0.1 : 0
  }

  // --- Expansion: accelerating positive, high regime confidence, narrow scenarios, strong posterior ---
  if (trendBaseline) {
    const accelerating = trendBaseline.direction === 'accelerating'
    const positiveDelta = trendBaseline.delta > 0.3
    const positiveAccel = trendBaseline.acceleration > 0.15
    const lowReversal = trendBaseline.reversalIndicator < 0.15
    scores.expansion += (accelerating ? 0.25 : 0) + (positiveDelta ? 0.1 : 0) +
      (positiveAccel ? 0.1 : 0) + (lowReversal ? 0.05 : 0)
  }
  if (markovRegime) {
    const highConfGrowth = markovRegime.stateStability > 0.85 &&
      markovRegime.dominantState === 'growth'
    scores.expansion += highConfGrowth ? 0.2 : 0
  }
  if (monteCarloScenario) {
    const narrow = monteCarloScenario.scenarioDispersion < 0.15
    scores.expansion += narrow ? 0.15 : 0
  }
  if (bayesianPosterior) {
    const strongPosterior = bayesianPosterior.beliefStrength > 0.8 &&
      bayesianPosterior.updateMagnitude > 0.2
    scores.expansion += strongPosterior ? 0.15 : 0
  }

  // --- Distribution: decelerating positive, early transition, widening, weakening posterior ---
  if (trendBaseline) {
    const decelerating = trendBaseline.direction === 'decelerating'
    const positiveDelta = trendBaseline.delta > 0
    const negativeAccel = trendBaseline.acceleration < -0.1
    const risingReversal = trendBaseline.reversalIndicator > 0.25
    scores.distribution += (decelerating && positiveDelta ? 0.25 : 0) +
      (negativeAccel ? 0.1 : 0) + (risingReversal ? 0.1 : 0)
  }
  if (markovRegime) {
    const earlyTransition = markovRegime.transitionProbability > 0.2 &&
      (markovRegime.dominantState === 'peak' || markovRegime.stateStability < 0.6)
    scores.distribution += earlyTransition ? 0.2 : 0
  }
  if (monteCarloScenario) {
    const widening = monteCarloScenario.scenarioDispersion > 0.3
    scores.distribution += widening ? 0.15 : 0
  }
  if (bayesianPosterior) {
    const weakening = bayesianPosterior.beliefStrength < 0.5 &&
      bayesianPosterior.priorToPosteriorDelta < 0
    scores.distribution += weakening ? 0.2 : 0
  }

  // --- Contraction: reversing/negative accel, active transition, wide diverging, shifting posterior ---
  if (trendBaseline) {
    const reversing = trendBaseline.direction === 'reversing'
    const negativeDelta = trendBaseline.delta < -0.2
    const negativeAccel = trendBaseline.acceleration < -0.2
    const highReversal = trendBaseline.reversalIndicator > 0.5
    scores.contraction += (reversing ? 0.2 : 0) + (negativeDelta ? 0.1 : 0) +
      (negativeAccel ? 0.1 : 0) + (highReversal ? 0.1 : 0)
  }
  if (markovRegime) {
    const activeTransition = markovRegime.transitionProbability > 0.4 &&
      (markovRegime.dominantState === 'decline' || markovRegime.stateStability < 0.4)
    scores.contraction += activeTransition ? 0.2 : 0
  }
  if (monteCarloScenario) {
    const wideDiverging = monteCarloScenario.scenarioDispersion > 0.5
    scores.contraction += wideDiverging ? 0.15 : 0
  }
  if (bayesianPosterior) {
    const shifting = bayesianPosterior.updateMagnitude > 0.25 &&
      bayesianPosterior.priorToPosteriorDelta < -0.2
    scores.contraction += shifting ? 0.15 : 0
  }

  // --- Recovery: flattening negative, settling regime, narrowing from wide, stabilizing ---
  if (trendBaseline) {
    const flattening = trendBaseline.direction === 'decelerating' && trendBaseline.delta < 0
    const positiveAccel = trendBaseline.acceleration > 0.05
    const lowReversal = trendBaseline.reversalIndicator < 0.3
    scores.recovery += (flattening ? 0.2 : 0) + (positiveAccel ? 0.15 : 0) +
      (lowReversal ? 0.1 : 0)
  }
  if (markovRegime) {
    const settling = markovRegime.stateStability > 0.6 &&
      markovRegime.dominantState === 'settling'
    scores.recovery += settling ? 0.2 : 0
  }
  if (monteCarloScenario) {
    const narrowingFromWide = monteCarloScenario.scenarioDispersion > 0.15 &&
      monteCarloScenario.scenarioDispersion < 0.4
    scores.recovery += narrowingFromWide ? 0.15 : 0
  }
  if (bayesianPosterior) {
    const stabilizing = bayesianPosterior.beliefStrength > 0.5 &&
      bayesianPosterior.priorToPosteriorDelta > 0 &&
      bayesianPosterior.updateMagnitude < 0.15
    scores.recovery += stabilizing ? 0.2 : 0
  }

  // Normalize scores so they sum to 1
  const total = Object.values(scores).reduce((sum, s) => sum + s, 0)
  if (total > 0) {
    for (const phase of Object.keys(scores)) {
      scores[phase] = scores[phase] / total
    }
  } else {
    scores.uncertain = 1
  }

  return scores as Record<CyclePhase, number>
}

/**
 * Applies hysteresis: requires HYSTERESIS_ENTRY to enter a new phase.
 * Without a previous phase (stateless call), uses entry threshold only.
 */
function applyPhaseHysteresis(
  scores: Record<CyclePhase, number>
): CyclePhase {
  const entries = Object.entries(scores) as [CyclePhase, number][]
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const [topPhase, topScore] = sorted[0]

  // Stateless: require entry threshold
  if (topScore >= CYCLE_PHASE_THRESHOLDS.HYSTERESIS_ENTRY) {
    return topPhase
  }

  return CYCLE_PHASES.uncertain
}

/**
 * Collects warnings from upstream input analysis.
 */
function aggregateUpstreamWarnings(input: CyclePhaseInput): readonly CyclePhaseWarning[] {
  const warnings: CyclePhaseWarning[] = [...input.inheritedWarnings]

  const upstreamSources = [
    { name: 'trend-baseline', value: input.trendBaseline },
    { name: 'markov-regime', value: input.markovRegime },
    { name: 'monte-carlo-scenario', value: input.monteCarloScenario },
    { name: 'bayesian-posterior', value: input.bayesianPosterior },
  ]

  for (const { name, value } of upstreamSources) {
    if (!value) {
      warnings.push({
        code: CYCLE_PHASE_WARNING_CODES.UPSTREAM_MISSING,
        message: `Upstream model result is missing: ${name}`,
        severity: CYCLE_PHASE_WARNING_SEVERITIES.warn,
        source: name,
      })
    }
  }

  // Check for low upstream confidence
  const upstreamConfidences: number[] = []
  if (input.trendBaseline) upstreamConfidences.push(input.trendBaseline.confidence)
  if (input.markovRegime) upstreamConfidences.push(input.markovRegime.confidence)
  if (input.monteCarloScenario) upstreamConfidences.push(input.monteCarloScenario.confidence)
  if (input.bayesianPosterior) upstreamConfidences.push(input.bayesianPosterior.confidence)

  if (upstreamConfidences.length > 0) {
    const minConf = Math.min(...upstreamConfidences)
    if (minConf < CYCLE_PHASE_THRESHOLDS.MIN_CONFIDENCE) {
      warnings.push({
        code: CYCLE_PHASE_WARNING_CODES.LOW_CONFIDENCE,
        message: `Minimum upstream confidence (${minConf.toFixed(2)}) is below threshold (${CYCLE_PHASE_THRESHOLDS.MIN_CONFIDENCE})`,
        severity: CYCLE_PHASE_WARNING_SEVERITIES.warn,
        source: 'cycle-phase-model',
      })
    }
  }

  return warnings
}

/**
 * Generates a human-readable evidence summary.
 * Uses hedged language per spec Section 9.
 */
function buildEvidenceSummary(
  phase: CyclePhase,
  input: CyclePhaseInput
): string {
  const signals: string[] = []

  if (input.trendBaseline) {
    signals.push(`trend appears ${input.trendBaseline.direction} (delta: ${input.trendBaseline.delta.toFixed(2)})`)
  }
  if (input.markovRegime) {
    signals.push(`regime suggests ${input.markovRegime.dominantState} state (stability: ${input.markovRegime.stateStability.toFixed(2)})`)
  }
  if (input.monteCarloScenario) {
    signals.push(`scenarios indicate dispersion of ${input.monteCarloScenario.scenarioDispersion.toFixed(2)}`)
  }
  if (input.bayesianPosterior) {
    signals.push(`posterior belief strength at ${input.bayesianPosterior.beliefStrength.toFixed(2)}`)
  }

  if (signals.length === 0) {
    return `No upstream evidence available; classification defaults to ${phase}`
  }

  return `Evidence consistent with ${phase} phase: ${signals.join('; ')}`
}

// ---------------------------------------------------------------------------
// Exported pure functions (5 authorized exports)
// ---------------------------------------------------------------------------

/**
 * Detects phase ambiguity from phase scores.
 * Formula: ambiguity = 1 - (topScore - runnerUpScore) / topScore
 * Returns 0 when one phase dominates completely, 1 when scores are equal.
 */
export function detectPhaseAmbiguity(
  scores: Record<CyclePhase, number>
): number {
  const values = Object.values(scores).sort((a, b) => b - a)
  const topScore = values[0]
  const runnerUp = values[1]

  if (topScore === 0) return 1
  if (runnerUp === 0 && topScore > 0) return 0

  return 1 - (topScore - runnerUp) / topScore
}

/**
 * Computes overall confidence using the multiplicative penalty chain.
 * confidence = phaseScore * upstreamConfidence * qualityPenalty * warningPenalty * stalenessPenalty
 */
export function computePhaseConfidence(
  phaseScore: number,
  input: CyclePhaseInput
): CyclePhaseConfidence {
  // Phase score confidence — clamped to [0, 1]
  const phaseScoreConfidence = Math.max(0, Math.min(1, phaseScore))

  // Upstream confidence penalty — geometric mean of available upstream confidences
  const upstreamConfidences: number[] = []
  if (input.trendBaseline) upstreamConfidences.push(input.trendBaseline.confidence)
  if (input.markovRegime) upstreamConfidences.push(input.markovRegime.confidence)
  if (input.monteCarloScenario) upstreamConfidences.push(input.monteCarloScenario.confidence)
  if (input.bayesianPosterior) upstreamConfidences.push(input.bayesianPosterior.confidence)

  let upstreamConfidencePenalty: number
  if (upstreamConfidences.length === 0) {
    upstreamConfidencePenalty = 0
  } else {
    const product = upstreamConfidences.reduce((acc, c) => acc * c, 1)
    upstreamConfidencePenalty = Math.pow(product, 1 / upstreamConfidences.length)
  }

  // Data quality penalty — lowest quality tier applies
  let dataQualityPenalty = 1.0
  if (input.trendBaseline) {
    const quality = input.trendBaseline.dataQuality
    if (quality === 'low') {
      dataQualityPenalty = Math.min(dataQualityPenalty, CYCLE_PHASE_THRESHOLDS.QUALITY_PENALTY_LOW)
    } else if (quality === 'moderate') {
      dataQualityPenalty = Math.min(dataQualityPenalty, CYCLE_PHASE_THRESHOLDS.QUALITY_PENALTY_MODERATE)
    }
  }

  // Warning penalty — each warning reduces confidence by WARNING_PENALTY_FACTOR
  const warningCount = input.inheritedWarnings.length
  const warningPenalty = Math.pow(CYCLE_PHASE_THRESHOLDS.WARNING_PENALTY_FACTOR, warningCount)

  // Staleness penalty — pure function cannot check real time, so defaults to 1.0
  // Staleness is evaluated at the integration layer, not in pure functions
  const stalenessPenalty = 1.0

  const overall = Math.max(0, Math.min(1,
    phaseScoreConfidence * upstreamConfidencePenalty * dataQualityPenalty * warningPenalty * stalenessPenalty
  ))

  return {
    phaseScoreConfidence,
    upstreamConfidencePenalty,
    dataQualityPenalty,
    warningPenalty,
    stalenessPenalty,
    overall,
  }
}

/**
 * Assesses phase transition risk from upstream signals and ambiguity.
 * Components: regime transition probability, trend reversal, scenario dispersion, ambiguity.
 */
export function assessPhaseTransitionRisk(
  input: CyclePhaseInput,
  ambiguityScore: number
): CyclePhaseTransitionRisk {
  // Regime transition component — from M-F
  const regimeTransitionComponent = input.markovRegime
    ? Math.max(0, Math.min(1, input.markovRegime.transitionProbability))
    : 0.5 // Default moderate risk when missing

  // Trend reversal component — from M-G
  const trendReversalComponent = input.trendBaseline
    ? Math.max(0, Math.min(1, input.trendBaseline.reversalIndicator))
    : 0.5

  // Scenario dispersion component — from M-D
  const scenarioDispersionComponent = input.monteCarloScenario
    ? Math.max(0, Math.min(1, input.monteCarloScenario.scenarioDispersion))
    : 0.5

  // Ambiguity component — directly from ambiguity score
  const ambiguityComponent = Math.max(0, Math.min(1, ambiguityScore))

  // Overall — weighted average (equal weights)
  const overall = Math.max(0, Math.min(1,
    (regimeTransitionComponent + trendReversalComponent +
      scenarioDispersionComponent + ambiguityComponent) / 4
  ))

  return {
    regimeTransitionComponent,
    trendReversalComponent,
    scenarioDispersionComponent,
    ambiguityComponent,
    overall,
  }
}

/**
 * Assembles the final CyclePhaseResult with all safety fields enforced.
 */
export function buildCyclePhaseResult(params: {
  readonly phase: CyclePhase
  readonly phaseScores: Readonly<Record<CyclePhase, number>>
  readonly confidence: number
  readonly transitionRisk: number
  readonly ambiguityScore: number
  readonly warnings: readonly CyclePhaseWarning[]
  readonly evidenceSummary: string
  readonly assumptions: readonly string[]
  readonly provenanceTrail: readonly string[]
}): CyclePhaseResult {
  return {
    phase: params.phase,
    confidence: params.confidence,
    phaseScores: params.phaseScores,
    transitionRisk: params.transitionRisk,
    ambiguityScore: params.ambiguityScore,
    warnings: params.warnings,
    evidenceSummary: params.evidenceSummary,
    assumptions: params.assumptions,
    provenanceTrail: params.provenanceTrail,
    advisoryOnly: CYCLE_PHASE_DEFAULT_SAFETY_FLAGS.advisoryOnly,
    humanReviewRequired: CYCLE_PHASE_DEFAULT_SAFETY_FLAGS.humanReviewRequired,
    noActionRecommended: CYCLE_PHASE_DEFAULT_SAFETY_FLAGS.noActionRecommended,
  }
}

/**
 * Orchestrator — fuses upstream evidence and returns CyclePhaseResult.
 * Pure function: deterministic, no side effects, no I/O, no mutation.
 */
export function classifyCyclePhase(input: CyclePhaseInput): CyclePhaseResult {
  // Collect warnings
  const warnings = aggregateUpstreamWarnings(input)

  // Check for blocking warnings — forces uncertain
  const hasBlockingWarning = warnings.some(
    w => w.severity === CYCLE_PHASE_WARNING_SEVERITIES.block
  ) || input.inheritedWarnings.some(
    w => w.severity === CYCLE_PHASE_WARNING_SEVERITIES.block
  )

  // Compute phase scores
  const phaseScores = computePhaseScores(input)

  // Detect ambiguity
  const ambiguityScore = detectPhaseAmbiguity(phaseScores)

  // Apply hysteresis to determine phase
  let phase = applyPhaseHysteresis(phaseScores)

  // Force uncertain on blocking conditions
  if (hasBlockingWarning) {
    phase = CYCLE_PHASES.uncertain
  }

  // Force uncertain on high ambiguity
  if (ambiguityScore >= CYCLE_PHASE_THRESHOLDS.AMBIGUITY_THRESHOLD) {
    phase = CYCLE_PHASES.uncertain
  }

  // Compute confidence
  const winningScore = phaseScores[phase] ?? 0
  const confidenceBreakdown = computePhaseConfidence(winningScore, input)

  // Force uncertain on low confidence
  if (confidenceBreakdown.overall < CYCLE_PHASE_THRESHOLDS.MIN_CONFIDENCE) {
    phase = CYCLE_PHASES.uncertain
  }

  // Add ambiguity warning if applicable
  const allWarnings: CyclePhaseWarning[] = [...warnings]
  if (ambiguityScore >= CYCLE_PHASE_THRESHOLDS.AMBIGUITY_THRESHOLD) {
    allWarnings.push({
      code: CYCLE_PHASE_WARNING_CODES.HIGH_AMBIGUITY,
      message: `Ambiguity score (${ambiguityScore.toFixed(2)}) exceeds threshold (${CYCLE_PHASE_THRESHOLDS.AMBIGUITY_THRESHOLD})`,
      severity: CYCLE_PHASE_WARNING_SEVERITIES.warn,
      source: 'cycle-phase-model',
    })
  }

  // Build evidence summary
  const evidenceSummary = buildEvidenceSummary(phase, input)

  // Compute transition risk
  const transitionRisk = assessPhaseTransitionRisk(input, ambiguityScore)

  // Build assumptions
  const assumptions = [
    ...input.assumptions,
    'cycle phase classification is advisory only',
  ]

  // Build provenance trail
  const provenanceTrail = [
    ...input.provenanceTrail,
    'M-H',
  ]

  return buildCyclePhaseResult({
    phase,
    phaseScores,
    confidence: confidenceBreakdown.overall,
    transitionRisk: transitionRisk.overall,
    ambiguityScore,
    warnings: allWarnings,
    evidenceSummary,
    assumptions,
    provenanceTrail,
  })
}
