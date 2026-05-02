# Stage M-I Type Contracts Handoff

## Gate Identity

| Field | Value |
|---|---|
| Stage | M-I |
| Name | Calibration Ledger — Type Contracts |
| Classification | type contracts only |
| Spec commit | `a081584` |
| Spec tag | `oracle-predictability-stage-mi-calibration-ledger-spec-locked` |
| Type contracts commit | `2fb0497` |
| Type contracts tag | `oracle-predictability-stage-mi-calibration-ledger-types-locked` |
| Branch | `night-build/2026-04-25` |
| Date | 2026-05-02 |

## What Was Delivered

Two files committed and tagged:

| File | Lines | Purpose |
|---|---|---|
| `ui/lib/oracle/predictability/calibration-ledger-types.ts` | 179 | Type contracts, frozen constants, interfaces |
| `ui/lib/oracle/predictability/__tests__/calibration-ledger-types.test.ts` | 723 | 49 tests — compilation, values, frozen, safety, scope |

## Type Inventory

### Frozen Const Objects (5)

| Constant | Keys | Purpose |
|---|---|---|
| `CALIBRATION_LEDGER_STATUSES` | pending, resolved, expired, invalidated | Entry lifecycle states |
| `CALIBRATION_LEDGER_WARNING_CODES` | 7 codes (INSUFFICIENT_DATA, OVERCONFIDENT, UNDERCONFIDENT, STALE_PENDING, BIN_SPARSITY, UPSTREAM_MISSING, HIGH_SURPRISE) | Warning code constants |
| `CALIBRATION_LEDGER_WARNING_SEVERITIES` | info, warn, block | Warning severity levels |
| `CALIBRATION_OUTCOME_LABELS` | occurred, did_not_occur, ambiguous, not_yet_observed | Observation outcome classification |
| `CALIBRATION_DEFAULT_SAFETY_FLAGS` | advisoryOnly, humanReviewRequired, noActionRecommended | Default safety posture |

### Derived Union Types (2)

- `CalibrationLedgerStatus` — from `CALIBRATION_LEDGER_STATUSES`
- `CalibrationOutcomeLabel` — from `CALIBRATION_OUTCOME_LABELS`

### Interfaces (8)

- `CalibrationLedgerInput` — `{ forecastId, sourceModule, forecastedProbability, confidenceLabel, scenario, evidenceBasis, assumptions, evaluationWindowMs, timestamp }`
- `CalibrationObservation` — `{ forecastId, occurred, observedAt, verificationMethod, humanReviewedBy, notes? }`
- `CalibrationLedgerEntry` — `{ forecastId, sourceModule, forecastedProbability, confidenceLabel, scenario, evidenceBasis, assumptions, evaluationWindowMs, forecastTimestamp, status, occurred, observedAt, verificationMethod, humanReviewedBy, notes, absoluteError, squaredError, surpriseScore }`
- `CalibrationLedgerWarning` — `{ code, message, severity, source }`
- `CalibrationConfidenceAdjustment` — `{ adjustmentFactor, direction, magnitude, basedOnCount, rationale }`
- `CalibrationAuditMetadata` — `{ ledgerVersion, computedAt, resolvedCount, pendingCount, expiredCount, invalidatedCount, totalEntries, oldestEntryTimestamp, newestEntryTimestamp }`
- `CalibrationBucket` — `{ binLower, binUpper, meanPredictedProbability, observedFrequency, count }`
- `CalibrationLedgerResult` — `{ brierScore, expectedCalibrationError, calibrationCurve, overconfidenceDetected, underconfidenceDetected, recommendedAdjustment, totalForecasts, resolvedForecasts, pendingForecasts, minimumCountMet, confidenceAdjustment, warnings, auditMetadata, advisoryOnly, humanReviewRequired, noActionRecommended }`

### Safety Fields

- `advisoryOnly: true` — literal `true` type, compile-time enforced
- `humanReviewRequired: true` — literal `true` type, compile-time enforced
- `noActionRecommended: true` — literal `true` type, compile-time enforced

## Test Coverage Summary

| Describe Block | Tests | What It Verifies |
|---|---|---|
| CALIBRATION_LEDGER_STATUSES | 3 | 4 statuses, exact values, frozen |
| CALIBRATION_LEDGER_WARNING_CODES | 3 | 7 codes, exact values, frozen |
| CALIBRATION_LEDGER_WARNING_SEVERITIES | 3 | 3 severities, exact values, frozen |
| CALIBRATION_OUTCOME_LABELS | 3 | 4 labels, exact values, frozen |
| CALIBRATION_DEFAULT_SAFETY_FLAGS | 3 | All 3 flags true, frozen |
| CalibrationLedgerStatus union type | 2 | Derived union, all members compile |
| CalibrationOutcomeLabel union type | 2 | Derived union, all members compile |
| CalibrationLedgerInput type | 3 | Required fields, confidenceLabel union, readonly arrays |
| CalibrationObservation type | 2 | Required + optional notes field compile |
| CalibrationLedgerEntry type | 4 | Status type, nullable fields, error fields, readonly arrays |
| CalibrationLedgerWarning type | 2 | Code/severity from frozen constants, required fields |
| CalibrationConfidenceAdjustment type | 2 | Direction union, numeric fields |
| CalibrationAuditMetadata type | 2 | Count fields, timestamps |
| CalibrationBucket type | 2 | Bin bounds, frequency, count |
| CalibrationLedgerResult type | 5 | Safety fields literal true, nested types, calibration curve array, all required fields |
| scope boundary checks | 8 | No functions, no forbidden imports, no shell-promoter, no certainty language, no Evidence Router/Kernel, no KEEP_DEFERRED unwiring |

**Total: 49 tests passing**

## Boundaries — What This Gate Does NOT Include

- No implementation functions (no Brier score computation, no ECE calculation, no calibration curve binning)
- No Evidence Router wiring
- No Predictability Kernel runtime calls
- No upstream model integration (Bayesian, Monte Carlo, Markov, Trend, Cycle Phase)
- No UI/API/DB/auth changes
- No shell-promoter activation
- No live prediction claims
- No autonomous forecasting or action

## Dependencies

- No imports from other modules
- No shared type references (self-contained)
- Spec: `docs/PREDICTABILITY_STAGE_MI_CALIBRATION_LEDGER_SPEC.md` (committed at `a081584`)

## Safety Boundaries Verified

| Boundary | Status |
|---|---|
| current.md untouched | yes |
| oracle-memory/sources untouched | yes |
| shell-promoter KEEP_DEFERRED | yes |
| No Gate E implementation | yes |
| No Evidence Router live wiring | yes |
| No Predictability Kernel runtime calls | yes |
| No UI/API/DB/auth | yes |
| No live prediction claims | yes |
| No autonomous forecasting/action | yes |

## Freeze Line

The following are locked and must not change without a new gate authorization:

- `ui/lib/oracle/predictability/calibration-ledger-types.ts` at `2fb0497`
- `ui/lib/oracle/predictability/__tests__/calibration-ledger-types.test.ts` at `2fb0497`
- Tag: `oracle-predictability-stage-mi-calibration-ledger-types-locked`

## Next Gate

**Stage M-I Pure Functions** — implement Brier score computation, ECE calculation, calibration curve binning, confidence adjustment, and ledger entry resolution using these type contracts. Requires explicit authorization.

This is the final model stage in the current Oracle Predictability chain. No further stages are defined beyond M-I.
