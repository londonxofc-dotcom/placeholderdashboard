# Predictability Model Expansion — Stage M-F Markov Functions Design

## 1. Canon Boundary

This document is a **design specification only**. It does not authorize implementation.

- No implementation authorized by this document.
- No Markov transition code.
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
| M-F | Markov pure functions | **DESIGN ONLY** | Pure functions consuming M-E contracts with deterministic fixtures |

Stage M-F implementation remains locked until separately and explicitly authorized.

## 3. Objective

Design how Markov regime transition functions should compute state transition distributions from fixture inputs while preserving:

- **Transition matrix integrity** — rows must normalize to 1.0, probabilities bounded [0, 1]
- **Determinism** — same input produces same output, every time
- **Provenance** — every computation step must preserve and extend provenance chains
- **Uncertainty widening** — weak evidence pushes distributions toward uniform, never toward certainty
- **Quarantine safety** — quarantined states cannot produce strong positive forecasts
- **Advisory-only output** — all transition output is advisory, not canon
- **Human review requirement** — no autonomous action from transition output
- **Immutability** — no input mutation; all functions return new objects

## 4. Function Philosophy

Markov transition functions are **pure computations over probability distributions**. They are not predictors of truth.

Core principles:

1. Functions are **pure** — no side effects, no mutation, no I/O, no network, no filesystem.
2. Functions consume **M-E type contracts only** — no imports from other stages unless explicitly authorized.
3. Output is **deterministic** — same input always produces same output.
4. Transition matrices are **validated before use** — invalid matrices produce warnings, not silent errors.
5. State distributions are **probability vectors** — they must sum to 1.0 and stay bounded in [0, 1].
6. Weak confidence **widens** distributions — it pushes toward uniform (maximum entropy), not toward any specific outcome.
7. Quarantined states are **near-absorbing** — they cannot produce strong positive transitions.
8. All output remains **advisory only** — never canon, never actionable without human review.

## 5. Determinism Requirement

Future implementation must support fully deterministic execution for testing and reproducibility.

Design rules:

1. **No randomness** — Markov transition computations are deterministic matrix operations, not sampling. No `Math.random` needed.
2. **No floating-point tolerance drift** — use a defined epsilon (e.g., 1e-10) for normalization checks, applied consistently across all functions.
3. **Normalization is explicit** — if a row does not sum to 1.0, the function must normalize it and emit a warning, not silently accept or reject.
4. **Tests must be reproducible** — running the same test twice must produce the same result.
5. **Same input = same output** — determinism is non-negotiable for verification.

## 6. Future Function Shape

Conceptual signatures only. No implementation code.

| Function | Conceptual Signature | Purpose |
|----------|---------------------|---------|
| `validateTransitionMatrix` | `(matrix: MarkovTransitionMatrix) → { valid: boolean; warnings: MarkovTransitionWarning[]; normalizedMatrix: MarkovTransitionMatrix }` | Validates row normalization and probability bounds; returns normalized copy with warnings if corrections applied |
| `normalizeMatrixRow` | `(cells: MarkovTransitionCell[], fromState: MarkovRegimeState) → MarkovTransitionCell[]` | Normalizes a single row of transition cells to sum to 1.0; returns new cells |
| `getTransitionRow` | `(matrix: MarkovTransitionMatrix, fromState: MarkovRegimeState) → MarkovTransitionCell[]` | Extracts the transition row for a given source state from the matrix |
| `computeNextStateDistribution` | `(currentState: MarkovRegimeState, matrix: MarkovTransitionMatrix) → Record<string, number>` | Reads the row for `currentState` and returns the probability distribution over next states |
| `applyConfidenceWidening` | `(distribution: Record<string, number>, confidence: MarkovTransitionConfidence) → Record<string, number>` | When confidence is weak, pushes distribution toward uniform (maximum entropy); strong confidence preserves the original distribution |
| `enforceQuarantineConstraint` | `(distribution: Record<string, number>, currentState: MarkovRegimeState) → { distribution: Record<string, number>; warnings: MarkovTransitionWarning[] }` | If current state is quarantined, suppresses strong positive transitions and emits a warning |
| `findMostLikelyNextState` | `(distribution: Record<string, number>) → MarkovRegimeState` | Returns the state with highest probability from a distribution |
| `buildTransitionPath` | `(currentState: MarkovRegimeState, mostLikelyNext: MarkovRegimeState) → MarkovRegimeState[]` | Constructs the ordered transition path from current to most likely next state |
| `computeMarkovTransition` | `(input: MarkovTransitionInput) → MarkovTransitionResult` | Top-level orchestrator: validates matrix, computes distribution, applies widening, enforces quarantine, assembles full result with provenance |

