/**
 * runtime-pipeline-types.ts
 *
 * RI-2: Runtime Integration Type Contracts.
 * Defines the caller-supplied input type and discriminated result union for the
 * future runtime wiring function.
 *
 * PURE TYPE CONTRACTS ONLY. No runtime logic. No function implementations.
 * No calls to bridge, kernel, or audit functions.
 *
 * Decisions encoded here:
 * - RuntimePipelineInput: Q1 supplemented field source decision
 *   (docs/PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION.md)
 * - RuntimePipelineResult: RI-1 return type ratification
 *   (docs/PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION.md)
 *
 * Key invariants:
 * - Only `status: 'success'` may carry a forecast or auditEntry.
 * - All failure branches carry `forecast: null` and `auditEntry: null`.
 * - No partial success state exists.
 * - No queue/defer state exists.
 * - All six supplemented fields are required. No optional variants.
 *
 * Status: RI-2 type contracts. Runtime wiring not started.
 */

import type { Horizon } from './types'
import type { PredictabilityForecast } from './types'
import type { ForecastAuditEntry } from './forecast-audit-types'

// ============================================================================
// CONTRACT VERSION
// ============================================================================

export const RUNTIME_PIPELINE_CONTRACT_VERSION = 'ri2-v1' as const

export type RuntimePipelineContractVersion = typeof RUNTIME_PIPELINE_CONTRACT_VERSION

// ============================================================================
// RESULT STATUS CONSTANTS
// ============================================================================

/**
 * All valid status values for RuntimePipelineResult.
 * Exactly five statuses. No queue/defer. No partial_success.
 */
export const RUNTIME_PIPELINE_RESULT_STATUSES = [
  'success',
  'bridge_failed',
  'audit_creation_failed',
  'audit_validation_failed',
  'safety_flag_failed',
] as const

export type RuntimePipelineResultStatus = typeof RUNTIME_PIPELINE_RESULT_STATUSES[number]

// ============================================================================
// ADAPTER-LOCAL SUPPLEMENTED FIELD SHAPES
// ============================================================================
// These shapes match ModelStageOrchestrationInput's optional field shapes.
// The G-3 bridge maps these to kernel-native shapes — callers supply adapter-local shapes only.
// Do NOT use kernel-native shapes from types.ts (TrendWindow, BehavioralPattern, CycleWindow)
// as those include bridge-added fields (scale, sourceTier, actorScope, etc.).

/**
 * Adapter-local trend window shape.
 * Bridge adds: scale (derived from value), sourceTier (hardcoded 'T2').
 * Caller does NOT supply scale or sourceTier.
 */
export interface RuntimePipelineTrendWindow {
  readonly id: string
  readonly label: string
  readonly start: string
  readonly end: string
  readonly signalType: string
  readonly value: number
  readonly confidence: number
}

/**
 * Adapter-local behavioral pattern shape.
 * Bridge adds: actorScope, positiveOutcomes, negativeOutcomes, neutralOutcomes,
 * sourceTier, tags. Caller does NOT supply those fields.
 */
export interface RuntimePipelineBehavioralPattern {
  readonly id: string
  readonly triggerCondition: string
  readonly repeatedBehavior: string
  readonly observedCount: number
  readonly confidence: number
}

/**
 * Adapter-local cycle window shape.
 * Bridge adds: scale (derived from period). Caller does NOT supply scale.
 */
export interface RuntimePipelineCycleWindow {
  readonly period: number
  readonly confidence: number
  readonly lastObserved: string
}

// ============================================================================
// RUNTIME PIPELINE INPUT
// ============================================================================

/**
 * Caller-supplied input to the future runtime wiring function.
 *
 * All fields required. No defaults. No optional supplemented fields.
 * Missing any field causes bridge failure (bridgeStatus: 'failed').
 *
 * Six supplemented fields (targetDate, domain, horizon, trendWindows,
 * behavioralPatterns, cycleWindows) must be caller-supplied at the call site.
 * The wiring function must NOT default, infer, or generate these internally.
 *
 * objective and adapterInput are required for bridge and audit lineage.
 *
 * Source: Q1 decision doc — all six supplemented fields are caller-supplied.
 */
export interface RuntimePipelineInput {
  // Kernel objective (non-supplemented; caller-supplied)
  readonly objective: string

  // Scalar supplemented fields — required, no defaults
  readonly targetDate: string        // ISO 8601 date string; never default to today
  readonly domain: string            // non-empty domain identifier
  readonly horizon: Horizon          // explicit; never default to 'medium'

  // Array supplemented fields — required, non-empty enforced by bridge at runtime
  // Adapter-local shapes only — bridge handles kernel enrichment
  readonly trendWindows: readonly RuntimePipelineTrendWindow[]
  readonly behavioralPatterns: readonly RuntimePipelineBehavioralPattern[]
  readonly cycleWindows: readonly RuntimePipelineCycleWindow[]
}

// ============================================================================
// RUNTIME PIPELINE RESULT
// ============================================================================

/**
 * Discriminated union result from the future runtime wiring function.
 *
 * Ratified in: docs/PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION.md
 *
 * Invariants:
 * - Only `status: 'success'` carries non-null forecast and auditEntry.
 * - Every failure branch carries `forecast: null` and `auditEntry: null`.
 * - No partial success state.
 * - No queue/defer state.
 * - No incomplete-audit-success state.
 * - `auditEntry: null` on all failure branches enables uniform destructuring
 *   without per-branch optional chaining.
 */
export type RuntimePipelineResult =
  | {
      readonly status: 'success'
      readonly forecast: PredictabilityForecast
      readonly auditEntry: ForecastAuditEntry
    }
  | {
      readonly status: 'bridge_failed'
      readonly bridgeError: string
      readonly forecast: null
      readonly auditEntry: null
    }
  | {
      readonly status: 'audit_creation_failed'
      readonly error: string
      readonly forecast: null
      readonly auditEntry: null
    }
  | {
      readonly status: 'audit_validation_failed'
      readonly errors: readonly string[]
      readonly forecast: null
      readonly auditEntry: null
    }
  | {
      readonly status: 'safety_flag_failed'
      readonly flagErrors: readonly string[]
      readonly forecast: null
      readonly auditEntry: null
    }
