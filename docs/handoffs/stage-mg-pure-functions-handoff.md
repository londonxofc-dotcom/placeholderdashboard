# Stage M-G Pure Functions Handoff

## Gate Identity

| Field | Value |
|---|---|
| Stage | M-G |
| Name | Trend Baseline Comparison — Pure Functions |
| Classification | pure functions only |
| Commit | `4adafc3` |
| Tag | `oracle-predictability-stage-mg-trend-baseline-functions-locked` |
| Branch | `night-build/2026-04-25` |
| Date | 2026-05-01 |

## Locked Chain

| Gate | Commit | Tag | What |
|---|---|---|---|
| M-G Spec | `0b1b7f6` | `oracle-predictability-stage-mg-trend-baseline-spec-locked` | Design spec |
| M-G Types | `510cce6` | `oracle-predictability-stage-mg-trend-baseline-types-locked` | Type contracts |
| M-G Type Handoff | `50beef2` | — | Type-contracts handoff doc |
| M-G Functions | `4adafc3` | `oracle-predictability-stage-mg-trend-baseline-functions-locked` | Pure functions + tests |

## What Was Delivered

Two files committed and tagged:

| File | Lines | Purpose |
|---|---|---|
| `ui/lib/oracle/predictability/trend-baseline-comparison.ts` | 447 | 10 pure functions + 1 internal helper |
| `ui/lib/oracle/predictability/__tests__/trend-baseline-comparison.test.ts` | 528 | 43 tests covering all 35 spec requirements |

## Function Inventory

### Exported Pure Functions (10)

| # | Function | Purpose |
|---|---|---|
| 1 | `validateBaselineWindows` | Validate both windows — empty, min points, finite values, overlap, span mismatch |
| 2 | `computeLinearSlope` | OLS closed-form linear regression: `m = (nΣxy − ΣxΣy) / (nΣx² − (Σx)²)` |
| 3 | `computeTrendDelta` | Delta between current and previous slopes |
| 4 | `computeAcceleration` | Rate of slope change normalized by midpoint separation |
| 5 | `classifyBaselineDirection` | Classify as stable, accelerating, decelerating, or reversing |
| 6 | `computeReversalIndicator` | Heuristic strength of sign reversal (0–1) |
| 7 | `computeBaselineDeviation` | Deviation of current mean from projected baseline |
| 8 | `assessDataQuality` | Classify window quality as high, moderate, or low |
| 9 | `computeOverallConfidence` | Geometric mean of window confidences with quality penalty |
| 10 | `computeTrendBaselineComparison` | Orchestrator — runs all 9 functions and assembles result |

### Internal Helper (1)

| Function | Purpose |
|---|---|
| `getWindowSpanDays` | Compute window span in days from timestamps |

## Key Implementation Details

- **OLS slope** uses index-based x values (0, 1, 2, ...) for deterministic results
- **Epsilon guard** (`1e-9`) protects division-by-zero in slope and acceleration
- **Direction classifier** handles all combinations: same-sign acceleration/deceleration and cross-sign reversal
- **Reversal indicator** uses harmonic-mean-like heuristic with sign factor, clamped to [0, 1]
- **Baseline deviation** projects previous trend line forward via timestamp-to-index conversion
- **Data quality** uses 2× minPoints threshold for "high" quality tier
- **Overall confidence** applies geometric mean with quality penalty (0.5 for low, 0.8 for moderate)
- **Result safety fields** hardcoded as literal `true` — `advisoryOnly: true`, `humanReviewRequired: true`

## Test Coverage Summary

| Describe Block | Tests | What It Verifies |
|---|---|---|
| validateBaselineWindows | 10 | Empty, min points, NaN/Infinity, overlap reject/warn, span mismatch, valid input |
| computeLinearSlope | 5 | Flat, positive, negative, single point, two points |
| computeTrendDelta | 2 | Positive and negative deltas |
| computeAcceleration | 3 | Non-zero, zero delta, zero separation |
| classifyBaselineDirection | 5 | Stable, accelerating, decelerating, reversing |
| computeReversalIndicator | 3 | No reversal, same sign, opposite signs |
| computeBaselineDeviation | 3 | Zero deviation, positive deviation, empty windows |
| assessDataQuality | 3 | High, moderate, low quality |
| computeOverallConfidence | 3 | Both high, mixed, both low |
| computeTrendBaselineComparison | 3 | Full pipeline, empty input, input warnings propagation |
| scope boundary checks | 3 | No forbidden imports, no certainty language, no shell-promoter |

**Total: 43 tests passing**
**Full suite: 409/409 passing**

## Boundaries — What This Gate Does NOT Include

- No Evidence Router wiring
- No Predictability Kernel runtime calls
- No Bayesian updater integration
- No Monte Carlo integration
- No Markov regime integration
- No UI/API/DB/auth changes
- No shell-promoter activation
- No live prediction claims

## Dependencies

- Imports only from `./trend-baseline-types` (frozen at `510cce6`)
- No external library imports
- No side effects, no I/O, no mutation
- Spec: `docs/PREDICTABILITY_STAGE_MG_TREND_BASELINE_SPEC.md` (committed at `0b1b7f6`)

## Freeze Line

The following are locked and must not change without a new gate authorization:

- `ui/lib/oracle/predictability/trend-baseline-comparison.ts` at `4adafc3`
- `ui/lib/oracle/predictability/__tests__/trend-baseline-comparison.test.ts` at `4adafc3`
- Tag: `oracle-predictability-stage-mg-trend-baseline-functions-locked`

## Next Gate

**Stage M-H — Cycle Phase Model** — design spec and type contracts for cycle phase detection. Requires explicit authorization. M-I (Calibration Ledger) remains locked.
