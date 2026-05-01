// ============================================================================
// Trend Baseline Type Contracts — Stage M-G Tests
// Type contracts only. No implementation functions. No trend computation.
// No Evidence Router. No Predictability Kernel. No Bayesian updater.
// No Monte Carlo. No Markov transitions. No trend-delta. No trend-velocity.
// ============================================================================

import { describe, it, expect, test } from 'vitest'
import type { TrendDirection } from '../types'
import {
  TREND_BASELINE_DIRECTIONS,
  TREND_BASELINE_OVERLAP_POLICIES,
  TREND_BASELINE_DATA_QUALITY_LEVELS,
  TREND_BASELINE_WARNING_SEVERITIES,
  TREND_BASELINE_THRESHOLDS,
  type TrendBaselineDirection,
  type TrendBaselineDataPoint,
  type TrendBaselineWindowConfig,
  type TrendBaselineInput,
  type TrendBaselineWarning,
  type TrendBaselineResult,
  type TrendBaselineDataQuality,
  type TrendBaselineOverlapPolicy,
  type TrendBaselineWarningSeverity,
} from '../trend-baseline-types'

// --- 1. All types compile without error ---

describe('Stage M-G: Trend Baseline Type Contracts', () => {
  describe('compilation and export verification', () => {
    it('exports TrendBaselineDirection type', () => {
      const direction: TrendBaselineDirection = 'accelerating'
      expect(direction).toBe('accelerating')
    })

    it('exports TrendBaselineDataPoint type', () => {
      const point: TrendBaselineDataPoint = {
        timestamp: '2026-01-01T00:00:00Z',
        value: 42,
        confidence: 0.9,
      }
      expect(point.timestamp).toBe('2026-01-01T00:00:00Z')
      expect(point.value).toBe(42)
      expect(point.confidence).toBe(0.9)
    })

    it('exports TrendBaselineWindowConfig type', () => {
      const config: TrendBaselineWindowConfig = {
        minPointsPerWindow: 3,
        overlapPolicy: 'reject',
      }
      expect(config.minPointsPerWindow).toBe(3)
      expect(config.overlapPolicy).toBe('reject')
    })

    it('exports TrendBaselineInput type', () => {
      const input: TrendBaselineInput = {
        previousWindow: [
          { timestamp: '2026-01-01T00:00:00Z', value: 10, confidence: 0.8 },
        ],
        currentWindow: [
          { timestamp: '2026-02-01T00:00:00Z', value: 20, confidence: 0.9 },
        ],
        windowConfig: { minPointsPerWindow: 3, overlapPolicy: 'reject' },
        signalType: 'engagement',
        assumptions: ['linear trend assumed'],
        provenance: 'test-fixture',
      }
      expect(input.signalType).toBe('engagement')
      expect(input.assumptions).toHaveLength(1)
      expect(input.provenance).toBe('test-fixture')
    })

    it('exports TrendBaselineInput with optional warnings', () => {
      const input: TrendBaselineInput = {
        previousWindow: [],
        currentWindow: [],
        windowConfig: { minPointsPerWindow: 3, overlapPolicy: 'warn' },
        signalType: 'streams',
        assumptions: [],
        provenance: 'test',
        warnings: [
          {
            code: 'UPSTREAM_WARNING',
            message: 'Upstream data may be incomplete',
            severity: 'info',
            field: 'previousWindow',
          },
        ],
      }
      expect(input.warnings).toHaveLength(1)
    })

    it('exports TrendBaselineWarning type', () => {
      const warning: TrendBaselineWarning = {
        code: 'WINDOWS_OVERLAP',
        message: 'Prior and current windows overlap in time range',
        severity: 'block',
        field: 'previousWindow',
      }
      expect(warning.code).toBe('WINDOWS_OVERLAP')
      expect(warning.severity).toBe('block')
    })

    it('exports TrendBaselineResult type', () => {
      const result: TrendBaselineResult = {
        signalType: 'engagement',
        previousTrendSlope: 0.5,
        currentTrendSlope: 0.8,
        delta: 0.3,
        acceleration: 0.1,
        direction: 'accelerating',
        reversalIndicator: 0,
        baselineDeviation: 0.15,
        dataQuality: 'high',
        confidence: 0.85,
        assumptions: ['linear trend assumed'],
        warnings: [],
        provenanceTrail: ['test-fixture'],
        advisoryOnly: true,
        humanReviewRequired: true,
      }
      expect(result.advisoryOnly).toBe(true)
      expect(result.humanReviewRequired).toBe(true)
      expect(result.direction).toBe('accelerating')
    })
  })

  // --- 2. TrendBaselineDirection includes all expected literal values ---

  describe('TrendBaselineDirection values', () => {
    it('includes accelerating', () => {
      const d: TrendBaselineDirection = 'accelerating'
      expect(d).toBe('accelerating')
    })

    it('includes decelerating', () => {
      const d: TrendBaselineDirection = 'decelerating'
      expect(d).toBe('decelerating')
    })

    it('includes stable', () => {
      const d: TrendBaselineDirection = 'stable'
      expect(d).toBe('stable')
    })

    it('includes reversing', () => {
      const d: TrendBaselineDirection = 'reversing'
      expect(d).toBe('reversing')
    })
  })

  // --- 3. Constants are readonly/frozen ---

  describe('constant objects', () => {
    it('TREND_BASELINE_DIRECTIONS has all 4 direction values', () => {
      expect(TREND_BASELINE_DIRECTIONS.accelerating).toBe('accelerating')
      expect(TREND_BASELINE_DIRECTIONS.decelerating).toBe('decelerating')
      expect(TREND_BASELINE_DIRECTIONS.stable).toBe('stable')
      expect(TREND_BASELINE_DIRECTIONS.reversing).toBe('reversing')
      expect(Object.keys(TREND_BASELINE_DIRECTIONS)).toHaveLength(4)
    })

    it('TREND_BASELINE_DIRECTIONS is frozen', () => {
      expect(Object.isFrozen(TREND_BASELINE_DIRECTIONS)).toBe(true)
    })

    it('TREND_BASELINE_OVERLAP_POLICIES has reject and warn', () => {
      expect(TREND_BASELINE_OVERLAP_POLICIES.reject).toBe('reject')
      expect(TREND_BASELINE_OVERLAP_POLICIES.warn).toBe('warn')
      expect(Object.keys(TREND_BASELINE_OVERLAP_POLICIES)).toHaveLength(2)
    })

    it('TREND_BASELINE_OVERLAP_POLICIES is frozen', () => {
      expect(Object.isFrozen(TREND_BASELINE_OVERLAP_POLICIES)).toBe(true)
    })

    it('TREND_BASELINE_DATA_QUALITY_LEVELS has high, moderate, low', () => {
      expect(TREND_BASELINE_DATA_QUALITY_LEVELS.high).toBe('high')
      expect(TREND_BASELINE_DATA_QUALITY_LEVELS.moderate).toBe('moderate')
      expect(TREND_BASELINE_DATA_QUALITY_LEVELS.low).toBe('low')
      expect(Object.keys(TREND_BASELINE_DATA_QUALITY_LEVELS)).toHaveLength(3)
    })

    it('TREND_BASELINE_DATA_QUALITY_LEVELS is frozen', () => {
      expect(Object.isFrozen(TREND_BASELINE_DATA_QUALITY_LEVELS)).toBe(true)
    })

    it('TREND_BASELINE_WARNING_SEVERITIES has info, warn, block', () => {
      expect(TREND_BASELINE_WARNING_SEVERITIES.info).toBe('info')
      expect(TREND_BASELINE_WARNING_SEVERITIES.warn).toBe('warn')
      expect(TREND_BASELINE_WARNING_SEVERITIES.block).toBe('block')
      expect(Object.keys(TREND_BASELINE_WARNING_SEVERITIES)).toHaveLength(3)
    })

    it('TREND_BASELINE_WARNING_SEVERITIES is frozen', () => {
      expect(Object.isFrozen(TREND_BASELINE_WARNING_SEVERITIES)).toBe(true)
    })
  })

  // --- 4. Thresholds ---

  describe('TREND_BASELINE_THRESHOLDS', () => {
    it('has SLOPE_FLAT_THRESHOLD as a positive number', () => {
      expect(TREND_BASELINE_THRESHOLDS.SLOPE_FLAT_THRESHOLD).toBeGreaterThan(0)
      expect(typeof TREND_BASELINE_THRESHOLDS.SLOPE_FLAT_THRESHOLD).toBe('number')
    })

    it('has MIN_POINTS_FOR_QUALITY as a positive integer', () => {
      expect(TREND_BASELINE_THRESHOLDS.MIN_POINTS_FOR_QUALITY).toBeGreaterThanOrEqual(2)
      expect(Number.isInteger(TREND_BASELINE_THRESHOLDS.MIN_POINTS_FOR_QUALITY)).toBe(true)
    })

    it('has EPSILON as a very small positive number', () => {
      expect(TREND_BASELINE_THRESHOLDS.EPSILON).toBeGreaterThan(0)
      expect(TREND_BASELINE_THRESHOLDS.EPSILON).toBeLessThan(0.001)
    })

    it('has HIGH_CONFIDENCE_THRESHOLD in (0, 1)', () => {
      expect(TREND_BASELINE_THRESHOLDS.HIGH_CONFIDENCE_THRESHOLD).toBeGreaterThan(0)
      expect(TREND_BASELINE_THRESHOLDS.HIGH_CONFIDENCE_THRESHOLD).toBeLessThan(1)
    })

    it('has MODERATE_CONFIDENCE_THRESHOLD in (0, HIGH_CONFIDENCE_THRESHOLD)', () => {
      expect(TREND_BASELINE_THRESHOLDS.MODERATE_CONFIDENCE_THRESHOLD).toBeGreaterThan(0)
      expect(TREND_BASELINE_THRESHOLDS.MODERATE_CONFIDENCE_THRESHOLD).toBeLessThan(
        TREND_BASELINE_THRESHOLDS.HIGH_CONFIDENCE_THRESHOLD
      )
    })

    it('has WINDOW_SPAN_MISMATCH_RATIO as a positive number > 1', () => {
      expect(TREND_BASELINE_THRESHOLDS.WINDOW_SPAN_MISMATCH_RATIO).toBeGreaterThan(1)
    })

    it('has QUALITY_PENALTY_LOW in (0, 1)', () => {
      expect(TREND_BASELINE_THRESHOLDS.QUALITY_PENALTY_LOW).toBeGreaterThan(0)
      expect(TREND_BASELINE_THRESHOLDS.QUALITY_PENALTY_LOW).toBeLessThan(1)
    })

    it('has QUALITY_PENALTY_MODERATE in (QUALITY_PENALTY_LOW, 1)', () => {
      expect(TREND_BASELINE_THRESHOLDS.QUALITY_PENALTY_MODERATE).toBeGreaterThan(
        TREND_BASELINE_THRESHOLDS.QUALITY_PENALTY_LOW
      )
      expect(TREND_BASELINE_THRESHOLDS.QUALITY_PENALTY_MODERATE).toBeLessThan(1)
    })

    it('is frozen', () => {
      expect(Object.isFrozen(TREND_BASELINE_THRESHOLDS)).toBe(true)
    })
  })

  // --- 5. TrendBaselineResult safety fields ---

  describe('TrendBaselineResult safety fields', () => {
    it('advisoryOnly field must be literal true', () => {
      const result: TrendBaselineResult = {
        signalType: 'test',
        previousTrendSlope: 0,
        currentTrendSlope: 0,
        delta: 0,
        acceleration: 0,
        direction: 'stable',
        reversalIndicator: 0,
        baselineDeviation: 0,
        dataQuality: 'low',
        confidence: 0,
        assumptions: [],
        warnings: [],
        provenanceTrail: [],
        advisoryOnly: true,
        humanReviewRequired: true,
      }
      expect(result.advisoryOnly).toBe(true)
    })

    it('humanReviewRequired field must be literal true', () => {
      const result: TrendBaselineResult = {
        signalType: 'test',
        previousTrendSlope: 0,
        currentTrendSlope: 0,
        delta: 0,
        acceleration: 0,
        direction: 'stable',
        reversalIndicator: 0,
        baselineDeviation: 0,
        dataQuality: 'low',
        confidence: 0,
        assumptions: [],
        warnings: [],
        provenanceTrail: [],
        advisoryOnly: true,
        humanReviewRequired: true,
      }
      expect(result.humanReviewRequired).toBe(true)
    })
  })

  // --- 6. Warning type has required fields ---

  describe('TrendBaselineWarning structure', () => {
    it('has code, message, severity, and field', () => {
      const warning: TrendBaselineWarning = {
        code: 'TEST_CODE',
        message: 'Test message',
        severity: 'info',
        field: 'testField',
      }
      expect(warning).toHaveProperty('code')
      expect(warning).toHaveProperty('message')
      expect(warning).toHaveProperty('severity')
      expect(warning).toHaveProperty('field')
    })
  })

  // --- 7. No implementation logic in the types file ---

  describe('scope boundary checks', () => {
    test('types file contains no function implementations', async () => {
      const fs = await import('fs')
      const source = fs.readFileSync(
        'lib/oracle/predictability/trend-baseline-types.ts',
        'utf-8'
      )
      // Should not contain function bodies — only type/interface/const declarations
      expect(source).not.toMatch(/function\s+\w+\s*\(/)
      expect(source).not.toMatch(/=>\s*\{/)
      expect(source).not.toMatch(/Math\.\w+/)
    })

    test('no forbidden imports in types file', async () => {
      const fs = await import('fs')
      const source = fs.readFileSync(
        'lib/oracle/predictability/trend-baseline-types.ts',
        'utf-8'
      )
      const forbidden = [
        'bayesian-updater',
        'monte-carlo',
        'markov-regime',
        'trend-delta',
        'trend-velocity',
        'evidence-router',
        'predictability-kernel',
        'adapter-validation',
        'adapter-integration',
        'shell-promoter',
      ]
      for (const keyword of forbidden) {
        expect(source).not.toContain(keyword)
      }
    })

    test('no Evidence Router imports', async () => {
      const fs = await import('fs')
      const source = fs.readFileSync(
        'lib/oracle/predictability/trend-baseline-types.ts',
        'utf-8'
      )
      expect(source).not.toMatch(/import.*evidence.*router/i)
    })

    test('no Predictability Kernel imports', async () => {
      const fs = await import('fs')
      const source = fs.readFileSync(
        'lib/oracle/predictability/trend-baseline-types.ts',
        'utf-8'
      )
      expect(source).not.toMatch(/import.*predictability.*kernel/i)
    })

    test('no UI/API/DB/filesystem/current.md/shell-promoter references', async () => {
      const fs = await import('fs')
      const source = fs.readFileSync(
        'lib/oracle/predictability/trend-baseline-types.ts',
        'utf-8'
      )
      expect(source).not.toContain('current.md')
      expect(source).not.toContain('shell-promoter')
      expect(source).not.toContain('KEEP_DEFERRED')
      expect(source).not.toMatch(/import.*from\s+['"]fs['"]/)
      expect(source).not.toMatch(/import.*from\s+['"]path['"]/)
    })

    test('no certainty language in source file', async () => {
      const fs = await import('fs')
      const source = fs.readFileSync(
        'lib/oracle/predictability/trend-baseline-types.ts',
        'utf-8'
      ).toLowerCase()
      const certaintyWords = ['guaranteed', 'certain', 'definite', 'will happen', 'impossible']
      for (const word of certaintyWords) {
        expect(source).not.toContain(word)
      }
    })
  })
})