## 7. Input Requirements

Future Markov functions consume:

| Input | Source | Required |
|-------|--------|----------|
| `MarkovTransitionInput` | Stage M-E contract | Yes |
| `currentState` | Embedded in `MarkovTransitionInput.currentState` | Yes |
| `candidateStates` | Embedded in `MarkovTransitionInput.candidateStates` | Yes |
| `transitionMatrix` | Embedded in `MarkovTransitionInput.transitionMatrix` | Yes |
| `observations` | Embedded in `MarkovTransitionInput.observations` | Yes |
| `horizon` | Embedded in `MarkovTransitionInput.horizon` | Yes |
| `assumptions` | Embedded in `MarkovTransitionInput.assumptions` | Yes |
| `sourceTier` | Embedded in `MarkovTransitionInput.sourceTier` | Yes |
| `confidence` | Embedded in `MarkovTransitionInput.confidence` | Yes |
| `provenance` | Embedded in `MarkovTransitionInput.provenance` | Yes |
| `warnings` | Embedded in `MarkovTransitionInput.warnings` | Optional |

## 8. Output Requirements

Future output must satisfy the `MarkovTransitionResult` contract from M-E:

| Field | Type | Purpose |
|-------|------|---------|
| `currentState` | `MarkovRegimeState` | The state the system occupies at computation time |
| `mostLikelyNextState` | `MarkovRegimeState` | The state with highest transition probability |
| `nextStateDistribution` | `Record<string, number>` | Full probability distribution over all candidate states |
| `transitionPath` | `MarkovRegimeState[]` | Ordered sequence of states in the most likely trajectory |
| `confidence` | `MarkovTransitionConfidence` | Calibrated confidence of the computation |
| `assumptions` | `string[]` | All assumptions used in the transition computation |
| `warnings` | `MarkovTransitionWarning[]` | Generated and propagated warnings |
| `provenanceTrail` | `string[]` | Chain of sources contributing to the result |
| `advisoryOnly` | `true` (literal) | Hardcoded — output is never canon |
| `humanReviewRequired` | `true` (literal) | Hardcoded — no autonomous action permitted |

## 9. Function Interaction Map

The top-level `computeMarkovTransition` orchestrates the helper functions in this order:

```
computeMarkovTransition(input)
  │
  ├─ 1. validateTransitionMatrix(input.transitionMatrix)
  │     └─ normalizeMatrixRow() — called per row if normalization needed
  │
  ├─ 2. getTransitionRow(validatedMatrix, input.currentState)
  │
  ├─ 3. computeNextStateDistribution(input.currentState, validatedMatrix)
  │
  ├─ 4. applyConfidenceWidening(distribution, input.confidence)
  │
  ├─ 5. enforceQuarantineConstraint(widenedDistribution, input.currentState)
  │
  ├─ 6. findMostLikelyNextState(constrainedDistribution)
  │
  ├─ 7. buildTransitionPath(input.currentState, mostLikelyNext)
  │
  └─ 8. Assemble MarkovTransitionResult
        ├─ advisoryOnly: true (hardcoded)
        ├─ humanReviewRequired: true (hardcoded)
        ├─ provenanceTrail: [input.provenance, matrix.provenance, ...]
        └─ warnings: [validation warnings + quarantine warnings + input warnings]
```

