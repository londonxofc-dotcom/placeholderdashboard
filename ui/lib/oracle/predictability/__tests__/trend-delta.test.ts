import { describe, test, expect } from 'vitest'
import { compareTrendWindows, classifyTrendDirection, scoreTrendMomentum } from '../trend-delta'
import type { TrendWindow } from '../types'

describe('trend-delta', () => {
  test('classifies rising trend correctly', () => {
    const previous: TrendWindow = {
      signalType: 'engagement',
      timestamp: '2026-04-20',
      value: 0.5,
      confidence: 0.9
    }
    const current: TrendWindow = {
      signalType: 'engagement',
      timestamp: '2026-04-25',
      value: 0.7,
      confidence: 0.85
    }

    const delta = compareTrendWindows(previous, current)

    expect(delta.direction).toBe('rising')
    expect(delta.delta).toBe(0.2)
    expect(delta.strength).toBeGreaterThan(0)
    expect(delta.confidence).toBeLessThanOrEqual(1.0)
    expect(delta.previousValue).toBe(0.5)
    expect(delta.currentValue).toBe(0.7)
  })

  test('classifies falling trend correctly', () => {
    const previous: TrendWindow = {
      signalType: 'velocity',
      timestamp: '2026-04-10',
      value: 0.8,
      confidence: 0.92
    }
    const current: TrendWindow = {
      signalType: 'velocity',
      timestamp: '2026-04-15',
      value: 0.3,
      confidence: 0.88
    }

    const delta = compareTrendWindows(previous, current)

    expect(delta.direction).toBe('falling')
    expect(delta.delta).toBe(-0.5)
    expect(delta.strength).toBeGreaterThan(0)
  })

  test('classifies flat trend when delta is small', () => {
    const previous: TrendWindow = {
      signalType: 'stability',
      timestamp: '2026-04-01',
      value: 0.5,
      confidence: 0.9
    }
    const current: TrendWindow = {
      signalType: 'stability',
      timestamp: '2026-04-05',
      value: 0.51,
      confidence: 0.91
    }

    const delta = compareTrendWindows(previous, current)

    expect(delta.direction).toBe('flat')
    expect(Math.abs(delta.delta)).toBeLessThan(0.1)
  })

  test('scores trend momentum with confidence modulation', () => {
    const rising = {
      direction: 'rising' as const,
      delta: 0.3,
      strength: 0.8,
      confidence: 0.9,
      signalType: 'test',
      previousValue: 0.5,
      currentValue: 0.8,
      strength_capped: 0.8
    }

    const score = scoreTrendMomentum(rising)

    expect(score).toBeGreaterThan(0.6)
    expect(score).toBeLessThanOrEqual(1.0)

    const lowConfidenceRising = { ...rising, confidence: 0.3 }
    const lowConfScore = scoreTrendMomentum(lowConfidenceRising)

    expect(lowConfScore).toBeLessThan(score)
  })
})
