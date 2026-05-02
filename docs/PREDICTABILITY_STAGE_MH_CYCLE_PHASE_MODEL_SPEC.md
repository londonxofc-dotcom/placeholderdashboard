# Predictability Model Expansion — Stage M-H Cycle Phase Model Design

## 1. Canon Boundary

This document is a **design specification only**. It does not authorize implementation.

- No implementation authorized by this document.
- No cycle phase model code.
- No type contracts.
- No pure functions.
- No test files.
- No Predictability Kernel integration.
- No Gate E implementation.
- No Evidence Router wiring.
- No UI/API/DB/auth.
- No current.md edits.
- No protected source mutation.
- No shell-promoter activation.
- No live prediction claims.
- No autonomous forecasting or action.

## 2. Gate Identity

| Field | Value |
|---|---|
| Stage | M-H |
| Name | Cycle Phase Model |
| Classification | design spec only |
| Branch | `night-build/2026-04-25` |

### Upstream Dependencies

| Stage | Name | Status |
|---|---|---|
| M-A | Bayesian updater type contracts | Complete — locked |
| M-B | Bayesian updater pure functions | Complete — locked |
| M-C | Monte Carlo scenario type contracts | Complete — locked |
| M-D | Deterministic Monte Carlo fixture simulation | Complete — locked |
| M-E | Markov regime transition contracts | Complete — locked |
| M-F | Markov regime transition functions | Complete — locked |
| M-G | Trend baseline comparison (spec, types, functions, handoffs) | Complete — locked |

### Downstream Gates

| Gate | Name | Status |
|---|---|---|
| M-H type contracts | Cycle phase model type contracts | Locked — requires separate authorization |
| M-H pure functions | Cycle phase model pure functions | Locked — requires separate authorization |
| M-H handoff | Cycle phase model handoff | Locked — requires separate authorization |
| M-I | Calibration ledger spec | Locked — requires separate authorization |

## 3. Purpose

Define how the Cycle Phase Model should classify a signal or regime trajectory into discrete cycle phases based on converging evidence from upstream model stages (M-A through M-G).

The model is **advisory-only**. It does not predict the future. It does not generate autonomous actions. It does not produce certainty claims. It synthesizes upstream model outputs into a phase classification that a human reviewer can use as one input among many when making decisions.

The Cycle Phase Model answers a single question:

> Given the current trend direction, regime transition probabilities, scenario dispersion, and Bayesian posterior state — what phase of a recurring cycle does this signal most likely occupy?

The answer is always provisional, always accompanied by confidence bounds, and always marked as requiring human review.

## 4. Conceptual Model

### Cycle Phases

The model classifies signals into one of six discrete phases:

| Phase | Description | Characteristic Pattern |
|---|---|---|
| `accumulation` | Evidence of building momentum before a directional move | Low slope, narrowing scenario bands, regime stability |
| `expansion` | Active directional movement with increasing confidence | Positive slope acceleration, high regime confidence, expanding momentum |
| `distribution` | Momentum exhaustion at a local extreme | Decelerating slope, widening scenario bands, early reversal indicators |
| `contraction` | Active directional movement in the opposite direction | Negative slope acceleration, regime transition in progress, shrinking metrics |
| `recovery` | Stabilization after contraction, before new accumulation | Flattening slope, regime settling, decreasing volatility |
| `uncertain` | Insufficient evidence or conflicting signals prevent classification | Low confidence, high warning count, model disagreement |

### Phase Ordering

Phases form a conceptual cycle: `accumulation → expansion → distribution → contraction → recovery → accumulation`. However, this ordering is **not enforced**. Real-world signals may skip phases, reverse, stall, or oscillate. The model classifies based on current evidence, not based on expected sequence.

The `uncertain` phase is not part of the cycle. It is an escape valve that fires when evidence is insufficient or contradictory. A system that never classifies `uncertain` is overconfident.

### Naming Convention