## 10. Mathematical Principles

Future implementation should apply:

1. **Row normalization** — for every row `i` in the transition matrix: `sum(M[i][j] for all j) = 1.0`. If a row does not sum to 1.0, divide each cell by the row sum and emit a warning.
2. **Probability bounds** — every probability value must satisfy `0 <= p <= 1`. Values outside bounds are clamped and a warning is emitted.
3. **Next-state distribution** — given current state `i`, the probability distribution over next states is row `i` of the validated matrix: `P(next = j | current = i) = M[i][j]`.
4. **Confidence widening (maximum entropy push)** — when confidence is weak, blend the original distribution with the uniform distribution: `p'[j] = alpha * p[j] + (1 - alpha) * (1/N)`, where `alpha` varies by confidence level (e.g., weak: 0.4, moderate: 0.7, strong: 0.9, verified: 1.0) and `N` is the number of candidate states.
5. **Quarantine suppression** — when current state is `quarantined`, cap positive-state probabilities (accelerating, breakout, recovering) and redistribute excess probability to `unknown` and `quarantined`. A "strong positive forecast" means any single positive state exceeding a defined threshold (e.g., 0.3).
6. **Most likely state selection** — `argmax(distribution)`. In case of ties, prefer the state that appears earlier in the `candidateStates` array (deterministic tie-breaking).
7. **Normalization epsilon** — use `1e-10` as the tolerance for row-sum checks. A row sums to 1.0 if `|sum - 1.0| < epsilon`.
8. **Distribution invariant** — after all transformations (widening, quarantine enforcement), the output distribution must still sum to 1.0 within epsilon.

## 11. Safety Rules

Future implementation must enforce every rule from the Stage M-E contract:

| Rule ID | Enforcement |
|---------|-------------|
| `TRANSITION_PROBABILITIES_BOUNDED` | `validateTransitionMatrix` clamps values to [0, 1] and emits warning |
| `MATRIX_ROWS_MUST_NORMALIZE` | `validateTransitionMatrix` normalizes rows and emits warning if correction applied |
| `STATE_LABELS_ARE_OPERATIONAL` | States describe metric behavior — function names and warnings must not use diagnosis language |
| `QUARANTINED_CANNOT_STRONG_POSITIVE` | `enforceQuarantineConstraint` caps positive-state probabilities from quarantined source |
| `WEAK_CONFIDENCE_WIDENS_UNCERTAINTY` | `applyConfidenceWidening` blends toward uniform when confidence is weak |
| `PROVENANCE_REQUIRED` | `computeMarkovTransition` builds provenance trail from all input sources |
| `ADVISORY_ONLY_OUTPUT` | `advisoryOnly: true` hardcoded in every result — not computed, not conditional |
| `HUMAN_REVIEW_REQUIRED` | `humanReviewRequired: true` hardcoded — no downstream action without human approval |
| `NO_CERTAINTY_CLAIMS` | No warning message or output field may use "guaranteed," "certain," "definite," "will happen," or "impossible" |
| `NO_AUTONOMOUS_ACTION` | Pure functions only — no side effects, no network, no filesystem, no state mutation |

## 12. Failure Modes

Risks that future M-F implementation must guard against:

| Failure Mode | Impact | Mitigation |
|--------------|--------|------------|
| Row not normalized | Invalid probability distribution — downstream computations meaningless | `validateTransitionMatrix` normalizes and warns |
| Probability out of bounds | Mathematically invalid distribution | Clamp to [0, 1] and emit warning |
| Quarantined produces strong positive | Safety violation — quarantined state bypasses human review intent | `enforceQuarantineConstraint` caps positive transitions |
| Weak confidence narrows distribution | False precision from insufficient evidence | `applyConfidenceWidening` pushes toward uniform |
| Distribution does not sum to 1.0 after transformations | Invalid output distribution | Re-normalize after widening and quarantine steps |
| Floating-point drift in normalization | Inconsistent results across platforms | Fixed epsilon (1e-10) for all normalization checks |
| Input mutation | Caller's data corrupted | All functions return new objects; never modify input |
| Provenance dropped | Result lacks audit trail | `computeMarkovTransition` chains all source provenances |
| Certainty language in warnings | Misleading output | Warning text reviewed against forbidden word list |
| Tie-breaking nondeterminism | Different runs produce different most-likely states | Deterministic tie-breaking: first in `candidateStates` array wins |
| Missing current state in matrix | No row for the current state — undefined behavior | Emit block-severity warning; default to uniform distribution over candidates |
| Autonomous action triggered | System acts on advisory output | No side effects in any function; pure computation only |
| current.md updated from result | Canon state mutated by advisory output | No filesystem access in any function |
| shell-promoter activated | Promotion logic triggered by transition result | No shell-promoter imports or references |

## 13. Future Test Requirements

When M-F implementation is authorized, tests must verify:

1. Transition matrix with valid rows passes validation with no warnings.
2. Transition matrix with non-normalized rows is corrected and produces normalization warning.
3. Transition matrix with out-of-bounds probabilities is clamped and produces bounds warning.
4. `computeNextStateDistribution` returns the correct row from the matrix.
5. Distribution sums to 1.0 within epsilon after all transformations.
6. Weak confidence widens distribution toward uniform compared to strong confidence.
7. Verified confidence preserves original distribution unchanged.
8. Quarantined state suppresses strong positive transitions.
9. Non-quarantined state passes through `enforceQuarantineConstraint` unchanged.
10. `findMostLikelyNextState` returns the highest-probability state.
11. Ties are broken deterministically (first in `candidateStates` wins).
12. Missing current state in matrix produces block-severity warning and uniform fallback.
13. `advisoryOnly` is always `true` in output.
14. `humanReviewRequired` is always `true` in output.
15. Provenance trail includes input provenance and matrix provenance.
16. Assumptions from input are preserved in output.
17. Input warnings are propagated to output.
18. Input object is not mutated — immutability preserved.
19. No Evidence Router imports in implementation or tests.
20. No Predictability Kernel imports in implementation or tests.
21. No UI/API/DB/filesystem/current.md/shell-promoter references in exports.
22. No certainty language in any warning message.
23. `computeMarkovTransition` produces correct full result for a known fixture.
24. Same input produces same output across multiple runs (determinism check).

## 14. Future Implementation Constraints

Future M-F implementation, if authorized, may create:

| File | Purpose |
|------|---------|
| `ui/lib/oracle/predictability/markov-regime-transitions.ts` | Pure Markov transition functions |
| `ui/lib/oracle/predictability/__tests__/markov-regime-transitions.test.ts` | Deterministic TDD tests for transition functions |

**Allowed imports:**
- `markov-regime-transition-types.ts` only (Stage M-E contracts)

**Forbidden imports:**
- Evidence Router (`evidence-router-adapter-types.ts`, `evidence-router-adapter.ts`)
- Predictability Kernel (`predictability-kernel.ts`)
- Monte Carlo implementation (`monte-carlo-scenarios.ts`) — unless separately authorized
- Monte Carlo types (`monte-carlo-scenario-types.ts`) — unless separately authorized
- Bayesian updater (`bayesian-updater-types.ts`, `bayesian-updater.ts`) — unless separately authorized
- Adapter integration (`adapter-integration.ts`)
- Adapter validation (`adapter-validation.ts`)
- UI/API/DB/auth modules
- Filesystem/network modules
- shell-promoter

## 15. Freeze Line

This design specification does not authorize:

- Stage M-F implementation
- Markov transition code
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
