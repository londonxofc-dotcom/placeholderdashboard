import { describe, test, expect } from 'vitest'
import { detectRegimeShift, scoreLandmarkInfluence, applyRegimeInfluence } from '../regime-shift'
import type { LandmarkEvent, RegimeState } from '../types'

describe('regime-shift', () => {
  test('detects recent high-magnitude landmark as regime shift', () => {
    const recentEvent: LandmarkEvent = {
      id: 'event-001',
      timestamp: '2026-04-20',
      domain: 'batman',
      eventType: 'booking_system_launch',
      description: 'Implemented centralized booking system.',
      impact: 'positive',
      magnitude: 0.8,
      affectedSignals: ['booking_turnaround', 'venue_coordination'],
      createsRegimeShift: true,
      confidence: 0.95,
      sourceTier: 'T0',
      tags: ['process', 'infrastructure']
    }

    const regime = detectRegimeShift([recentEvent], '2026-04-25')

    expect(regime).not.toBeNull()
    expect(regime?.label).toContain('booking_system_launch')
    expect(regime?.domain).toBe('batman')
    expect(regime?.confidence).toBe(0.95)
  })

  test('applies decay to stale landmarks', () => {
    const oldEvent: LandmarkEvent = {
      id: 'event-old',
      timestamp: '2025-10-20',
      domain: 'test',
      eventType: 'test_event',
      description: 'Old landmark.',
      impact: 'positive',
      magnitude: 1.0,
      affectedSignals: ['test_signal'],
      createsRegimeShift: false,
      confidence: 1.0,
      sourceTier: 'T0',
      tags: []
    }

    const recentScore = scoreLandmarkInfluence(oldEvent, '2025-10-21')
    const staleScore = scoreLandmarkInfluence(oldEvent, '2026-04-20')

    expect(recentScore).toBeGreaterThan(staleScore)
    expect(staleScore).toBeGreaterThan(0)
  })

  test('warns about unknown-impact events', () => {
    const unknownEvent: LandmarkEvent = {
      id: 'event-unknown',
      timestamp: '2026-04-15',
      domain: 'test',
      eventType: 'uncertain_event',
      description: 'Unknown impact.',
      impact: 'unknown',
      magnitude: 0.5,
      affectedSignals: [],
      createsRegimeShift: false,
      confidence: 0.5,
      sourceTier: 'T2',
      tags: []
    }

    const score = scoreLandmarkInfluence(unknownEvent, '2026-04-20')

    expect(score).toBeLessThan(
      scoreLandmarkInfluence(
        { ...unknownEvent, impact: 'positive' },
        '2026-04-20'
      )
    )
  })

  test('regime influence boost caps at 15%', () => {
    const regime: RegimeState = {
      id: 'regime-high-conf',
      label: 'test regime',
      start: '2026-04-20',
      domain: 'test',
      activeSignals: ['test'],
      originatingLandmarkEventIds: ['event-1'],
      confidence: 1.0,
      notes: 'high confidence regime'
    }

    const boosted = applyRegimeInfluence(0.7, regime)

    expect(boosted).toBeLessThanOrEqual(0.85)
    expect(boosted).toBeGreaterThan(0.7)
  })
})
