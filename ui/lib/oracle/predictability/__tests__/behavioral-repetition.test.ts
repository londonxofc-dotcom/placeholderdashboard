import { describe, test, expect } from 'vitest'
import { scoreBehavioralPattern, summarizeBehavioralTendency, detectRepeatedBehavior } from '../behavioral-repetition'
import type { BehavioralPattern } from '../types'

describe('behavioral-repetition', () => {
  test('scores positive behavioral pattern highly', () => {
    const pattern: BehavioralPattern = {
      id: 'pattern-positive',
      actorScope: 'organization',
      triggerCondition: 'booking inquiry received',
      repeatedBehavior: 'centralized system processes and responds',
      observedCount: 12,
      positiveOutcomes: 10,
      negativeOutcomes: 1,
      neutralOutcomes: 1,
      confidence: 0.92,
      sourceTier: 'T0',
      tags: ['booking', 'speed']
    }

    const score = scoreBehavioralPattern(pattern)

    expect(score).toBeGreaterThan(0.7)
    expect(score).toBeLessThanOrEqual(1.0)
  })

  test('reduces score when outcomes are mixed', () => {
    const balanced: BehavioralPattern = {
      id: 'pattern-mixed',
      actorScope: 'organization',
      triggerCondition: 'test trigger',
      repeatedBehavior: 'mixed outcomes',
      observedCount: 10,
      positiveOutcomes: 5,
      negativeOutcomes: 5,
      neutralOutcomes: 0,
      confidence: 0.8,
      sourceTier: 'T1',
      tags: []
    }

    const positiveSkewed: BehavioralPattern = {
      ...balanced,
      positiveOutcomes: 8,
      negativeOutcomes: 2
    }

    const balancedScore = scoreBehavioralPattern(balanced)
    const skewedScore = scoreBehavioralPattern(positiveSkewed)

    expect(skewedScore).toBeGreaterThan(balancedScore)
  })

  test('penalizes low observation count', () => {
    const lowCount: BehavioralPattern = {
      id: 'pattern-low',
      actorScope: 'organization',
      triggerCondition: 'test',
      repeatedBehavior: 'test behavior',
      observedCount: 1,
      positiveOutcomes: 1,
      negativeOutcomes: 0,
      neutralOutcomes: 0,
      confidence: 0.9,
      sourceTier: 'T0',
      tags: []
    }

    const highCount: BehavioralPattern = {
      ...lowCount,
      observedCount: 10
    }

    const lowScore = scoreBehavioralPattern(lowCount)
    const highScore = scoreBehavioralPattern(highCount)

    expect(highScore).toBeGreaterThan(lowScore)
  })

  test('avoids diagnosis language in summary', () => {
    const pattern: BehavioralPattern = {
      id: 'pattern-summary',
      actorScope: 'organization',
      triggerCondition: 'booking inquiry',
      repeatedBehavior: 'system processes and responds',
      observedCount: 12,
      positiveOutcomes: 11,
      negativeOutcomes: 1,
      neutralOutcomes: 0,
      confidence: 0.9,
      sourceTier: 'T0',
      tags: []
    }

    const summary = summarizeBehavioralTendency(pattern)

    expect(summary).not.toContain('diagnosis')
    expect(summary).not.toContain('disorder')
    expect(summary).not.toContain('predicts')
    expect(summary).toContain('When booking inquiry')
    expect(summary).toContain('92%')
    expect(summary).toContain('12 observations')
  })

  test('detects repeated behaviors matching objective', () => {
    const patterns: BehavioralPattern[] = [
      {
        id: 'p1',
        actorScope: 'organization',
        triggerCondition: 'trigger 1',
        repeatedBehavior: 'behavior 1',
        observedCount: 5,
        positiveOutcomes: 4,
        negativeOutcomes: 1,
        neutralOutcomes: 0,
        confidence: 0.8,
        sourceTier: 'T0',
        tags: ['booking', 'speed']
      },
      {
        id: 'p2',
        actorScope: 'organization',
        triggerCondition: 'trigger 2',
        repeatedBehavior: 'behavior 2',
        observedCount: 6,
        positiveOutcomes: 5,
        negativeOutcomes: 1,
        neutralOutcomes: 0,
        confidence: 0.85,
        sourceTier: 'T1',
        tags: ['marketing', 'outreach']
      }
    ]

    const bookingPatterns = detectRepeatedBehavior(patterns, 'booking_system')

    expect(bookingPatterns).toHaveLength(1)
    expect(bookingPatterns[0].id).toBe('p1')
  })

  test('returns empty array when no patterns match objective', () => {
    const patterns: BehavioralPattern[] = [
      {
        id: 'p1',
        actorScope: 'organization',
        triggerCondition: 'trigger',
        repeatedBehavior: 'behavior',
        observedCount: 5,
        positiveOutcomes: 4,
        negativeOutcomes: 1,
        neutralOutcomes: 0,
        confidence: 0.8,
        sourceTier: 'T0',
        tags: ['marketing']
      }
    ]

    const matched = detectRepeatedBehavior(patterns, 'nonexistent_objective')

    expect(matched).toHaveLength(0)
  })
})
