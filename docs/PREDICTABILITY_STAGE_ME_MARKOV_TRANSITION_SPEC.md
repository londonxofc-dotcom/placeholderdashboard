# Predictability Model Expansion — Stage M-E Markov Transition Design

## 1. Canon Boundary

- Design/spec only.
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
- No autonomous forecasting/action.

## 2. Stage Position

| Stage | Name | Status |
|-------|------|--------|
| M-A | Bayesian updater type contracts | Complete — locked |
| M-B | Bayesian updater pure functions | Complete — locked |
| M-C | Monte Carlo scenario type contracts | Complete — locked |
| M-D | Deterministic Monte Carlo fixture simulation | Complete — locked |
| M-E | Markov regime transition design | This document — design only |

M-E implementation remains locked until separately authorized. This document defines what M-E would contain, not an instruction to build it.

## 3. Objective

Design how Markov transition modeling should estimate the probability of moving between regimes/states while preserving:

- State definitions — named, finite, exhaustive
- Transition probabilities — bounded, normalized, explicit
- Provenance — every transition matrix must declare its source
- Uncertainty — weak evidence widens distributions, never narrows them
- Advisory-only output — no transition result is canon
- Human review requirement — no autonomous action from transition output

## 4. Markov Philosophy

- Markov models describe transitions between states, not destiny.
- A transition matrix estimates plausible next states given a current state.
- Outputs are probability distributions over future states — not single-point predictions.
- The Markov property means the next state depends only on the current state, not the full history. This is a modeling simplification, not a claim about reality.
- Weak evidence broadens uncertainty in transition probabilities.
- Strong evidence narrows uncertainty but never eliminates it.
- Predictions remain advisory. No transition output may claim a guaranteed outcome.

## 5. Regime / State Model

Future Markov implementation should define these conceptual operational states:

| State | Description |
|-------|-------------|
| `unknown` | Insufficient data to classify current regime |
| `stable` | Metrics within normal range, low volatility |
| `accelerating` | Positive trend with increasing velocity |
| `decelerating` | Positive trend with decreasing velocity |
| `volatile` | High variance, no clear directional trend |
| `recovering` | Transition from negative to positive trend |
| `declining` | Sustained negative trend |
| `breakout` | Rapid positive movement outside historical range |
| `constrained` | Growth limited by identified external factors |
| `quarantined` | State flagged for human review — no automated action permitted |

These are operational/forecast states describing observable metric behavior. They are not psychological diagnoses, personality labels, or value judgments. No state label should be interpreted as describing the character or mental state of any person or entity.

## 6. Transition Matrix Design

Conceptual structure only — no implementation:

- States form rows and columns of a square matrix.
- Each row represents the current state; each column represents a possible next state.
- Each cell `M[i][j]` represents the probability of transitioning from `state_i` to `state_j`.
- Each row must sum to exactly 1.0 (row normalization).
- Each cell value must be bounded in [0, 1].
- Missing transitions default to a low-confidence transfer to the `unknown` state.
- The `quarantined` state cannot produce a strong positive forecast — transitions from `quarantined` must heavily weight `unknown`, `quarantined`, or negative states.
- The `unknown` state distributes probability broadly — it represents maximum uncertainty, not neutrality.

## 7. Input Requirements

Future Markov module should consume:

- `currentState` — the regime the system is currently estimated to occupy
- `candidateStates` — the set of states the system may transition to
- `transitionMatrix` — the probability matrix governing transitions
- `historicalObservations` — prior observed state sequence (for matrix calibration, not for violating the Markov property)
- `sourceTier` — provenance tier of the transition data
- `confidence` — confidence label for the overall assessment
- `provenance` — origin of the transition matrix data
- `timeHorizon` — forecast window
- `assumptions` — explicit assumptions underlying the transition model
- `warnings` — any pre-existing warnings to propagate

## 8. Output Requirements

Future output must include:

- `currentState` — the state the system occupies at forecast time
- `mostLikelyNextState` — the state with highest transition probability
- `nextStateDistribution` — full probability distribution over all candidate states
- `transitionPath` — ordered sequence of states in the most likely trajectory
- `confidenceLabel` — calibrated confidence of the forecast
- `assumptions` — all assumptions used in the transition computation
- `warnings` — generated and propagated warnings
- `provenanceTrail` — chain of sources contributing to the forecast
- `advisoryOnly: true` — hardcoded, always true
- `humanReviewRequired: true` — hardcoded, always true

## 9. Mathematical Principles

