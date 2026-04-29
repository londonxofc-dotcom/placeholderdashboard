export type SignalScale = "micro" | "meso" | "macro"
export type TrendDirection = "rising" | "falling" | "flat" | "volatile"
export type EventImpact = "positive" | "negative" | "mixed" | "unknown"
export type ActorScope = "self" | "contact" | "organization" | "market" | "system"
export type Horizon = "short" | "medium" | "long"
export type ForecastBand = "unlikely" | "possible" | "likely" | "strong"
export type SourceTier = "T0" | "T1" | "T2" | "T3" | "T4" | "T5"

export interface TrendWindow {
  id: string
  label: string
  start: string
  end: string
  scale: SignalScale
  signalType: string
  value: number
  confidence: number
  sourceTier: SourceTier
}

export interface TrendDelta {
  signalType: string
  previousValue: number
  currentValue: number
  delta: number
  direction: TrendDirection
  strength: number
  confidence: number
}

export interface LandmarkEvent {
  id: string
  timestamp: string
  domain: string
  eventType: string
  description: string
  impact: EventImpact
  magnitude: number
  affectedSignals: string[]
  createsRegimeShift: boolean
  confidence: number
  sourceTier: SourceTier
  tags: string[]
}

export interface RegimeState {
  id: string
  label: string
  start: string
  end?: string
  domain: string
  activeSignals: string[]
  originatingLandmarkEventIds: string[]
  confidence: number
  notes: string
}

export interface BehavioralPattern {
  id: string
  actorScope: ActorScope
  triggerCondition: string
  repeatedBehavior: string
  observedCount: number
  positiveOutcomes: number
  negativeOutcomes: number
  neutralOutcomes: number
  confidence: number
  sourceTier: SourceTier
  tags: string[]
}

export interface CycleWindow {
  period: number
  scale: SignalScale
  confidence: number
  lastObserved: string
}

export interface CycleAlignment {
  isAligned: boolean
  alignmentScore: number
  matchingCycle: CycleWindow | null
  phaseAlignment: number
}

export interface PredictabilityInput {
  targetDate: string
  domain: string
  objective: string
  horizon: Horizon
  historicalEvents: LandmarkEvent[]
  trendWindows: TrendWindow[]
  landmarkEvents: LandmarkEvent[]
  behavioralPatterns: BehavioralPattern[]
  cycleWindows: CycleWindow[]
}

export interface PredictabilityForecast {
  scenario: string
  forecastBand: ForecastBand
  score: number
  confidence: number
  trendDeltas: TrendDelta[]
  activeRegime: RegimeState | null
  supportingEvidence: string[]
  opposingEvidence: string[]
  behavioralSignals: string[]
  assumptions: string[]
  warnings: string[]
  recommendedNextMove: string
}
