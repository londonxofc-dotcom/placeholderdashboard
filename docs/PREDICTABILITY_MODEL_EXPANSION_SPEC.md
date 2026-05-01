# Predictability Model Expansion Specification

## 1. Canon Boundary

- Spec only.
- No implementation authorized.
- No Gate E implementation.
- No Evidence Router wiring.
- No Predictability Kernel runtime calls.
- No UI/API/DB/auth.
- No current.md edits.
- No protected source mutation.
- No shell-promoter activation.
- No autonomous forecasting/action.

## 2. Objective

Define how Oracle should improve predictability using:

- **Historical evidence** — leveraging accumulated evidence entries to refine probability estimates over time.
- **Macro / meso / micro cycles** — detecting multi-scale periodicity in behavioral and environmental data.
- **Current vs. previous trends** — comparing recent trend windows against prior baselines to detect acceleration, deceleration, and reversal.
- **Landmark event response** — measuring how behavior shifts after significant events, without diagnosing or predicting identity.
- **Behavioral repetition** — quantifying pattern recurrence to estimate future likelihood.
- **Bayesian updating** — formally revising beliefs as new evidence arrives, with explicit priors, likelihoods, and posteriors.
- **Monte Carlo uncertainty bands** — sampling possible futures to produce confidence intervals rather than point estimates.
- **Markov regime transitions** — modeling the probability of shifting between discrete behavioral/environmental states.
- **Mathematical critical thinking protocol** — applying base-rate reasoning, conditional probability, sensitivity analysis, and second-order effect awareness to every forecast.

## 3. Existing Model Layer

Current modules in `ui/lib/oracle/predictability/`:

| Module | File | Purpose |
|--------|------|---------|
| Trend Delta | `trend-delta.ts` | Computes directional change between consecutive data points |
| Regime Shift | `regime-shift.ts` | Detects discontinuous state changes in time-series data |
| Behavioral Repetition | `behavioral-repetition.ts` | Scores how frequently a pattern recurs |
| Predictability Kernel | `predictability-kernel.ts` | Orchestrates sub-models into a unified predictability score |
| Cycle Analysis | `cycle-analysis.ts` | Identifies periodic patterns at configurable windows |
| Trend Velocity | `trend-velocity.ts` | Measures rate of change and acceleration of trends |
| Landmark Response | `landmark-response.ts` | Quantifies behavioral shift magnitude after landmark events |
| Types | `types.ts` | Shared type definitions for the predictability system |
| Adapter Types | `evidence-router-adapter-types.ts` | Type contracts for Evidence Router adapter (Gate B) |
| Adapter Validation | `adapter-validation.ts` | Validates adapter inputs/outputs against contracts (Gate C) |
| Adapter Integration | `adapter-integration.ts` | Fixture-based integration of adapter with kernel (Gate D) |

## 4. Missing Algorithmic Capabilities

The current model layer computes descriptive scores from observed data. It lacks:

1. **Bayesian belief updating** — No mechanism to maintain prior beliefs and formally update them with incoming evidence. Current scores are stateless per invocation.

2. **Monte Carlo scenario simulation** — No sampling-based uncertainty estimation. Current outputs are point values, not distributions or confidence intervals.

3. **Markov state transition modeling** — Regime shift detects that a transition occurred but does not model the probability of transitioning between specific states or forecast the next likely state.

4. **Regime transition probability** — No transition matrix. No way to estimate the likelihood of moving from state A to state B given current conditions.

5. **Current-vs-previous trend baseline comparison** — Trend velocity measures rate of change, but does not compare the current trend window against a defined prior window to detect acceleration, deceleration, or reversal relative to a baseline.

6. **Macro/micro cycle phase estimation** — Cycle analysis identifies periodicity but does not classify data into macro (long-term), meso (medium-term), or micro (short-term) cycle phases, nor does it estimate current phase position.

7. **Confidence calibration over time** — No mechanism to track whether past forecasts were accurate, detect systematic overconfidence or underconfidence, and adjust future confidence accordingly.

8. **Prediction outcome ledger** — No structured record of predictions made vs. outcomes observed. Future-only — this would track forecasts going forward, not retroactively score past work.

## 5. Proposed Future Modules

Design only. No implementation authorized.

### 5.1 bayesian-updater.ts

Maintains and updates belief states using Bayes' theorem.

