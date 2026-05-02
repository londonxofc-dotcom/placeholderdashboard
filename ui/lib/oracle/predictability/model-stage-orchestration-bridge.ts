/**
 * model-stage-orchestration-bridge.ts
 *
 * Gate G-3.2: Pure adapter-to-kernel bridge functions.
 *
 * No imports from sealed adapter, kernel, Gate F, or model stage modules.
 * No I/O. No mutation. No side effects. No runtime wiring.
 */

import {
  MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION,
  type AdapterToKernelBridgeContract,
  type BridgeFieldAudit,
  type BridgeResult,
  type LossyTransformRecord,
  type ModelStageOrchestrationInput,
  type ModelStageOrchestrationSafetyFlags,
} from './model-stage-orchestration-types'

type KernelInput = NonNullable<BridgeResult['kernelInput']>
type KernelLandmarkEvent = KernelInput['historicalEvents'][number]
type KernelTrendWindow = KernelInput['trendWindows'][number]
type KernelBehavioralPattern = KernelInput['behavioralPatterns'][number]
type KernelCycleWindow = KernelInput['cycleWindows'][number]

const REQUIRED_SUPPLEMENTED_FIELDS = [
  'targetDate',
  'domain',
  'horizon',
  'trendWindows',
  'behavioralPatterns',
  'cycleWindows',
] as const

const DERIVED_FIELDS = [
  'objective',
  'historicalEvents',
  'landmarkEvents',
] as const

const SAFETY_FLAG_NAMES: readonly (keyof ModelStageOrchestrationSafetyFlags)[] = [
  'advisoryOnly',
  'humanReviewRequired',
  'userAcknowledgmentRequired',
  'forbidAutonomousAction',
  'forbidCertaintyLanguage',
  'requireAssumptions',
  'requireFailureModes',
  'requireProvenanceTrail',
  'noActionRecommended',
  'requireDeterministicSeed',
  'forbidStageSkipping',
  'requireLineageCompleteness',
  'failOpenToSafeState',
]

export function bridgeAdapterToKernelInput(
  input: ModelStageOrchestrationInput,
  safetyFlags: ModelStageOrchestrationSafetyFlags
): BridgeResult {
  const safetyErrors = validateSafetyFlags(safetyFlags)
  if (safetyErrors.length > 0) {
    return buildFailedResult({
      errors: safetyErrors,
      warnings: ['Bridge failed closed before transformation because safety flags were invalid.'],
      fieldAudit: createEmptyAudit(),
      bridgeVersion: input.bridgeContract?.bridgeVersion,
    })
  }

  const versionError = validateBridgeVersion(input.bridgeContract)
  if (versionError) {
    return buildFailedResult({
      errors: [versionError],
      warnings: ['Bridge failed closed before transformation because bridge version mismatched.'],
      fieldAudit: createEmptyAudit(),
      bridgeVersion: input.bridgeContract?.bridgeVersion,
    })
  }

  const inputErrors = validateAdapterInput(input)
  if (inputErrors.length > 0) {
    return buildFailedResult({
      errors: inputErrors,
      warnings: ['Bridge failed closed before kernel-native input was produced.'],
      fieldAudit: buildFieldAudit(input, { failed: true }),
      bridgeVersion: input.bridgeContract?.bridgeVersion,
    })
  }

  const fieldAudit = buildFieldAudit(input, { failed: false })
  const historicalEvents = input.historicalEvents.map((event, index) =>
    mapHistoricalEvent(event, input, index)
  )

  return {
    success: true,
    kernelInput: {
      targetDate: input.targetDate as string,
      domain: input.domain as string,
      objective: input.objective,
      horizon: input.horizon as KernelInput['horizon'],
      historicalEvents,
      trendWindows: (input.trendWindows as NonNullable<ModelStageOrchestrationInput['trendWindows']>).map(
        mapTrendWindow
      ),
      landmarkEvents: historicalEvents.map(event => ({ ...event })),
      behavioralPatterns: (
        input.behavioralPatterns as NonNullable<ModelStageOrchestrationInput['behavioralPatterns']>
      ).map(mapBehavioralPattern),
      cycleWindows: (input.cycleWindows as NonNullable<ModelStageOrchestrationInput['cycleWindows']>).map(
        mapCycleWindow
      ),
    },
    bridgeContract: {
      bridgeStatus: 'applied',
      bridgeVersion: MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION,
      inputTypePath: 'bridged',
      derivedFields: [...fieldAudit.derivedFields],
      supplementedFields: [...fieldAudit.supplementedFields],
      defaultedFields: [...fieldAudit.defaultedFields],
      unmappableFields: [...fieldAudit.unmappableFields],
      unbridgedWarning: false,
      bridgeApplied: true,
    },
    errors: [],
    warnings: [],
    fieldAudit,
  }
}

