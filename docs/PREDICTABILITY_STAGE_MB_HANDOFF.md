# Predictability Stage M-B Handoff

## 1. Status

**Stage M-B: Bayesian Updater Pure Functions — COMPLETE**

All six pure functions implemented, tested (TDD), and committed. No side effects. No filesystem. No API. No UI. No DB. No Evidence Router. No Predictability Kernel imports. Imports only from `bayesian-updater-types.ts`.

## 2. Commit and Tag

- **Commit:** `9c872df` — `feat(predictability): add bayesian updater pure functions`
- **Tag:** `oracle-predictability-stage-mb-bayesian-functions-locked` *(pending — applied after this handoff commit)*
- **Branch:** `night-build/2026-04-25`
- **Parent commit:** `89914f1` — `docs(predictability): capture stage m-a handoff`

## 3. Files Added

| File | Purpose | Lines |
|------|---------|-------|
| `ui/lib/oracle/predictability/bayesian-updater.ts` | Pure Bayesian update functions | 177 |
| `ui/lib/oracle/predictability/__tests__/bayesian-updater.test.ts` | TDD tests for all six functions | 298 |

No existing files were modified. `bayesian-updater-types.ts` and `predictability-kernel.ts` confirmed untouched via empty `git diff`.

## 4. Functions Implemented

| Function | Signature | Purpose |
|----------|-----------|---------|
| `clampProbability` | `(value: number) → BayesianProbability` | Enforces [0, 1] bounds on probability values |
| `normalizeLikelihood` | `(value: number) → number` | Floors to ε (0.0001), caps at 1 − ε (0.9999) — prevents division-by-zero and degenerate certainty |
| `calculateBayesianPosterior` | `(prior, lH, lNotH) → BayesianProbability` | Computes P(H\|E) via Bayes' theorem with normalized inputs |
| `calculateProbabilityDelta` | `(posterior, prior) → number` | Simple difference: posterior − prior |
| `classifyBayesianEvidenceWeight` | `(delta) → 'negligible' \| 'weak' \| 'moderate' \| 'strong'` | Classifies absolute delta magnitude against thresholds |
| `updateBayesianBelief` | `(input: BayesianUpdateInput) → BayesianUpdateResult` | Orchestrates full pipeline: clamp → apply evidence sequentially → detect conflicts → classify → assemble result |

## 5. Mathematical Principle

**Bayes' Theorem:**

```
P(H|E) = P(E|H) × P(H) / [P(E|H) × P(H) + P(E|¬H) × (1 − P(H))]
```

**Sequential application:** Each evidence item's posterior becomes the next item's prior (Markov chain over belief states). This is mathematically equivalent to batch application with the product of all likelihood ratios, but sequential application is more interpretable for audit.

**Likelihood normalization:** ε = 0.0001 prevents degenerate behavior:
- Floor at ε prevents division by zero when P(E|¬H) = 0
- Cap at 1 − ε (0.9999) prevents posterior collapsing to 0 or 1 (no certainty claims)

**Evidence weight thresholds:**
- |Δ| < 0.02 → negligible
- |Δ| < 0.10 → weak
- |Δ| < 0.25 → moderate
- |Δ| ≥ 0.25 → strong

## 6. Safety Rules Enforced at Runtime

| Rule ID | How Enforced |
|---------|-------------|
| PRIOR_MUST_BE_BOUNDED | `clampProbability` on input prior |
| POSTERIOR_MUST_BE_BOUNDED | `clampProbability` on computed posterior |
| EVIDENCE_REQUIRES_PROVENANCE | Consumed from type contract (enforced by `BayesianEvidenceItem.provenance` required field) |
| WEAK_EVIDENCE_CANNOT_FORCE_DECISIVE_UPDATE | `classifyBayesianEvidenceWeight` labels impact; weight visible in result |
| CONFLICTED_EVIDENCE_MUST_WARN | Explicit direction-set check emits `CONFLICTED_EVIDENCE_MUST_WARN` warning |
| SOURCE_TIER_AFFECTS_WEIGHT | Passed through from evidence items (available for future Gate E weighting) |
| ADVISORY_ONLY_OUTPUT | `advisoryOnly: true` hardcoded in every result |
| NO_CERTAINTY_CLAIMS | `normalizeLikelihood` caps at 0.9999; posterior cannot reach 0 or 1 from valid inputs |
| HUMAN_REVIEW_REQUIRED_FOR_STRATEGIC_USE | Enforced by `advisoryOnly: true` — system cannot act on results |
| NO_AUTONOMOUS_ACTION | No side effects in any function; pure computation only |

## 7. Verification

- **Tests:** 28 tests in `bayesian-updater.test.ts` — all passing
- **Full suite:** 339/339 tests passing across 25 test files (no regressions)
- **Build:** `npm run build` — clean (compiled successfully, 0 errors, 0 warnings)
- **No lint errors** in new files
- **Protected files verified untouched:** `bayesian-updater-types.ts`, `predictability-kernel.ts` — empty diff

### Test Coverage Summary

Tests validate:
1. `clampProbability` — values within [0,1] unchanged; negatives clamped to 0; values > 1 clamped to 1
2. `normalizeLikelihood` — values in (0,1) unchanged; zero/negative floored to ε; values ≥ 1 capped to 0.9999
3. `calculateBayesianPosterior` — standard Bayes computation; equal likelihoods return prior unchanged; strong opposing evidence lowers posterior; posterior bounded [0,1]
4. `calculateProbabilityDelta` — positive/negative/zero delta cases
5. `classifyBayesianEvidenceWeight` — all four thresholds; uses absolute value of delta
6. `updateBayesianBelief` — advisoryOnly always true; empty evidence returns prior; supporting evidence increases posterior; opposing evidence decreases posterior; multiple evidence applied sequentially (two items shift more than one); all required result fields present; posterior bounded; conflicting evidence emits warning; explanation non-empty

## 8. Current Classification

- **Stage:** M-B (second stage of Model Expansion)
- **Type:** Pure stateless functions — no side effects, no external dependencies
- **Pattern:** Matches Gates A–E gated adapter chain + Stage M-A type contracts
- **Imports:** Only from `bayesian-updater-types.ts` (type-only imports at runtime)

## 9. Stage M-C Boundary

Stage M-C (Evidence Router → Bayesian Updater Integration) is **NOT AUTHORIZED** until this handoff is acknowledged and M-C is explicitly authorized.

Stage M-C scope (when authorized):
- Wire Evidence Router output into `updateBayesianBelief` input
- Adapter/bridge functions that transform Evidence Router format → `BayesianUpdateInput`
- Integration tests proving end-to-end evidence → posterior pipeline
- No Predictability Kernel runtime calls
- No UI/API/DB/auth
- No autonomous action or live prediction

Expected M-C functions (spec reference only — not authorized):
- Evidence-to-BayesianInput adapter
- Integration test fixtures
- Error handling for malformed evidence

## 10. Freeze Line

This handoff does not authorize:

- Gate E implementation
- Evidence Router → Bayesian Updater wiring (Stage M-C)
- Predictability Kernel runtime calls
- UI/API/DB/auth wiring
- current.md edits
- Protected source mutation
- shell-promoter activation
- Live prediction claims
- Autonomous forecasting or action
- Any modification to files committed under this tag
- Any modification to Stage M-A files (`bayesian-updater-types.ts`, `bayesian-updater-types.test.ts`)
