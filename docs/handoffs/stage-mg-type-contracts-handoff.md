# Stage M-G Type Contracts Handoff

## Gate Identity

| Field | Value |
|---|---|
| Stage | M-G |
| Name | Trend Baseline Comparison — Type Contracts |
| Classification | type contracts only |
| Commit | `510cce6` |
| Tag | `oracle-predictability-stage-mg-trend-baseline-types-locked` |
| Branch | `night-build/2026-04-25` |
| Date | 2026-05-01 |

## What Was Delivered

Two files committed and tagged:

| File | Lines | Purpose |
|---|---|---|
| `ui/lib/oracle/predictability/trend-baseline-types.ts` | 121 | Type contracts, frozen constants, interfaces |
| `ui/lib/oracle/predictability/__tests__/trend-baseline-types.test.ts` | 396 | 37 tests — compilation, values, frozen, thresholds, safety, scope |

## Type Inventory

### Frozen Const Objects (5)

| Constant | Keys | Purpose |
|---|---|---|
| `TREND_BASELINE_DIRECTIONS` | accelerating, decelerating, stable, reversing | Direction classification |
| `TREND_BASELINE_OVERLAP_POLICIES` | reject, warn | Window overlap handling |
| `TREND_BASELINE_DATA_QUALITY_LEVELS` | high, moderate, low | Data quality tiers |
| `TREND_BASELINE_WARNING_SEVERITIES` | info, warn, block | Warning severity levels |
| `TREND_BASELINE_THRESHOLDS` | 8 numeric constants | Computation thresholds |

### Derived Union Types (4)

- `TrendBaselineDirection` — from `TREND_BASELINE_DIRECTIONS`
- `TrendBaselineOverlapPolicy` — from `TREND_BASELINE_OVERLAP_POLICIES`
- `TrendBaselineDataQuality` — from `TREND_BASELINE_DATA_QUALITY_LEVELS`
- `TrendBaselineWarningSeverity` — from `TREND_BASELINE_WARNING_SEVERITIES`

### Interfaces (5)

- `TrendBaselineDataPoint` — `{ timestamp, value, confidence }`
- `TrendBaselineWindowConfig` — `{ minPointsPerWindow, overlapPolicy }`
- `TrendBaselineWarning` — `{ code, message, severity, field }`
- `TrendBaselineInput` — two windows + config + metadata + optional warnings
- `TrendBaselineResult` — slopes, delta, acceleration, direction, quality, confidence, safety fields

### Safety Fields

- `advisoryOnly: true` — literal `true` type, compile-time enforced
- `humanReviewRequired: true` — literal `true` type, compile-time enforced

## Threshold Constants

| Constant | Value | Purpose |
|---|---|---|
| `SLOPE_FLAT_THRESHOLD` | 0.05 | Below this, slope is "stable" |
| `MIN_POINTS_FOR_QUALITY` | 5 | Minimum data points for quality assessment |
| `EPSILON` | 1e-9 | Floating point comparison guard |
| `HIGH_CONFIDENCE_THRESHOLD` | 0.8 | Above this = high confidence |
| `MODERATE_CONFIDENCE_THRESHOLD` | 0.5 | Above this = moderate confidence |
| `WINDOW_SPAN_MISMATCH_RATIO` | 2.0 | Flag if window spans differ by 2x+ |
| `QUALITY_PENALTY_LOW` | 0.3 | Confidence multiplier for low quality |
| `QUALITY_PENALTY_MODERATE` | 0.7 | Confidence multiplier for moderate quality |

## Test Coverage Summary

| Describe Block | Tests | What It Verifies |
|---|---|---|
| compilation and export verification | 7 | All types and interfaces compile and export correctly |
| TrendBaselineDirection values | 4 | All 4 direction literals assignable |
| constant objects | 8 | Frozen, correct keys, correct counts |
| TREND_BASELINE_THRESHOLDS | 9 | Value ranges, relationships, frozen |
| TrendBaselineResult safety fields | 2 | advisoryOnly and humanReviewRequired are literal true |
| TrendBaselineWarning structure | 1 | All 4 required fields present |
| scope boundary checks | 6 | No functions, no forbidden imports, no certainty language |

**Total: 37 tests passing**

## Boundaries — What This Gate Does NOT Include

- No implementation functions (no OLS slope, no acceleration, no direction classifier)
- No Evidence Router wiring
- No Predictability Kernel runtime calls
- No Bayesian updater integration
- No Monte Carlo integration
- No Markov regime integration
- No UI/API/DB/auth changes
- No shell-promoter activation

## Dependencies

- No imports from other modules
- No shared type references (self-contained)
- Spec: `docs/PREDICTABILITY_STAGE_MG_TREND_BASELINE_SPEC.md` (committed at `0b1b7f6`)

## Freeze Line

The following are locked and must not change without a new gate authorization:

- `ui/lib/oracle/predictability/trend-baseline-types.ts` at `510cce6`
- `ui/lib/oracle/predictability/__tests__/trend-baseline-types.test.ts` at `510cce6`
- Tag: `oracle-predictability-stage-mg-trend-baseline-types-locked`

## Next Gate

**Stage M-G Pure Functions** — implement `computeTrendBaseline()` and related pure functions using these type contracts. Requires explicit authorization.