Phase names use neutral economic/systems terminology rather than domain-specific language (no "bull"/"bear", no "hot"/"cold"). This keeps the model applicable across signal types — engagement metrics, release performance, booking patterns, audience growth — without importing assumptions from any single domain.

## 5. Inputs

The Cycle Phase Model consumes outputs from upstream model stages. These are described here as future type-contract inputs — not implemented.

### Primary Input Sources

| Source | Stage | Key Fields Consumed |
|---|---|---|
| Trend baseline comparison | M-G | `direction`, `delta`, `acceleration`, `reversalIndicator`, `baselineDeviation`, `confidence`, `dataQuality` |
| Markov regime transition | M-F | `currentStateVector`, `transitionMatrix`, `dominantState`, `stateStability`, `confidence` |
| Monte Carlo scenario summary | M-D | `scenarioDispersion`, `tailRiskMetrics`, `medianOutcome`, `confidenceInterval`, `uncertaintyBand` |
| Bayesian posterior update | M-B | `posterior`, `priorToPosterioDelta`, `beliefStrength`, `updateMagnitude`, `confidence` |

### Metadata Inputs

| Field | Purpose |
|---|---|
| `signalType` | Identifies what is being classified (e.g., "engagement", "streams", "bookings") |
| `assumptions` | Inherited assumptions from upstream models |
| `warnings` | Aggregated warnings from all upstream stages |
| `provenanceTrail` | Full provenance chain from all contributing models |
| `windowConfig` | Time window parameters used in upstream computations |

### Input Quality Requirements

- All upstream results must include `advisoryOnly: true` and `humanReviewRequired: true`.
- If any upstream result is missing, the model must classify as `uncertain` with a specific warning code.
- If any upstream confidence is below a minimum threshold, the model must apply a confidence penalty.
- Stale upstream evidence (beyond a configurable staleness window) must trigger a warning.

## 6. Outputs

The Cycle Phase Model produces a single result object. Described here as a future type contract — not implemented.

### Result Fields

| Field | Type | Purpose |
|---|---|---|
| `phase` | CyclePhase | The classified phase (`accumulation`, `expansion`, `distribution`, `contraction`, `recovery`, `uncertain`) |
| `confidence` | number | Overall classification confidence [0, 1] |
| `phaseScores` | Record<CyclePhase, number> | Score for each candidate phase — shows how close the runner-up phases are |
| `dominantSignals` | string[] | Which upstream signals most influenced the classification |
| `transitionRisk` | number | Estimated probability that the phase will change in the next observation window [0, 1] |
| `ambiguityScore` | number | How close the top two phase scores are — high ambiguity triggers `uncertain` |
| `warnings` | CyclePhaseWarning[] | Aggregated and generated warnings |
| `evidenceSummary` | string | Human-readable summary of the evidence supporting the classification |
| `assumptions` | string[] | All assumptions inherited and added |
| `provenanceTrail` | string[] | Full provenance chain |
| `advisoryOnly` | true | Literal `true` — compile-time enforced |
| `humanReviewRequired` | true | Literal `true` — compile-time enforced |
| `noActionRecommended` | true | Literal `true` — the model never recommends action |

### Safety Fields

Three literal `true` fields enforce non-autonomy at the type level:

- `advisoryOnly: true` — this output is informational only.
- `humanReviewRequired: true` — a human must review before any decision.
- `noActionRecommended: true` — the model explicitly does not recommend action.

These are not runtime flags that can be toggled. They are literal types that cannot compile as `false`.

## 7. Phase Classification Logic

This section describes the intended future classification logic. No code. No runtime execution.

### Multi-Model Evidence Fusion

Phase classification is not a single-model decision. It fuses evidence from four upstream model families:

1. **Trend signal** (M-G): Is the trend accelerating, decelerating, stable, or reversing?
2. **Regime signal** (M-F): Is the regime stable, transitioning, or uncertain?
3. **Scenario signal** (M-D): Are simulated futures converging or dispersing?
4. **Belief signal** (M-B): Is the Bayesian posterior strengthening, weakening, or shifting?

### Phase-Evidence Mapping

Each phase has a characteristic evidence signature:

| Phase | Trend Direction | Slope/Acceleration | Regime State | Scenario Dispersion | Bayesian Posterior |
|---|---|---|---|---|---|
| `accumulation` | stable | near-zero slope, low acceleration | stable or settling | narrowing | strengthening prior |
| `expansion` | accelerating | positive and increasing | high confidence in current state | narrow, trending | strong posterior, large update magnitude |
| `distribution` | decelerating | positive but decreasing | early transition signals | widening | weakening posterior |
| `contraction` | accelerating (negative) or reversing | negative and increasing magnitude | active transition | wide, diverging | shifting posterior, high delta |
| `recovery` | decelerating (negative) | negative but decreasing magnitude | settling into new state | narrowing from wide | stabilizing posterior |
| `uncertain` | any | any | any | any | any — triggered by low confidence or model disagreement |

### Scoring Mechanism

For each candidate phase, compute a score based on how well the current evidence matches the characteristic signature. The classification is the phase with the highest score, subject to:

- **Minimum confidence threshold**: If the best score is below a threshold, classify as `uncertain`.
- **Ambiguity threshold**: If the top two scores are within a configurable margin, classify as `uncertain`.
- **Warning severity escalation**: If any upstream warning has `block` severity, classify as `uncertain`.

### Confidence Computation

Overall confidence is the product of:

1. **Phase score confidence** — how strongly the evidence matches the winning phase.
2. **Upstream confidence penalty** — geometric mean of all upstream confidence values.
3. **Data quality penalty** — lowest upstream data quality tier applies a multiplier (high: 1.0, moderate: 0.8, low: 0.5).
4. **Warning penalty** — each warning above a threshold reduces confidence by a configurable factor.
5. **Staleness penalty** — if upstream evidence exceeds a freshness window, confidence decays.

### Transition Risk

Transition risk estimates how likely the phase classification is to change in the next observation window. Computed from:

- Regime transition probability from M-F (high transition probability = high phase transition risk).
- Trend reversal indicator from M-G (high reversal = high transition risk).
- Scenario dispersion from M-D (wide dispersion = high uncertainty about stability).
- Ambiguity score (high ambiguity = already near a phase boundary).

## 8. Mathematical Basis

### Phase-Space Interpretation

The Cycle Phase Model operates in a multi-dimensional phase space where each axis represents an upstream model output:

- Axis 1: Trend slope and acceleration (from M-G)
- Axis 2: Regime transition probability (from M-F)
- Axis 3: Scenario dispersion (from M-D)
- Axis 4: Bayesian posterior strength (from M-B)

Each cycle phase occupies a characteristic region in this phase space. Classification is the problem of determining which region the current state vector falls into.

### Cyclical Systems

The phase model draws on the mathematical concept of limit cycles — closed trajectories in phase space that a system tends to return to. Real-world signals rarely follow perfect limit cycles, but many exhibit quasi-periodic behavior where the system revisits similar regions of phase space over time.

The model does not assume periodicity. It detects phase-space position and lets the human reviewer determine whether cyclical behavior is present.

### State Transitions and Hysteresis

Phase transitions exhibit hysteresis — the evidence required to transition into a phase is different from the evidence required to remain in it. This prevents oscillation at phase boundaries.

Design-level concept:

- **Entry threshold**: The score required to classify into a new phase (higher).
- **Retention threshold**: The score required to remain in the current phase (lower).
- **Hysteresis band**: The gap between entry and retention thresholds.

Without hysteresis, a signal near a phase boundary would oscillate between phases on every observation, producing noise rather than signal. The hysteresis band creates a "sticky" region where the current phase is maintained unless evidence strongly favors a different classification.

