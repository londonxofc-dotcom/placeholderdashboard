// ============================================================================
// Monte Carlo Scenario Type Contract Tests — Stage M-C
// Tests written first (TDD). Type contracts only. No simulation logic.
// No random sampling. No filesystem. No API. No UI. No DB.
// ============================================================================

import {
  MONTE_CARLO_SCENARIO_BANDS,
  MONTE_CARLO_ASSUMPTION_SENSITIVITIES,
  MONTE_CARLO_DISTRIBUTION_SHAPES,
  MONTE_CARLO_WARNING_SEVERITIES,
  MONTE_CARLO_CONTRACT_RULES,
} from '../monte-carlo-scenario-types'

import * as monteCarloExports from '../monte-carlo-scenario-types'

import type {
  MonteCarloScenarioBand,
  MonteCarloAssumptionSensitivity,
  MonteCarloDistributionShape,
  MonteCarloWarningSeverity,
  MonteCarloVariable,
  MonteCarloAssumption,
  MonteCarloScenarioInput,
  MonteCarloScenarioResult,
  MonteCarloWarning,
  MonteCarloContractRule,
} from '../monte-carlo-scenario-types'

// ============================================================================
// 1. Enum-like constant shapes
// ============================================================================

describe('monte-carlo-scenario-types', () => {
  describe('MONTE_CARLO_SCENARIO_BANDS', () => {
    test('has all required scenario bands', () => {
      expect(MONTE_CARLO_SCENARIO_BANDS.downside).toBe('downside')
      expect(MONTE_CARLO_SCENARIO_BANDS.base).toBe('base')
      expect(MONTE_CARLO_SCENARIO_BANDS.upside).toBe('upside')
      expect(MONTE_CARLO_SCENARIO_BANDS.tail_risk).toBe('tail_risk')
      expect(MONTE_CARLO_SCENARIO_BANDS.breakout).toBe('breakout')
    })

    test('has exactly 5 bands', () => {
      expect(Object.keys(MONTE_CARLO_SCENARIO_BANDS)).toHaveLength(5)
    })
  })

  describe('MONTE_CARLO_ASSUMPTION_SENSITIVITIES', () => {
    test('has all required sensitivity labels', () => {
      expect(MONTE_CARLO_ASSUMPTION_SENSITIVITIES.low).toBe('low')
      expect(MONTE_CARLO_ASSUMPTION_SENSITIVITIES.medium).toBe('medium')
      expect(MONTE_CARLO_ASSUMPTION_SENSITIVITIES.high).toBe('high')
      expect(MONTE_CARLO_ASSUMPTION_SENSITIVITIES.critical).toBe('critical')
    })

    test('has exactly 4 sensitivities', () => {
      expect(Object.keys(MONTE_CARLO_ASSUMPTION_SENSITIVITIES)).toHaveLength(4)
    })
  })

  describe('MONTE_CARLO_DISTRIBUTION_SHAPES', () => {
    test('has all required distribution shapes', () => {
      expect(MONTE_CARLO_DISTRIBUTION_SHAPES.uniform).toBe('uniform')
      expect(MONTE_CARLO_DISTRIBUTION_SHAPES.triangular).toBe('triangular')
      expect(MONTE_CARLO_DISTRIBUTION_SHAPES.normal_like).toBe('normal_like')
      expect(MONTE_CARLO_DISTRIBUTION_SHAPES.skewed_positive).toBe('skewed_positive')
      expect(MONTE_CARLO_DISTRIBUTION_SHAPES.skewed_negative).toBe('skewed_negative')
      expect(MONTE_CARLO_DISTRIBUTION_SHAPES.discrete).toBe('discrete')
    })

    test('has exactly 6 shapes', () => {
      expect(Object.keys(MONTE_CARLO_DISTRIBUTION_SHAPES)).toHaveLength(6)
    })
  })

  describe('MONTE_CARLO_WARNING_SEVERITIES', () => {
    test('has all required severity levels', () => {
      expect(MONTE_CARLO_WARNING_SEVERITIES.info).toBe('info')
      expect(MONTE_CARLO_WARNING_SEVERITIES.warn).toBe('warn')
      expect(MONTE_CARLO_WARNING_SEVERITIES.block).toBe('block')
    })

    test('has exactly 3 severities', () => {
      expect(Object.keys(MONTE_CARLO_WARNING_SEVERITIES)).toHaveLength(3)
    })
  })

  // ============================================================================
  // 2. Interface shapes
  // ============================================================================

  describe('MonteCarloScenarioInput shape', () => {
    test('includes objective, assumptions, variables, constraints, horizon, provenance', () => {
      const input: MonteCarloScenarioInput = {
        id: 'sc-1',
        objective: 'Test objective',
        baseProbability: 0.5,
        assumptions: [],
        variables: [],
        constraints: ['no-budget-exceed'],
        horizon: '6 months',
        sourceTier: 'T1',
        confidence: 'LIKELY',
        provenance: 'test-source',
      }
      expect(input.id).toBe('sc-1')
      expect(input.objective).toBe('Test objective')
      expect(input.baseProbability).toBe(0.5)
      expect(input.assumptions).toEqual([])
      expect(input.variables).toEqual([])
      expect(input.constraints).toEqual(['no-budget-exceed'])
      expect(input.horizon).toBe('6 months')
      expect(input.provenance).toBe('test-source')
    })

    test('supports optional notes', () => {
      const input: MonteCarloScenarioInput = {
        id: 'sc-2',
        objective: 'Test',
        baseProbability: 0.5,
        assumptions: [],
        variables: [],
        constraints: [],
        horizon: '3 months',
        sourceTier: 'T2',
        confidence: 'POSSIBLE',
        provenance: 'test',
        notes: 'Some notes',
      }
      expect(input.notes).toBe('Some notes')
    })
  })

  describe('MonteCarloVariable shape', () => {
    test('includes baseline, min, max, distribution shape, sensitivity', () => {
      const variable: MonteCarloVariable = {
        id: 'v-1',
        label: 'Revenue growth',
        baseline: 0.1,
        min: -0.05,
        max: 0.3,
        distributionShape: 'triangular',
        sensitivity: 'high',
        confidence: 'LIKELY',
      }
      expect(variable.baseline).toBe(0.1)
      expect(variable.min).toBe(-0.05)
      expect(variable.max).toBe(0.3)
      expect(variable.distributionShape).toBe('triangular')
      expect(variable.sensitivity).toBe('high')
    })

    test('supports optional notes', () => {
      const variable: MonteCarloVariable = {
        id: 'v-2',
        label: 'Test',
        baseline: 0,
        min: -1,
        max: 1,
        distributionShape: 'uniform',
        sensitivity: 'low',
        confidence: 'POSSIBLE',
        notes: 'Variable note',
      }
      expect(variable.notes).toBe('Variable note')
    })
  })

  describe('MonteCarloAssumption shape', () => {
    test('includes statement, sensitivity, source tier, provenance', () => {
      const assumption: MonteCarloAssumption = {
        id: 'a-1',
        statement: 'Market remains stable',
        sensitivity: 'medium',
        confidence: 'LIKELY',
        sourceTier: 'T1',
        provenance: 'analyst-report',
      }
      expect(assumption.statement).toBe('Market remains stable')
      expect(assumption.sensitivity).toBe('medium')
      expect(assumption.sourceTier).toBe('T1')
      expect(assumption.provenance).toBe('analyst-report')
    })

    test('supports optional notes', () => {
      const assumption: MonteCarloAssumption = {
        id: 'a-2',
        statement: 'Test',
        sensitivity: 'low',
        confidence: 'POSSIBLE',
        sourceTier: 'T3',
        provenance: 'test',
        notes: 'Assumption note',
      }
      expect(assumption.notes).toBe('Assumption note')
    })
  })

  describe('MonteCarloScenarioResult shape', () => {
    test('includes probability range, median, downside, upside, tail risk', () => {
      const result: MonteCarloScenarioResult = {
        scenarioId: 'sc-1',
        band: 'base',
        probabilityRange: [0.3, 0.7],
        medianEstimate: 0.5,
        downsideEstimate: 0.2,
        upsideEstimate: 0.8,
        tailRiskEstimate: 0.05,
        assumptionsUsed: [],
        sensitiveVariables: [],
        warnings: [],
        advisoryOnly: true,
      }
      expect(result.probabilityRange).toEqual([0.3, 0.7])
      expect(result.medianEstimate).toBe(0.5)
      expect(result.downsideEstimate).toBe(0.2)
      expect(result.upsideEstimate).toBe(0.8)
      expect(result.tailRiskEstimate).toBe(0.05)
    })

    test('advisoryOnly is part of result shape', () => {
      const result: MonteCarloScenarioResult = {
        scenarioId: 'sc-1',
        band: 'base',
        probabilityRange: [0.4, 0.6],
        medianEstimate: 0.5,
        downsideEstimate: 0.3,
        upsideEstimate: 0.7,
        tailRiskEstimate: 0.1,
        assumptionsUsed: [],
        sensitiveVariables: [],
        warnings: [],
        advisoryOnly: true,
      }
      expect(result.advisoryOnly).toBe(true)
    })
  })

  describe('MonteCarloWarning shape', () => {
    test('includes code, message, severity', () => {
      const warning: MonteCarloWarning = {
        code: 'TEST_WARNING',
        message: 'Test warning message',
        severity: 'warn',
      }
      expect(warning.code).toBe('TEST_WARNING')
      expect(warning.message).toBe('Test warning message')
      expect(warning.severity).toBe('warn')
    })

    test('supports optional variableId and assumptionId', () => {
      const warning: MonteCarloWarning = {
        code: 'TEST',
        message: 'Test',
        severity: 'info',
        variableId: 'v-1',
        assumptionId: 'a-1',
      }
      expect(warning.variableId).toBe('v-1')
      expect(warning.assumptionId).toBe('a-1')
    })
  })

  // ============================================================================
  // 3. Contract rules
  // ============================================================================

  describe('MONTE_CARLO_CONTRACT_RULES', () => {
    test('has exactly 10 contract rules', () => {
      expect(MONTE_CARLO_CONTRACT_RULES).toHaveLength(10)
    })

    test.each([
      ['SCENARIO_OUTPUT_MUST_BE_RANGE', 'block', 'MonteCarloScenarioResult.probabilityRange'],
      ['ASSUMPTIONS_MUST_BE_EXPLICIT', 'block', 'MonteCarloScenarioResult.assumptionsUsed'],
      ['SENSITIVE_VARIABLES_MUST_BE_LISTED', 'block', 'MonteCarloScenarioResult.sensitiveVariables'],
      ['TAIL_RISK_MUST_BE_PRESERVED', 'block', 'MonteCarloScenarioResult.tailRiskEstimate'],
      ['WEAK_CONFIDENCE_EXPANDS_RANGE', 'warn', 'MonteCarloScenarioResult.probabilityRange'],
      ['NO_CERTAINTY_CLAIMS', 'block', 'MonteCarloScenarioResult'],
      ['ADVISORY_ONLY_OUTPUT', 'block', 'MonteCarloScenarioResult.advisoryOnly'],
      ['HUMAN_REVIEW_REQUIRED_FOR_ACTION', 'block', 'MonteCarloScenarioResult'],
      ['PROVENANCE_REQUIRED', 'block', 'MonteCarloAssumption.provenance'],
      ['NO_RANDOM_RUNTIME_YET', 'block', 'MonteCarloScenarioResult'],
    ] as const)('rule %s exists with severity %s and appliesTo %s', (id, severity, appliesTo) => {
      const rule = MONTE_CARLO_CONTRACT_RULES.find(r => r.id === id)
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe(severity)
      expect(rule!.appliesTo).toBe(appliesTo)
      expect(rule!.description.length).toBeGreaterThan(0)
    })

    test('all rules have non-empty descriptions', () => {
      for (const rule of MONTE_CARLO_CONTRACT_RULES) {
        expect(rule.description.length).toBeGreaterThan(0)
      }
    })

    test('all rule IDs are unique', () => {
      const ids = MONTE_CARLO_CONTRACT_RULES.map(r => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  // ============================================================================
  // 4. Boundary checks — no implementation, no leaks
  // ============================================================================

  describe('boundary checks', () => {
    test('no implementation functions are exported', () => {
      const exportKeys = Object.keys(monteCarloExports)
      const functionExports = exportKeys.filter(k => {
        const val = (monteCarloExports as Record<string, unknown>)[k]
        return typeof val === 'function'
      })
      expect(functionExports).toEqual([])
    })

    test('no random sampling function exists', () => {
      const exportKeys = Object.keys(monteCarloExports)
      const samplingNames = exportKeys.filter(k =>
        /random|sample|simulate|run/i.test(k)
      )
      expect(samplingNames).toEqual([])
    })

    test('no Evidence Router imports in exports', () => {
      const exportKeys = Object.keys(monteCarloExports)
      const routerLeaks = exportKeys.filter(k =>
        /evidence.*router|router.*adapter/i.test(k)
      )
      expect(routerLeaks).toEqual([])
    })

    test('no Predictability Kernel imports in exports', () => {
      const exportKeys = Object.keys(monteCarloExports)
      const kernelLeaks = exportKeys.filter(k =>
        /kernel|predictability.*kernel/i.test(k)
      )
      expect(kernelLeaks).toEqual([])
    })

    test('no filesystem, API, UI, DB, current.md, or shell-promoter references in exports', () => {
      const exportKeys = Object.keys(monteCarloExports)
      const forbiddenPatterns = [
        'filesystem', 'writeFile', 'readFile',
        'fetch', 'endpoint', 'route',
        'component', 'render', 'jsx',
        'database', 'query', 'migration',
        'currentMd', 'current_md',
        'shellPromoter', 'shell_promoter',
      ]
      for (const key of exportKeys) {
        const lower = key.toLowerCase()
        for (const pattern of forbiddenPatterns) {
          expect(lower.includes(pattern.toLowerCase())).toBe(false)
        }
      }
    })
  })
})