**Inputs:**
- `prior: BeliefState` — prior probability distribution over hypotheses
- `evidence: EvidenceEntry` — new observation with type and weight
- `likelihoodModel: LikelihoodFunction` — P(evidence | hypothesis) for each hypothesis

**Outputs:**
- `posterior: BeliefState` — updated probability distribution
- `evidenceWeight: number` — how much the evidence shifted the posterior (KL divergence from prior)
- `uncertaintyLabel: 'high' | 'moderate' | 'low'` — derived from posterior entropy

**Constraints:**
- Posteriors must sum to 1.0
- Single evidence entry cannot shift posterior by more than a configurable maximum (prevents overreaction to outliers)
- Weak evidence (low likelihood ratio) must produce proportionally small updates
- All priors must be explicitly stated, never implicit

### 5.2 monte-carlo-scenarios.ts

Generates scenario distributions by sampling from parameter ranges.

**Inputs:**
- `baselineParams: ScenarioParams` — central estimates for each variable
- `sensitivityRanges: Range[]` — min/max bounds per parameter
- `sampleCount: number` — number of Monte Carlo draws (default: 1000)
- `correlationMatrix?: CorrelationMatrix` — optional parameter correlations

**Outputs:**
- `scenarios: ScenarioResult[]` — sampled outcomes
- `confidenceInterval: { p5: number, p25: number, p50: number, p75: number, p95: number }` — percentile distribution
- `downsideCase: ScenarioResult` — p5 scenario
- `upsideCase: ScenarioResult` — p95 scenario
- `sensitivityRanking: ParameterSensitivity[]` — which parameters most affect the outcome

**Constraints:**
- Must produce a distribution, never a point estimate
- Results labeled as simulated scenarios, not predictions
- Sample count must be sufficient for stable percentile estimates

### 5.3 markov-regime-transitions.ts

Models transitions between discrete behavioral/environmental states.

**Inputs:**
- `stateDefinitions: StateDefinition[]` — named states with entry criteria
- `observedSequence: StateObservation[]` — historical sequence of observed states
- `currentState: string` — current identified state

**Outputs:**
- `transitionMatrix: TransitionMatrix` — estimated P(next state | current state)
- `regimeProbabilities: Record<string, number>` — probability of each state at next timestep
- `nextStateForecast: { state: string, probability: number, confidence: UncertaintyLabel }`
- `stationaryDistribution: Record<string, number>` — long-run state frequencies

**Constraints:**
- Transition probabilities must sum to 1.0 per row
- Minimum observation count required before matrix is considered reliable
- Forecast is advisory — must include confidence label and human review flag
- Cannot infer protected traits or identity from state transitions

### 5.4 trend-baseline-comparison.ts

Compares current trend against a defined prior trend window.

**Inputs:**
- `previousWindow: DataPoint[]` — prior trend baseline
- `currentWindow: DataPoint[]` — recent trend data
- `windowSizeConfig: WindowConfig` — defines window boundaries

**Outputs:**
- `delta: number` — magnitude of change between windows
- `acceleration: number` — rate of change of the rate of change (second derivative)
- `direction: 'accelerating' | 'decelerating' | 'stable' | 'reversing'`
- `reversalProbability: number` — estimated probability that the current trend will reverse (0–1)
- `baselineDeviation: number` — how far current values deviate from the prior trend's projected trajectory

**Constraints:**
- Windows must be non-overlapping
- Reversal probability is a heuristic estimate, not a guaranteed forecast
- Must label confidence of comparison based on window data density

### 5.5 cycle-phase-model.ts

Classifies data into multi-scale cycle phases and estimates current position.

**Inputs:**
- `timeSeries: DataPoint[]` — full available time series
- `cycleConfig: CycleConfig` — defines macro/meso/micro window sizes

