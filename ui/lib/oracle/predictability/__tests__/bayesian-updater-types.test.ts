// ============================================================================
// Bayesian Updater Type Contract Tests — Stage M-A
// Validates type shapes and contract rules only.
// No implementation logic. No Bayesian calculation. No runtime scoring.
// ============================================================================

import {
  BAYESIAN_EVIDENCE_DIRECTIONS,
  BAYESIAN_EVIDENCE_STRENGTHS,
  BAYESIAN_UPDATE_MODES,
  BAYESIAN_WARNING_SEVERITIES,
  BAYESIAN_CONTRACT_RULES,
  type BayesianProbability,
  type BayesianEvidenceDirection,
  type BayesianEvidenceStrength,
  type BayesianUpdateMode,
  type BayesianWarningSeverity,
  type BayesianPrior,
  type BayesianEvidenceItem,
  type BayesianUpdateInput,
  type BayesianUpdateWarning,
  type BayesianUpdateResult,
  type BayesianContractRule,
} from '../bayesian-updater-types'

import * as bayesianExports from '../bayesian-updater-types'

describe('bayesian-updater-types', () => {
  // --- 1. All direction labels exist ---
  test('BAYESIAN_EVIDENCE_DIRECTIONS includes supports/opposes/neutral/mixed', () => {
    expect(BAYESIAN_EVIDENCE_DIRECTIONS).toEqual({
      supports: 'supports',
      opposes: 'opposes',
      neutral: 'neutral',
      mixed: 'mixed',
    })
  })

  // --- 2. All strength labels exist ---
  test('BAYESIAN_EVIDENCE_STRENGTHS includes weak/moderate/strong/decisive', () => {
    expect(BAYESIAN_EVIDENCE_STRENGTHS).toEqual({
      weak: 'weak',
      moderate: 'moderate',
      strong: 'strong',
      decisive: 'decisive',
    })
  })

  // --- 3. All update modes exist ---
  test('BAYESIAN_UPDATE_MODES includes conservative/balanced/aggressive', () => {
    expect(BAYESIAN_UPDATE_MODES).toEqual({
      conservative: 'conservative',
      balanced: 'balanced',
      aggressive: 'aggressive',
    })
  })

  // --- 4. BayesianPrior shape includes hypothesis and priorProbability ---
  test('BayesianPrior shape includes hypothesis and priorProbability', () => {
    const prior: BayesianPrior = {
      id: 'test-prior-1',
      hypothesis: 'Test hypothesis',
      priorProbability: 0.5 as BayesianProbability,
      sourceTier: 'T1',
      confidence: 'LIKELY',
      assumptions: ['assumption-1'],
    }
    expect(prior.hypothesis).toBe('Test hypothesis')
    expect(prior.priorProbability).toBe(0.5)
    expect(prior.id).toBe('test-prior-1')
    expect(prior.sourceTier).toBe('T1')
    expect(prior.confidence).toBe('LIKELY')
    expect(prior.assumptions).toEqual(['assumption-1'])
  })

  test('BayesianPrior supports optional createdAt and notes', () => {
    const prior: BayesianPrior = {
      id: 'test-prior-2',
      hypothesis: 'Optional fields test',
      priorProbability: 0.3 as BayesianProbability,
      sourceTier: 'T2',
      confidence: 'INFERRED',
      assumptions: [],
      createdAt: '2026-05-01',
      notes: 'Test note',
    }
    expect(prior.createdAt).toBe('2026-05-01')
    expect(prior.notes).toBe('Test note')
  })

  // --- 5. BayesianEvidenceItem shape includes likelihood fields ---
  test('BayesianEvidenceItem includes likelihoodGivenHypothesis and likelihoodGivenNotHypothesis', () => {
    const evidence: BayesianEvidenceItem = {
      id: 'ev-1',
      claim: 'Test claim',
      direction: 'supports',
      strength: 'moderate',
      likelihoodGivenHypothesis: 0.8 as BayesianProbability,
      likelihoodGivenNotHypothesis: 0.2 as BayesianProbability,
      sourceTier: 'T1',
      confidence: 'LIKELY',
      provenance: 'test-source',
    }
    expect(evidence.likelihoodGivenHypothesis).toBe(0.8)
    expect(evidence.likelihoodGivenNotHypothesis).toBe(0.2)
    expect(evidence.claim).toBe('Test claim')
    expect(evidence.direction).toBe('supports')
    expect(evidence.strength).toBe('moderate')
    expect(evidence.provenance).toBe('test-source')
  })

  test('BayesianEvidenceItem supports optional tags and notes', () => {
    const evidence: BayesianEvidenceItem = {
      id: 'ev-2',
      claim: 'Optional fields',
      direction: 'neutral',
      strength: 'weak',
      likelihoodGivenHypothesis: 0.5 as BayesianProbability,
      likelihoodGivenNotHypothesis: 0.5 as BayesianProbability,
      sourceTier: 'T3',
      confidence: 'INFERRED',
      provenance: 'test',
      tags: ['tag-a', 'tag-b'],
      notes: 'Evidence note',
    }
    expect(evidence.tags).toEqual(['tag-a', 'tag-b'])
    expect(evidence.notes).toBe('Evidence note')
  })

  // --- 6. BayesianUpdateInput keeps prior and evidence separate ---
  test('BayesianUpdateInput keeps prior and evidence as separate fields', () => {
    const prior: BayesianPrior = {
      id: 'p-1',
      hypothesis: 'H1',
      priorProbability: 0.5 as BayesianProbability,
      sourceTier: 'T1',
      confidence: 'LIKELY',
      assumptions: [],
    }
    const evidence: BayesianEvidenceItem = {
      id: 'e-1',
      claim: 'Supports H1',
      direction: 'supports',
      strength: 'strong',
      likelihoodGivenHypothesis: 0.9 as BayesianProbability,
      likelihoodGivenNotHypothesis: 0.1 as BayesianProbability,
      sourceTier: 'T1',
      confidence: 'LIKELY',
      provenance: 'test',
    }
    const input: BayesianUpdateInput = {
      hypothesis: 'H1',
      prior,
      evidence: [evidence],
      mode: 'balanced',
    }
    expect(input.prior).toBe(prior)
    expect(input.evidence).toEqual([evidence])
    expect(input.prior).not.toBe(input.evidence)
    expect(input.mode).toBe('balanced')
  })

  test('BayesianUpdateInput supports optional objective, canonBoundaries, outputContract', () => {
    const input: BayesianUpdateInput = {
      hypothesis: 'H2',
      prior: {
        id: 'p-2',
        hypothesis: 'H2',
        priorProbability: 0.4 as BayesianProbability,
        sourceTier: 'T2',
        confidence: 'INFERRED',
        assumptions: ['a1'],
      },
      evidence: [],
      mode: 'conservative',
      objective: 'Test objective',
      canonBoundaries: ['no-certainty'],
      outputContract: ['advisory-only'],
    }
    expect(input.objective).toBe('Test objective')
    expect(input.canonBoundaries).toEqual(['no-certainty'])
    expect(input.outputContract).toEqual(['advisory-only'])
  })

  // --- 7. BayesianUpdateResult includes prior, posterior, delta, assumptions, uncertainty, explanation ---
  test('BayesianUpdateResult includes all required fields', () => {
    const result: BayesianUpdateResult = {
      hypothesis: 'H1',
      priorProbability: 0.5 as BayesianProbability,
      posteriorProbability: 0.75 as BayesianProbability,
      probabilityDelta: 0.25,
      evidenceUsed: [],
      evidenceWarnings: [],
      assumptions: ['Stable conditions'],
      uncertainty: 'Medium — limited evidence',
      explanation: 'Prior updated with supporting evidence',
      advisoryOnly: true,
    }
    expect(result.priorProbability).toBe(0.5)
    expect(result.posteriorProbability).toBe(0.75)
    expect(result.probabilityDelta).toBe(0.25)
    expect(result.assumptions).toEqual(['Stable conditions'])
    expect(result.uncertainty).toBe('Medium — limited evidence')
    expect(result.explanation).toBe('Prior updated with supporting evidence')
  })

  // --- 8. Contract rules include all 10 required rules ---
  test('BAYESIAN_CONTRACT_RULES is array with 10 rules', () => {
    expect(Array.isArray(BAYESIAN_CONTRACT_RULES)).toBe(true)
    expect(BAYESIAN_CONTRACT_RULES.length).toBe(10)
  })

  test('contract rule PRIOR_MUST_BE_BOUNDED exists with severity block', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'PRIOR_MUST_BE_BOUNDED')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
    expect(rule?.description).toContain('between 0 and 1')
  })

  test('contract rule POSTERIOR_MUST_BE_BOUNDED exists with severity block', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'POSTERIOR_MUST_BE_BOUNDED')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
  })

  test('contract rule EVIDENCE_REQUIRES_PROVENANCE exists with severity block', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'EVIDENCE_REQUIRES_PROVENANCE')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
  })

  test('contract rule WEAK_EVIDENCE_CANNOT_FORCE_DECISIVE_UPDATE exists with severity warn', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'WEAK_EVIDENCE_CANNOT_FORCE_DECISIVE_UPDATE')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('warn')
  })

  test('contract rule CONFLICTED_EVIDENCE_MUST_WARN exists with severity warn', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'CONFLICTED_EVIDENCE_MUST_WARN')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('warn')
  })

  test('contract rule SOURCE_TIER_AFFECTS_WEIGHT exists with severity info', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'SOURCE_TIER_AFFECTS_WEIGHT')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('info')
  })

  test('contract rule ADVISORY_ONLY_OUTPUT exists with severity block', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'ADVISORY_ONLY_OUTPUT')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
    expect(rule?.description).toContain('advisory')
  })

  test('contract rule NO_CERTAINTY_CLAIMS exists with severity block', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'NO_CERTAINTY_CLAIMS')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
  })

  test('contract rule HUMAN_REVIEW_REQUIRED_FOR_STRATEGIC_USE exists with severity block', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'HUMAN_REVIEW_REQUIRED_FOR_STRATEGIC_USE')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
  })

  test('contract rule NO_AUTONOMOUS_ACTION exists with severity block', () => {
    const rule = BAYESIAN_CONTRACT_RULES.find(r => r.id === 'NO_AUTONOMOUS_ACTION')
    expect(rule).toBeDefined()
    expect(rule?.severity).toBe('block')
  })

  // --- 9. advisoryOnly is part of result shape ---
  test('BayesianUpdateResult.advisoryOnly is always true', () => {
    const result: BayesianUpdateResult = {
      hypothesis: 'H1',
      priorProbability: 0.5 as BayesianProbability,
      posteriorProbability: 0.6 as BayesianProbability,
      probabilityDelta: 0.1,
      evidenceUsed: [],
      evidenceWarnings: [],
      assumptions: [],
      uncertainty: 'Low',
      explanation: 'Minimal update',
      advisoryOnly: true,
    }
    expect(result.advisoryOnly).toBe(true)
  })

  // --- 10. No Evidence Router imports ---
  test('file does not import from evidence-router or adapter modules', () => {
    const source = bayesianExports
    const exportKeys = Object.keys(source)
    // Verify no adapter or evidence-router types leak in
    const adapterLeaks = exportKeys.filter(k =>
      k.startsWith('Adapter') || k.startsWith('ADAPTER_')
    )
    expect(adapterLeaks).toEqual([])
  })

  // --- 11. No Predictability Kernel imports ---
  test('file does not export predictability kernel types', () => {
    const exportKeys = Object.keys(bayesianExports)
    const kernelLeaks = exportKeys.filter(k =>
      k.includes('Kernel') || k.includes('KERNEL')
    )
    expect(kernelLeaks).toEqual([])
  })

  // --- 12. No filesystem/API/UI/DB/current.md/shell-promoter references ---
  test('exports contain no filesystem, API, UI, DB, or shell-promoter references', () => {
    const exportKeys = Object.keys(bayesianExports)
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

  // --- 13. No implementation functions exported ---
  test('file does not export implementation functions', () => {
    const exportKeys = Object.keys(bayesianExports)
    const functionExports = exportKeys.filter(k => {
      const val = (bayesianExports as Record<string, unknown>)[k]
      return typeof val === 'function'
    })
    expect(functionExports).toEqual([])
  })

  // --- 14. No Bayesian calculation function exists yet ---
  test('no updateBayesianBelief or calculatePosterior function exists', () => {
    const exportKeys = Object.keys(bayesianExports)
    const calcFunctions = exportKeys.filter(k =>
      k.includes('update') || k.includes('calculate') || k.includes('compute')
    )
    // Only const objects and types should exist — no calculation functions
    expect(calcFunctions).toEqual([])
  })

  // --- Warning type shape ---
  test('BayesianUpdateWarning includes code, message, severity, optional evidenceId', () => {
    const warning: BayesianUpdateWarning = {
      code: 'CONFLICTED_EVIDENCE_MUST_WARN',
      message: 'Evidence contains conflicting signals',
      severity: 'warn',
      evidenceId: 'ev-1',
    }
    expect(warning.code).toBe('CONFLICTED_EVIDENCE_MUST_WARN')
    expect(warning.message).toContain('conflicting')
    expect(warning.severity).toBe('warn')
    expect(warning.evidenceId).toBe('ev-1')
  })

  test('BayesianUpdateWarning evidenceId is optional', () => {
    const warning: BayesianUpdateWarning = {
      code: 'NO_CERTAINTY_CLAIMS',
      message: 'Cannot claim certainty',
      severity: 'block',
    }
    expect(warning.evidenceId).toBeUndefined()
  })

  // --- Warning severity labels ---
  test('BAYESIAN_WARNING_SEVERITIES includes info/warn/block', () => {
    expect(BAYESIAN_WARNING_SEVERITIES).toEqual({
      info: 'info',
      warn: 'warn',
      block: 'block',
    })
  })

  // --- Contract rule shape ---
  test('every contract rule has id, description, severity, appliesTo', () => {
    for (const rule of BAYESIAN_CONTRACT_RULES) {
      expect(typeof rule.id).toBe('string')
      expect(typeof rule.description).toBe('string')
      expect(typeof rule.severity).toBe('string')
      expect(typeof rule.appliesTo).toBe('string')
      expect(rule.id.length).toBeGreaterThan(0)
      expect(rule.description.length).toBeGreaterThan(0)
    }
  })
})