export function createKernelNativeBridgeResult(kernelInput: KernelInput): BridgeResult {
  return {
    success: true,
    kernelInput,
    bridgeContract: {
      bridgeStatus: 'not_required',
      bridgeVersion: MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION,
      inputTypePath: 'kernel_native',
      derivedFields: [],
      supplementedFields: [],
      defaultedFields: [],
      unmappableFields: [],
      unbridgedWarning: true,
      bridgeApplied: false,
    },
    errors: [],
    warnings: ['Bridge not required because kernel-native input was supplied.'],
    fieldAudit: createEmptyAudit(),
  }
}

function createEmptyAudit(): BridgeFieldAudit {
  return {
    derivedFields: [],
    supplementedFields: [],
    defaultedFields: [],
    unmappableFields: [],
    lossyTransforms: [],
  }
}

function validateSafetyFlags(flags: ModelStageOrchestrationSafetyFlags): string[] {
  const values = flags as unknown as Record<string, unknown>
  return SAFETY_FLAG_NAMES.flatMap(name =>
    values[name] === true ? [] : [`Safety flag ${name} must be true, got ${String(values[name])}`]
  )
}

function validateBridgeVersion(bridge?: AdapterToKernelBridgeContract): string | undefined {
  if (!bridge?.bridgeVersion) return undefined
  if (bridge.bridgeVersion === MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION) return undefined
  return `Bridge version mismatch: expected ${MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION}, got ${bridge.bridgeVersion}`
}

function validateAdapterInput(input: ModelStageOrchestrationInput): string[] {
  const errors: string[] = []

  if (!input.objective.trim()) errors.push('objective must not be empty')

  for (const field of REQUIRED_SUPPLEMENTED_FIELDS) {
    const value = input[field]
    if (value === undefined || value === null || value === '') {
      errors.push(`Missing required supplemented field: ${field}`)
    }
  }

  if (input.trendWindows && input.trendWindows.length === 0) {
    errors.push('Required supplemented array trendWindows must not be empty')
  }
  if (input.behavioralPatterns && input.behavioralPatterns.length === 0) {
    errors.push('Required supplemented array behavioralPatterns must not be empty')
  }
  if (input.cycleWindows && input.cycleWindows.length === 0) {
    errors.push('Required supplemented array cycleWindows must not be empty')
  }

  input.historicalEvents.forEach((event, index) => {
    if (!event.sourceId.trim()) errors.push(`historicalEvents.${index}.sourceId must not be empty`)
    if (!event.claim.trim()) errors.push(`historicalEvents.${index}.claim must not be empty`)
    if (!event.sourceReliability.trim()) {
      errors.push(`historicalEvents.${index}.sourceReliability must not be empty`)
    }
    if (!event.observedAt.trim()) errors.push(`historicalEvents.${index}.observedAt must not be empty`)
    if (!isConfidence(event.originalConfidence)) {
      errors.push(`historicalEvents.${index}.originalConfidence must be between 0 and 1`)
    }
    if (!isConfidence(event.adjustedConfidence)) {
      errors.push(`historicalEvents.${index}.adjustedConfidence must be between 0 and 1`)
    }
  })

  input.trendWindows?.forEach((window, index) => {
    if (!window.id.trim()) errors.push(`trendWindows.${index}.id must not be empty`)
    if (!window.label.trim()) errors.push(`trendWindows.${index}.label must not be empty`)
    if (!window.start.trim()) errors.push(`trendWindows.${index}.start must not be empty`)
    if (!window.end.trim()) errors.push(`trendWindows.${index}.end must not be empty`)
    if (!window.signalType.trim()) errors.push(`trendWindows.${index}.signalType must not be empty`)
    if (!Number.isFinite(window.value)) errors.push(`trendWindows.${index}.value must be finite`)
    if (!isConfidence(window.confidence)) {
      errors.push(`trendWindows.${index}.confidence must be between 0 and 1`)
    }
  })

  input.behavioralPatterns?.forEach((pattern, index) => {
    if (!pattern.id.trim()) errors.push(`behavioralPatterns.${index}.id must not be empty`)
    if (!pattern.triggerCondition.trim()) {
      errors.push(`behavioralPatterns.${index}.triggerCondition must not be empty`)
    }
    if (!pattern.repeatedBehavior.trim()) {
      errors.push(`behavioralPatterns.${index}.repeatedBehavior must not be empty`)
    }
    if (!Number.isInteger(pattern.observedCount) || pattern.observedCount < 0) {
      errors.push(`behavioralPatterns.${index}.observedCount must be a non-negative integer`)
    }
    if (!isConfidence(pattern.confidence)) {
      errors.push(`behavioralPatterns.${index}.confidence must be between 0 and 1`)
    }
  })

  input.cycleWindows?.forEach((window, index) => {
    if (!Number.isFinite(window.period) || window.period <= 0) {
      errors.push(`cycleWindows.${index}.period must be greater than 0`)
    }
    if (!isConfidence(window.confidence)) {
      errors.push(`cycleWindows.${index}.confidence must be between 0 and 1`)
    }
    if (!window.lastObserved.trim()) {
      errors.push(`cycleWindows.${index}.lastObserved must not be empty`)
    }
  })

  return errors
}

