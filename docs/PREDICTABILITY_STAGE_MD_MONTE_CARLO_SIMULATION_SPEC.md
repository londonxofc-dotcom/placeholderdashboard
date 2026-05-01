# Predictability Model Expansion — Stage M-D Monte Carlo Simulation Design

## 1. Canon Boundary

This document is a **design specification only**. It does not authorize implementation.

- No implementation authorized by this document.
- No random sampling implementation.
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
| M-A | Bayesian Updater Contracts | COMPLETE | Type contracts for Bayesian update pipeline |
| M-B | Bayesian Updater Pure Functions | COMPLETE | 6 pure functions: clamp, normalize, posterior, delta, classify, update |
| M-C | Monte Carlo Scenario Contracts | COMPLETE | Type contracts for Monte Carlo scenario modeling |
| M-D | Monte Carlo Pure Fixture Simulation | **DESIGN ONLY** | Pure functions consuming M-C contracts with deterministic fixtures |

Stage M-D implementation remains locked until separately and explicitly authorized.

## 3. Objective

Design how Monte Carlo simulation should estimate scenario ranges from fixture inputs while preserving:

- **Assumptions** — every simulation result must expose all assumptions consumed
- **Sensitivity variables** — high-sensitivity variables must be surfaced in output
- **Probability ranges** — output must be a range, not a single-point claim
- **Downside / tail risk** — downside and tail risk cannot be hidden or omitted
- **Uncertainty** — weak evidence or low confidence must widen uncertainty ranges
- **Advisory-only output** — all simulation output is advisory, not canon
- **Human review requirement** — no autonomous decision or outreach from simulation output

## 4. Simulation Philosophy

Monte Carlo simulation is **not certainty**. It is a method for exploring the distribution of possible outcomes under stated assumptions.

Core principles:

1. Monte Carlo generates **scenario distributions**, not truth.
2. Output must be **ranges**, not single-point claims.
3. Weak evidence **widens** uncertainty — it does not narrow it.
4. Tail risk must be **preserved** — not suppressed, smoothed, or omitted.
5. Randomness must be **controlled and deterministic** in tests.
6. No simulation output may be treated as a guaranteed forecast.
7. All output remains **advisory only** — never canon.

## 5. Determinism Requirement

Future implementation must support fully deterministic fixtures for testing and reproducibility.

Design rules:

1. **No uncontrolled `Math.random`** in tests or test-facing code paths.
2. **Injectable random source** — simulation functions must accept an optional random source parameter (function or seeded generator).
3. **Seeded deterministic sequence** — when no external random source is provided, a seeded PRNG (pseudorandom number generator) must be used with a configurable seed.
4. **Tests must be reproducible** — running the same test twice must produce the same result.
5. **Same input + same seed = same output** — determinism is non-negotiable for verification.
6. **Runtime randomness must not affect canon** — even if a future runtime uses true randomness, the results remain advisory-only and do not mutate canon state.

## 6. Future Function Shape

Conceptual signatures only. No implementation code.

| Function | Conceptual Signature | Purpose |
|----------|---------------------|---------|
| `runMonteCarloScenario` | `(input: MonteCarloScenarioInput, options: SimulationOptions) → MonteCarloSimulationResult` | Top-level orchestrator: runs N iterations, summarizes distribution |
| `sampleVariable` | `(variable: MonteCarloVariable, randomSource: RandomSource) → number` | Draws a single sample from a variable's distribution |
| `runScenarioIteration` | `(input: MonteCarloScenarioInput, sampledVariables: SampledVariableMap) → MonteCarloIterationResult` | Evaluates one scenario iteration with a fixed set of sampled values |
| `summarizeScenarioDistribution` | `(iterations: MonteCarloIterationResult[]) → MonteCarloScenarioResult` | Aggregates iteration results into percentile bands, median, downside, upside, tail risk |
| `calculateUncertaintyBand` | `(results: MonteCarloIterationResult[]) → ProbabilityRange` | Computes the probability range from iteration distribution |
| `detectTailRisk` | `(results: MonteCarloIterationResult[]) → TailRiskSummary` | Identifies and quantifies tail-risk scenarios from the distribution |

