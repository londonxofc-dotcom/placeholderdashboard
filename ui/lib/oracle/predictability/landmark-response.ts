export type LandmarkResponseTendency =
  | 'recovery'
  | 'avoidance'
  | 'caution'
  | 'acceleration'
  | 'process-correction'
  | 'opportunity-seeking'
  | 'volatility'
  | 'neutral'

export interface LandmarkResponseScore {
  score: number
  confidence: number
  tendency: LandmarkResponseTendency
  recoveryWindowDays?: number
  supportingEvents: string[]
  opposingEvents: string[]
  warnings: string[]
  assumptions: string[]
}

export interface RecoveryWindowEstimate {
  windowDays: number
  confidence: number
}

export interface PostLandmarkPattern {
  pattern:
    | 'recovery'
    | 'caution'
    | 'acceleration'
    | 'correction'
    | 'volatility'
    | 'neutral'
  strength: number
}

interface Landmark {
  eventName: string
  magnitude: number
  sentiment: 'positive' | 'negative' | 'neutral'
  timestamp: string
}

interface PostLandmarkEvent {
  timestamp: string
  trendDelta: number
  confidence: number
}

export function scoreLandmarkResponse(input: {
  landmark: Landmark
  postLandmarkEvents: PostLandmarkEvent[]
  targetDate: string
}): LandmarkResponseScore {
  const { landmark, postLandmarkEvents, targetDate } = input

  const assumptions: string[] = []
  const warnings: string[] = []
  const supportingEvents: string[] = []
  const opposingEvents: string[] = []

  // Recency factor: decay score over time
  const landmarkAge = daysBetween(landmark.timestamp, targetDate)
  const recencyDecay = Math.max(0, 1 - landmarkAge / 365) // Linear decay over 1 year
  assumptions.push(`Landmark age ${landmarkAge} days; recency decay applied`)

  if (landmarkAge > 180) {
    warnings.push('Landmark is older than 6 months; influence is weak')
  }

  // Post-landmark pattern detection
  const pattern = detectPostLandmarkPattern(postLandmarkEvents, landmark.timestamp)
  assumptions.push(`Post-landmark pattern identified: ${pattern.pattern} (strength: ${pattern.strength.toFixed(2)})`)

  // Observed event count and consistency
  const observedCount = postLandmarkEvents.length
  if (observedCount < 2) {
    warnings.push('Low observation count')
  }

  // Volatility check
  const volatility = computeVolatility(postLandmarkEvents)
  if (volatility > 0.1) {
    warnings.push('Volatile behavior detected post-landmark')
  }

  // Magnitude influence
  const magnitudeInfluence = Math.min(landmark.magnitude, 1)
  assumptions.push(`Landmark magnitude ${magnitudeInfluence.toFixed(2)} modulates influence`)

  // Classify tendency
  const tendency = classifyResponseTendency(pattern.pattern, pattern.strength, landmark.sentiment)

  // Compute supporting and opposing events
  for (const event of postLandmarkEvents) {
    const timeSinceLandmark = daysBetween(landmark.timestamp, event.timestamp)
    if (timeSinceLandmark >= 0) {
      if (
        (landmark.sentiment === 'negative' && event.trendDelta > 0.05) ||
        (landmark.sentiment === 'positive' && event.trendDelta > 0.05)
      ) {
        supportingEvents.push(`${event.timestamp}: Δ${event.trendDelta.toFixed(2)} (confidence: ${event.confidence.toFixed(2)})`)
      } else if (event.trendDelta < -0.05) {
        opposingEvents.push(`${event.timestamp}: Δ${event.trendDelta.toFixed(2)} (confidence: ${event.confidence.toFixed(2)})`)
      }
    }
  }

  // Confidence: based on pattern strength, recency, and observed count
  const baselineConfidence = 0.4
  const patternBoost = pattern.strength * 0.4 // Up to 0.4
  const countBoost = Math.min(observedCount / 5, 0.2) // Up to 0.2
  let rawConfidence = baselineConfidence + patternBoost + countBoost

  if (warnings.length > 0) {
    rawConfidence *= 0.85 // Penalize confidence if warnings exist
  }

  const confidence = Math.min(Math.max(rawConfidence, 0), 1)

  // Score: combination of pattern strength, recency, magnitude, and tendency alignment
  const patternScore = pattern.strength * magnitudeInfluence * recencyDecay

  // Tendency-specific adjustments
  let tendencyMultiplier = 1
  if (tendency === 'acceleration' || tendency === 'opportunity-seeking') {
    tendencyMultiplier = 1.2
  } else if (tendency === 'avoidance' || tendency === 'caution') {
    tendencyMultiplier = 0.6
  }

  let score = (patternScore + 0.2) * tendencyMultiplier
  if (opposingEvents.length > supportingEvents.length && opposingEvents.length > 0) {
    warnings.push('More opposing than supporting events detected')
    score *= 0.8
  }

  score = Math.min(Math.max(score, 0), 1)

  return {
    score,
    confidence,
    tendency,
    recoveryWindowDays: estimateRecoveryWindow(landmark, postLandmarkEvents, targetDate).windowDays,
    supportingEvents,
    opposingEvents,
    warnings,
    assumptions,
  }
}

