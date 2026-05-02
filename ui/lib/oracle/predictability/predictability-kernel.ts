import type {
  PredictabilityInput,
  PredictabilityForecast,
  TrendDelta,
  RegimeState,
  ForecastBand
} from './types'
import { compareTrendWindows, scoreTrendMomentum } from './trend-delta'
import { detectRegimeShift, scoreLandmarkInfluence, applyRegimeInfluence } from './regime-shift'
import {
  scoreBehavioralPattern,
  summarizeBehavioralTendency,
  detectRepeatedBehavior
} from './behavioral-repetition'

export function calculatePredictabilityForecast(input: PredictabilityInput): PredictabilityForecast {
  const warnings: string[] = []
  const supportingEvidence: string[] = []
  const opposingEvidence: string[] = []
  const behavioralSignals: string[] = []

  // Compute trend score from sorted windows
  let trendScore = 0
  let trendDelta: TrendDelta | null = null

  if (input.trendWindows && input.trendWindows.length >= 2) {
    const sorted = [...input.trendWindows].sort(
      (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime()
    )

    const previous = sorted[sorted.length - 2]
    const current = sorted[sorted.length - 1]

    trendDelta = compareTrendWindows(previous, current)
    trendScore = scoreTrendMomentum(trendDelta)

    // Check for stale trends
    const daysSinceTrend =
      (new Date(input.targetDate).getTime() - new Date(current.end).getTime()) /
      (1000 * 60 * 60 * 24)
    if (daysSinceTrend > 30) {
      warnings.push('stale_trend')
    }

    // Check for volatile signals
    if (trendDelta.strength > 0.8) {
      warnings.push('volatile_signal')
    }

    if (trendScore > 0.6) {
      supportingEvidence.push(
        `trend shows ${trendDelta.direction} momentum (strength: ${(trendDelta.strength * 100).toFixed(0)}%)`
      )
    } else if (trendScore < 0.4) {
      opposingEvidence.push(
        `trend shows ${trendDelta.direction} momentum (strength: ${(trendDelta.strength * 100).toFixed(0)}%)`
      )
    }
  } else {
    warnings.push('insufficient_history')
  }

  // Detect regime and apply landmark influence
  let landmarkScore = 0
  let activeRegime: RegimeState | null = null

  if (input.landmarkEvents && input.landmarkEvents.length > 0) {
    activeRegime = detectRegimeShift(input.landmarkEvents, input.targetDate)

    const landmarkInfluences = input.landmarkEvents.map(e => scoreLandmarkInfluence(e, input.targetDate))
    landmarkScore =
      landmarkInfluences.length > 0 ? landmarkInfluences.reduce((a, b) => a + b, 0) / landmarkInfluences.length : 0

    if (activeRegime) {
      landmarkScore = applyRegimeInfluence(landmarkScore, activeRegime)
      supportingEvidence.push(`regime shift active: ${activeRegime.label}`)
    }

    // Warn about unknown impacts
    const unknownImpactEvents = input.landmarkEvents.filter(e => e.impact === 'unknown')
    if (unknownImpactEvents.length > 0) {
      warnings.push('unknown_impact_events')
    }
  }

  // Score behavioral patterns
  let behavioralScore = 0
  const repeatedBehaviors = input.objective
    ? detectRepeatedBehavior(input.behavioralPatterns || [], input.objective)
    : input.behavioralPatterns || []

  if (repeatedBehaviors.length > 0) {
    const behaviorScores = repeatedBehaviors.map(p => scoreBehavioralPattern(p))
    behavioralScore = behaviorScores.reduce((a, b) => a + b, 0) / behaviorScores.length

    repeatedBehaviors.forEach(pattern => {
      const summary = summarizeBehavioralTendency(pattern)
      behavioralSignals.push(summary)
    })

    if (behavioralScore > 0.75) {
      supportingEvidence.push(`${repeatedBehaviors.length} behavioral pattern(s) show strong positive tendency`)
    } else if (behavioralScore < 0.25) {
      opposingEvidence.push(`${repeatedBehaviors.length} behavioral pattern(s) show weak or negative tendency`)
    }
  }

  // Score cycles aligned to horizon
  let cycleScore = 0
  const horizonToCycleScale: Record<string, string> = {
    short: 'micro',
    medium: 'meso',
    long: 'macro'
  }
  const targetScale = horizonToCycleScale[input.horizon] || 'meso'

  if (input.cycleWindows && input.cycleWindows.length > 0) {
    const relevantCycles = input.cycleWindows.filter(c => c.scale === targetScale)
    if (relevantCycles.length > 0) {
      const cycleScores = relevantCycles.map(c => {
        const targetTime = new Date(input.targetDate).getTime()
        const observedTime = new Date(c.lastObserved).getTime()
        const daysSinceObserved = (targetTime - observedTime) / (1000 * 60 * 60 * 24)
        const recencyFactor = Math.max(0.4, Math.min(1, 1 - daysSinceObserved / (c.period * 2)))
        return c.confidence * recencyFactor
      })
      cycleScore = cycleScores.reduce((a, b) => a + b, 0) / cycleScores.length
      supportingEvidence.push(
        `${targetScale} cycle alignment: ${(cycleScore * 100).toFixed(0)}% to objective`
      )
    }
  }

  // Count evidence
  const evidenceCount =
    (input.landmarkEvents?.length || 0) + (repeatedBehaviors.length || 0) + (input.cycleWindows?.length || 0)

  // Check for weak evidence
  if (evidenceCount === 0) {
    warnings.push('no_evidence')
  } else if (evidenceCount < 3) {
    warnings.push('weak_evidence')
  }

  // Check for scaffold fixtures
  const lowTrustSourceTiers = new Set(['T3', 'T4', 'T5'])
  const landmarkEvents = input.landmarkEvents || []
  const scaffoldLandmarks = landmarkEvents.filter(e => lowTrustSourceTiers.has(e.sourceTier))
  const hasScaffoldAsOnlySource =
    landmarkEvents.length > 0 && scaffoldLandmarks.length === landmarkEvents.length
  if (hasScaffoldAsOnlySource) {
    warnings.push('scaffold_fixtures_only')
  }

  // Calculate final confidence-weighted score
  const baseScore = trendScore * 0.35 + landmarkScore * 0.3 + behavioralScore * 0.25 + cycleScore * 0.1
  const confidenceBoost = 0.8 + Math.min(evidenceCount * 0.067, 0.2)
  const finalScore = Math.min(1.0, baseScore * confidenceBoost)

  // Map to forecast band
  let forecastBand: ForecastBand
  if (finalScore < 0.25) {
    forecastBand = 'unlikely'
  } else if (finalScore < 0.5) {
    forecastBand = 'possible'
  } else if (finalScore < 0.75) {
    forecastBand = 'likely'
  } else {
    forecastBand = 'strong'
  }

  // If only scaffold evidence, prevent strong forecast
  if (hasScaffoldAsOnlySource && forecastBand === 'strong') {
    forecastBand = 'likely'
  }

  return {
    scenario: `${input.domain}:${input.objective}:${input.targetDate}`,
    forecastBand,
    score: finalScore,
    confidence: finalScore,
    trendDeltas: trendDelta ? [trendDelta] : [],
    activeRegime,
    supportingEvidence,
    opposingEvidence,
    behavioralSignals,
    warnings,
    assumptions: [
      '180-day decay half-life for landmark influence',
      'trend window confidence averaged for trend delta',
      'behavioral patterns scored by win rate with observation confidence',
      `cycle alignment measured against ${targetScale} scale for ${input.horizon} horizon`,
      'confidence boost of 0.8 baseline plus 6.7% per evidence item (capped +0.2)'
    ],
    recommendedNextMove:
      warnings.length > 0
        ? 'Review warnings and supporting evidence before using this advisory forecast.'
        : 'Use as advisory input for human review; do not take autonomous action.'
  }
}