## 7. Input Requirements

Future simulation consumes:

| Input | Source | Required |
|-------|--------|----------|
| `MonteCarloScenarioInput` | Stage M-C contract | Yes |
| `MonteCarloVariable[]` | Embedded in `MonteCarloScenarioInput.variables` | Yes |
| `MonteCarloAssumption[]` | Embedded in `MonteCarloScenarioInput.assumptions` | Yes |
| `constraints` | Embedded in `MonteCarloScenarioInput.constraints` | Yes |
| `confidence` | Embedded in `MonteCarloScenarioInput.confidence` | Yes |
| `sourceTier` | Embedded in `MonteCarloScenarioInput.sourceTier` | Yes |
| `provenance` | Embedded in `MonteCarloScenarioInput.provenance` | Yes |
| Deterministic seed | `SimulationOptions.seed` | Optional (defaults to fixed seed) |
| Iteration count | `SimulationOptions.iterations` | Optional (defaults to reasonable N) |

## 8. Output Requirements

Future output must include:

| Field | Type | Purpose |
|-------|------|---------|
| `scenarioId` | string | Links result to input scenario |
| `probabilityRange` | [number, number] | Bounded range — never a single point |
| `medianEstimate` | number | Central tendency of distribution |
| `downsideEstimate` | number | Lower percentile estimate |
| `upsideEstimate` | number | Upper percentile estimate |
| `tailRiskEstimate` | number | Extreme downside quantification |
| `sensitiveVariables` | MonteCarloVariable[] | Variables with high impact on outcome |
| `assumptionsUsed` | MonteCarloAssumption[] | All assumptions consumed by simulation |
| `warnings` | MonteCarloWarning[] | Any contract rule violations or cautions |
| `uncertaintyNotes` | string | Human-readable uncertainty explanation |
| `advisoryOnly` | true (literal) | Hardcoded — output is never canon |
| `humanReviewRequired` | true (literal) | Hardcoded — no autonomous action permitted |

## 9. Mathematical Principles

Future implementation should apply:

1. **Repeated sampling** — draw N independent samples from each variable's distribution to approximate the outcome space
2. **Distribution approximation** — use the specified `distributionShape` (uniform, triangular, normal-like, skewed, discrete) to generate samples that respect variable bounds
3. **Expected value** — median of the iteration results serves as the central estimate
4. **Variance / spread** — interquartile range and standard deviation of iterations quantify uncertainty
5. **Percentile bands** — map iterations to scenario bands (downside ≈ P10, base ≈ P50, upside ≈ P90, tail risk ≈ P1–P5, breakout ≈ P95+)
6. **Downside / tail-risk preservation** — tail percentiles must always be computed and surfaced; they cannot be hidden by summarization
7. **Sensitivity analysis** — rank variables by their contribution to outcome variance; high-sensitivity variables must appear in `sensitiveVariables`
8. **Confidence interval approximation** — probability range reflects the spread of the iteration distribution, not a single-point estimate
9. **Uncertainty widening from weak evidence** — when `confidence` is low (e.g., POSSIBLE, UNLIKELY) or `sourceTier` is weak (T3, T4), the probability range must be expanded rather than narrowed

## 10. Safety Rules

Future implementation must enforce every rule from the Stage M-C contract:

| Rule | Enforcement |
|------|-------------|
| No certainty claims | Output is always a range; no single-point-only result permitted |
| No single-point-only result | `probabilityRange` must be a two-element tuple with distinct bounds |
| No hidden tail risk | `tailRiskEstimate` is always computed and present |
| Weak confidence expands range | Low confidence or weak source tier widens `probabilityRange` |
| Assumptions explicit | `assumptionsUsed` populated from input; never empty when input has assumptions |
| Provenance required | Assumptions and variables must carry provenance from input |
| advisoryOnly always true | Hardcoded `true` in every result — not computed, not conditional |
| Human review required | Hardcoded `true` — no downstream action without human approval |
| No autonomous action | Pure functions only — no side effects, no network, no filesystem, no state mutation |
| No canon mutation | Simulation results never write to canon, current.md, or protected sources |

