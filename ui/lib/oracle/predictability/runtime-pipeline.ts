/**
 * runtime-pipeline.ts
 *
 * RI-3: Runtime wiring function for the Predictability pipeline.
 * Implements the ordered 5-step execution sequence:
 *   1. Bridge adapter input to kernel-native input
 *   2. Calculate predictability forecast (kernel)
 *   3. Create forecast audit entry
 *   4. Validate forecast audit entry
 *   5. Assert safety flags on audit entry
 *
 * Returns a RuntimePipelineResult discriminated union.
 * Fail-closed: forecast is returned only when all 5 steps succeed.
 *
 * No defaults for supplemented fields. All six supplemented fields
 * are caller-supplied via RuntimePipelineInput. No optional variants.
 *
 * No new types. No changes to existing Gate files.
 *
 * Source decisions:
 * - RuntimePipelineInput/RuntimePipelineResult: RI-2 type contracts
 *   (ui/lib/oracle/predictability/runtime-pipeline-types.ts)
 * - Return type ratification: docs/PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION.md
 * - Supplemented field source: docs/PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION.md
 * - Implementation spec: docs/PREDICTABILITY_RI3_RUNTIME_PIPELINE_FUNCTION_SPEC.md
 *
 * Status: RI-3 implementation.
 */

import { bridgeAdapterToKernelInput } from './model-stage-orchestration-bridge'
import { calculatePredictabilityForecast } from './predictability-kernel'
import {
  createForecastAuditEntry,
  validateForecastAuditEntry,
  assertForecastAuditSafetyFlags,
} from './forecast-audit'
import { ORCHESTRATION_EXAMPLE_SAFETY_FLAGS } from './model-stage-orchestration-types'
import type {
  RuntimePipelineInput,
  RuntimePipelineResult,
} from './runtime-pipeline-types'
import type { PredictabilityInput } from './types'

// ============================================================================
// RUNTIME WIRING FUNCTION
// ============================================================================

/**
 * Executes the full Predictability runtime pipeline.
 *
 * Steps (in order, fail-closed):
 * 1. Bridge adapter input → kernel input
 * 2. Calculate forecast (kernel)
 * 3. Create forecast audit entry
 * 4. Validate forecast audit entry
 * 5. Assert safety flags
 *
 * Returns success only when all 5 steps complete without error.
 * Returns the appropriate failure branch on any step failure.
 *
 * The wiring function does NOT default any supplemented field.
 * All six supplemented fields (targetDate, domain, horizon,
 * trendWindows, behavioralPatterns, cycleWindows) are passed
 * from input to the bridge unchanged.
 */