function buildFieldAudit(
  input: ModelStageOrchestrationInput,
  options: { readonly failed: boolean }
): BridgeFieldAudit {
  const defaultedFields = [
    ...input.historicalEvents.flatMap((_, index) => [
      `historicalEvents.${index}.eventType`,
      `historicalEvents.${index}.impact`,
      `historicalEvents.${index}.magnitude`,
      `historicalEvents.${index}.affectedSignals`,
      `historicalEvents.${index}.createsRegimeShift`,
      `historicalEvents.${index}.sourceTier`,
      `historicalEvents.${index}.tags`,
    ]),
    ...(input.trendWindows ?? []).flatMap((_, index) => [
      `trendWindows.${index}.scale`,
      `trendWindows.${index}.sourceTier`,
    ]),
    ...(input.behavioralPatterns ?? []).flatMap((_, index) => [
      `behavioralPatterns.${index}.actorScope`,
      `behavioralPatterns.${index}.positiveOutcomes`,
      `behavioralPatterns.${index}.negativeOutcomes`,
      `behavioralPatterns.${index}.neutralOutcomes`,
      `behavioralPatterns.${index}.sourceTier`,
      `behavioralPatterns.${index}.tags`,
    ]),
    ...(input.cycleWindows ?? []).map((_, index) => `cycleWindows.${index}.scale`),
  ]

  return {
    derivedFields: options.failed ? [] : [...DERIVED_FIELDS],
    supplementedFields: [...REQUIRED_SUPPLEMENTED_FIELDS],
    defaultedFields,
    unmappableFields: options.failed ? findUnmappableFields(input) : [],
    lossyTransforms: buildLossyTransforms(input),
  }
}

function buildLossyTransforms(input: ModelStageOrchestrationInput): LossyTransformRecord[] {
  return input.historicalEvents.flatMap((_, index) => [
    {
      targetField: `historicalEvents.${index}.impact`,
      sourceField: `historicalEvents.${index}.adjustedConfidence`,
      transformRule: 'adjustedConfidence thresholded into kernel EventImpact',
      informationLost: 'numeric confidence becomes a coarse event impact label',
    },
    {
      targetField: `historicalEvents.${index}.magnitude`,
      sourceField: `historicalEvents.${index}.originalConfidence`,
      transformRule: 'originalConfidence copied into kernel magnitude',
      informationLost: 'confidence magnitude is used as event magnitude without independent scale data',
    },
    {
      targetField: `historicalEvents.${index}.sourceTier`,
      sourceField: `historicalEvents.${index}.sourceReliability`,
      transformRule: 'sourceReliability label mapped to conservative kernel SourceTier',
      informationLost: 'adapter reliability label does not preserve full kernel source tier provenance',
    },
  ])
}