- **Markov property:** The probability of transitioning to a future state depends only on the current state, not on the sequence of states that preceded it. Formally: `P(S_{t+1} | S_t, S_{t-1}, ..., S_0) = P(S_{t+1} | S_t)`.
- **Transition matrix:** A square matrix `M` where `M[i][j] = P(S_{t+1} = j | S_t = i)`.
- **Row normalization:** For every row `i`: `sum(M[i][j] for all j) = 1.0`.
- **State probability vector:** A vector `p` where `p[i]` represents the probability of being in state `i`. The next-step distribution is `p' = p * M`.
- **Next-state distribution:** Given current state `i`, the probability distribution over next states is row `i` of `M`.
- **Multi-step transitions:** The probability of being in state `j` after `k` steps from state `i` is given by `M^k[i][j]` (the `(i,j)` entry of `M` raised to the `k`-th power).
- **Absorbing/quarantine states:** A state `q` is absorbing if `M[q][q] = 1.0`. The `quarantined` state should be near-absorbing — high self-transition probability, requiring explicit human intervention to exit.
- **Uncertainty widening:** When confidence is weak, transition probabilities should be pushed toward uniform distribution (maximum entropy), not toward any specific outcome.
- **Confidence calibration:** The spread of the next-state distribution should reflect the quality of the evidence, not the desire for a clear answer.

## 10. Safety Rules

Future implementation must enforce:

- No diagnosis language — states describe metric behavior, not people
- No state-as-destiny claims — a state is a current estimate, not a permanent condition
- No certainty claims — no transition output may use "guaranteed," "certain," "definite," "will happen," or "impossible"
- Row probabilities must sum to 1.0
- All probabilities bounded [0, 1]
- Provenance required on all transition matrices and outputs
- Assumptions must be explicit and included in output
- `advisoryOnly` always `true` — hardcoded
- Human review required before any action based on transition output
- No autonomous action triggered from transition results
- No canon mutation from transition output — transition results do not update `current.md`, protected sources, or any persistent state

## 11. Failure Modes

| Failure | Description |
|---------|-------------|
| Row not normalized | Transition probabilities for a state do not sum to 1.0 — invalid matrix |
| Probability out of bounds | A cell value is below 0 or above 1 — mathematically invalid |
| Quarantined treated as positive | A `quarantined` state produces a strong positive forecast — safety violation |
| State as diagnosis | A state label is interpreted as a psychological diagnosis — framing violation |
| Overconfident transition | Weak evidence produces a narrow, confident transition distribution — calibration failure |
| Provenance dropped | Transition output lacks provenance trail — auditability failure |
| Output stated as certainty | Markov transition result presented as a guaranteed outcome — safety violation |
| Autonomous action triggered | An action is taken automatically based on transition output without human review — autonomy boundary violation |
| current.md updated | Transition result writes to `current.md` — protected source violation |
| Shell-promoter activated | Transition result triggers shell-promoter — boundary violation |

## 12. Future Test Requirements

Future M-E implementation tests (to be written TDD-first when authorized):

1. Transition matrix rows sum to 1.0.
2. All probabilities are bounded [0, 1].
3. Invalid matrix is rejected or normalized with warning.
4. Next-state distribution is deterministic for same input.
5. Multi-step transitions remain bounded.
6. Quarantined/blocked state cannot produce strong positive forecast.
7. Weak confidence widens uncertainty (pushes toward uniform).
8. State labels avoid diagnosis language.
9. Provenance is preserved in output.
10. `advisoryOnly` is always `true`.
11. `humanReviewRequired` is always `true`.
12. No certainty language appears in warnings or output.
13. Input object is not mutated.
14. No Evidence Router imports.
15. No Predictability Kernel imports.
16. No UI/API/DB/filesystem/current.md/shell-promoter references in exports.

## 13. Future Implementation Constraints

Future M-E implementation, if authorized, may create:

- `ui/lib/oracle/predictability/markov-regime-transitions.ts`
- `ui/lib/oracle/predictability/__tests__/markov-regime-transitions.test.ts`

**Allowed imports:**
- Future Markov type contracts only, or local types if M-E combines contracts and pure functions after authorization

**Forbidden imports:**
- Evidence Router
- Predictability Kernel
- Monte Carlo implementation (unless separately authorized)
- Bayesian updater (unless separately authorized)
- `adapter-integration`
- UI/API/DB/auth modules
- Filesystem/network modules
- Shell-promoter

## 14. Acceptance Criteria

M-E implementation can only be accepted if:

- Deterministic tests pass (all 16 future test requirements)
- Full predictability suite passes with no regressions
- Build passes with no type errors
- No existing modules modified unless explicitly authorized
- No Gate E work
- No live prediction claims
- No autonomous action
- No `current.md` or protected source mutation

## 15. Freeze Line

This design does not authorize:
- Stage M-E implementation
- Markov transition code
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
