# Predictability Model Expansion — Stage M-E Handoff

## 1. Stage M-E Status

Stage M-E is complete and committed.
It added Markov regime transition type contracts only.
It did not implement Markov transition functions.
It did not implement Stage M-F.
It did not modify Monte Carlo files.
It did not modify Bayesian files.
It did not modify Predictability Kernel.
It did not implement Gate E.

## 2. Commit

- Commit: `633ec07` feat(predictability): add markov regime transition type contracts

## 3. Files Added

- `ui/lib/oracle/predictability/markov-regime-transition-types.ts`
- `ui/lib/oracle/predictability/__tests__/markov-regime-transition-types.test.ts`

## 4. Type Contracts Added

| Export | Kind | Purpose |
|--------|------|---------|
| `MARKOV_REGIME_STATES` | `as const` object (10 keys) | Enum-like regime state labels: unknown, stable, accelerating, decelerating, volatile, recovering, declining, breakout, constrained, quarantined |
| `MarkovRegimeState` | Union type | Derived from `MARKOV_REGIME_STATES` values |
| `MARKOV_TRANSITION_CONFIDENCES` | `as const` object (4 keys) | Confidence labels: weak, moderate, strong, verified |
| `MarkovTransitionConfidence` | Union type | Derived from `MARKOV_TRANSITION_CONFIDENCES` values |
| `MARKOV_TIME_HORIZONS` | `as const` object (4 keys) | Forecast horizons: short, medium, long, strategic |
| `MarkovTimeHorizon` | Union type | Derived from `MARKOV_TIME_HORIZONS` values |
| `MARKOV_TRANSITION_SEVERITIES` | `as const` object (3 keys) | Warning severities: info, warn, block |
| `MarkovTransitionSeverity` | Union type | Derived from `MARKOV_TRANSITION_SEVERITIES` values |
| `MarkovStateObservation` | Interface | Observed regime state with id, state, observedAt, confidence, sourceTier, provenance, optional tags/notes |
| `MarkovTransitionCell` | Interface | Single cell in transition matrix: fromState, toState, probability, confidence, optional provenance/notes |
| `MarkovTransitionMatrix` | Interface | Full transition matrix: id, states, cells, sourceTier, confidence, assumptions, provenance, optional createdAt/notes |
| `MarkovStateVector` | Interface | Probability distribution over states at a given horizon with confidence, assumptions, warnings, provenance |
| `MarkovTransitionInput` | Interface | Input to future Markov transition computation: currentState, candidateStates, transitionMatrix, observations, horizon, assumptions, sourceTier, confidence, provenance, optional warnings |
| `MarkovTransitionResult` | Interface | Output of future Markov transition computation: currentState, mostLikelyNextState, nextStateDistribution, transitionPath, confidence, assumptions, warnings, provenanceTrail, advisoryOnly (always true), humanReviewRequired (always true) |
| `MarkovTransitionWarning` | Interface | Warning with code, message, severity, optional state/transition/observationId |
| `MarkovContractRule` | Interface | Contract rule with id, description, severity, appliesTo |

## 5. Contract Rules

| Rule ID | Description | Severity |
|---------|-------------|----------|
| `TRANSITION_PROBABILITIES_BOUNDED` | Transition probabilities must stay within [0, 1] | block |
| `MATRIX_ROWS_MUST_NORMALIZE` | Each transition row must sum to 1 | block |
| `STATE_LABELS_ARE_OPERATIONAL` | States are operational forecast states, not diagnoses | block |
| `QUARANTINED_CANNOT_STRONG_POSITIVE` | Quarantined state cannot produce strong positive forecast alone | block |
| `WEAK_CONFIDENCE_WIDENS_UNCERTAINTY` | Weak confidence must widen uncertainty | warn |
| `PROVENANCE_REQUIRED` | Matrix, observations, and result require provenance | block |
| `ADVISORY_ONLY_OUTPUT` | Result remains advisory | block |
| `HUMAN_REVIEW_REQUIRED` | Strategic state transitions require human review | block |
| `NO_CERTAINTY_CLAIMS` | No state transition can be stated as guaranteed | block |
| `NO_AUTONOMOUS_ACTION` | Output cannot trigger autonomous action | block |

## 6. Verification

- Markov type tests: 29/29 passing
- Full predictability suite: 294/294 passing (15 test files)
- Build: clean — no type errors
- Only two M-E files committed
- No implementation functions exported
- No Evidence Router imports
- No Predictability Kernel imports
- No Gate E implementation
- No UI/API/DB/auth
- No `current.md` writes
- No protected source mutation
- Shell-promoter remains KEEP_DEFERRED

## 7. Current Classification

Stage M-E is contract-only.
It defines Markov state/transition vocabulary and safety rules.
It does not calculate state distributions.
It does not normalize transition matrices.
It does not run Markov transitions.
It does not produce forecasts.

## 8. Stage M-F Boundary

Stage M-F remains NOT STARTED.
Stage M-F may later implement pure Markov transition functions only after explicit authorization.
Stage M-F must not be started by this handoff.

## 9. Freeze Line

This handoff does not authorize:
- Stage M-F implementation
- Markov transition functions
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
