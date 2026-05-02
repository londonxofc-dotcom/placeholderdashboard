import { describe, test, expect } from 'vitest'
import {
  detectCycleAlignment,
  scoreCycleWindow,
  classifyCycleScale,
  estimateCyclePhase
} from '../cycle-analysis'
import type { CycleWindow, TrendWindow } from '../types'

const createTrendWindow = (overrides: Partial<TrendWindow> = {}): TrendWindow => ({
  id: 'trend-window',
  label: 'Trend window',
  start: '2026-04-15T00:00:00Z',
  end: '2026-04-15T00:00:00Z',
  scale: 'meso',
  signalType: 'engagement',
  value: 0.75,
  confidence: 0.85,
  sourceTier: 'T0',
  ...overrides,
})

describe('cycle-analysis', () => {
  const sampleWindow = createTrendWindow()

  const recentCycles: CycleWindow[] = [
    {
      period: 7,
      scale: 'meso',
      confidence: 0.9,
      lastObserved: '2026-04-14T00:00:00Z'
    },
    {
      period: 30,
      scale: 'macro',
      confidence: 0.8,
      lastObserved: '2026-04-01T00:00:00Z'
    },
    {
      period: 1,
      scale: 'micro',
      confidence: 0.75,
      lastObserved: '2026-04-15T12:00:00Z'
    }
  ]

  test('detectCycleAlignment: aligned window increases score', () => {
    const result = detectCycleAlignment(sampleWindow, recentCycles)
    expect(result.isAligned).toBe(true)
    expect(result.alignmentScore).toBeGreaterThan(0.5)
    expect(result.matchingCycle).toBeDefined()
  })

  test('detectCycleAlignment: stale, non-aligned window decreases score', () => {
    const offsetWindow = createTrendWindow({
      ...sampleWindow,
      start: '2026-02-01T13:37:00Z',
      end: '2026-02-01T13:37:00Z',
    })
    const staleCycles: CycleWindow[] = [
      {
        period: 7,
        scale: 'meso',
        confidence: 0.9,
        lastObserved: '2026-01-01T00:00:00Z'
      }
    ]
    const result = detectCycleAlignment(offsetWindow, staleCycles)
    expect(result.alignmentScore).toBeLessThan(0.6)
  })

  test('classifyCycleScale: period 1-2 days is micro', () => {
    const scale = classifyCycleScale(1.5)
    expect(scale).toBe('micro')
  })

  test('classifyCycleScale: period 3-14 days is meso', () => {
    const scale = classifyCycleScale(7)
    expect(scale).toBe('meso')
  })

  test('classifyCycleScale: period 15+ days is macro', () => {
    const scale = classifyCycleScale(30)
    expect(scale).toBe('macro')
  })

  test('estimateCyclePhase: phase matches timestamp + period', () => {
    const baseTimestamp = '2026-04-01T00:00:00Z'
    const period = 7
    const phase = estimateCyclePhase(baseTimestamp, period)
    expect(phase).toBeGreaterThanOrEqual(0)
    expect(phase).toBeLessThanOrEqual(1)
  })

  test('scoreCycleWindow: aligned micro cycle with matching phase scores high', () => {
    const window = createTrendWindow({
      id: 'micro-window',
      start: '2026-04-16T00:00:00Z',
      end: '2026-04-16T00:00:00Z',
      value: 0.8,
      confidence: 0.9,
    })
    const microCycles: CycleWindow[] = [
      {
        period: 1,
        scale: 'micro',
        confidence: 0.95,
        lastObserved: '2026-04-16T00:00:00Z'
      }
    ]
    const score = scoreCycleWindow(window, microCycles)
    expect(score).toBeGreaterThan(0.6)
  })

  test('scoreCycleWindow: unaligned or stale cycles reduce score', () => {
    const window = createTrendWindow({ confidence: 0.8 })
    const staleCycles: CycleWindow[] = [
      {
        period: 7,
        scale: 'meso',
        confidence: 0.6,
        lastObserved: '2026-03-01T00:00:00Z'
      }
    ]
    const score = scoreCycleWindow(window, staleCycles)
    expect(score).toBeLessThan(0.5)
  })

  test('scoreCycleWindow: empty cycle history scores baseline', () => {
    const window = createTrendWindow({ confidence: 0.8 })
    const score = scoreCycleWindow(window, [])
    expect(score).toBeGreaterThanOrEqual(0.4)
    expect(score).toBeLessThanOrEqual(0.6)
  })

  test('scoreCycleWindow: macro and meso cycles influence long horizon', () => {
    const window = createTrendWindow()
    const macroCycles: CycleWindow[] = [
      {
        period: 30,
        scale: 'macro',
        confidence: 0.9,
        lastObserved: '2026-04-15T00:00:00Z'
      }
    ]
    const score = scoreCycleWindow(window, macroCycles)
    expect(score).toBeGreaterThan(0.5)
  })
})