export function detectPostLandmarkPattern(
  events: PostLandmarkEvent[],
  landmarkTimestamp: string,
): PostLandmarkPattern {
  if (events.length === 0) {
    return { pattern: 'neutral', strength: 0 }
  }

  const validEvents = events.filter((e) => e.timestamp >= landmarkTimestamp)

  if (validEvents.length === 0) {
    return { pattern: 'neutral', strength: 0 }
  }

  // Compute trend: average delta
  const avgDelta = validEvents.reduce((sum, e) => sum + e.trendDelta, 0) / validEvents.length
  const avgConfidence = validEvents.reduce((sum, e) => sum + e.confidence, 0) / validEvents.length

  // Detect pattern type
  const positiveDelta = validEvents.filter((e) => e.trendDelta > 0.03).length
  const negativeDelta = validEvents.filter((e) => e.trendDelta < -0.03).length

  let pattern: PostLandmarkPattern['pattern']

  if (Math.abs(avgDelta) < 0.02) {
    pattern = 'neutral'
  } else if (validEvents.length >= 3) {
    // Check for consistent direction
    if (positiveDelta >= validEvents.length - 1) {
      pattern = avgDelta > 0.1 ? 'acceleration' : 'recovery'
    } else if (negativeDelta >= validEvents.length - 1) {
      pattern = 'caution'
    } else {
      // Mixed signals
      const volatility = computeVolatility(validEvents)
      pattern = volatility > 0.15 ? 'volatility' : 'correction'
    }
  } else {
    // Few events; use magnitude
    pattern = avgDelta > 0.05 ? 'recovery' : avgDelta < -0.05 ? 'caution' : 'neutral'
  }

  // Strength: weighted by consistency and confidence
  const directionConsistency = Math.max(positiveDelta, negativeDelta) / validEvents.length
  const strength = directionConsistency * avgConfidence

  return { pattern, strength }
}

export function estimateRecoveryWindow(
  landmark: Landmark,
  postLandmarkEvents: PostLandmarkEvent[],
  targetDate: string,
): RecoveryWindowEstimate {
  // Simple heuristic: recovery window scales with landmark magnitude
  // Negative landmarks: allow 5–30 days; positive: allow 5–20 days
  const magnitudeScaling = landmark.magnitude

  let baseWindow = landmark.sentiment === 'negative' ? 20 : 15
  const windowDays = Math.min(5 + baseWindow * magnitudeScaling, 60)

  // Confidence based on observed recovery events
  const recoveryEvents = postLandmarkEvents.filter((e) => e.trendDelta > 0.05)
  const baselineWindowConfidence = 0.5
  const recoveryBoost = Math.min(recoveryEvents.length / 5, 0.3)
  const confidence = Math.min(baselineWindowConfidence + recoveryBoost, 1)

  return {
    windowDays: Math.round(windowDays),
    confidence: Math.min(Math.max(confidence, 0), 1),
  }
}

export function classifyResponseTendency(
  pattern: string,
  strength: number,
  sentiment: 'positive' | 'negative' | 'neutral',
): LandmarkResponseTendency {
  if (strength < 0.2) {
    return 'neutral'
  }

  switch (pattern) {
    case 'recovery':
      return sentiment === 'negative' ? 'recovery' : 'opportunity-seeking'
    case 'acceleration':
      return 'acceleration'
    case 'caution':
      return 'avoidance'
    case 'correction':
      return 'process-correction'
    case 'volatility':
      return 'volatility'
    default:
      return 'neutral'
  }
}

// Utility: compute days between two ISO date strings
function daysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

// Utility: compute volatility of post-landmark events
function computeVolatility(events: PostLandmarkEvent[]): number {
  if (events.length < 2) {
    return 0
  }

  const deltas = events.map((e) => e.trendDelta)
  const mean = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
  const variance = deltas.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / deltas.length
  const stdDev = Math.sqrt(variance)

  return stdDev
}