### Uncertainty Penalties

Confidence bounds are computed using a multiplicative penalty chain:

```
confidence = phaseScore × upstreamConfidence × qualityPenalty × warningPenalty × stalenessPenalty
```

Each penalty is in [0, 1]. The product can only decrease confidence, never inflate it. This ensures that uncertainty from any source propagates through to the final classification.

### Confidence Bounds

The model does not produce point estimates of phase membership. It produces a score distribution across all phases. The confidence bound is the gap between the winning phase score and the runner-up:

```
ambiguity = 1 - (topScore - runnerUpScore) / topScore
```

When ambiguity approaches 1, the classification is essentially a coin flip and should be reported as `uncertain`.

## 9. Safety and Anti-Overclaiming

### Explicit Safety Statements

1. **The model does not predict the future.** It classifies the current state based on historical and recent evidence. Phase classification describes where the signal appears to be now, not where it will go.

2. **The model does not make live claims.** All outputs are advisory. No output is presented as fact, certainty, or recommendation.

3. **The model does not trigger autonomous actions.** The `noActionRecommended: true` field is a literal type. No downstream system may use a cycle phase classification to trigger an automated action without explicit human authorization.

4. **The model does not call external systems.** All computation is pure — no I/O, no network, no filesystem, no database, no API calls.

5. **The model is advisory-only.** The `advisoryOnly: true` field is a literal type. It cannot be set to `false` at compile time.

6. **Human review is mandatory.** The `humanReviewRequired: true` field is a literal type. Every classification must be reviewed by a human before informing any decision.

7. **The `uncertain` phase exists specifically to prevent overclaiming.** When evidence is insufficient, the model must say so rather than force a classification.

### Anti-Overclaiming Guardrails

- No output field uses language like "prediction", "forecast", "will", "should", or "recommend".
- Evidence summaries use hedged language: "consistent with", "suggests", "appears to be".
- Phase names are descriptive of observed state, not prescriptive of future action.
- Confidence values are always penalized, never inflated.

## 10. Relationship to Existing Stages

### Direct Dependencies

| Stage | Relationship to M-H |
|---|---|
| M-A (Bayesian updater contracts) | Defines the type vocabulary for Bayesian posterior inputs that M-H will consume |
| M-B (Bayesian pure functions) | Produces `BayesianUpdateResult` with posterior, delta, belief strength — consumed by M-H as belief signal |
| M-C (Monte Carlo contracts) | Defines the type vocabulary for scenario summary inputs that M-H will consume |
| M-D (Monte Carlo fixtures) | Produces `MonteCarloScenarioResult` with dispersion, tail risk, uncertainty bands — consumed by M-H as scenario signal |
| M-E (Markov contracts) | Defines the type vocabulary for regime transition inputs that M-H will consume |
| M-F (Markov functions) | Produces `MarkovTransitionResult` with state vectors, transition matrix, stability — consumed by M-H as regime signal |
| M-G (Trend baseline) | Produces `TrendBaselineResult` with slope, delta, acceleration, direction, reversal — consumed by M-H as trend signal |

### Independence from Stage P

The existing `cycle-analysis.ts` (committed at `3dd7a54`) is Stage P work — a standalone cycle analysis module predating the M-series model expansion chain. M-H does not import from it, extend it, or replace it. They are architecturally independent:

- `cycle-analysis.ts` (Stage P): Identifies periodic patterns at configurable windows.
- Cycle Phase Model (M-H): Classifies multi-model evidence into discrete cycle phases.

The two modules may eventually be composed, but that composition is not designed, authorized, or implied by this spec.

### No Cross-Stage Runtime Dependencies

M-H consumes upstream results as data — it does not import or call upstream functions at runtime. The upstream stages produce results independently; M-H receives those results as input parameters, not as function calls.

## 11. Non-Goals

The following are explicitly out of scope for M-H and must not be implemented, implied, or designed into downstream gates:

| Non-Goal | Reason |
|---|---|
| Gate E implementation | Requires separate authorization |
| Evidence Router wiring | Requires separate authorization |
| Predictability Kernel runtime calls | Requires separate authorization |
| UI/API/DB/auth changes | Outside model scope |
| Autonomous forecasting | Violates advisory-only constraint |
| Live prediction claims | Violates anti-overclaiming guardrails |
| Source mutation | All functions are pure and immutable |
| shell-promoter activation | Remains KEEP_DEFERRED |
| Modification of `cycle-analysis.ts` | Stage P work — architecturally independent |
| Importing from `cycle-analysis.ts` | Stage P work — no cross-dependency |
| Phase sequence enforcement | Real signals skip, reverse, and stall |
| Domain-specific phase naming | Phases use neutral systems terminology |
| Action recommendations | `noActionRecommended: true` is a literal type |

## 12. Future Type-Contract Requirements

The following types are expected for the M-H type contracts gate. They are listed here for planning purposes only — not created, not implemented.

| Type Name | Kind | Purpose |
|---|---|---|
| `CyclePhase` | Union type | `'accumulation' \| 'expansion' \| 'distribution' \| 'contraction' \| 'recovery' \| 'uncertain'` |
| `CyclePhaseInput` | Interface | Aggregated upstream model results + metadata |
| `CyclePhaseResult` | Interface | Phase classification + scores + confidence + safety fields |
| `CyclePhaseWarning` | Interface | Warning with code, message, severity, source |
| `CyclePhaseEvidence` | Interface | Evidence summary linking phase to upstream signals |
| `CyclePhaseConfidence` | Union type or interface | Confidence tier classification |
| `CyclePhaseTransitionRisk` | Interface | Transition risk assessment |
| `CYCLE_PHASE_THRESHOLDS` | Frozen const | Configurable thresholds for scoring, ambiguity, hysteresis |
| `CYCLE_PHASES` | Frozen const | Source-of-truth object for phase values |

## 13. Future Pure-Function Requirements

The following functions are expected for the M-H pure functions gate. They are listed here for planning purposes only — not implemented.

| Function Name | Purpose |
|---|---|
| `classifyCyclePhase` | Orchestrator — fuses upstream evidence and returns `CyclePhaseResult` |
| `computePhaseScores` | Scores each candidate phase against current evidence |
| `computePhaseConfidence` | Computes overall confidence with penalty chain |
| `assessPhaseTransitionRisk` | Estimates probability of phase change in next window |
| `detectPhaseAmbiguity` | Measures gap between top phase scores |
| `applyPhaseHysteresis` | Adjusts classification using entry/retention thresholds |
| `aggregateUpstreamWarnings` | Collects and deduplicates warnings from all upstream stages |
| `buildCyclePhaseResult` | Assembles the final result object with all safety fields |
| `buildEvidenceSummary` | Generates human-readable evidence summary string |
| `validateCyclePhaseInput` | Validates that all required upstream results are present and well-formed |

## 14. Test Requirements for Future Gates

### Type Contract Tests (future M-H type contracts gate)

- All types compile and export correctly.
- Frozen const objects are frozen and have correct keys.
- Union types accept all valid values and reject invalid values.
- Safety fields (`advisoryOnly`, `humanReviewRequired`, `noActionRecommended`) are literal `true` types.
- No implementation functions exported.
- No Evidence Router imports.
- No Predictability Kernel imports.
- No forbidden scope references (filesystem, API, UI, DB, current.md, shell-promoter).
- No certainty language in string constants.

### Pure Function Tests (future M-H pure functions gate)

