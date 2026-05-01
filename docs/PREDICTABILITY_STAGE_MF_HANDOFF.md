# Predictability Model Expansion — Stage M-F Handoff

## 1. Stage M-F Status

Stage M-F is complete and committed.
It implements pure Markov regime transition functions.
It does not implement Stage M-G.
It does not modify Predictability Kernel.
It does not implement Gate E.
It does not wire Evidence Router.
It does not add UI/API/DB/auth.
It does not modify Monte Carlo files.
It does not modify Bayesian files.
It does not modify Markov type files.

## 2. Commit

- Commit: `6ad30fa` feat(predictability): add markov regime transition functions

## 3. Files Added

- `ui/lib/oracle/predictability/markov-regime-transitions.ts`
- `ui/lib/oracle/predictability/__tests__/markov-regime-transitions.test.ts`

## 4. Functions Implemented

| Function | Purpose |
|----------|---------|
| `validateTransitionMatrix` | Validates row normalization and probability bounds; clamps out-of-bounds values; normalizes rows; returns normalized copy with warnings |
| `normalizeMatrixRow` | Normalizes a single row of transition cells to sum to 1.0; returns new cells without mutating input |
| `getTransitionRow` | Extracts the transition row for a given source state from the matrix |
| `computeNextStateDistribution` | Reads the row for current state and returns probability distribution over next states; uniform fallback for missing state |
| `applyConfidenceWidening` | When confidence is weak, pushes distribution toward uniform (maximum entropy); strong/verified confidence preserves original distribution |
| `enforceQuarantineConstraint` | If current state is quarantined, caps positive-state probabilities at 0.3 and redistributes excess; emits warning |
| `findMostLikelyNextState` | Returns the state with highest probability; deterministic tie-breaking (first key wins) |
| `buildTransitionPath` | Constructs ordered transition path from current to most likely next state |
| `computeMarkovTransition` | Top-level orchestrator: validates matrix, computes distribution, applies widening, enforces quarantine, assembles full result with provenance |

## 5. Mathematical / Statistical Behavior

- Discrete-time Markov transition over 10 regime states
- Next-state probability distribution extracted from current state row: `P(next=j | current=i) = M[i][j]`
- Row normalization preserves probability simplex: `sum(p_i) = 1.0` within epsilon `1e-10`
- Confidence widening via convex blend with uniform distribution: `p'[j] = alpha * p[j] + (1 - alpha) * (1/N)` where alpha varies by confidence level (weak: 0.4, moderate: 0.7, strong: 0.9, verified: 1.0)
- Quarantine constraint caps positive-state probabilities (accelerating, breakout, recovering) at 0.3 threshold; excess redistributed to non-positive states
- Argmax selects most likely next state with deterministic tie-breaking (first key in iteration order wins)
- Deterministic pure function pipeline — same input always produces same output
- All functions return new objects — input objects are never mutated

## 6. Safety Rules Enforced

| Rule | Enforcement |
|------|-------------|
| Probabilities bounded [0, 1] | `validateTransitionMatrix` clamps and emits block-severity warning |
| Rows normalize to 1 | `validateTransitionMatrix` normalizes and emits block-severity warning |
| Invalid probabilities warn/block | Warnings emitted with specific codes for each violation type |
| Missing rows warn | `computeMarkovTransition` emits block-severity warning and falls back to uniform distribution |
| Quarantined state cannot produce strong positive result | `enforceQuarantineConstraint` caps positive states at 0.3 |
| Weak confidence widens uncertainty | `applyConfidenceWidening` blends toward uniform when confidence is weak |
| `advisoryOnly` always `true` | Hardcoded in `computeMarkovTransition` result — not computed, not conditional |
| `humanReviewRequired` always `true` | Hardcoded in `computeMarkovTransition` result — not computed, not conditional |
| No diagnosis language | State labels are operational forecast states only |
| No certainty claims | No warning message uses "guaranteed," "certain," "definite," "will happen," or "impossible" |
| No autonomous action | Pure functions only — no side effects, no network, no filesystem, no state mutation |
| No `current.md` writes | No filesystem access in any function |
| No protected source mutation | No imports from protected stages |
| No shell-promoter activation | No shell-promoter imports or references |
| No Evidence Router imports | Only import is `markov-regime-transition-types.ts` (Stage M-E contracts) |
| No Predictability Kernel imports | No Predictability Kernel references in implementation or tests |
| No UI/API/DB/auth | No UI, API, database, or authentication code |

## 7. Verification

- Markov function tests: 35/35 passing
- Full predictability suite: 329/329 passing (16 test files)
- Build: clean — no type errors
- Only two M-F files committed
- `next-env.d.ts` restored before commit (build churn)
- Log files remain uncommitted
- `PHASE_3_IMPLEMENTATION_PLAN.md` remains untracked
- No Evidence Router imports in implementation or tests
- No Predictability Kernel imports in implementation or tests
- No UI/API/DB/filesystem/shell-promoter references in exports
- No certainty language in any warning message
- Shell-promoter remains KEEP_DEFERRED

## 8. Current Classification

Stage M-F is local, deterministic, pure Markov transition logic.
It does not consume live Evidence Router output.
It does not call the Predictability Kernel.
It does not produce live prediction claims.
It does not write canon.
It does not take autonomous action.

All output is advisory only. All output requires human review.

## 9. Stage M-G Boundary

Stage M-G remains NOT STARTED.
Stage M-G may later define trend baseline comparison only after explicit authorization.
Stage M-G must not be started by this handoff.

## 10. Freeze Line

This handoff does not authorize:
- Stage M-G implementation
- Trend baseline comparison
- Gate E implementation
- Evidence Router wiring
- Predictability Kernel runtime calls
- UI/API/DB/auth wiring
- `current.md` edits
- Protected source mutation
- Shell-promoter activation
- Live prediction claims
- Autonomous forecasting
- Autonomous action
- Any modification to Stage M-A files (`bayesian-updater-types.ts`, `bayesian-updater.ts`)
- Any modification to Stage M-B files (`bayesian-updater.ts`, `bayesian-updater.test.ts`)
- Any modification to Stage M-C files (`monte-carlo-scenario-types.ts`, `monte-carlo-scenario-types.test.ts`)
- Any modification to Stage M-D files (`monte-carlo-scenarios.ts`, `monte-carlo-scenarios.test.ts`)
- Any modification to Stage M-E files (`markov-regime-transition-types.ts`, `markov-regime-transition-types.test.ts`)
- Any modification to Stage M-F files (`markov-regime-transitions.ts`, `markov-regime-transitions.test.ts`)
