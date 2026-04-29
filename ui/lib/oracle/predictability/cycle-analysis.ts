import type { CycleWindow, TrendWindow, CycleAlignment } from './types'

export function detectCycleAlignment(
  window: TrendWindow,
  cycleHistory: CycleWindow[]
): CycleAlignment {
  if (cycleHistory.length === 0) {
    return {
      isAligned: false,
      alignmentScore: 0.5,
      matchingCycle: null,
      phaseAlignment: 0
    }
  }

  const windowDate = new Date(window.timestamp)
  let bestScore = 0
  let bestCycle: CycleWindow | null = null
  let bestPhase = 0

  for (const cycle of cycleHistory) {
    const phase = estimateCyclePhase(cycle.lastObserved, cycle.period)
    const windowPhase = estimateCyclePhase(window.timestamp, cycle.period)
    const phaseDiff = Math.abs(windowPhase - phase)
    const phaseAlignment = 1 - Math.min(phaseDiff, 1 - phaseDiff)

    const recencyDays = (windowDate.getTime() - new Date(cycle.lastObserved).getTime()) / (1000 * 60 * 60 * 24)
    const recencyFactor = Math.max(0.4, 1 - recencyDays / (cycle.period * 2))

    const score = phaseAlignment * cycle.confidence * recencyFactor

    if (score > bestScore) {
      bestScore = score
      bestCycle = cycle
      bestPhase = phaseAlignment
    }
  }

  return {
    isAligned: bestScore > 0.5,
    alignmentScore: Math.max(0, Math.min(1, bestScore)),
    matchingCycle: bestCycle,
    phaseAlignment: bestPhase
  }
}

export function classifyCycleScale(period: number): 'macro' | 'meso' | 'micro' {
  if (period <= 2) return 'micro'
  if (period <= 14) return 'meso'
  return 'macro'
}

export function estimateCyclePhase(timestamp: string, period: number): number {
  const epochDate = new Date('2026-01-01T00:00:00Z')
  const targetDate = new Date(timestamp)
  const daysSinceEpoch = (targetDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24)
  const phaseRaw = ((daysSinceEpoch % period) + period) % period / period
  return phaseRaw
}

export function scoreCycleWindow(
  window: TrendWindow,
  cycleHistory: CycleWindow[]
): number {
  if (cycleHistory.length === 0) {
    return 0.5
  }

  const alignment = detectCycleAlignment(window, cycleHistory)

  let baseScore = alignment.alignmentScore
  let scaleWeighting = 1

  const matchScale = alignment.matchingCycle?.scale
  if (matchScale === 'micro') {
    scaleWeighting = 0.8
  } else if (matchScale === 'meso') {
    scaleWeighting = 1
  } else if (matchScale === 'macro') {
    scaleWeighting = 1.2
  }

  const cycleConfidenceBoost = alignment.matchingCycle ? alignment.matchingCycle.confidence * 0.15 : 0
  const windowConfidenceBoost = window.confidence * 0.1

  let score = baseScore * scaleWeighting + cycleConfidenceBoost + windowConfidenceBoost
  score = Math.max(0.2, Math.min(1, score))

  return Math.round(score * 100) / 100
}
