# Predictability Stage M-I: Calibration Ledger — Design Specification

## 1. Canon Boundary

- Spec only.
- No implementation authorized.
- No type contracts authorized.
- No pure functions authorized.
- No test code authorized.
- No Gate E implementation.
- No Evidence Router wiring.
- No Predictability Kernel runtime calls.
- No UI/API/DB/auth.
- No current.md edits.
- No protected source mutation.
- No shell-promoter activation.
- No autonomous forecasting/action.
- No live prediction claims.

## 2. Gate Identity

| Field | Value |
|-------|-------|
| Stage | M-I |
| Name | Calibration Ledger |
| Classification | Design spec only |
| Upstream dependencies | M-A/M-B (Bayesian Updater), M-C/M-D (Monte Carlo Scenarios), M-E/M-F (Markov Regime Transitions), M-G (Trend Baseline Comparison), M-H (Cycle Phase Model) |
| Downstream gates | None authorized. Future type contracts and pure functions require separate authorization. |
| Scope | Documentation. No source code. No tests. No types. |

## 3. Purpose

The Calibration Ledger is a conceptual append-only record that tracks the accuracy of probabilistic forecasts produced by the Predictability system over time. Its purpose is to answer one question: **are the confidence levels the system assigns to its outputs well-calibrated?**

A well-calibrated system produces forecasts where stated confidence matches observed frequency. When the system says "70% confidence," the corresponding outcome should occur approximately 70% of the time across a sufficiently large sample.

The Calibration Ledger does not improve predictions directly. It measures whether the confidence metadata attached to predictions is trustworthy, and produces adjustment signals that upstream modules can consume to correct systematic bias.

### What the Calibration Ledger is

- A diagnostic tool for measuring forecast reliability over time.
- An append-only audit trail of forecast-outcome pairs.
- A source of calibration metrics (Brier score, calibration curves, confidence bin analysis).
- A feedback mechanism that detects overconfidence and underconfidence.
- An internal system component — not user-facing.

### What the Calibration Ledger is not

- Not a prediction engine.
- Not a scoring system for human decisions.
- Not a retroactive judge of past work before the ledger existed.
- Not a trigger for autonomous action.
- Not a source of certainty claims.

## 4. Conceptual Model

The Calibration Ledger operates on a simple lifecycle:

```
Forecast Created → Forecast Recorded → Outcome Observed → Pair Evaluated → Metrics Updated
```

### 4.1 Forecast Recording

When any upstream module produces a probabilistic output (a scenario with a probability band and confidence label), the ledger records the forecast as a **LedgerEntry**. Each entry captures:

