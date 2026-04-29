import type { LandmarkEvent, RegimeState } from './types'

export function detectRegimeShift(
  landmarkEvents: LandmarkEvent[],
  targetDate: string
): RegimeState | null {
  const targetTime = new Date(targetDate).getTime()
  const shifterEvents = landmarkEvents.filter(e => e.createsRegimeShift)

  if (shifterEvents.length === 0) return null

  const mostRecentShifter = shifterEvents.reduce((latest, event) => {
    const eventTime = new Date(event.timestamp).getTime()
    const latestTime = new Date(latest.timestamp).getTime()
    return eventTime > latestTime ? event : latest
  })

  const shiftTime = new Date(mostRecentShifter.timestamp).getTime()

  if (shiftTime > targetTime) return null

  return {
    id: `regime-${mostRecentShifter.id}`,
    label: `${mostRecentShifter.domain} regime shift (${mostRecentShifter.eventType})`,
    start: mostRecentShifter.timestamp,
    domain: mostRecentShifter.domain,
    activeSignals: mostRecentShifter.affectedSignals,
    originatingLandmarkEventIds: [mostRecentShifter.id],
    confidence: mostRecentShifter.confidence,
    notes: `Initiated by: ${mostRecentShifter.description}`
  }
}

export function scoreLandmarkInfluence(
  event: LandmarkEvent,
  targetDate: string
): number {
  const targetTime = new Date(targetDate).getTime()
  const eventTime = new Date(event.timestamp).getTime()
  const daysAgo = (targetTime - eventTime) / (1000 * 60 * 60 * 24)

  if (daysAgo < 0) return 0

  const halfLife = 180
  const decayFactor = Math.pow(0.5, daysAgo / halfLife)

  let impactMultiplier = 1.0
  if (event.impact === 'positive') impactMultiplier = 1.2
  if (event.impact === 'negative') impactMultiplier = 1.1
  if (event.impact === 'mixed') impactMultiplier = 0.9
  if (event.impact === 'unknown') impactMultiplier = 0.7

  return event.magnitude * event.confidence * decayFactor * impactMultiplier
}

export function applyRegimeInfluence(baseScore: number, regimeState: RegimeState): number {
  const boostCap = 0.15
  const boost = Math.min(boostCap, regimeState.confidence * 0.15)
  return Math.min(1.0, baseScore + boost)
}
