# Predictability Model Expansion — Stage M-G Trend Baseline Comparison Design

## 1. Canon Boundary

This document is a **design specification only**. It does not authorize implementation.

- No implementation authorized by this document.
- No trend baseline comparison code.
- No Predictability Kernel integration.
- No Gate E implementation.
- No Evidence Router wiring.
- No UI/API/DB/auth.
- No current.md edits.
- No protected source mutation.
- No shell-promoter activation.
- No live prediction claims.
- No autonomous forecasting or action.

## 2. Stage Position

| Stage | Name | Status | Content |
|-------|------|--------|---------|
| M-A | Bayesian updater type contracts | COMPLETE — locked | Type contracts for Bayesian update pipeline |
| M-B | Bayesian updater pure functions | COMPLETE — locked | 6 pure functions: clamp, normalize, posterior, delta, classify, update |
| M-C | Monte Carlo scenario type contracts | COMPLETE — locked | Type contracts for Monte Carlo scenario modeling |
| M-D | Monte Carlo pure fixture simulation | COMPLETE — locked | 7 pure functions: seed PRNG, sample, iterate, summarize, tail risk, uncertainty band, orchestrate |
| M-E | Markov regime transition contracts | COMPLETE — locked | 4 const objects, 4 union types, 8 interfaces, 10 contract rules |
| M-F | Markov pure functions | COMPLETE — locked | 9 pure functions: validate, normalize, row extract, distribution, widening, quarantine, argmax, path, orchestrate |
| M-G | Trend baseline comparison | **DESIGN ONLY** | Pure functions comparing current vs. prior trend windows |

Stage M-G implementation remains locked until separately and explicitly authorized.

## 3. Objective

Design how trend baseline comparison functions should detect acceleration, deceleration, reversal, and deviation by comparing a current trend window against a defined prior trend window, while preserving:

- **Window isolation** — prior and current windows must be non-overlapping; overlapping windows produce invalid comparisons
- **Determinism** — same input produces same output, every time
- **Provenance** — every computation step must preserve and extend provenance chains
- **Confidence scaling** — sparse or low-quality input data reduces output confidence
- **Advisory-only output** — all comparison output is advisory, not canon
- **Human review requirement** — no autonomous action from comparison output
- **Immutability** — no input mutation; all functions return new objects
- **Integration with existing primitives** — builds on existing `TrendWindow`, `TrendDelta`, and `TrendDirection` types from `types.ts`

## 4. Function Philosophy

Trend baseline comparison functions are **pure computations over paired time windows**. They measure how the present differs from the past. They do not predict the future.

Core principles:

1. Functions are **pure** — no side effects, no mutation, no I/O, no network, no filesystem.
2. Functions consume **M-G type contracts only** — plus shared types from `types.ts` that are already part of the predictability system. No imports from Stages M-A through M-F implementation files.
3. Output is **deterministic** — same input always produces same output.
4. Windows are **validated before comparison** — overlapping, empty, or malformed windows produce warnings, not silent errors.
5. Direction labels describe **mathematical relationships** — accelerating means the second derivative is positive, not that things are "getting better."
6. Reversal detection is a **heuristic estimate** — it reflects a change in sign of the first derivative, not a guaranteed prediction.
7. Sparse data produces **low confidence** — fewer data points reduce confidence in all derived metrics.
8. All output remains **advisory only** — never canon, never actionable without human review.

## 5. Determinism Requirement

Future implementation must support fully deterministic execution for testing and reproducibility.

Design rules:

1. **No randomness** — trend comparison is deterministic arithmetic over input arrays. No `Math.random` needed.
2. **No floating-point tolerance drift** — use a defined epsilon (e.g., 1e-10) for equality checks, applied consistently across all functions.
3. **Regression fitting uses closed-form solutions** — ordinary least squares (OLS) for linear trend estimation. No iterative solvers, no convergence-dependent results.
4. **Tests must be reproducible** — running the same test twice must produce the same result.
5. **Same input = same output** — determinism is non-negotiable for verification.

## 6. Relationship to Existing Modules

Stage M-G **does not modify** existing predictability modules. It introduces new functions that operate on data shapes already defined in `types.ts`.

