# Stage M-H Type Contracts Handoff

## Gate Identity

| Field | Value |
|---|---|
| Stage | M-H |
| Name | Cycle Phase Model — Type Contracts |
| Classification | type contracts only |
| Spec commit | `5bd4371` |
| Spec tag | `oracle-predictability-stage-mh-cycle-phase-spec-locked` |
| Type contracts commit | `76926aa` |
| Type contracts tag | `oracle-predictability-stage-mh-cycle-phase-types-locked` |
| Branch | `night-build/2026-04-25` |
| Date | 2026-05-01 |

## What Was Delivered

Two files committed and tagged:

| File | Lines | Purpose |
|---|---|---|
| `ui/lib/oracle/predictability/cycle-phase-types.ts` | 194 | Type contracts, frozen constants, interfaces |
| `ui/lib/oracle/predictability/__tests__/cycle-phase-types.test.ts` | 487 | 45 tests — compilation, values, frozen, thresholds, safety, scope |

## Type Inventory

### Frozen Const Objects (5)

| Constant | Keys | Purpose |
|---|---|---|
| `CYCLE_PHASES` | accumulation, expansion, distribution, contraction, recovery, uncertain | Phase classification values |
| `CYCLE_PHASE_WARNING_SEVERITIES` | info, warn, block | Warning severity levels |
| `CYCLE_PHASE_WARNING_CODES` | 7 codes (UPSTREAM_MISSING, LOW_CONFIDENCE, STALE_EVIDENCE, HIGH_AMBIGUITY, MODEL_DISAGREEMENT, QUALITY_DEGRADED, BLOCKING_WARNING_PRESENT) | Warning code constants |
| `CYCLE_PHASE_DEFAULT_SAFETY_FLAGS` | advisoryOnly, humanReviewRequired, noActionRecommended | Default safety posture |
| `CYCLE_PHASE_THRESHOLDS` | 8 numeric constants | Computation and confidence thresholds |

### Derived Union Types (3)

- `CyclePhase` — from `CYCLE_PHASES`
- `CyclePhaseWarningSeverity` — from `CYCLE_PHASE_WARNING_SEVERITIES`
- `CyclePhaseWarningCode` — from `CYCLE_PHASE_WARNING_CODES`

### Interfaces (8)

- `CyclePhaseWarning` — `{ code, message, severity, source }`
- `CyclePhaseEvidence` — `{ trendSignal, regimeSignal, scenarioSignal, beliefSignal, dominantSignals, summary }`
- `CyclePhaseConfidence` — `{ phaseScoreConfidence, upstreamConfidencePenalty, dataQualityPenalty, warningPenalty, stalenessPenalty, overall }`
- `CyclePhaseTransitionRisk` — `{ regimeTransitionComponent, trendReversalComponent, scenarioDispersionComponent, ambiguityComponent, overall }`
- `TrendBaselineInputSummary` — upstream summary from M-G
- `MarkovRegimeInputSummary` — upstream summary from M-E/M-F
- `MonteCarloScenarioInputSummary` — upstream summary from M-C/M-D
- `BayesianPosteriorInputSummary` — upstream summary from M-A/M-B
- `CyclePhaseInput` — aggregated input with optional upstream summaries + metadata
- `CyclePhaseResult` — phase, confidence, phaseScores, transitionRisk, ambiguityScore, warnings, evidence, safety fields

### Safety Fields

- `advisoryOnly: true` — literal `true` type, compile-time enforced
- `humanReviewRequired: true` — literal `true` type, compile-time enforced
- `noActionRecommended: true` — literal `true` type, compile-time enforced (new in M-H)

## Threshold Constants

| Constant | Value | Purpose |
|---|---|---|
| `MIN_CONFIDENCE` | 0.3 | Below this, result is unreliable |
| `AMBIGUITY_THRESHOLD` | 0.85 | Above this, ambiguity is flagged |
| `HYSTERESIS_ENTRY` | 0.6 | Score required to enter a new phase |
| `HYSTERESIS_RETENTION` | 0.4 | Score required to retain current phase |
| `QUALITY_PENALTY_LOW` | 0.5 | Confidence multiplier for low quality data |
| `QUALITY_PENALTY_MODERATE` | 0.8 | Confidence multiplier for moderate quality data |
| `STALENESS_WINDOW_MS` | 3,600,000 | 1 hour freshness window for upstream evidence |
| `WARNING_PENALTY_FACTOR` | 0.9 | Per-warning confidence penalty multiplier |

## Test Coverage Summary

| Describe Block | Tests | What It Verifies |
|---|---|---|
| cycle-phase-types exports | 5 | All constants export and are objects |
| CyclePhase literals | 3 | 6 phases, exact values, frozen |
| CyclePhaseWarningSeverity | 3 | info/warn/block, count, frozen |
| CyclePhaseWarningCodes | 6 | All 5+ codes present, frozen |
| CYCLE_PHASE_DEFAULT_SAFETY_FLAGS | 4 | All 3 flags true, frozen |
| CYCLE_PHASE_THRESHOLDS | 9 | Value types, ranges, hysteresis entry > retention, frozen |
| CyclePhaseWarning type | 1 | Required fields compile |
| CyclePhaseEvidence type | 1 | Required fields compile |
| CyclePhaseResult safety fields | 4 | 3 literal true fields + confidence number |
| CyclePhaseConfidence type | 1 | Required fields compile |
| CyclePhaseTransitionRisk type | 1 | Required fields compile |
| CyclePhaseInput type | 2 | Required upstream fields + optional upstream undefined |
| scope boundary checks | 5 | No functions, no forbidden imports, no shell-promoter, no certainty language, no Evidence Router/Kernel |

**Total: 45 tests passing**

## Boundaries — What This Gate Does NOT Include

- No implementation functions (no phase scoring, no confidence computation, no transition risk calculation)
- No Evidence Router wiring
- No Predictability Kernel runtime calls
- No Bayesian updater integration
- No Monte Carlo integration
- No Markov regime integration
- No Trend baseline integration
- No UI/API/DB/auth changes
- No shell-promoter activation
- No live prediction claims
- No autonomous forecasting or action

## Dependencies

- No imports from other modules
- No shared type references (self-contained)
- Spec: `docs/PREDICTABILITY_STAGE_MH_CYCLE_PHASE_MODEL_SPEC.md` (committed at `5bd4371`)

## Safety Boundaries Verified

| Boundary | Status |
|---|---|
| current.md untouched | yes |
| oracle-memory/sources untouched | yes |
| cycle-analysis.ts untouched (Stage P) | yes |
| shell-promoter KEEP_DEFERRED | yes |
| No Gate E implementation | yes |
| No Evidence Router live wiring | yes |
| No Predictability Kernel runtime calls | yes |
| No UI/API/DB/auth | yes |
| No live prediction claims | yes |
| No autonomous forecasting/action | yes |

## Freeze Line

The following are locked and must not change without a new gate authorization:

- `ui/lib/oracle/predictability/cycle-phase-types.ts` at `76926aa`
- `ui/lib/oracle/predictability/__tests__/cycle-phase-types.test.ts` at `76926aa`
- Tag: `oracle-predictability-stage-mh-cycle-phase-types-locked`

## Next Gate

**Stage M-H Pure Functions** — implement cycle phase classification, confidence computation, transition risk calculation, and evidence synthesis using these type contracts. Requires explicit authorization.

**Stage M-I Calibration Ledger** — remains locked. Not started.
