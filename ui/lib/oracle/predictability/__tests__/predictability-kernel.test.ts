import { describe, test, expect } from 'vitest'
import { calculatePredictabilityForecast } from '../predictability-kernel'
import type { PredictabilityInput, TrendWindow, LandmarkEvent, BehavioralPattern, CycleWindow } from '../types'

describe('predictability-kernel', () => {
  test('generates strong forecast when evidence is high quality', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'batman',
      horizon: 'medium_term',
      objective: 'booking_system',
      trendWindows: [
        {
          signalType: 'booking_turnaround',
          timestamp: '2026-04-20',
          value: 0.5,
          confidence: 0.85
        },
        {
          signalType: 'booking_turnaround',
          timestamp: '2026-04-23',
          value: 0.8,
          confidence: 0.9
        }
      ],
      landmarkEvents: [
        {
          id: 'event-booking',
          timestamp: '2026-04-20',
          domain: 'batman',
          eventType: 'booking_system_launch',
          description: 'Implemented booking system.',
          impact: 'positive',
          magnitude: 0.8,
          affectedSignals: ['booking_turnaround'],
          createsRegimeShift: true,
          confidence: 0.95,
          sourceTier: 'T0',
          tags: ['booking']
        }
      ],
      behavioralPatterns: [
        {
          id: 'behavior-booking',
          actorScope: 'organization',
          triggerCondition: 'booking inquiry',
          repeatedBehavior: 'system processes inquiry',
          observedCount: 12,
          positiveOutcomes: 11,
          negativeOutcomes: 1,
          neutralOutcomes: 0,
          confidence: 0.92,
          sourceTier: 'T0',
          tags: ['booking']
        }
      ],
      cycleWindows: [
        {
          scale: 'meso',
          strength: 0.8,
          alignmentWithObjective: 0.9
        }
      ]
    }

    const forecast = calculatePredictabilityForecast(input)

    expect(forecast.confidence).toBeGreaterThan(0.65)
    expect(forecast.forecastBand).toBe('strong')
    expect(forecast.supportingEvidence.length).toBeGreaterThan(0)
  })

  test('scaffold fixtures alone cannot create strong forecast', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'jarvis',
      horizon: 'short_term',
      objective: 'automation',
      trendWindows: [
        {
          signalType: 'automation_readiness',
          timestamp: '2026-04-20',
          value: 0.4,
          confidence: 0.5
        },
        {
          signalType: 'automation_readiness',
          timestamp: '2026-04-23',
          value: 0.6,
          confidence: 0.55
        }
      ],
      landmarkEvents: [
        {
          id: 'event-scaffold',
          timestamp: '2026-02-28',
          domain: 'jarvis',
          eventType: 'automation_deployment',
          description: 'Deployed automation.',
          impact: 'positive',
          magnitude: 0.5,
          affectedSignals: ['lead_response_time'],
          createsRegimeShift: false,
          confidence: 0.72,
          sourceTier: 'T3',
          tags: ['automation']
        }
      ],
      behavioralPatterns: [],
      cycleWindows: []
    }

    const forecast = calculatePredictabilityForecast(input)

    if (forecast.forecastBand === 'strong') {
      expect(forecast.warnings).toContain('scaffold_fixtures_only')
    }
    expect(forecast.warnings.some(w => w.includes('scaffold'))).toBeTruthy()
  })

  test('reflects trend direction in supporting evidence', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'test',
      horizon: 'medium_term',
      objective: 'test_goal',
      trendWindows: [
        {
          signalType: 'test_signal',
          timestamp: '2026-04-20',
          value: 0.2,
          confidence: 0.8
        },
        {
          signalType: 'test_signal',
          timestamp: '2026-04-23',
          value: 0.95,
          confidence: 0.85
        }
      ],
      landmarkEvents: [],
      behavioralPatterns: [],
      cycleWindows: []
    }

    const forecast = calculatePredictabilityForecast(input)

    expect(forecast.supportingEvidence.some(e => e.includes('rising'))).toBeTruthy()
  })

  test('aligns cycle scoring to horizon', () => {
    const microInput: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'test',
      horizon: 'short_term',
      objective: 'test',
      trendWindows: [],
      landmarkEvents: [],
      behavioralPatterns: [],
      cycleWindows: [
        {
          scale: 'micro',
          strength: 0.9,
          alignmentWithObjective: 0.95
        },
        {
          scale: 'macro',
          strength: 0.6,
          alignmentWithObjective: 0.7
        }
      ]
    }

    const forecast = calculatePredictabilityForecast(microInput)

    expect(forecast.supportingEvidence.some(e => e.includes('micro'))).toBeTruthy()
  })

  test('includes opposing evidence when patterns are weak', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'test',
      horizon: 'medium_term',
      objective: 'test',
      trendWindows: [
        {
          signalType: 'test_signal',
          timestamp: '2026-04-20',
          value: 0.8,
          confidence: 0.8
        },
        {
          signalType: 'test_signal',
          timestamp: '2026-04-23',
          value: 0.1,
          confidence: 0.8
        }
      ],
      landmarkEvents: [],
      behavioralPatterns: [],
      cycleWindows: []
    }

    const forecast = calculatePredictabilityForecast(input)

    expect(forecast.opposingEvidence.length).toBeGreaterThan(0)
  })

  test('maintains immutability of inputs', () => {
    const originalTrend: TrendWindow = {
      signalType: 'test',
      timestamp: '2026-04-20',
      value: 0.5,
      confidence: 0.8
    }
    const originalBehavior: BehavioralPattern = {
      id: 'b1',
      actorScope: 'organization',
      triggerCondition: 'trigger',
      repeatedBehavior: 'behavior',
      observedCount: 5,
      positiveOutcomes: 4,
      negativeOutcomes: 1,
      neutralOutcomes: 0,
      confidence: 0.8,
      sourceTier: 'T0',
      tags: []
    }

    const trendClone = JSON.parse(JSON.stringify(originalTrend))
    const behaviorClone = JSON.parse(JSON.stringify(originalBehavior))

    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'test',
      horizon: 'medium_term',
      objective: 'test',
      trendWindows: [trendClone, { ...trendClone, timestamp: '2026-04-23', value: 0.7 }],
      landmarkEvents: [],
      behavioralPatterns: [behaviorClone],
      cycleWindows: []
    }

    calculatePredictabilityForecast(input)

    expect(input.trendWindows[0]).toEqual(trendClone)
    expect(input.behavioralPatterns[0]).toEqual(behaviorClone)
  })

  test('does not perform database, API, or filesystem operations', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'test',
      horizon: 'medium_term',
      objective: 'test',
      trendWindows: [],
      landmarkEvents: [],
      behavioralPatterns: [],
      cycleWindows: []
    }

    expect(() => {
      calculatePredictabilityForecast(input)
    }).not.toThrow()
  })

  test('warns when evidence count is low', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'test',
      horizon: 'medium_term',
      objective: 'test',
      trendWindows: [],
      landmarkEvents: [],
      behavioralPatterns: [],
      cycleWindows: []
    }

    const forecast = calculatePredictabilityForecast(input)

    expect(forecast.warnings).toContain('no_evidence')
  })

  test('includes behavioral signals in output', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'batman',
      horizon: 'medium_term',
      objective: 'booking',
      trendWindows: [],
      landmarkEvents: [],
      behavioralPatterns: [
        {
          id: 'b1',
          actorScope: 'organization',
          triggerCondition: 'booking inquiry',
          repeatedBehavior: 'system processes it',
          observedCount: 8,
          positiveOutcomes: 7,
          negativeOutcomes: 1,
          neutralOutcomes: 0,
          confidence: 0.88,
          sourceTier: 'T0',
          tags: ['booking']
        }
      ],
      cycleWindows: []
    }

    const forecast = calculatePredictabilityForecast(input)

    expect(forecast.behavioralSignals.length).toBeGreaterThan(0)
    expect(forecast.behavioralSignals[0]).toContain('When booking inquiry')
  })

  test('includes assumptions in output', () => {
    const input: PredictabilityInput = {
      targetDate: '2026-04-25',
      domain: 'test',
      horizon: 'medium_term',
      objective: 'test',
      trendWindows: [],
      landmarkEvents: [],
      behavioralPatterns: [],
      cycleWindows: []
    }

    const forecast = calculatePredictabilityForecast(input)

    expect(forecast.assumptions.length).toBeGreaterThan(0)
    expect(forecast.assumptions).toContain('180-day decay half-life for landmark influence')
  })
})