| Existing Module | Relationship to M-G |
|----------------|---------------------|
| `types.ts` — `TrendWindow` | M-G consumes `TrendWindow` as its core data shape for both prior and current windows |
| `types.ts` — `TrendDelta` | M-G produces a `TrendDelta`-compatible comparison, but extends it with second-order metrics (acceleration, baseline deviation) |
| `types.ts` — `TrendDirection` | M-G uses the existing `TrendDirection` union (`rising`, `falling`, `flat`, `volatile`) for direction classification |
| `trend-delta.ts` — `compareTrendWindows` | Existing function compares two `TrendWindow` objects. M-G extends this concept to multi-point windows with regression-based trend estimation, not just single-value comparison |
| `trend-velocity.ts` — `calculateTrendVelocity` | Existing function computes velocity from `TrendDelta[]`. M-G computes velocity and acceleration from data point arrays within windows, then compares across windows |
| `trend-velocity.ts` — `classifyMomentumState` | Existing function classifies momentum. M-G produces its own direction classification but uses the same conceptual vocabulary (accelerating, decelerating, stable, reversing) |

M-G is a **higher-order trend analysis** — it compares entire windows against each other, not individual data points. The existing modules handle point-to-point deltas and velocity; M-G handles window-to-window trajectory comparison.

## 7. Future Type Contracts

Conceptual types only. No implementation code.

### 7.1 Input Types

```
TrendBaselineDataPoint {
  timestamp: string          — ISO 8601 date string
  value: number              — observed metric value
  confidence: number         — per-point confidence [0, 1]
}

TrendBaselineWindowConfig {
  minPointsPerWindow: number — minimum data points required per window (default: 3)
  overlapPolicy: 'reject' | 'warn' — behavior when windows overlap
}

TrendBaselineInput {
  previousWindow: TrendBaselineDataPoint[]   — prior trend baseline
  currentWindow: TrendBaselineDataPoint[]    — recent trend data
  windowConfig: TrendBaselineWindowConfig    — validation configuration
  signalType: string                         — label for the metric being compared
  assumptions: string[]                      — stated assumptions for this comparison
  provenance: string                         — source chain identifier
  warnings?: TrendBaselineWarning[]          — optional propagated warnings
}
```

### 7.2 Output Types

```
TrendBaselineDirection = 'accelerating' | 'decelerating' | 'stable' | 'reversing'

TrendBaselineWarning {
  code: string               — machine-readable warning identifier
  message: string            — human-readable description (no certainty language)
  severity: 'info' | 'warn' | 'block'
  field: string              — which input or computation triggered the warning
}

TrendBaselineResult {
  signalType: string                         — echoed from input
  previousTrendSlope: number                 — linear regression slope of prior window
  currentTrendSlope: number                  — linear regression slope of current window
  delta: number                              — difference in slopes (current - previous)
  acceleration: number                       — second derivative: rate of change of the slope change
  direction: TrendBaselineDirection           — classified direction of the trend shift
  reversalIndicator: number                  — heuristic reversal strength [0, 1]; 0 = no reversal signal, 1 = strong reversal signal
  baselineDeviation: number                  — how far the current window's mean deviates from the prior window's projected trajectory
  dataQuality: 'high' | 'moderate' | 'low'  — derived from point count and per-point confidence
  confidence: number                         — overall comparison confidence [0, 1]
  assumptions: string[]                      — preserved from input
  warnings: TrendBaselineWarning[]           — generated + propagated warnings
  provenanceTrail: string[]                  — chain of sources contributing to the result
  advisoryOnly: true                         — hardcoded — output is never canon
  humanReviewRequired: true                  — hardcoded — no autonomous action permitted
}
```

## 8. Future Function Shape

Conceptual signatures only. No implementation code.