## 11. Failure Modes

Risks that future M-D implementation must guard against:

| Failure Mode | Impact | Mitigation |
|--------------|--------|------------|
| Random nondeterminism breaking tests | Tests flake, results not reproducible | Injectable random source with deterministic seed |
| Scenario output interpreted as truth | Downstream actors treat advisory output as canon | `advisoryOnly: true` + `humanReviewRequired: true` hardcoded |
| Weak evidence producing narrow range | False precision from insufficient data | Confidence-weighted range expansion |
| Tail risk suppressed | Decision-makers unaware of extreme downside | Mandatory `tailRiskEstimate` computation from lower percentiles |
| Assumptions hidden | Results appear assumption-free | `assumptionsUsed` always populated from input |
| High-sensitivity variables not surfaced | Key drivers invisible to reviewer | Sensitivity analysis ranking variables by variance contribution |
| Forecast explanation dropping uncertainty | Human-readable summary sounds certain | `uncertaintyNotes` field required; warnings for weak evidence |
| Autonomous action triggered from scenario | System acts on advisory output | No side effects in any function; pure computation only |
| current.md updated from simulation result | Canon state mutated by advisory output | No filesystem access in simulation functions |
| shell-promoter activated from scenario result | Promotion logic triggered by simulation | No shell-promoter imports or references |

## 12. Future Test Requirements

When M-D implementation is authorized, tests must verify:

1. Deterministic seed produces repeatable result.
2. Same input and same random source produces same output.
3. Probability ranges remain bounded within [0, 1].
4. Weak confidence widens range compared to strong confidence.
5. Tail risk is preserved — `tailRiskEstimate` is always present and computed.
6. Assumptions are included in output — `assumptionsUsed` matches input assumptions.
7. High-sensitivity variables are surfaced in `sensitiveVariables`.
8. `advisoryOnly` is always `true`.
9. `humanReviewRequired` is always `true`.
10. No certainty language appears in warnings or uncertainty notes.
11. Input object is not mutated — immutability preserved.
12. No Evidence Router imports in implementation or tests.
13. No Predictability Kernel imports in implementation or tests.
14. No UI/API/DB/filesystem/current.md/shell-promoter references in exports.
15. No uncontrolled `Math.random` in tests — all randomness injectable.

## 13. Future Implementation Constraints

Future M-D implementation, if authorized, may create:

| File | Purpose |
|------|---------|
| `ui/lib/oracle/predictability/monte-carlo-scenarios.ts` | Pure Monte Carlo simulation functions |
| `ui/lib/oracle/predictability/__tests__/monte-carlo-scenarios.test.ts` | Deterministic TDD tests for simulation functions |

**Allowed imports:**
- `monte-carlo-scenario-types.ts` only (Stage M-C contracts)

**Forbidden imports:**
- Evidence Router (`evidence-router-adapter-types.ts`, `evidence-router-adapter.ts`)
- Predictability Kernel (`predictability-kernel.ts`)
- Bayesian updater (`bayesian-updater-types.ts`, `bayesian-updater.ts`) — unless separately authorized
- Adapter integration (`adapter-integration.ts`)
- UI/API/DB/auth modules
- Filesystem/network modules
- shell-promoter

## 14. Acceptance Criteria

M-D implementation can only be accepted if:

1. All deterministic tests pass.
2. Full predictability suite passes with no regressions.
3. `npm run build` passes with 0 errors, 0 warnings.
4. No existing modules modified unless explicitly authorized.
5. No Gate E work.
6. No live prediction claims.
7. No autonomous action or side effects.
8. No current.md or protected source mutation.
9. `advisoryOnly: true` hardcoded in every result.
10. `humanReviewRequired: true` hardcoded in every result.

## 15. Freeze Line

This design specification does not authorize:

- Stage M-D implementation
- Monte Carlo simulation code
- Random sampling implementation
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
