/**
 * runtime-pipeline-invocation.ts
 *
 * RI-5: Thin invocation boundary for the Predictability runtime pipeline.
 *
 * Validates that caller-provided candidate input contains every required
 * RuntimePipelineInput field before invoking the locked RI-3 pipeline.
 *
 * Missing or empty input fails closed before runtime execution:
 * - status: bridge_failed
 * - forecast: null
 * - auditEntry: null
 *
 * No defaults. No live Evidence Router wiring. No persistence. No UI/API work.
 */

import { runPredictabilityRuntimePipeline } from './runtime-pipeline'
import type {
  RuntimePipelineInput,
  RuntimePipelineResult,
} from './runtime-pipeline-types'

type RequiredScalarField = 'objective' | 'targetDate' | 'domain' | 'horizon'
type RequiredArrayField = 'trendWindows' | 'behavioralPatterns' | 'cycleWindows'

const REQUIRED_SCALAR_FIELDS: readonly RequiredScalarField[] = [
  'objective',
  'targetDate',
  'domain',
  'horizon',
]

const REQUIRED_ARRAY_FIELDS: readonly RequiredArrayField[] = [
  'trendWindows',
  'behavioralPatterns',
  'cycleWindows',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function collectInvocationErrors(candidate: unknown): readonly string[] {
  if (!isRecord(candidate)) {
    return ['invalid RuntimePipelineInput candidate: expected object']
  }

  const errors: string[] = []

  for (const field of REQUIRED_SCALAR_FIELDS) {
    const value = candidate[field]
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`missing or invalid required field: ${field}`)
    }
  }

  for (const field of REQUIRED_ARRAY_FIELDS) {
    const value = candidate[field]
    if (!Array.isArray(value) || value.length === 0) {
      errors.push(`missing or invalid required field: ${field}`)
    }
  }

  return errors
}

/**
 * Invoke the locked RI-3 runtime pipeline only after RI-5 boundary validation.
 */
export function invokePredictabilityRuntimePipeline(
  candidate: unknown
): RuntimePipelineResult {
  const errors = collectInvocationErrors(candidate)

  if (errors.length > 0) {
    return {
      status: 'bridge_failed',
      bridgeError: errors.join('; '),
      forecast: null,
      auditEntry: null,
    }
  }

  return runPredictabilityRuntimePipeline(candidate as RuntimePipelineInput)
}
