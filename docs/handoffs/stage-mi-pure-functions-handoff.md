# Stage M-I Pure Functions Handoff

## Scope

Stage M-I implements the Calibration Ledger pure functions — ten exported functions that track forecast accuracy over time using an append-only conceptual ledger. The ledger computes Brier scores, calibration curves, expected calibration error, confidence bias detection, and adjustment factors from resolved forecast entries.

### Exported Functions

1. **`recordForecast(input)`** — Creates a new ledger entry in pending status from a forecast input.
2. **`resolveOutcome(entry, observation)`** — Transitions a pending entry to resolved, computing absolute error, squared error, and surprise score. Requires `humanReviewedBy`.
3. **`expireEntry(entry)`** — Transitions a pending entry to expired.
4. **`invalidateEntry(entry, reason)`** — Transitions a pending entry to invalidated.
5. **`computeBrierScore(entries)`** — Computes Brier score: `BS = (1/N) * sum((fi - oi)^2)` across resolved entries.
6. **`computeCalibrationCurve(entries, binCount?)`** — Computes calibration curve: predicted probability vs observed frequency across configurable bins (default 10).
7. **`computeExpectedCalibrationError(curve)`** — Weighted sum of `|observedFreq - meanPredicted|` per bin.
8. **`detectConfidenceBias(curve)`** — Detects systematic overconfidence or underconfidence from a calibration curve.
9. **`computeAdjustmentFactor(curve)`** — Computes adjustment factor: `observedFrequencyAggregate / meanPredictedProbabilityAggregate`.
10. **`buildAggregateResult(entries, config?)`** — Orchestrates all aggregate metrics into a single `CalibrationLedgerResult` with warnings, confidence adjustment, and audit metadata.

### Internal Helpers

- `assignToBin` — Maps a probability [0,1] to a bin index for the given bin count.
- `computeSurpriseScore` — Information-theoretic surprise: `-log2(p)` clamped to avoid log(0).
- `checkMinimumCount` — Returns whether resolved count meets minimum threshold.
- `filterResolved` — Returns only entries with status `resolved`.

### Entry Status Lifecycle

`pending` -> `resolved` | `expired` | `invalidated` (one-way transitions only)

## Files

| File | Purpose |
|------|---------|
| `ui/lib/oracle/predictability/calibration-ledger.ts` | Pure functions implementation |
| `ui/lib/oracle/predictability/__tests__/calibration-ledger.test.ts` | 105 tests covering all functions |

## M-I Locked Chain

| Artifact | Commit | Tag |
|----------|--------|-----|
| Spec | `a081584` | `oracle-predictability-stage-mi-calibration-ledger-spec-locked` |
| Type contracts | `2fb0497` | `oracle-predictability-stage-mi-calibration-ledger-types-locked` |
| Type-contracts handoff | `4d96e89` | -- |
| Pure functions | `02b9f0c` | `oracle-predictability-stage-mi-calibration-ledger-functions-locked` |

## Tests

- Targeted M-I function tests: **105/105 passed**
- Full suite: **815/815 passed** (35 test files)
- Build: **clean**

## Safety Boundaries

- `current.md` -- untouched
- `~/.claude/oracle-memory/sources/` -- untouched
- `calibration-ledger-types.ts` -- untouched, frozen at `2fb0497`
- `shell-promoter` -- remains `KEEP_DEFERRED`
- Gate E implementation -- not started
- Evidence Router live wiring -- absent
- Predictability Kernel runtime calls -- absent
- Runtime ledger writes -- absent
- Persistence/database/schema/storage -- absent
- UI/API/auth changes -- absent
- Live prediction claims -- absent
- Autonomous forecasting/action -- absent
- All results enforce `advisoryOnly: true`, `humanReviewRequired: true`, `noActionRecommended: true`

## Imports

`calibration-ledger.ts` imports only from `./calibration-ledger-types`. No other imports.

## Freeze Line

- Stage M-I pure functions are **sealed**.
- Model stage chain M-A through M-I is **complete**.
- Gate E (Live Evidence Router consumption) remains **locked**.
- Persistence/database/schema/storage/UI/API/auth remain **locked**.
- No further changes to M-I files without explicit authorization.