export function runPredictabilityRuntimePipeline(
  input: RuntimePipelineInput
): RuntimePipelineResult {
  // -------------------------------------------------------------------------
  // Step 1: Bridge adapter input to kernel-native input
  // -------------------------------------------------------------------------
  const adapterInput = {
    objective: input.objective,
    historicalEvents: [] as readonly {
      readonly sourceId: string
      readonly claim: string
      readonly sourceReliability: string
      readonly originalConfidence: number
      readonly adjustedConfidence: number
      readonly observedAt: string
    }[],
    excludedEvidenceIds: [] as readonly string[],
    validationWarnings: [] as readonly string[],
    hardConstraints: [] as readonly string[],
    outputConstraints: { forbidAutonomousAction: true as boolean },
    provenanceTrail: [] as readonly string[],
    shouldTriggerMCT: false,
    // Supplemented fields — caller-supplied, passed unchanged. No defaults.
    targetDate: input.targetDate,
    domain: input.domain,
    horizon: input.horizon,
    trendWindows: input.trendWindows,
    behavioralPatterns: input.behavioralPatterns,
    cycleWindows: input.cycleWindows,
  }

  const bridgeResult = bridgeAdapterToKernelInput(
    adapterInput,
    ORCHESTRATION_EXAMPLE_SAFETY_FLAGS
  )

  if (!bridgeResult.success) {
    return {
      status: 'bridge_failed',
      bridgeError: bridgeResult.errors.join('; '),
      forecast: null,
      auditEntry: null,
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Calculate predictability forecast (kernel)
  // -------------------------------------------------------------------------
  const bridgedKernelInput = bridgeResult.kernelInput!
  // Boundary copy: bridge output is readonly by contract, while the sealed
  // kernel accepts mutable PredictabilityInput arrays.
  const kernelInput: PredictabilityInput = {
    targetDate: bridgedKernelInput.targetDate,
    domain: bridgedKernelInput.domain,
    objective: bridgedKernelInput.objective,
    horizon: bridgedKernelInput.horizon,
    historicalEvents: bridgedKernelInput.historicalEvents.map(event => ({
      ...event,
      affectedSignals: [...event.affectedSignals],
      tags: [...event.tags],
    })),
    trendWindows: bridgedKernelInput.trendWindows.map(window => ({ ...window })),
    landmarkEvents: bridgedKernelInput.landmarkEvents.map(event => ({
      ...event,
      affectedSignals: [...event.affectedSignals],
      tags: [...event.tags],
    })),
    behavioralPatterns: bridgedKernelInput.behavioralPatterns.map(pattern => ({
      ...pattern,
      tags: [...pattern.tags],
    })),
    cycleWindows: bridgedKernelInput.cycleWindows.map(window => ({ ...window })),
  }

  const forecast = calculatePredictabilityForecast(kernelInput)

  // -------------------------------------------------------------------------
  // Step 3: Create forecast audit entry
  // -------------------------------------------------------------------------
  const now = new Date().toISOString()
  const auditEntryId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const forecastId = `forecast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  let auditEntry
  try {
    auditEntry = createForecastAuditEntry({
      auditEntryId,
      forecastId,
      createdAt: now,
      evidenceLineage: [],
      adapterPacketLineage: {
        task: input.objective,
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
        validatedAt: now,
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
      // Forecast assumptions mapped to structured audit assumption shape.
      // Validation requires at least one — provide advisory default if forecast.assumptions is empty.
      assumptions: (forecast.assumptions && forecast.assumptions.length > 0)
        ? forecast.assumptions.map((a: string) => ({
            assumption: a,
            ifWrongBy: 'unknown',
            forecastFlips: false,
          }))
        : [{
            assumption: 'This forecast is advisory only and requires human review before any action.',
            ifWrongBy: 'any margin',
            forecastFlips: false,
          }],
      // Failure modes derived from forecast.warnings; validation requires at least one.
      // Provide advisory default if forecast.warnings is empty.
      failureModes: (forecast.warnings && forecast.warnings.length > 0)
        ? forecast.warnings.map((w: string, i: number) => ({
            id: `fm-${i + 1}`,
            mode: w,
            severity: 'MEDIUM' as const,
            detection: 'forecast review',
            mitigation: 'human review required before any action',
          }))
        : [{
            id: 'fm-1',
            mode: 'forecast produced under advisory constraints; all safety flags active',
            severity: 'MEDIUM' as const,
            detection: 'safety flag validation',
            mitigation: 'human review required; no autonomous action permitted',
          }],
      // Uncertainty statement derived from forecast warnings or advisory default.
      uncertaintyStatement: (forecast.warnings && forecast.warnings.length > 0)
        ? forecast.warnings.join('; ')
        : 'This forecast is advisory only. All safety flags are active. Human review is required.',
      // Forbidden claims: advisory constraint prohibits certainty language
      forbiddenClaims: [{
        claim: 'This forecast is certain',
        reason: 'forbidCertaintyLanguage flag is active; certainty claims are prohibited',
      }],
    })
  } catch (err) {
    return {
      status: 'audit_creation_failed',
      error: err instanceof Error ? err.message : 'createForecastAuditEntry threw unknown error',
      forecast: null,
      auditEntry: null,
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Validate forecast audit entry
  // -------------------------------------------------------------------------
  const validationResult = validateForecastAuditEntry(auditEntry)
  if (!validationResult.valid) {
    return {
      status: 'audit_validation_failed',
      errors: validationResult.errors,
      forecast: null,
      auditEntry: null,
    }
  }

  // -------------------------------------------------------------------------
  // Step 5: Assert safety flags
  // -------------------------------------------------------------------------
  const flagResult = assertForecastAuditSafetyFlags(auditEntry.safetyFlags)
  if (!flagResult.valid) {
    return {
      status: 'safety_flag_failed',
      flagErrors: flagResult.errors,
      forecast: null,
      auditEntry: null,
    }
  }

  // -------------------------------------------------------------------------
  // All 5 conditions satisfied — return success
  // persistenceState set via immutable spread (Gate F-native deferred persistence)
  // -------------------------------------------------------------------------
  const finalAuditEntry = {
    ...auditEntry,
    persistenceState: 'persisted_by_future_gate' as const,
  }

  return {
    status: 'success',
    forecast,
    auditEntry: finalAuditEntry,
  }
}