function findUnmappableFields(input: ModelStageOrchestrationInput): string[] {
  return REQUIRED_SUPPLEMENTED_FIELDS.filter(field => {
    const value = input[field]
    return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
  })
}

function mapHistoricalEvent(
  event: ModelStageOrchestrationInput['historicalEvents'][number],
  input: ModelStageOrchestrationInput,
  index: number
): KernelLandmarkEvent {
  return {
    id: event.sourceId,
    timestamp: event.observedAt,
    domain: input.domain as string,
    eventType: 'adapter_historical_event',
    description: event.claim,
    impact: deriveImpact(event.adjustedConfidence),
    magnitude: event.originalConfidence,
    affectedSignals: [input.objective],
    createsRegimeShift: false,
    confidence: event.adjustedConfidence,
    sourceTier: deriveSourceTier(event.sourceReliability),
    tags: ['bridged', `historical-event-${index}`],
  }
}

function mapTrendWindow(
  window: NonNullable<ModelStageOrchestrationInput['trendWindows']>[number]
): KernelTrendWindow {
  return {
    id: window.id,
    label: window.label,
    start: window.start,
    end: window.end,
    scale: deriveSignalScale(window.value),
    signalType: window.signalType,
    value: window.value,
    confidence: window.confidence,
    sourceTier: 'T2',
  }
}

function mapBehavioralPattern(
  pattern: NonNullable<ModelStageOrchestrationInput['behavioralPatterns']>[number]
): KernelBehavioralPattern {
  return {
    id: pattern.id,
    actorScope: 'system',
    triggerCondition: pattern.triggerCondition,
    repeatedBehavior: pattern.repeatedBehavior,
    observedCount: pattern.observedCount,
    positiveOutcomes: 0,
    negativeOutcomes: 0,
    neutralOutcomes: pattern.observedCount,
    confidence: pattern.confidence,
    sourceTier: 'T2',
    tags: ['supplemented'],
  }
}

function mapCycleWindow(
  window: NonNullable<ModelStageOrchestrationInput['cycleWindows']>[number]
): KernelCycleWindow {
  return {
    period: window.period,
    scale: deriveCycleScale(window.period),
    confidence: window.confidence,
    lastObserved: window.lastObserved,
  }
}

function deriveImpact(confidence: number): KernelLandmarkEvent['impact'] {
  if (confidence >= 0.7) return 'positive'
  if (confidence >= 0.4) return 'mixed'
  return 'unknown'
}

function deriveSignalScale(value: number): KernelTrendWindow['scale'] {
  const magnitude = Math.abs(value)
  if (magnitude >= 0.75) return 'macro'
  if (magnitude >= 0.4) return 'meso'
  return 'micro'
}

function deriveCycleScale(period: number): KernelCycleWindow['scale'] {
  if (period >= 90) return 'macro'
  if (period >= 14) return 'meso'
  return 'micro'
}

function deriveSourceTier(reliability: string): KernelLandmarkEvent['sourceTier'] {
  const normalized = reliability.toLowerCase()
  if (normalized.includes('user')) return 'T0'
  if (normalized.includes('canon') || normalized.includes('direct') || normalized.includes('primary')) return 'T1'
  if (normalized.includes('verified') || normalized.includes('module')) return 'T2'
  if (normalized.includes('scaffold')) return 'T3'
  if (normalized.includes('inference')) return 'T4'
  return 'T5'
}

function isConfidence(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

function buildFailedResult(args: {
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly fieldAudit: BridgeFieldAudit
  readonly bridgeVersion?: string
}): BridgeResult {
  return {
    success: false,
    bridgeContract: {
      bridgeStatus: 'failed',
      bridgeVersion: args.bridgeVersion || MODEL_STAGE_ORCHESTRATION_CONTRACT_VERSION,
      inputTypePath: 'adapter_local',
      derivedFields: [...args.fieldAudit.derivedFields],
      supplementedFields: [...args.fieldAudit.supplementedFields],
      defaultedFields: [...args.fieldAudit.defaultedFields],
      unmappableFields: [...args.fieldAudit.unmappableFields],
      unbridgedWarning: true,
      bridgeApplied: false,
    },
    errors: args.errors,
    warnings: args.warnings,
    fieldAudit: args.fieldAudit,
  }
}