- A unique identifier for the forecast.
- The source module that produced it (e.g., `bayesian-updater`, `monte-carlo-scenarios`, `markov-regime-transitions`).
- The forecasted probability (the system's stated belief).
- The confidence label attached to the forecast (`speculative`, `low`, `moderate`, `high`).
- The timestamp of the forecast.
- The evaluation window — the time horizon after which the outcome can be assessed.
- The status of the entry (`pending`, `resolved`, `expired`, `invalidated`).

### 4.2 Outcome Recording

When the evaluation window elapses and an outcome is observed, the ledger records:

- The observed result (binary: did the forecasted scenario occur or not).
- The timestamp of the observation.
- The method of verification (how the outcome was determined).
- Human review confirmation (always required — outcomes are never auto-resolved).

### 4.3 Pair Evaluation

Once a forecast-outcome pair is complete, the ledger computes per-entry metrics:

- **Absolute error**: `|forecasted probability - observed outcome|` where outcome is 0 or 1.
- **Squared error**: `(forecasted probability - observed outcome)^2` — the Brier score component.
- **Surprise score**: How unexpected the outcome was given the forecast.

### 4.4 Aggregate Calibration

Across the full set of resolved pairs, the ledger computes:

- **Brier score** — mean squared error across all resolved forecasts.
- **Calibration curve** — predicted probability vs. observed frequency across confidence bins.
- **Overconfidence flag** — detected when predicted probabilities systematically exceed observed frequencies.
- **Underconfidence flag** — detected when predicted probabilities systematically understate observed frequencies.
- **Recommended adjustment factor** — a scaling coefficient that upstream modules can apply to correct systematic bias.

## 5. Inputs

The Calibration Ledger consumes two categories of input:

### 5.1 Forecast Input

| Field | Type | Description |
|-------|------|-------------|
| `forecastId` | `string` | Unique identifier for this forecast |
| `sourceModule` | `string` | Which upstream module produced the forecast |
| `forecastedProbability` | `number` | The system's stated probability (0–1) |
| `confidenceLabel` | `string` | Qualitative confidence tier: `speculative`, `low`, `moderate`, `high` |
| `scenario` | `string` | Plain-language description of the forecasted outcome |
| `evidenceBasis` | `string[]` | Evidence entries that informed the forecast |
| `assumptions` | `string[]` | Conditions that must hold for the forecast to be valid |
| `evaluationWindowMs` | `number` | Time horizon in milliseconds after which the outcome can be assessed |
| `timestamp` | `number` | When the forecast was created (epoch ms) |

### 5.2 Outcome Input

| Field | Type | Description |
|-------|------|-------------|
| `forecastId` | `string` | Which forecast this outcome resolves |
| `occurred` | `boolean` | Whether the forecasted scenario occurred |
| `observedAt` | `number` | When the outcome was observed (epoch ms) |
| `verificationMethod` | `string` | How the outcome was determined |
| `humanReviewedBy` | `string` | Identifier of the human who confirmed the outcome |
| `notes` | `string` | Optional context about the outcome |

## 6. Outputs

### 6.1 Per-Entry Metrics

| Field | Type | Description |
|-------|------|-------------|
| `forecastId` | `string` | Which forecast this metric evaluates |
| `absoluteError` | `number` | `|forecastedProbability - outcome|` |
| `squaredError` | `number` | `(forecastedProbability - outcome)^2` |
| `surpriseScore` | `number` | Information-theoretic surprise: `-log2(p)` where `p` is the probability assigned to the actual outcome |

### 6.2 Aggregate Metrics

| Field | Type | Description |
|-------|------|-------------|
| `brierScore` | `number` | Mean squared error across all resolved forecasts (0 = perfect, 1 = worst) |
| `calibrationCurve` | `CalibrationBucket[]` | Predicted probability vs. observed frequency per bin |
| `expectedCalibrationError` | `number` | Weighted average absolute difference between predicted and observed frequency across bins |
| `overconfidenceDetected` | `boolean` | `true` if predicted > observed systematically |
| `underconfidenceDetected` | `boolean` | `true` if predicted < observed systematically |
| `recommendedAdjustment` | `number` | Suggested confidence scaling factor (1.0 = no adjustment needed) |
| `totalForecasts` | `number` | Total forecasts recorded |
| `resolvedForecasts` | `number` | Forecasts with observed outcomes |
| `pendingForecasts` | `number` | Forecasts awaiting outcome observation |
| `minimumCountMet` | `boolean` | Whether enough forecasts have been resolved for metrics to be reliable |
| `advisoryOnly` | `true` | Always `true` — calibration data is diagnostic, never prescriptive |
| `humanReviewRequired` | `true` | Always `true` |
| `noActionRecommended` | `true` | Always `true` |

## 7. Ledger Entry Design

A single ledger entry represents the full lifecycle of one forecast:

```
LedgerEntry {
  // Forecast side
  forecastId: string
  sourceModule: string
  forecastedProbability: number        // 0–1
  confidenceLabel: string              // 'speculative' | 'low' | 'moderate' | 'high'
  scenario: string
  evidenceBasis: string[]
  assumptions: string[]
  evaluationWindowMs: number
  forecastTimestamp: number

  // Outcome side (populated when resolved)
  status: string                       // 'pending' | 'resolved' | 'expired' | 'invalidated'
  occurred: boolean | null             // null until resolved
  observedAt: number | null
  verificationMethod: string | null
  humanReviewedBy: string | null
  notes: string | null

  // Computed metrics (populated when resolved)
  absoluteError: number | null
  squaredError: number | null
  surpriseScore: number | null
}
```

### 7.1 Entry Status Lifecycle

```
pending → resolved       (outcome observed and human-confirmed)
pending → expired         (evaluation window elapsed without observation)
pending → invalidated     (assumptions violated before evaluation window elapsed)
```

- `resolved` is the only status that contributes to calibration metrics.
- `expired` entries are recorded but excluded from calibration scoring — they represent incomplete data, not failed forecasts.
- `invalidated` entries are recorded but excluded from calibration scoring — the forecast's preconditions were not met, so evaluating accuracy is meaningless.
- Status transitions are one-way. A resolved entry cannot be un-resolved.

### 7.2 Append-Only Semantics

The ledger is append-only. Entries are never deleted, never modified after resolution, and never retroactively re-scored. The only mutable field before resolution is `status` (which can transition from `pending` to another terminal state). Once an entry reaches a terminal state (`resolved`, `expired`, `invalidated`), it is immutable.

This constraint ensures the ledger functions as a monotonic audit trail. Any analysis can be reproduced by replaying the ledger from the beginning.

## 8. Calibration Concepts

### 8.1 Calibration vs. Accuracy

**Accuracy** asks: did the forecast get the outcome right?
**Calibration** asks: did the forecast's stated confidence match reality across many forecasts?

A system can be accurate on individual predictions but poorly calibrated overall (e.g., assigning 90% confidence to everything, including cases where the true rate is 60%). The Calibration Ledger measures calibration, not accuracy. Accuracy is a property of individual forecasts; calibration is a property of the forecasting system.

### 8.2 Confidence Drift

Over time, a forecasting system's calibration may change. Early forecasts may be well-calibrated, but as the system encounters new domains or edge cases, its confidence assignments may drift. The ledger detects this by computing calibration metrics over rolling windows, not just lifetime aggregates.

### 8.3 Retrospective Validation

The ledger enables retrospective validation: looking back at a set of resolved forecasts and asking whether the system's confidence was justified. This is distinct from retroactive scoring — the ledger only evaluates forecasts that were recorded before their outcomes were known. It never scores past work that was not explicitly entered into the ledger.

### 8.4 Uncertainty Decay

As the evaluation window for a pending forecast elapses, the relevance of the forecast decays. A forecast made 6 months ago about a 1-week horizon that still has no recorded outcome is likely stale. The ledger tracks this decay but does not auto-resolve entries — human review is always required.

### 8.5 Minimum Forecast Count

Calibration metrics are unreliable with small sample sizes. The ledger enforces a minimum resolved forecast count before reporting aggregate metrics. Below this threshold, the ledger reports raw data only and flags that metrics are not yet statistically meaningful.

The exact threshold is a design parameter to be defined at the type-contract stage. Conceptually, it should be large enough that per-bin frequencies in the calibration curve are stable (typically 20–50 resolved forecasts minimum, with more needed for fine-grained bin analysis).

## 9. Mathematical Basis

### 9.1 Brier Score

The Brier score is a proper scoring rule for probabilistic predictions of binary outcomes:

```
BS = (1/N) × Σ(forecasted_probability_i - outcome_i)^2
```

Where `outcome_i` is 1 if the event occurred and 0 if it did not. Range: 0 (perfect) to 1 (worst possible).

Properties:
- Proper scoring rule — minimized when the forecaster reports their true belief.
- Decomposable into reliability (calibration), resolution (ability to distinguish outcomes), and uncertainty (base-rate entropy).
- Penalizes overconfidence and underconfidence equally.

### 9.2 Expected Calibration Error (ECE)

ECE measures the average gap between predicted confidence and observed accuracy across bins:

```
ECE = Σ (n_b / N) × |observed_frequency_b - mean_predicted_probability_b|
```

Where `b` indexes confidence bins, `n_b` is the number of forecasts in bin `b`, and `N` is the total number of resolved forecasts.

### 9.3 Calibration Curve

The calibration curve plots predicted probability (x-axis) against observed frequency (y-axis) across discrete bins. A perfectly calibrated system produces a diagonal line (predicted = observed). Deviations reveal:

- **Above the diagonal**: underconfidence (outcomes occur more often than predicted).
- **Below the diagonal**: overconfidence (outcomes occur less often than predicted).

### 9.4 Confidence Bins

Forecasts are grouped into bins by their stated probability:

```
[0.0, 0.1), [0.1, 0.2), [0.2, 0.3), ..., [0.9, 1.0]
```

Within each bin, the observed frequency of positive outcomes is computed and compared to the bin's mean predicted probability.

### 9.5 Recommended Adjustment Factor

When systematic bias is detected (overconfidence or underconfidence), the ledger computes a scaling factor:

```
adjustment = observed_frequency_aggregate / mean_predicted_probability_aggregate
```

Values > 1.0 indicate the system is underconfident (should increase stated probabilities). Values < 1.0 indicate overconfidence (should decrease stated probabilities). This factor is advisory — upstream modules may choose to apply it, ignore it, or apply a dampened version.

### 9.6 Surprise Score (Information-Theoretic)

For a single forecast-outcome pair:

```
surprise = -log2(p_assigned_to_actual_outcome)
```

Where `p_assigned_to_actual_outcome` is the probability the system assigned to what actually happened. If the system said 90% and the event occurred, surprise is low (`-log2(0.9) ≈ 0.15`). If the system said 10% and the event occurred, surprise is high (`-log2(0.1) ≈ 3.32`).

## 10. Relationship to Existing Stages

### 10.1 Upstream Dependencies

| Stage | Relationship |
|-------|-------------|
| M-A/M-B (Bayesian Updater) | Produces posterior beliefs with confidence. Ledger records these as forecasts and evaluates whether stated confidence matches observed frequency over time. |
| M-C/M-D (Monte Carlo Scenarios) | Produces scenario distributions with percentile bands. Ledger records the probability assigned to specific scenarios and checks calibration of the distribution tails. |
| M-E/M-F (Markov Regime Transitions) | Produces state transition probabilities and next-state forecasts. Ledger records transition predictions and evaluates whether stated transition probabilities match observed transition rates. |
| M-G (Trend Baseline Comparison) | Produces reversal probabilities and directional assessments. Ledger records reversal predictions and evaluates calibration of the reversal probability estimate. |
| M-H (Cycle Phase Model) | Produces phase classifications with confidence and transition risk. Ledger records phase predictions and evaluates whether confidence and timing risk assessments are well-calibrated. |

### 10.2 Downstream Gates

| Gate | Relationship |
|------|-------------|
| M-I type contracts | Not authorized. Requires separate explicit authorization. |
| M-I pure functions | Not authorized. Requires separate explicit authorization. |
| Gate E (Live Evidence Router) | Independent work stream. Calibration Ledger does not require or authorize Gate E. |

### 10.3 Cross-Module Interaction Model

The Calibration Ledger is a **consumer** of upstream forecasts and an **advisor** to upstream modules. It does not modify upstream behavior directly. The interaction model is:

```
Upstream Module → produces forecast → Ledger records it
                                          ↓
                              Outcome observed (human-confirmed)
                                          ↓
                              Ledger computes metrics
                                          ↓
                              Ledger publishes adjustment signal
                                          ↓
                    Upstream Module reads signal (optional, advisory)
```

No upstream module is required to consume calibration signals. The signals are available; consumption is voluntary and must be explicitly wired in a future authorized gate.

## 11. Safety and Anti-Overclaiming Constraints

### 11.1 Mandatory Safety Flags

Every output from the Calibration Ledger must include:

```
advisoryOnly: true
humanReviewRequired: true
noActionRecommended: true
```

No exceptions. No conditional logic. These are constant.

### 11.2 Forbidden Claims

The Calibration Ledger must never produce:

- **Certainty language** — "the system is calibrated," "confidence is correct," "accuracy is proven."
- **Retroactive scoring** — evaluating forecasts that were not recorded in the ledger before their outcomes were known.
- **Autonomous adjustment** — applying calibration corrections to upstream modules without human review.
- **Accuracy guarantees** — claiming that calibration metrics prove the system's predictions are reliable.
- **Diagnosis language** — interpreting calibration results as evidence about the nature or identity of the subject being forecast.
- **Protected trait inference** — using calibration patterns to infer race, gender, sexuality, disability, religion, or political affiliation.
- **Live prediction claims** — presenting calibration data as evidence that the system can make live, real-time predictions.

### 11.3 Hedging Requirements

All calibration outputs must use hedged language:

- "Based on N resolved forecasts, the system appears to be [overconfident/underconfident/well-calibrated] in the [X] confidence range."
- "This assessment is based on limited data and may change as more forecasts are resolved."
- "Calibration metrics are diagnostic tools, not proof of prediction quality."

### 11.4 Human Review Gate

- Outcome recording always requires human confirmation.
- Calibration metrics are internal diagnostics — not surfaced as public-facing scores.
- No calibration result may trigger an automated action.
- The `recommendedAdjustment` factor is advisory — it must be reviewed and approved by a human before any upstream module applies it.

## 12. Non-Goals

The following are explicitly out of scope for the Calibration Ledger:

1. **Improving predictions** — The ledger measures calibration. It does not generate, modify, or improve predictions. Improvement is the responsibility of upstream modules consuming the ledger's advisory signals.

2. **Real-time calibration** — The ledger operates on resolved forecast-outcome pairs. It does not provide real-time confidence adjustments during forecast generation.

3. **Cross-module comparison** — The ledger does not rank modules against each other or declare one more accurate than another. Per-module metrics are available for diagnostic purposes, not for competitive ranking.

4. **Historical backfill** — The ledger is future-only. It does not retroactively score forecasts made before the ledger existed. There is no mechanism to backfill entries.

5. **User-facing dashboards** — Calibration data is internal. UI presentation is a separate concern requiring separate authorization.

6. **Automated confidence correction** — The ledger produces adjustment signals. It never applies them. Automated application would require a separate authorized gate with its own safety review.

7. **Filesystem, API, DB, or auth interaction** — The ledger is a pure computational model. It does not read from or write to persistent storage, network endpoints, or authentication systems.

8. **shell-promoter interaction** — The ledger has no relationship to `shell-promoter`. `shell-promoter` remains `KEEP_DEFERRED`.

## 13. Future Type-Contract Requirements

When M-I type contracts are authorized (separate gate, separate authorization), they must define:

| Type | Purpose |
|------|---------|
| `ForecastInput` | Validated shape for recording a new forecast |
| `OutcomeInput` | Validated shape for recording an observed outcome |
| `LedgerEntry` | Full lifecycle record of a single forecast |
| `LedgerEntryStatus` | Union type: `'pending' \| 'resolved' \| 'expired' \| 'invalidated'` |
| `ConfidenceLabel` | Union type: `'speculative' \| 'low' \| 'moderate' \| 'high'` |
| `PerEntryMetrics` | Computed metrics for a single resolved entry |
| `CalibrationBucket` | Single bin in a calibration curve |
| `AggregateCalibrationResult` | Full calibration output including Brier score, ECE, curve, flags, adjustment |
| `CalibrationSafetyFlags` | Constant safety flags object (`advisoryOnly`, `humanReviewRequired`, `noActionRecommended`) |
| `CalibrationConfig` | Configuration: bin boundaries, minimum forecast count, rolling window size |

All types must be:
- Exported from a single file (`calibration-ledger-types.ts`).
- Importable without side effects.
- Compatible with the safety flag pattern established in M-A through M-H.
- Accompanied by scope-boundary tests verifying no forbidden imports.

## 14. Future Pure-Function Requirements

When M-I pure functions are authorized (separate gate, separate authorization), they must implement:

### 14.1 Exported Functions

| Function | Purpose |
|----------|---------|
| `recordForecast(input)` | Creates a new `LedgerEntry` in `pending` status from a `ForecastInput` |
| `resolveOutcome(entry, outcome)` | Transitions a `pending` entry to `resolved` and computes per-entry metrics |
| `expireEntry(entry)` | Transitions a `pending` entry to `expired` |
| `invalidateEntry(entry, reason)` | Transitions a `pending` entry to `invalidated` |
| `computeBrierScore(entries)` | Computes Brier score across resolved entries |
| `computeCalibrationCurve(entries, config)` | Computes calibration curve with configurable bins |
| `computeExpectedCalibrationError(curve)` | Computes ECE from a calibration curve |
| `detectConfidenceBias(curve)` | Detects overconfidence and underconfidence from a calibration curve |
| `computeAdjustmentFactor(curve)` | Computes the recommended confidence scaling factor |
| `buildAggregateResult(entries, config)` | Orchestrates all aggregate metrics into a single `AggregateCalibrationResult` |

### 14.2 Internal Helpers

| Helper | Purpose |
|--------|---------|
| `assignToBin(probability, binBoundaries)` | Maps a probability to its confidence bin |
| `computeSurpriseScore(forecastedProbability, occurred)` | Computes information-theoretic surprise for a single entry |
| `checkMinimumCount(resolvedCount, config)` | Returns whether enough entries have been resolved for reliable metrics |
| `filterResolved(entries)` | Returns only entries with status `resolved` |

### 14.3 Constraints

- All functions must be pure — no side effects, no I/O, no mutation of arguments.
- All functions must return new objects (immutable update pattern).
- All functions must include safety flags in their output where applicable.
- All functions must be stateless — the ledger state is passed in, not maintained internally.
- The file must import only from `./calibration-ledger-types`. No other imports.

## 15. Test Requirements

When tests are authorized (alongside pure functions, separate gate), they must cover:

### 15.1 Forecast Recording

- `recordForecast` creates a valid `LedgerEntry` with `pending` status.
- `recordForecast` sets `occurred` to `null`, metrics to `null`.
- `recordForecast` preserves all input fields.

### 15.2 Outcome Resolution

- `resolveOutcome` transitions status from `pending` to `resolved`.
- `resolveOutcome` computes correct `absoluteError`, `squaredError`, `surpriseScore`.
- `resolveOutcome` rejects non-pending entries.
- `resolveOutcome` requires `humanReviewedBy` to be non-empty.

### 15.3 Entry Lifecycle

- `expireEntry` transitions `pending` to `expired`.
- `invalidateEntry` transitions `pending` to `invalidated`.
- Terminal states (`resolved`, `expired`, `invalidated`) reject further transitions.

### 15.4 Brier Score

- Brier score is 0.0 for perfect forecasts (all 1.0 predictions that occurred, all 0.0 predictions that did not).
- Brier score is 1.0 for worst-case forecasts (all 1.0 predictions that did not occur).
- Brier score is correctly computed for mixed sets.
- Brier score excludes non-resolved entries.

### 15.5 Calibration Curve

- Calibration curve bins are non-overlapping and cover [0, 1].
- Each bin reports predicted mean and observed frequency.
- Empty bins are reported with zero count.
- Calibration curve with all-correct predictions at 100% produces perfect diagonal point.

### 15.6 Expected Calibration Error

- ECE is 0.0 for perfectly calibrated forecasts.
- ECE increases as predicted and observed diverge.
- ECE correctly weights by bin count.

### 15.7 Confidence Bias Detection

- Overconfidence detected when predicted > observed systematically.
- Underconfidence detected when predicted < observed systematically.
- Neither flag set when calibration is within tolerance.

### 15.8 Adjustment Factor

- Adjustment factor is 1.0 for perfectly calibrated forecasts.
- Adjustment factor > 1.0 for underconfident systems.
- Adjustment factor < 1.0 for overconfident systems.

### 15.9 Minimum Count Gate

- Aggregate metrics report `minimumCountMet: false` when resolved count is below threshold.
- Raw per-entry metrics are still available below the threshold.

### 15.10 Safety

- All outputs include `advisoryOnly: true`, `humanReviewRequired: true`, `noActionRecommended: true`.
- No function writes to filesystem, API, UI, DB, current.md, or shell-promoter.
- No function triggers autonomous action.
- Ledger is future-only — no retroactive scoring mechanism exists.

### 15.11 Scope Boundary

- `calibration-ledger.ts` imports only from `./calibration-ledger-types`.
- No imports from `cycle-analysis.ts`, Evidence Router, Predictability Kernel, or any other module.
- No references to `shell-promoter` or `KEEP_DEFERRED` in production code.

## 16. Failure Modes

### 16.1 Insufficient Data

If the ledger has fewer resolved entries than the minimum count threshold, calibration metrics are unreliable. The ledger must report `minimumCountMet: false` and suppress aggregate metrics or label them as preliminary.

### 16.2 Bin Sparsity

If most forecasts cluster in a narrow probability range (e.g., 0.5–0.7), many calibration curve bins will be empty. The ECE will be dominated by the populated bins. The ledger should report bin counts alongside metrics so consumers can assess coverage.

### 16.3 Outcome Ambiguity

Some outcomes may be ambiguous — the event partially occurred, or occurred in a modified form. The current design uses binary outcomes (`occurred: boolean`). Ambiguous outcomes should be flagged and either resolved through human judgment or excluded (via `invalidateEntry`).

### 16.4 Evaluation Window Mismatch

If evaluation windows are inconsistent across forecasts (e.g., 1 day vs. 6 months), aggregate metrics conflate predictions of different difficulty levels. Future enhancements may segment calibration by evaluation window. The current design records the window but does not segment by it.

### 16.5 Stale Pending Entries

Entries that remain `pending` long past their evaluation window represent unresolved forecasts. The ledger tracks these but does not auto-expire them. A human must decide whether to record an outcome, expire the entry, or invalidate it.

### 16.6 Systematic Correlation

If upstream forecasts are correlated (e.g., multiple forecasts about related events), the Brier score's assumption of independence is violated. The ledger does not currently model correlation. This is a known limitation.

## 17. Acceptance Criteria

The M-I design spec is complete when:

- [ ] All 17 sections are present and substantive.
- [ ] Purpose, inputs, outputs, and ledger entry lifecycle are fully specified.
- [ ] Mathematical basis covers Brier score, ECE, calibration curves, confidence bins, adjustment factor, and surprise score.
- [ ] Relationships to all upstream stages (M-A through M-H) are documented.
- [ ] Safety constraints are explicit: `advisoryOnly`, `humanReviewRequired`, `noActionRecommended` are always `true`.
- [ ] Anti-overclaiming constraints prohibit certainty language, retroactive scoring, autonomous adjustment, and live prediction claims.
- [ ] Non-goals are enumerated: no real-time calibration, no cross-module ranking, no historical backfill, no UI, no filesystem/API/DB/auth, no shell-promoter interaction.
- [ ] Future type-contract requirements list all types with purpose.
- [ ] Future pure-function requirements list all functions and helpers with constraints.
- [ ] Test requirements cover all categories from Section 15.
- [ ] Failure modes are documented with mitigation guidance.
- [ ] No implementation, no type contracts, no test code, no source code.
- [ ] Canon boundary and freeze line are explicit.

## 18. Freeze Line

This specification does not authorize:

- Implementation of any module described above.
- Type contract creation for the Calibration Ledger.
- Pure function implementation for the Calibration Ledger.
- Test code for the Calibration Ledger.
- Gate E implementation.
- Evidence Router wiring.
- Predictability Kernel runtime calls.
- UI/API/DB/auth wiring.
- current.md edits.
- Protected source mutation.
- shell-promoter activation.
- Live prediction claims.
- Autonomous forecasting.
- Autonomous action.

This document is a design reference. Implementation requires a separate, explicit authorization conversation following the gated pattern established in Gates A–E and Stages M-A through M-H.