- Each function produces deterministic output for fixed input.
- `classifyCyclePhase` returns correct phase for characteristic evidence signatures.
- `uncertain` is returned when confidence is below threshold.
- `uncertain` is returned when ambiguity exceeds threshold.
- `uncertain` is returned when blocking warnings are present.
- `uncertain` is returned when upstream results are missing.
- Hysteresis prevents oscillation at phase boundaries.
- Confidence is always penalized, never inflated.
- Transition risk increases with high regime transition probability.
- Transition risk increases with high reversal indicator.
- All safety fields are literal `true` in output.
- No side effects, no I/O, no mutation.
- No forbidden scope references.

## 15. Failure Modes

| Failure Mode | Description | Mitigation |
|---|---|---|
| False phase certainty | Model classifies with high confidence when evidence is actually ambiguous | Ambiguity threshold forces `uncertain` when top scores are close |
| Overfitting to short windows | Classification swings wildly based on small data windows | Minimum point requirements inherited from upstream stages; data quality penalties |
| Mistaking noise for cycle transition | Random fluctuation triggers a phase change | Hysteresis band requires sustained evidence shift before reclassification |
| Ignoring confidence decay | Upstream confidence degradation not propagated | Multiplicative penalty chain ensures upstream uncertainty flows through |
| Conflicting model signals | Trend says expansion but regime says contraction | Ambiguity score rises, triggering `uncertain` when disagreement is strong enough |
| Stale upstream evidence | Classification based on old upstream results | Staleness penalty reduces confidence when evidence exceeds freshness window |
| Hidden live-action coupling | Downstream system uses phase classification to trigger automated action | `noActionRecommended: true` is a literal type; no runtime toggle |
| Ambiguous phase boundaries | Signal sits at the boundary between two phases | Hysteresis band and ambiguity threshold prevent forced classification |
| Missing upstream model | One or more upstream stages did not produce a result | Missing input triggers `uncertain` with specific warning code |
| Cascading false confidence | Multiple upstream models are wrong in the same direction | Independent model architectures reduce correlation; confidence is product not sum |

## 16. Acceptance Criteria

This spec is complete only if all of the following are true:

- [ ] Exactly one document created: `docs/PREDICTABILITY_STAGE_MH_CYCLE_PHASE_MODEL_SPEC.md`
- [ ] No source code created or modified
- [ ] No test files created or modified
- [ ] No `current.md` changes
- [ ] No protected source mutation
- [ ] No shell-promoter activation
- [ ] No Evidence Router wiring
- [ ] No Predictability Kernel runtime calls
- [ ] No UI/API/DB/auth changes
- [ ] No `cycle-analysis.ts` modification
- [ ] No `cycle-phase-types.ts` created
- [ ] No `cycle-phase.ts` created
- [ ] Predictability tests still pass
- [ ] Build still passes

## 17. Freeze Line

- M-H design spec is documentation only.
- M-H type contracts remain locked until separately authorized.
- M-H pure functions remain locked until separately authorized.
- M-H handoff remains locked until separately authorized.
- M-I (Calibration Ledger) remains locked until separately authorized.
- `cycle-analysis.ts` (Stage P) is not M-H and must not be modified under M-H authorization.

### Forbidden Scope

| Action | Status |
|---|---|
| Creating `cycle-phase-types.ts` | FORBIDDEN |
| Creating `cycle-phase.ts` | FORBIDDEN |
| Creating test files | FORBIDDEN |
| Modifying `cycle-analysis.ts` | FORBIDDEN |
| Importing from `cycle-analysis.ts` | FORBIDDEN |
| Modifying `current.md` | FORBIDDEN |
| Mutating `~/.claude/oracle-memory/sources/` | FORBIDDEN |
| Activating shell-promoter | FORBIDDEN |
| Unwiring KEEP_DEFERRED | FORBIDDEN |
| Wiring live Evidence Router | FORBIDDEN |
| Calling Predictability Kernel runtime | FORBIDDEN |
| Adding UI/API/DB/auth code | FORBIDDEN |
| Claiming live predictions work | FORBIDDEN |
| Autonomous forecasting or action | FORBIDDEN |
