import type { BehavioralPattern } from './types'

export function scoreBehavioralPattern(pattern: BehavioralPattern): number {
  const totalOutcomes = pattern.positiveOutcomes + pattern.negativeOutcomes + pattern.neutralOutcomes
  if (totalOutcomes === 0) return 0

  const winRate = pattern.positiveOutcomes / totalOutcomes
  const observationConfidence = Math.min(pattern.observedCount / 10, 1.0)
  const sourceTierConfidence = 1.0 - (parseInt(pattern.sourceTier.slice(1)) / 5) * 0.2

  const score =
    winRate * 0.5 +
    observationConfidence * 0.25 +
    pattern.confidence * 0.25 +
    sourceTierConfidence * 0.1

  return Math.max(0, Math.min(1.0, score))
}

export function summarizeBehavioralTendency(pattern: BehavioralPattern): string {
  const totalOutcomes = pattern.positiveOutcomes + pattern.negativeOutcomes + pattern.neutralOutcomes
  if (totalOutcomes === 0) return 'No observed outcomes yet.'

  const positiveRate = Math.round((pattern.positiveOutcomes / totalOutcomes) * 100)
  return `When ${pattern.triggerCondition}, ${pattern.repeatedBehavior} succeeds ${positiveRate}% of the time (${pattern.observedCount} observations).`
}

export function detectRepeatedBehavior(
  patterns: BehavioralPattern[],
  objective: string
): BehavioralPattern[] {
  return patterns.filter(
    p => p.tags && p.tags.some(tag => objective.toLowerCase().includes(tag.toLowerCase()))
  )
}