**Outputs:**
- `macroCycle: CyclePhase` — long-term cycle: { phase: 'expansion' | 'peak' | 'contraction' | 'trough', position: number }`
- `mesoCycle: CyclePhase` — medium-term cycle
- `microCycle: CyclePhase` — short-term cycle
- `phaseAlignment: 'aligned' | 'divergent' | 'mixed'` — whether cycles reinforce or conflict
- `timingRisk: 'low' | 'moderate' | 'high'` — risk that current phase is about to transition

**Constraints:**
- Cycle detection requires minimum data length (at least 2x the macro window)
- Phase position is an estimate, not a certainty
- Timing risk must never be presented as a prediction of when a transition will occur

### 5.6 confidence-calibration-ledger.ts

Tracks forecast accuracy going forward to calibrate future confidence.

**Inputs:**
- `forecast: ForecastEntry` — a prediction with probability, confidence label, and timestamp
- `outcome: OutcomeEntry` — the observed result after the forecast period elapsed

**Outputs:**
- `calibrationScore: number` — Brier score or similar proper scoring rule
- `calibrationCurve: CalibrationBucket[]` — predicted probability vs. observed frequency across bins
- `overconfidenceDetected: boolean` — true if predicted probabilities systematically exceed observed frequencies
- `underconfidenceDetected: boolean` — true if predicted probabilities systematically understate observed frequencies
- `recommendedAdjustment: number` — suggested confidence scaling factor

**Constraints:**
- Future only — does not retroactively score past work before the ledger existed
- Minimum forecast count required before calibration metrics are reported
- Calibration data is internal diagnostic — not surfaced as a public-facing score
- Cannot be used to justify autonomous action

## 6. Mathematical Principles

Every module in the expansion must be grounded in these principles:

1. **Base-rate reasoning** — Start from population-level frequencies before adjusting for specific evidence. Never anchor on a single salient data point.

2. **Bayesian updating** — P(H|E) = P(E|H) × P(H) / P(E). Every belief revision must follow this structure, even if implemented as an approximation.

3. **Conditional probability** — Distinguish P(A|B) from P(B|A). Never conflate "given X, how likely is Y" with "given Y, how likely is X."

4. **Expected value** — Weight outcomes by their probabilities. Do not evaluate scenarios by their best or worst case alone.

5. **Variance and uncertainty** — Report spread, not just central tendency. A prediction without uncertainty bounds is incomplete.

6. **Sensitivity analysis** — Identify which inputs most affect outputs. Flag when a conclusion depends heavily on a single uncertain assumption.

7. **Markov transitions** — Model state changes as probabilistic transitions. Current state constrains but does not determine next state.

8. **Monte Carlo sampling** — When analytical solutions are intractable, sample from distributions to approximate the answer. Report percentiles, not means alone.

9. **Confidence calibration** — Track predicted probabilities against observed frequencies. Adjust confidence over time to reduce systematic bias.

10. **Second-order effects** — Consider how an action or prediction changes the system being predicted. Predictions that are acted upon alter their own base rates.

## 7. Forecast Output Requirements

Every future forecast produced by the expanded model must include all of the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `scenario` | `string` | Plain-language description of the forecasted outcome |
| `probabilityBand` | `{ low: number, mid: number, high: number }` | Probability range, not a point estimate |
| `confidenceLabel` | `'speculative' \| 'low' \| 'moderate' \| 'high'` | Qualitative confidence tier |
| `evidenceBasis` | `EvidenceEntry[]` | Evidence entries that support this forecast |
| `supportingEvidence` | `string[]` | Factors that increase the probability |
| `opposingEvidence` | `string[]` | Factors that decrease the probability |
| `assumptions` | `string[]` | Conditions that must hold for the forecast to be valid |
| `uncertainty` | `string` | Primary source of uncertainty in this forecast |
| `failureModes` | `string[]` | Ways this forecast could be wrong |
| `recommendedAction` | `string` | Suggested next test, observation, or decision |
| `humanReviewRequired` | `true` | Always `true` — no forecast bypasses human review |

## 8. Forbidden Claims

The expanded model must never produce:

- **Certainty language** — "will happen," "guaranteed," "certain," "inevitable," "definitely."
- **"This will happen"** — All outputs are probabilistic scenarios, not deterministic predictions.
- **Diagnosis language** — "this person is," "this indicates that they are," or any language that pathologizes or diagnoses.
- **Protected trait inference** — No inference of race, gender, sexuality, disability, religion, political affiliation, or any protected characteristic from behavioral data.
- **Behavior-as-destiny claims** — "Because they did X, they will always do Y." Past behavior informs probability; it does not determine future outcomes.
- **Autonomous action** — No forecast may trigger an action without human approval. Forecasts are advisory inputs to human decision-making.
- **Canon updates from predictions** — Predictions do not update canon. Only verified outcomes, reviewed by a human, update canon.
- **Live prediction claims** — No output may claim to be a live, real-time prediction. All outputs are scenario analyses based on available data.

## 9. Future Test Requirements

Each proposed module requires the following test categories before implementation can be considered complete. Tests are spec-only — no test code is authorized.

### 9.1 Bayesian Updater Tests
- Prior + evidence → posterior sums to 1.0
- Weak evidence produces small posterior shift
- Strong evidence produces proportional posterior shift
- Single evidence entry cannot exceed maximum shift threshold
- Posterior with no evidence equals prior
- Multiple sequential updates produce correct cumulative posterior

### 9.2 Monte Carlo Tests
- Output distribution has correct percentile structure (p5 < p25 < p50 < p75 < p95)
- Increasing sample count reduces percentile variance
- Correlated parameters produce correlated outcomes
- Sensitivity ranking correctly identifies dominant parameters
- Zero-variance inputs produce deterministic outputs

### 9.3 Markov Transition Tests
- Transition matrix rows sum to 1.0
- Stationary distribution is consistent with transition matrix
- Minimum observation count gate prevents premature matrix usage
- Forecast includes confidence label
- Cannot infer protected traits from state sequence

### 9.4 Trend Baseline Comparison Tests
- Non-overlapping windows enforced
- Acceleration correctly computed as second derivative
- Reversal detection triggers when direction changes sign
- Stable trends produce near-zero delta
- Sparse data produces low-confidence labels

### 9.5 Cycle Phase Model Tests
- Minimum data length enforced (2x macro window)
- Phase position is bounded [0, 1]
- Phase alignment correctly identifies reinforcing vs. conflicting cycles
- Timing risk reflects proximity to phase boundary
- Insufficient data returns 'indeterminate' phase

### 9.6 Confidence Calibration Ledger Tests
- Brier score correctly computed for binary outcomes
- Overconfidence detected when predicted > observed systematically
- Underconfidence detected when predicted < observed systematically
- Minimum forecast count gate prevents premature calibration reporting
- Ledger is future-only — no retroactive scoring

### 9.7 Cross-Cutting Safety Tests
- Landmark response does not become diagnosis
- Weak evidence cannot produce strong forecast
- Predictions remain advisory (humanReviewRequired always true)
- No module writes to filesystem, API, UI, DB, current.md, or shell-promoter
- No module triggers autonomous action

## 10. Recommended Implementation Sequence

Spec only. All stages listed below are **NOT AUTHORIZED** for implementation.

| Stage | Name | Scope |
|-------|------|-------|
| M-A | Bayesian updater contracts | Type definitions and interfaces only |
| M-B | Bayesian updater pure functions | Stateless computation, fixture-tested |
| M-C | Monte Carlo scenario contracts | Type definitions and interfaces only |
| M-D | Monte Carlo pure fixture simulation | Stateless sampling, fixture-tested |
| M-E | Markov regime transition contracts | Type definitions and interfaces only |
| M-F | Markov pure functions | Stateless transition computation, fixture-tested |
| M-G | Trend baseline comparison | Pure function, fixture-tested |
| M-H | Cycle phase model | Pure function, fixture-tested |
| M-I | Calibration ledger spec | Design only — no implementation |

**Each stage requires explicit authorization before work begins.**

**Each stage follows the gated pattern established in Gates A–E:**
1. Spec document
2. Type contracts
3. Pure function implementation with fixture tests
4. Validation
5. Integration
6. Handoff

## 11. Relationship to Gate E

- **Model expansion** concerns algorithmic depth — adding new mathematical capabilities to the Predictability Kernel.
- **Gate E** concerns live Evidence Router consumption — wiring the existing kernel to receive real evidence data.
- These are independent work streams.
- Model expansion does not require Gate E to be implemented.
- Gate E does not require model expansion to be implemented.
- Neither authorizes the other.
- Both require separate, explicit authorization before implementation begins.

## 12. Freeze Line

This specification does not authorize:

- Implementation of any module described above
- Gate E implementation
- Evidence Router wiring
- Predictability Kernel runtime calls
- UI/API/DB/auth wiring
- current.md edits
- Protected source mutation
- shell-promoter activation
- Live prediction claims
- Autonomous forecasting
- Autonomous action

This document is a design reference. Implementation requires a separate, explicit authorization conversation following the gated pattern established in Gates A–E.
