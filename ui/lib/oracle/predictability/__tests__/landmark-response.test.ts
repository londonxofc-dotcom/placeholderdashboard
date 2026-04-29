import { describe, test, expect } from 'vitest'
import {
  scoreLandmarkResponse,
  detectPostLandmarkPattern,
  estimateRecoveryWindow,
  classifyResponseTendency,
  type LandmarkResponseTendency,
  type LandmarkResponseScore,
} from '../landmark-response'

describe('landmark-response', () => {
  // Fixture: common test data
  const landmark = {
    eventName: 'campaign_launch_failure',
    magnitude: 0.8,
    sentiment: 'negative' as const,
    timestamp: '2026-04-20',
  }

  const recoveryEvents = [
    { timestamp: '2026-04-22', trendDelta: 0.05, confidence: 0.6 },
    { timestamp: '2026-04-24', trendDelta: 0.12, confidence: 0.7 },
    { timestamp: '2026-04-26', trendDelta: 0.08, confidence: 0.65 },
  ]

  const cautionEvents = [
    { timestamp: '2026-04-22', trendDelta: -0.02, confidence: 0.4 },
    { timestamp: '2026-04-24', trendDelta: -0.01, confidence: 0.35 },
  ]

  const mixedEvents = [
    { timestamp: '2026-04-22', trendDelta: 0.05, confidence: 0.6 },
    { timestamp: '2026-04-24', trendDelta: -0.1, confidence: 0.7 },
    { timestamp: '2026-04-26', trendDelta: 0.03, confidence: 0.5 },
  ]

  test('1. recent high-magnitude landmark increases response influence', () => {
    const recentLandmark = {
      ...landmark,
      magnitude: 0.9,
      timestamp: '2026-04-20', // same as base landmark
    }

    const recentRecoveryEvents = [
      { timestamp: '2026-04-22', trendDelta: 0.15, confidence: 0.8 },
      { timestamp: '2026-04-24', trendDelta: 0.18, confidence: 0.85 },
      { timestamp: '2026-04-26', trendDelta: 0.2, confidence: 0.82 },
    ]

    const result = scoreLandmarkResponse({
      landmark: recentLandmark,
      postLandmarkEvents: recentRecoveryEvents,
      targetDate: '2026-04-29',
    })

    expect(result.score).toBeGreaterThan(0.5)
    expect(result.confidence).toBeGreaterThan(0.6)
  })

  test('2. stale landmark influence decays over time', () => {
    const staleLandmark = {
      ...landmark,
      timestamp: '2025-04-01', // 364 days ago
    }

    const result = scoreLandmarkResponse({
      landmark: staleLandmark,
      postLandmarkEvents: recoveryEvents,
      targetDate: '2026-04-29',
    })

    expect(result.score).toBeLessThan(0.4)
  })

  test('3. repeated post-landmark behavior increases confidence', () => {
    const repeatedRecovery = [
      ...recoveryEvents,
      { timestamp: '2026-04-20', trendDelta: 0.1, confidence: 0.72 },
      { timestamp: '2026-04-25', trendDelta: 0.09, confidence: 0.68 },
    ]

    const result = scoreLandmarkResponse({
      landmark,
      postLandmarkEvents: repeatedRecovery,
      targetDate: '2026-04-29',
    })

    expect(result.confidence).toBeGreaterThan(0.65)
  })

  test('4. low observed count creates warning', () => {
    const singleEvent = [{ timestamp: '2026-04-05', trendDelta: 0.05, confidence: 0.6 }]

    const result = scoreLandmarkResponse({
      landmark,
      postLandmarkEvents: singleEvent,
      targetDate: '2026-04-29',
    })

    expect(result.warnings.some(w => /low|observation|count/i.test(w))).toBe(true)
  })

  test('5. unknown or mixed impact creates warning, not confidence boost', () => {
    const result = scoreLandmarkResponse({
      landmark,
      postLandmarkEvents: mixedEvents,
      targetDate: '2026-04-29',
    })

    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThan(0.7)
  })

  test('6. recovery tendency estimates a bounded recovery window', () => {
    const result = estimateRecoveryWindow(landmark, recoveryEvents, '2026-04-29')

    expect(result.windowDays).toBeGreaterThan(0)
    expect(result.windowDays).toBeLessThanOrEqual(60)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  test('7. avoidance/caution tendency lowers opportunity confidence', () => {
    const cautionLandmark = {
      ...landmark,
      sentiment: 'negative' as const,
    }

    const strongCautionEvents = [
      { timestamp: '2026-04-22', trendDelta: -0.1, confidence: 0.4 },
      { timestamp: '2026-04-24', trendDelta: -0.08, confidence: 0.35 },
    ]

    const result = scoreLandmarkResponse({
      landmark: cautionLandmark,
      postLandmarkEvents: strongCautionEvents,
      targetDate: '2026-04-29',
    })

    expect(result.tendency).toBe('avoidance')
    expect(result.score).toBeLessThan(0.5)
  })

  test('8. acceleration/opportunity-seeking tendency raises opportunity confidence', () => {
    const positiveLandmark = {
      ...landmark,
      sentiment: 'positive' as const,
      magnitude: 0.7,
    }

    const accelerationEvents = [
      { timestamp: '2026-04-22', trendDelta: 0.15, confidence: 0.8 },
      { timestamp: '2026-04-24', trendDelta: 0.18, confidence: 0.85 },
      { timestamp: '2026-04-26', trendDelta: 0.2, confidence: 0.82 },
    ]

    const result = scoreLandmarkResponse({
      landmark: positiveLandmark,
      postLandmarkEvents: accelerationEvents,
      targetDate: '2026-04-29',
    })

    expect(result.tendency).toBe('acceleration')
    expect(result.score).toBeGreaterThan(0.6)
  })

  test('9. volatile post-landmark pattern creates warning', () => {
    const volatileEvents = [
      { timestamp: '2026-04-05', trendDelta: 0.3, confidence: 0.9 },
      { timestamp: '2026-04-10', trendDelta: -0.25, confidence: 0.85 },
      { timestamp: '2026-04-15', trendDelta: 0.35, confidence: 0.88 },
    ]

    const result = scoreLandmarkResponse({
      landmark,
      postLandmarkEvents: volatileEvents,
      targetDate: '2026-04-29',
    })

    expect(result.warnings.some(w => /volatile|unstable/i.test(w))).toBe(true)
  })

  test('10. output avoids diagnosis language', () => {
    const result = scoreLandmarkResponse({
      landmark,
      postLandmarkEvents: recoveryEvents,
      targetDate: '2026-04-29',
    })

    const output = JSON.stringify(result)

    expect(output).not.toMatch(/disorder|syndrome|patholog|psycholog|mental|illness/i)
    expect(output).not.toMatch(/diagnos|condition|trait/i)
  })

  test('11. no protected/sensitive trait inference', () => {
    const result = scoreLandmarkResponse({
      landmark,
      postLandmarkEvents: recoveryEvents,
      targetDate: '2026-04-29',
    })

    expect(result.tendency).toMatch(/recovery|avoidance|caution|acceleration|correction|opportunity|volatility|neutral/)
    expect(result.assumptions.length).toBeGreaterThan(0)
    expect(result.assumptions.some((a) => a.includes('pattern'))).toBe(true)
  })

  test('12. input objects are not mutated', () => {
    const landmarkCopy = { ...landmark }
    const eventsCopy = JSON.parse(JSON.stringify(recoveryEvents))

    scoreLandmarkResponse({
      landmark,
      postLandmarkEvents: recoveryEvents,
      targetDate: '2026-04-29',
    })

    expect(landmark).toEqual(landmarkCopy)
    expect(recoveryEvents).toEqual(eventsCopy)
  })

  test('detectPostLandmarkPattern: identifies recovery pattern', () => {
    const pattern = detectPostLandmarkPattern(recoveryEvents, landmark.timestamp)

    expect(pattern.pattern).toBe('recovery')
    expect(pattern.strength).toBeGreaterThan(0)
  })

  test('classifyResponseTendency: maps pattern to tendency', () => {
    const tendency = classifyResponseTendency('recovery', 0.85, 'negative')

    expect(tendency).toBe('recovery')
  })

  test('classifyResponseTendency: avoidance for caution pattern', () => {
    const tendency = classifyResponseTendency('caution', 0.7, 'negative')

    expect(tendency).toBe('avoidance')
  })

  test('classifyResponseTendency: acceleration for expansion pattern', () => {
    const tendency = classifyResponseTendency('acceleration', 0.8, 'positive')

    expect(tendency).toBe('acceleration')
  })

  test('estimateRecoveryWindow: returns bounded window', () => {
    const window = estimateRecoveryWindow(landmark, recoveryEvents, '2026-04-29')

    expect(window.windowDays).toBeGreaterThanOrEqual(5)
    expect(window.windowDays).toBeLessThanOrEqual(60)
    expect(window.confidence).toBeGreaterThan(0)
    expect(window.confidence).toBeLessThanOrEqual(1)
  })

  test('scoreLandmarkResponse: clamps score 0–1', () => {
    const result = scoreLandmarkResponse({
      landmark: { ...landmark, magnitude: 2.0 }, // invalid but test clamping
      postLandmarkEvents: recoveryEvents,
      targetDate: '2026-04-29',
    })

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(1)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })
})
