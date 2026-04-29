import type { TrendWindow, TrendDelta, TrendDirection } from './types'

export function compareTrendWindows(
  previousWindow: TrendWindow,
  currentWindow: TrendWindow
): TrendDelta {
  const rawDelta = currentWindow.value - previousWindow.value
  const delta = Math.round(rawDelta * 100) / 100
  const direction = classifyTrendDirection(delta)
  const strength = Math.abs(delta) / (Math.abs(previousWindow.value) + 1)
  const avgConfidence = (previousWindow.confidence + currentWindow.confidence) / 2

  return {
    signalType: currentWindow.signalType,
    previousValue: previousWindow.value,
    currentValue: currentWindow.value,
    delta,
    direction,
    strength: Math.min(strength, 1.0),
    confidence: avgConfidence
  }
}

export function classifyTrendDirection(delta: number): TrendDirection {
  if (delta > 0.05) return 'rising'
  if (delta < -0.05) return 'falling'
  return 'flat'
}

export function scoreTrendMomentum(delta: TrendDelta): number {
  let baseScore = 0

  if (delta.direction === 'rising') {
    baseScore = 0.6 + delta.strength * 0.4
  } else if (delta.direction === 'falling') {
    baseScore = 0.2 - delta.strength * 0.2
  } else {
    baseScore = 0.4
  }

  return Math.max(0, Math.min(1.0, baseScore * delta.confidence))
}
