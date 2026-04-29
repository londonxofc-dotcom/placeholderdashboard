import { describe, test, expect } from 'vitest'
import {
  calculateTrendVelocity,
  calculateTrendAcceleration,
  classifyMomentumState,
  scoreMomentumShift
} from '../trend-velocity'
import { TrendDelta, TrendWindow } from '../types'

describe('trend-velocity', () => {
  const risingDeltas: TrendDelta[] = [
    {
      signalType: 'engagement',
      previousValue: 0.5,
      currentValue: 0.6,
      delta: 0.1,
      direction: 'rising',
      strength: 0.2,
      confidence: 0.85
    },
    {
      signalType: 'engagement',
      previousValue: 0.6,
      currentValue: 0.75,
      delta: 0.15,
      direction: 'rising',
      strength: 0.25,
      confidence: 0.9
    },
    {
      signalType: 'engagement',
      previousValue: 0.75,
      currentValue: 0.95,
      delta: 0.2,
      direction: 'rising',
      strength: 0.27,
      confidence: 0.88
    }
  ]

  const flatDeltas: TrendDelta[] = [
    {
      signalType: 'engagement',
      previousValue: 0.5,
      currentValue: 0.51,
      delta: 0.01,
      direction: 'flat',
      strength: 0.02,
      confidence: 0.8
    },
    {
      signalType: 'engagement',
      previousValue: 0.51,
      currentValue: 0.5,
      delta: -0.01,
      direction: 'flat',
      strength: 0.02,
      confidence: 0.8
    }
  ]

  const decliningDeltas: TrendDelta[] = [
    {
      signalType: 'engagement',
      previousValue: 0.95,
      currentValue: 0.8,
      delta: -0.15,
      direction: 'falling',
      strength: 0.2,
      confidence: 0.85
    },
    {
      signalType: 'engagement',
      previousValue: 0.8,
      currentValue: 0.6,
      delta: -0.2,
      direction: 'falling',
      strength: 0.25,
      confidence: 0.88
    }
  ]

  test('calculateTrendVelocity: rising deltas produce positive velocity', () => {
    const velocity = calculateTrendVelocity(risingDeltas)
    expect(velocity).toBeGreaterThan(0)
  })

  test('calculateTrendVelocity: flat deltas produce near-zero velocity', () => {
    const velocity = calculateTrendVelocity(flatDeltas)
    expect(velocity).toBeLessThan(0.1)
    expect(velocity).toBeGreaterThanOrEqual(0)
  })

  test('calculateTrendVelocity: declining deltas produce negative velocity', () => {
    const velocity = calculateTrendVelocity(decliningDeltas)
    expect(velocity).toBeLessThan(0)
  })

  test('calculateTrendAcceleration: increasing deltas produce positive acceleration', () => {
    const acceleration = calculateTrendAcceleration([0.1, 0.15, 0.2])
    expect(acceleration).toBeGreaterThan(0)
  })

  test('calculateTrendAcceleration: decreasing deltas produce negative acceleration', () => {
    const acceleration = calculateTrendAcceleration([0.2, 0.15, 0.1])
    expect(acceleration).toBeLessThan(0)
  })

  test('calculateTrendAcceleration: stable velocities produce near-zero acceleration', () => {
    const acceleration = calculateTrendAcceleration([0.1, 0.1, 0.1])
    expect(acceleration).toBeCloseTo(0, 1)
  })

  test('classifyMomentumState: rising velocity with positive acceleration is accelerating', () => {
    const state = classifyMomentumState(0.15, 0.02)
    expect(state).toBe('accelerating')
  })

  test('classifyMomentumState: rising velocity with negative acceleration is decelerating', () => {
    const state = classifyMomentumState(0.15, -0.02)
    expect(state).toBe('decelerating')
  })

  test('classifyMomentumState: near-zero velocity with near-zero acceleration is stable', () => {
    const state = classifyMomentumState(0.01, 0.001)
    expect(state).toBe('stable')
  })

  test('classifyMomentumState: negative velocity with positive acceleration is reversing', () => {
    const state = classifyMomentumState(-0.1, 0.05)
    expect(state).toBe('reversing')
  })

  test('classifyMomentumState: high volatility is classified as volatile', () => {
    const state = classifyMomentumState(0.3, 0.2)
    expect(state).toBe('volatile')
  })

  test('scoreMomentumShift: accelerating from flat produces positive score', () => {
    const result = scoreMomentumShift('stable', 'accelerating')
    expect(result.score).toBeGreaterThan(0.5)
    expect(result.warning).toBeUndefined()
  })

  test('scoreMomentumShift: reversal produces warning', () => {
    const result = scoreMomentumShift('accelerating', 'reversing')
    expect(result.score).toBeLessThan(0.5)
    expect(result.warning).toBeDefined()
  })

  test('scoreMomentumShift: volatile state produces warning', () => {
    const result = scoreMomentumShift('accelerating', 'volatile')
    expect(result.score).toBeLessThan(0.6)
    expect(result.warning).toBeDefined()
  })

  test('scoreMomentumShift: stable to stable maintains mid-range score', () => {
    const result = scoreMomentumShift('stable', 'stable')
    expect(result.score).toBeGreaterThanOrEqual(0.4)
    expect(result.score).toBeLessThanOrEqual(0.6)
  })
})