| Function | Conceptual Signature | Purpose |
|----------|---------------------|---------|
| `validateBaselineWindows` | `(input: TrendBaselineInput) → { valid: boolean; warnings: TrendBaselineWarning[] }` | Validates that windows are non-overlapping, non-empty, meet minimum point count, and have valid data; emits warnings for violations |
| `computeLinearSlope` | `(points: TrendBaselineDataPoint[]) → number` | Computes the ordinary least squares (OLS) linear regression slope for a set of data points; returns 0 for insufficient data |
| `computeTrendDelta` | `(previousSlope: number, currentSlope: number) → number` | Returns the difference between current and previous slopes: `currentSlope - previousSlope` |
| `computeAcceleration` | `(previousSlope: number, currentSlope: number, previousWindowSpan: number, currentWindowSpan: number) → number` | Computes the second derivative: rate of change of the slope over time, normalized by window spans |
| `classifyBaselineDirection` | `(delta: number, previousSlope: number, currentSlope: number) → TrendBaselineDirection` | Classifies the comparison direction based on slope signs and delta magnitude |
| `computeReversalIndicator` | `(previousSlope: number, currentSlope: number) → number` | Heuristic reversal strength [0, 1] — high when slopes have opposite signs with significant magnitude |
| `computeBaselineDeviation` | `(previousPoints: TrendBaselineDataPoint[], currentPoints: TrendBaselineDataPoint[], previousSlope: number) → number` | Measures how far the current window's mean deviates from where the prior trend's regression line would project |
| `assessDataQuality` | `(points: TrendBaselineDataPoint[], minPoints: number) → { quality: 'high' \| 'moderate' \| 'low'; confidence: number }` | Evaluates data quality based on point count and per-point confidence values |
| `computeOverallConfidence` | `(previousQuality: { quality: string; confidence: number }, currentQuality: { quality: string; confidence: number }) → number` | Combines both windows' data quality into a single comparison confidence score |
| `computeTrendBaselineComparison` | `(input: TrendBaselineInput) → TrendBaselineResult` | Top-level orchestrator: validates windows, computes slopes, derives delta/acceleration/direction/reversal/deviation, assesses quality, assembles full result with provenance |

## 9. Input Requirements

Future trend baseline functions consume:

| Input | Source | Required |
|-------|--------|----------|
| `TrendBaselineInput` | M-G type contract | Yes |
| `previousWindow` | Embedded in `TrendBaselineInput.previousWindow` | Yes |
| `currentWindow` | Embedded in `TrendBaselineInput.currentWindow` | Yes |
| `windowConfig` | Embedded in `TrendBaselineInput.windowConfig` | Yes |
| `signalType` | Embedded in `TrendBaselineInput.signalType` | Yes |
| `assumptions` | Embedded in `TrendBaselineInput.assumptions` | Yes |
| `provenance` | Embedded in `TrendBaselineInput.provenance` | Yes |
| `warnings` | Embedded in `TrendBaselineInput.warnings` | Optional |

## 10. Output Requirements

Future output must satisfy the `TrendBaselineResult` contract:

| Field | Type | Purpose |
|-------|------|---------|
| `signalType` | `string` | Echoed from input — identifies the metric being compared |
| `previousTrendSlope` | `number` | OLS slope of the prior window's data points |
| `currentTrendSlope` | `number` | OLS slope of the current window's data points |
| `delta` | `number` | `currentTrendSlope - previousTrendSlope` — magnitude of slope change |
| `acceleration` | `number` | Second derivative — rate of change of the slope change |
| `direction` | `TrendBaselineDirection` | Classified as `accelerating`, `decelerating`, `stable`, or `reversing` |
| `reversalIndicator` | `number` | Heuristic reversal strength [0, 1] |
| `baselineDeviation` | `number` | Distance from current mean to prior trend's projected value |
| `dataQuality` | `'high' \| 'moderate' \| 'low'` | Derived from point count and per-point confidence |
| `confidence` | `number` | Overall comparison confidence [0, 1] |
| `assumptions` | `string[]` | All assumptions from input preserved |
| `warnings` | `TrendBaselineWarning[]` | Generated and propagated warnings |
| `provenanceTrail` | `string[]` | Chain of sources contributing to the result |
| `advisoryOnly` | `true` (literal) | Hardcoded — output is never canon |
| `humanReviewRequired` | `true` (literal) | Hardcoded — no autonomous action permitted |

## 11. Function Interaction Map

The top-level `computeTrendBaselineComparison` orchestrates the helper functions in this order:

```
computeTrendBaselineComparison(input)
  │
  ├─ 1. validateBaselineWindows(input)
  │     └─ Checks: non-empty, non-overlapping, min point count, valid values
  │
  ├─ 2. computeLinearSlope(input.previousWindow) → previousSlope
  │
  ├─ 3. computeLinearSlope(input.currentWindow) → currentSlope
  │
  ├─ 4. computeTrendDelta(previousSlope, currentSlope) → delta
  │
  ├─ 5. computeAcceleration(previousSlope, currentSlope, prevSpan, currSpan) → acceleration
  │
  ├─ 6. classifyBaselineDirection(delta, previousSlope, currentSlope) → direction
  │
  ├─ 7. computeReversalIndicator(previousSlope, currentSlope) → reversalIndicator
  │
  ├─ 8. computeBaselineDeviation(previousPoints, currentPoints, previousSlope) → deviation
  │
  ├─ 9. assessDataQuality(previousWindow, minPoints) → prevQuality
  │     assessDataQuality(currentWindow, minPoints) → currQuality
  │
  ├─ 10. computeOverallConfidence(prevQuality, currQuality) → confidence
  │
  └─ 11. Assemble TrendBaselineResult
         ├─ advisoryOnly: true (hardcoded)
         ├─ humanReviewRequired: true (hardcoded)
         ├─ provenanceTrail: [input.provenance]
         ├─ warnings: [validation warnings + input warnings]
         └─ dataQuality: min(prevQuality.quality, currQuality.quality)
```

## 12. Mathematical Principles

Future implementation should apply:

1. **Ordinary least squares (OLS) slope** — for a set of `n` data points `(x_i, y_i)`, the slope `m` is:
   `m = (n * sum(x_i * y_i) - sum(x_i) * sum(y_i)) / (n * sum(x_i^2) - (sum(x_i))^2)`
   where `x_i` is the index (or normalized timestamp offset) and `y_i` is the value. This is a closed-form, deterministic computation.

2. **Trend delta** — the change in slope between windows: `delta = currentSlope - previousSlope`. Positive delta means the trend is steepening upward or reversing from downward. Negative delta means the trend is flattening or steepening downward.

3. **Acceleration (second derivative)** — the rate of change of the slope over time:
   `acceleration = (currentSlope - previousSlope) / ((currentWindowMidpoint - previousWindowMidpoint))`
   Normalization by window midpoint separation prevents window size from biasing the acceleration estimate.

4. **Direction classification thresholds** — based on slope signs and delta magnitude:
   - `accelerating`: both slopes positive, delta > 0 (or slope turned from negative to positive with large positive delta)
   - `decelerating`: positive previous slope with delta < 0 (trend is flattening or turning)
   - `stable`: `|delta| < threshold` (e.g., 0.05) — slopes are approximately equal
   - `reversing`: slopes have opposite signs (positive → negative or negative → positive)

5. **Reversal indicator** — heuristic strength of a reversal signal:
   `reversalIndicator = min(1, |previousSlope| * |currentSlope| / (|previousSlope| + |currentSlope|) * sign_factor)`
   where `sign_factor = 2` when slopes have opposite signs, `0` otherwise. Strong reversal requires both slopes to have significant magnitude in opposite directions.

6. **Baseline deviation** — project the previous window's OLS line forward to the current window's midpoint time. The deviation is the difference between the current window's actual mean value and this projected value:
   `deviation = mean(currentValues) - (previousSlope * timeDelta + previousIntercept)`

7. **Data quality assessment** — combine point count and per-point confidence:
   - `high`: `n >= 2 * minPoints` AND mean confidence >= 0.7
   - `moderate`: `n >= minPoints` AND mean confidence >= 0.4
   - `low`: below moderate thresholds

8. **Confidence aggregation** — overall confidence is the geometric mean of both windows' quality confidences, reduced further if either window has `low` quality:
   `overallConfidence = sqrt(prevConfidence * currConfidence) * qualityPenalty`
   where `qualityPenalty = 0.5` if either window is `low`, `0.8` if either is `moderate`, `1.0` if both are `high`.

## 13. Safety Rules

Future implementation must enforce:

| Rule ID | Enforcement |
|---------|-------------|
| `WINDOWS_MUST_NOT_OVERLAP` | `validateBaselineWindows` checks timestamp ranges; emits block-severity warning if windows overlap |
| `MINIMUM_POINTS_REQUIRED` | `validateBaselineWindows` checks point count; emits block-severity warning if below threshold |
| `VALUES_MUST_BE_FINITE` | `validateBaselineWindows` checks for NaN, Infinity, -Infinity; emits block-severity warning |
| `CONFIDENCE_BOUNDED` | Per-point confidence values must be in [0, 1]; clamp and warn if out of bounds |
| `SPARSE_DATA_REDUCES_CONFIDENCE` | `assessDataQuality` reduces confidence when data is sparse |
| `REVERSAL_IS_HEURISTIC` | Reversal indicator is an estimate, not a guaranteed prediction; warning messages must not claim certainty |
| `DIRECTION_IS_MATHEMATICAL` | Direction labels describe slope relationships, not value judgments about outcomes |
| `PROVENANCE_REQUIRED` | `computeTrendBaselineComparison` builds provenance trail from input sources |
| `ADVISORY_ONLY_OUTPUT` | `advisoryOnly: true` hardcoded in every result — not computed, not conditional |
| `HUMAN_REVIEW_REQUIRED` | `humanReviewRequired: true` hardcoded — no downstream action without human approval |
| `NO_CERTAINTY_CLAIMS` | No warning message or output field may use "guaranteed," "certain," "definite," "will happen," or "impossible" |
| `NO_AUTONOMOUS_ACTION` | Pure functions only — no side effects, no network, no filesystem, no state mutation |

## 14. Failure Modes

Risks that future M-G implementation must guard against:

| Failure Mode | Impact | Mitigation |
|--------------|--------|------------|
| Overlapping windows | Comparison is statistically invalid — same data in both windows biases delta toward zero | `validateBaselineWindows` rejects or warns based on `overlapPolicy` |
| Too few data points | OLS slope is unreliable with < 3 points; 1 or 2 points cannot distinguish trend from noise | Minimum point count enforcement; low-confidence label |
| All points have same x-value | OLS denominator is zero — division by zero | Guard: if denominator < epsilon, return slope = 0 and emit warning |
| NaN or Infinity in data | Propagates through all arithmetic | Validate all values are finite before computation |
| Flat windows misclassified | Two flat windows with tiny numerical noise classified as "reversing" | Threshold on `|delta|` for `stable` classification; threshold on slope magnitude for reversal detection |
| Reversal indicator overconfident | High reversal score when data is sparse | Data quality modulates reversal indicator: `reversalIndicator *= qualityConfidence` |
| Window span mismatch | Comparing a 7-day window to a 90-day window produces misleading acceleration | Emit info-severity warning when window spans differ by more than 3x |
| Input mutation | Caller's data corrupted | All functions return new objects; never modify input |
| Provenance dropped | Result lacks audit trail | `computeTrendBaselineComparison` chains all source provenances |
| Certainty language in warnings | Misleading output | Warning text reviewed against forbidden word list |
| Autonomous action triggered | System acts on advisory output | No side effects in any function; pure computation only |
| current.md updated from result | Canon state mutated by advisory output | No filesystem access in any function |
| shell-promoter activated | Promotion logic triggered by comparison result | No shell-promoter imports or references |

## 15. Future Test Requirements

When M-G implementation is authorized, tests must verify:

1. Non-overlapping windows with sufficient data points pass validation with no warnings.
2. Overlapping windows produce block-severity warning when `overlapPolicy` is `'reject'`.
3. Overlapping windows produce warn-severity warning when `overlapPolicy` is `'warn'`.
4. Empty window (0 points) produces block-severity warning.
5. Window below minimum point count produces block-severity warning.
6. `computeLinearSlope` returns correct slope for known linear data (e.g., `[1, 2, 3]` → slope = 1.0).
7. `computeLinearSlope` returns 0 for constant data (e.g., `[5, 5, 5]`).
8. `computeLinearSlope` returns 0 for single-point input.
9. `computeTrendDelta` correctly computes `currentSlope - previousSlope`.
10. `computeAcceleration` correctly computes second derivative normalized by window span.
11. `classifyBaselineDirection` returns `'accelerating'` when both slopes positive and delta > 0.
12. `classifyBaselineDirection` returns `'decelerating'` when positive slope with negative delta.
13. `classifyBaselineDirection` returns `'stable'` when delta magnitude is below threshold.
14. `classifyBaselineDirection` returns `'reversing'` when slopes have opposite signs.
15. `computeReversalIndicator` returns 0 when slopes have same sign.
16. `computeReversalIndicator` returns > 0 when slopes have opposite signs.
17. `computeBaselineDeviation` correctly measures distance from projected trend.
18. `assessDataQuality` returns `'high'` for abundant high-confidence data.
19. `assessDataQuality` returns `'low'` for sparse or low-confidence data.
20. Sparse data produces lower overall confidence than dense data.
21. `advisoryOnly` is always `true` in output.
22. `humanReviewRequired` is always `true` in output.
23. Provenance trail includes input provenance.
24. Assumptions from input are preserved in output.
25. Input warnings are propagated to output.
26. Input object is not mutated — immutability preserved.
27. NaN values in data points produce block-severity warning.
28. Infinity values in data points produce block-severity warning.
29. `computeTrendBaselineComparison` produces correct full result for a known fixture.
30. Same input produces same output across multiple runs (determinism check).
31. No Evidence Router imports in implementation or tests.
32. No Predictability Kernel imports in implementation or tests.
33. No UI/API/DB/filesystem/current.md/shell-promoter references in exports.
34. No certainty language in any warning message.
35. No imports from Stage M-A through M-F implementation files.

## 16. Future Implementation Constraints

Future M-G implementation, if authorized, may create:

| File | Purpose |
|------|---------|
| `ui/lib/oracle/predictability/trend-baseline-types.ts` | Type contracts for trend baseline comparison |
| `ui/lib/oracle/predictability/__tests__/trend-baseline-types.test.ts` | Contract verification tests |
| `ui/lib/oracle/predictability/trend-baseline-comparison.ts` | Pure trend baseline comparison functions |
| `ui/lib/oracle/predictability/__tests__/trend-baseline-comparison.test.ts` | Deterministic TDD tests for comparison functions |

**Allowed imports:**
- `types.ts` (shared predictability types: `TrendDirection`, `TrendWindow`, `TrendDelta`, `SignalScale`)
- `trend-baseline-types.ts` (M-G's own type contracts, once created)

**Forbidden imports:**
- Evidence Router (`evidence-router-adapter-types.ts`, `evidence-router-adapter.ts`)
- Predictability Kernel (`predictability-kernel.ts`)
- Monte Carlo implementation (`monte-carlo-scenarios.ts`)
- Monte Carlo types (`monte-carlo-scenario-types.ts`)
- Bayesian updater (`bayesian-updater-types.ts`, `bayesian-updater.ts`)
- Markov transition implementation (`markov-regime-transitions.ts`)
- Markov transition types (`markov-regime-transition-types.ts`)
- Adapter integration (`adapter-integration.ts`)
- Adapter validation (`adapter-validation.ts`)
- Trend delta (`trend-delta.ts`) — M-G defines its own window comparison logic
- Trend velocity (`trend-velocity.ts`) — M-G defines its own slope/acceleration logic
- UI/API/DB/auth modules
- Filesystem/network modules
- shell-promoter

## 17. Freeze Line

This design specification does not authorize:

- Stage M-G implementation
- Trend baseline comparison code
- Gate E implementation
- Evidence Router wiring
- Predictability Kernel runtime calls
- UI/API/DB/auth wiring
- current.md edits
- Protected source mutation
- shell-promoter activation
- Live prediction claims
- Autonomous forecasting or action
- Any modification to Stage M-A files (`bayesian-updater-types.ts`, `bayesian-updater-types.test.ts`)
- Any modification to Stage M-B files (`bayesian-updater.ts`, `bayesian-updater.test.ts`)
- Any modification to Stage M-C files (`monte-carlo-scenario-types.ts`, `monte-carlo-scenario-types.test.ts`)
- Any modification to Stage M-D files (`monte-carlo-scenarios.ts`, `monte-carlo-scenarios.test.ts`)
- Any modification to Stage M-E files (`markov-regime-transition-types.ts`, `markov-regime-transition-types.test.ts`)
- Any modification to Stage M-F files (`markov-regime-transitions.ts`, `markov-regime-transitions.test.ts`)
