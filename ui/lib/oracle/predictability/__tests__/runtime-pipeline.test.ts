/**
 * runtime-pipeline.test.ts
 *
 * RI-3: Tests for the Predictability runtime pipeline wiring function.
 * Covers all 5 result branches and key invariants.
 *
 * Mocks: bridgeAdapterToKernelInput, calculatePredictabilityForecast,
 *        createForecastAuditEntry, validateForecastAuditEntry,
 *        assertForecastAuditSafetyFlags
 *
 * Status: RI-3 test file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runPredictabilityRuntimePipeline } from '../runtime-pipeline'
import type { RuntimePipelineInput } from '../runtime-pipeline-types'

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../model-stage-orchestration-bridge', () => ({
  bridgeAdapterToKernelInput: vi.fn(),
}))

vi.mock('../predictability-kernel', () => ({
  calculatePredictabilityForecast: vi.fn(),
}))

vi.mock('../forecast-audit', () => ({
  createForecastAuditEntry: vi.fn(),
  validateForecastAuditEntry: vi.fn(),
  assertForecastAuditSafetyFlags: vi.fn(),
}))

// model-stage-orchestration-types is imported for the ORCHESTRATION_EXAMPLE_SAFETY_FLAGS const
vi.mock('../model-stage-orchestration-types', () => ({
  ORCHESTRATION_EXAMPLE_SAFETY_FLAGS: {
    requireProvenanceTrail: true,
    requireFailureModes: true,
    requireAssumptions: true,
    forbidCertaintyLanguage: true,
    forbidAutonomousAction: true,
    requireConfidenceScore: true,
    requireScenario: true,
    requireForecastBand: true,
    requireSupportingEvidence: true,
    requireOpposingEvidence: true,
    requireBehavioralSignals: true,
    requireActiveRegime: true,
    requireRecommendedNextMove: true,
  },
}))

// ============================================================================
// IMPORTS (after mocks registered)
// ============================================================================

import { bridgeAdapterToKernelInput } from '../model-stage-orchestration-bridge'
import { calculatePredictabilityForecast } from '../predictability-kernel'
import {
  createForecastAuditEntry,
  validateForecastAuditEntry,
  assertForecastAuditSafetyFlags,
} from '../forecast-audit'

// ============================================================================
// TEST FIXTURES
// ============================================================================

const validInput: RuntimePipelineInput = {
  objective: 'assess Q3 release window',
  targetDate: '2026-09-01',
  domain: 'music-release',
  horizon: 'medium',
  trendWindows: [
    {
      id: 'tw-1',
      label: 'Q2 engagement',
      start: '2026-04-01',
      end: '2026-06-30',
      signalType: 'engagement',
      value: 0.72,
      confidence: 0.85,
    },
  ],
  behavioralPatterns: [
    {
      id: 'bp-1',
      triggerCondition: 'release milestone',
      repeatedBehavior: 'engagement spike',
      observedCount: 5,
      confidence: 0.78,
    },
  ],
  cycleWindows: [
    {
      period: 90,
      confidence: 0.82,
      lastObserved: '2026-03-15',
    },
  ],
}

const mockKernelInput = {
  targetDate: '2026-09-01',
  domain: 'music-release',
  objective: 'assess Q3 release window',
  horizon: 'medium',
  historicalEvents: [],
  trendWindows: [
    {
      id: 'tw-1',
      label: 'Q2 engagement',
      start: '2026-04-01',
      end: '2026-06-30',
      scale: 'meso',
      signalType: 'engagement',
      value: 0.72,
      confidence: 0.85,
      sourceTier: 'T2',
    },
  ],
  landmarkEvents: [],
  behavioralPatterns: [
    {
      id: 'bp-1',
      actorScope: 'market',
      triggerCondition: 'release milestone',
      repeatedBehavior: 'engagement spike',
      observedCount: 5,
      positiveOutcomes: 4,
      negativeOutcomes: 1,
      neutralOutcomes: 0,
      confidence: 0.78,
      sourceTier: 'T2',
      tags: [],
    },
  ],
  cycleWindows: [
    {
      period: 90,
      scale: 'meso',
      confidence: 0.82,
      lastObserved: '2026-03-15',
    },
  ],
} as const

const mockForecast = {
  scenario: 'baseline',
  forecastBand: { low: 0.6, mid: 0.72, high: 0.84 },
  score: 0.72,
  confidence: 0.85,
  trendDeltas: [],
  activeRegime: 'growth',
  supportingEvidence: [],
  opposingEvidence: [],
  behavioralSignals: [],
  assumptions: ['Streaming trends remain stable', 'No major competitor releases'],
  warnings: ['Limited historical data for this domain'],
  recommendedNextMove: 'Proceed with Q3 release window',
}

const mockAuditEntry = {
  auditEntryId: 'audit-test-id',
  forecastId: 'forecast-test-id',
  createdAt: '2026-05-14T00:00:00.000Z',
  evidenceLineage: [],
  adapterPacketLineage: {
    task: 'assess Q3 release window',
    allowedEvidenceCount: 0,
    blockedEvidenceCount: 0,
    warningCount: 0,
    canonBoundaries: [],
    outputContractSnapshot: {
      requireProvenanceTrail: true,
      requireFailureModes: true,
      requireAssumptions: true,
      forbidCertaintyLanguage: true,
      forbidAutonomousAction: true,
    },
  },
  validationLineage: {
    validationPassed: true,
    validationErrors: [],
    validatedAt: '2026-05-14T00:00:00.000Z',
  },
  kernelInputLineage: {
    inputTypePath: 'bridged',
    bridgeApplied: true,
    unbridgedWarning: false,
    bridgeGateId: 'G-3',
  },
  modelStageLineage: {
    stagesExecuted: ['M-A', 'M-B', 'M-C', 'M-D', 'M-E', 'M-F', 'M-G', 'M-H', 'M-I'],
    orchestrationGateId: 'G-3',
    compositionMethod: 'sequential',
  },
  assumptions: [
    { assumption: 'Streaming trends remain stable', ifWrongBy: 'unknown', forecastFlips: false },
  ],
  failureModes: [
    {
      id: 'fm-1',
      mode: 'Limited historical data for this domain',
      severity: 'MEDIUM' as const,
      detection: 'forecast review',
      mitigation: 'human review required before any action',
    },
  ],
  uncertaintyStatement: 'Limited historical data for this domain',
  forbiddenClaims: [
    { claim: 'This forecast is certain', reason: 'forbidCertaintyLanguage flag is active; certainty claims are prohibited' },
  ],
  safetyFlags: {
    requireProvenanceTrail: true,
    requireFailureModes: true,
    requireAssumptions: true,
    forbidCertaintyLanguage: true,
    forbidAutonomousAction: true,
    requireConfidenceScore: true,
    requireScenario: true,
    requireForecastBand: true,
    requireSupportingEvidence: true,
    requireOpposingEvidence: true,
    requireBehavioralSignals: true,
    requireActiveRegime: true,
    requireRecommendedNextMove: true,
  },
  authorizationState: 'pending',
  persistenceState: 'unpersisted',
}

// ============================================================================
// HELPERS
// ============================================================================

function setupSuccessPath() {
  vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
    success: true,
    kernelInput: mockKernelInput as never,
    errors: [],
    warnings: [],
    bridgeContract: {} as never,
    fieldAudit: {} as never,
  })
  vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
  vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
  vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
  vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({ valid: true, errors: [] })
}

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// SUCCESS BRANCH
// ============================================================================

describe('runPredictabilityRuntimePipeline — success branch', () => {
  it('returns status: success when all 5 steps pass', () => {
    setupSuccessPath()
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.status).toBe('success')
  })

  it('success result carries non-null forecast', () => {
    setupSuccessPath()
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).not.toBeNull()
  })

  it('success result carries non-null auditEntry', () => {
    setupSuccessPath()
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.auditEntry).not.toBeNull()
  })

  it('success result auditEntry has persistenceState: persisted_by_future_gate', () => {
    setupSuccessPath()
    const result = runPredictabilityRuntimePipeline(validInput)
    if (result.status === 'success') {
      expect(result.auditEntry.persistenceState).toBe('persisted_by_future_gate')
    }
  })

  it('success result forecast matches kernel output', () => {
    setupSuccessPath()
    const result = runPredictabilityRuntimePipeline(validInput)
    if (result.status === 'success') {
      expect(result.forecast.scenario).toBe(mockForecast.scenario)
      expect(result.forecast.score).toBe(mockForecast.score)
    }
  })

  it('calls bridge, kernel, createAuditEntry, validate, and assertFlags in order', () => {
    const callOrder: string[] = []
    vi.mocked(bridgeAdapterToKernelInput).mockImplementation(() => {
      callOrder.push('bridge')
      return { success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never }
    })
    vi.mocked(calculatePredictabilityForecast).mockImplementation(() => {
      callOrder.push('kernel')
      return mockForecast as never
    })
    vi.mocked(createForecastAuditEntry).mockImplementation(() => {
      callOrder.push('createAudit')
      return mockAuditEntry as never
    })
    vi.mocked(validateForecastAuditEntry).mockImplementation(() => {
      callOrder.push('validateAudit')
      return { valid: true, errors: [] }
    })
    vi.mocked(assertForecastAuditSafetyFlags).mockImplementation(() => {
      callOrder.push('assertFlags')
      return { valid: true, errors: [] }
    })

    runPredictabilityRuntimePipeline(validInput)
    expect(callOrder).toEqual(['bridge', 'kernel', 'createAudit', 'validateAudit', 'assertFlags'])
  })

  it('passes supplemented fields to bridge unchanged', () => {
    setupSuccessPath()
    runPredictabilityRuntimePipeline(validInput)
    const bridgeCallArg = vi.mocked(bridgeAdapterToKernelInput).mock.calls[0][0]
    expect(bridgeCallArg.targetDate).toBe(validInput.targetDate)
    expect(bridgeCallArg.domain).toBe(validInput.domain)
    expect(bridgeCallArg.horizon).toBe(validInput.horizon)
    expect(bridgeCallArg.trendWindows).toBe(validInput.trendWindows)
    expect(bridgeCallArg.behavioralPatterns).toBe(validInput.behavioralPatterns)
    expect(bridgeCallArg.cycleWindows).toBe(validInput.cycleWindows)
  })
})

// ============================================================================
// BRIDGE_FAILED BRANCH
// ============================================================================

describe('runPredictabilityRuntimePipeline — bridge_failed branch', () => {
  it('returns status: bridge_failed when bridge fails', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false,
      errors: ['missing required field: trendWindows', 'missing required field: cycleWindows'],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.status).toBe('bridge_failed')
  })

  it('bridge_failed carries joined bridgeError string', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false,
      errors: ['missing required field: trendWindows', 'missing required field: cycleWindows'],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    if (result.status === 'bridge_failed') {
      expect(result.bridgeError).toBe('missing required field: trendWindows; missing required field: cycleWindows')
    }
  })

  it('bridge_failed carries forecast: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false,
      errors: ['error'],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })

  it('bridge_failed carries auditEntry: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false,
      errors: ['error'],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.auditEntry).toBeNull()
  })

  it('does not call kernel when bridge fails', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false,
      errors: ['error'],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    runPredictabilityRuntimePipeline(validInput)
    expect(calculatePredictabilityForecast).not.toHaveBeenCalled()
  })

  it('does not call createForecastAuditEntry when bridge fails', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false,
      errors: ['error'],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    runPredictabilityRuntimePipeline(validInput)
    expect(createForecastAuditEntry).not.toHaveBeenCalled()
  })
})

// ============================================================================
// AUDIT_CREATION_FAILED BRANCH
// ============================================================================

describe('runPredictabilityRuntimePipeline — audit_creation_failed branch', () => {
  it('returns status: audit_creation_failed when createForecastAuditEntry throws', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => {
      throw new Error('invariant violation: assumptions array empty')
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.status).toBe('audit_creation_failed')
  })

  it('audit_creation_failed carries error message from thrown Error', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => {
      throw new Error('invariant violation: assumptions array empty')
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    if (result.status === 'audit_creation_failed') {
      expect(result.error).toBe('invariant violation: assumptions array empty')
    }
  })

  it('audit_creation_failed carries forecast: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => { throw new Error('err') })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })

  it('audit_creation_failed carries auditEntry: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => { throw new Error('err') })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.auditEntry).toBeNull()
  })

  it('handles non-Error throws with fallback message', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => { throw 'string error' })

    const result = runPredictabilityRuntimePipeline(validInput)
    if (result.status === 'audit_creation_failed') {
      expect(result.error).toBe('createForecastAuditEntry threw unknown error')
    }
  })
})

// ============================================================================
// AUDIT_VALIDATION_FAILED BRANCH
// ============================================================================

describe('runPredictabilityRuntimePipeline — audit_validation_failed branch', () => {
  it('returns status: audit_validation_failed when validateForecastAuditEntry returns errors', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({
      valid: false,
      errors: ['assumptions array is empty', 'uncertaintyStatement is empty'],
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.status).toBe('audit_validation_failed')
  })

  it('audit_validation_failed carries errors array from validation result', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({
      valid: false,
      errors: ['assumptions array is empty', 'uncertaintyStatement is empty'],
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    if (result.status === 'audit_validation_failed') {
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toBe('assumptions array is empty')
    }
  })

  it('audit_validation_failed carries forecast: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: false, errors: ['err'] })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })

  it('audit_validation_failed carries auditEntry: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: false, errors: ['err'] })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.auditEntry).toBeNull()
  })

  it('does not call assertForecastAuditSafetyFlags when validation fails', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: false, errors: ['err'] })

    runPredictabilityRuntimePipeline(validInput)
    expect(assertForecastAuditSafetyFlags).not.toHaveBeenCalled()
  })
})

// ============================================================================
// SAFETY_FLAG_FAILED BRANCH
// ============================================================================

describe('runPredictabilityRuntimePipeline — safety_flag_failed branch', () => {
  it('returns status: safety_flag_failed when assertForecastAuditSafetyFlags returns errors', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({
      valid: false,
      errors: ['safetyFlags.forbidAutonomousAction is false'],
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.status).toBe('safety_flag_failed')
  })

  it('safety_flag_failed carries flagErrors array', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({
      valid: false,
      errors: ['safetyFlags.forbidAutonomousAction is false'],
    })

    const result = runPredictabilityRuntimePipeline(validInput)
    if (result.status === 'safety_flag_failed') {
      expect(result.flagErrors).toHaveLength(1)
      expect(result.flagErrors[0]).toBe('safetyFlags.forbidAutonomousAction is false')
    }
  })

  it('safety_flag_failed carries forecast: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({ valid: false, errors: ['flag err'] })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })

  it('safety_flag_failed carries auditEntry: null', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true,
      kernelInput: mockKernelInput as never,
      errors: [],
      warnings: [],
      bridgeContract: {} as never,
      fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({ valid: false, errors: ['flag err'] })

    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.auditEntry).toBeNull()
  })
})

// ============================================================================
// INVARIANTS — ALL FAILURE BRANCHES
// ============================================================================

describe('runPredictabilityRuntimePipeline — failure branch invariants', () => {
  it('all failure branches carry forecast: null', () => {
    // bridge_failed
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false, errors: ['err'], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    const r1 = runPredictabilityRuntimePipeline(validInput)
    expect(r1.forecast).toBeNull()

    // audit_creation_failed
    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => { throw new Error('err') })
    const r2 = runPredictabilityRuntimePipeline(validInput)
    expect(r2.forecast).toBeNull()

    // audit_validation_failed
    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: false, errors: ['err'] })
    const r3 = runPredictabilityRuntimePipeline(validInput)
    expect(r3.forecast).toBeNull()

    // safety_flag_failed
    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({ valid: false, errors: ['flag err'] })
    const r4 = runPredictabilityRuntimePipeline(validInput)
    expect(r4.forecast).toBeNull()
  })

  it('all failure branches carry auditEntry: null', () => {
    // bridge_failed
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false, errors: ['err'], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    const r1 = runPredictabilityRuntimePipeline(validInput)
    expect(r1.auditEntry).toBeNull()

    // audit_creation_failed
    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => { throw new Error('err') })
    const r2 = runPredictabilityRuntimePipeline(validInput)
    expect(r2.auditEntry).toBeNull()

    // audit_validation_failed
    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: false, errors: ['err'] })
    const r3 = runPredictabilityRuntimePipeline(validInput)
    expect(r3.auditEntry).toBeNull()

    // safety_flag_failed
    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({ valid: false, errors: ['flag err'] })
    const r4 = runPredictabilityRuntimePipeline(validInput)
    expect(r4.auditEntry).toBeNull()
  })

  it('uniform destructuring works on all failure branches without optional chaining', () => {
    const failureResults = [] as ReturnType<typeof runPredictabilityRuntimePipeline>[]

    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false, errors: ['err'], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    failureResults.push(runPredictabilityRuntimePipeline(validInput))

    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => { throw new Error('err') })
    failureResults.push(runPredictabilityRuntimePipeline(validInput))

    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: false, errors: ['err'] })
    failureResults.push(runPredictabilityRuntimePipeline(validInput))

    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({ valid: false, errors: ['flag err'] })
    failureResults.push(runPredictabilityRuntimePipeline(validInput))

    for (const result of failureResults) {
      // Destructure without optional chaining — must work on all branches
      const { forecast, auditEntry } = result
      expect(forecast).toBeNull()
      expect(auditEntry).toBeNull()
    }
  })

  it('no partial_success, queued, or deferred status is ever returned', () => {
    // Success path
    setupSuccessPath()
    const successResult = runPredictabilityRuntimePipeline(validInput)
    expect(successResult.status).not.toBe('partial_success')
    expect(successResult.status).not.toBe('queued')
    expect(successResult.status).not.toBe('deferred')

    // Bridge failure path
    vi.clearAllMocks()
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false, errors: ['err'], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    const failResult = runPredictabilityRuntimePipeline(validInput)
    expect(failResult.status).not.toBe('partial_success')
    expect(failResult.status).not.toBe('queued')
    expect(failResult.status).not.toBe('deferred')
  })
})

// ============================================================================
// FAIL-CLOSED — FORECAST NOT RETURNED BEFORE ALL 5 CONDITIONS PASS
// ============================================================================

describe('runPredictabilityRuntimePipeline — fail-closed guarantee', () => {
  it('does not return forecast when bridge fails', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: false, errors: ['err'], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })

  it('does not return forecast when audit creation throws', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockImplementation(() => { throw new Error('err') })
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })

  it('does not return forecast when validation fails', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: false, errors: ['err'] })
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })

  it('does not return forecast when safety flags fail', () => {
    vi.mocked(bridgeAdapterToKernelInput).mockReturnValue({
      success: true, kernelInput: mockKernelInput as never, errors: [], warnings: [], bridgeContract: {} as never, fieldAudit: {} as never,
    })
    vi.mocked(calculatePredictabilityForecast).mockReturnValue(mockForecast as never)
    vi.mocked(createForecastAuditEntry).mockReturnValue(mockAuditEntry as never)
    vi.mocked(validateForecastAuditEntry).mockReturnValue({ valid: true, errors: [] })
    vi.mocked(assertForecastAuditSafetyFlags).mockReturnValue({ valid: false, errors: ['flag err'] })
    const result = runPredictabilityRuntimePipeline(validInput)
    expect(result.forecast).toBeNull()
  })
})
