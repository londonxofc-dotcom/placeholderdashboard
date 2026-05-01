# Predictability Model Expansion — Stage M-D Handoff

## 1. Stage M-D Status

Stage M-D is complete and committed.
It implements deterministic Monte Carlo pure fixture simulation.
It does not implement Markov transitions.
It does not implement Gate E.
It does not wire Evidence Router.
It does not call Predictability Kernel runtime.

## 2. Commit

- Commit: `f9c679e` feat(predictability): add deterministic monte carlo scenarios

## 3. Files Added

- `ui/lib/oracle/predictability/monte-carlo-scenarios.ts`
- `ui/lib/oracle/predictability/__tests__/monte-carlo-scenarios.test.ts`

## 4. Functions Implemented

| Function | Purpose |
|----------|---------|
| `createDeterministicRandomSource(seed)` | Seeded Mulberry32 PRNG returning values in [0, 1). Same seed always produces the same sequence. |
| `sampleVariable(variable, randomSource)` | Draws a sample from the variable's distribution shape (uniform, triangular, normal_like, skewed_positive, skewed_negative, discrete), bounded by min/max. |
| `runScenarioIteration(input, randomSource)` | Runs one iteration — samples all variables, computes a blended score in [0, 1]. Does not mutate input. |
| `runMonteCarloScenario(input, options)` | Orchestrator — runs N iterations with a seeded PRNG, summarizes the distribution, classifies band, filters sensitive variables, generates warnings. Returns `advisoryOnly: true` and `humanReviewRequired: true`. |
| `summarizeScenarioDistribution(iterations)` | Extracts median (P50), downside (P10), upside (P90), and tail risk (P5) from sorted iteration scores. |
| `detectTailRisk(iterations)` | Returns the P5 percentile estimate from sorted iteration scores. |
| `calculateUncertaintyBand(iterations)` | Returns [P5, P95] uncertainty band from sorted iteration scores, clamped to [0, 1]. |

## 5. Mathematical / Statistical Behavior

- Deterministic seeded PRNG (Mulberry32) — same seed always produces the same sequence
- Repeated fixture sampling across N iterations
- Bounded variable sampling — all samples clamped to [min, max]
- Six distribution shapes supported: uniform, triangular, normal_like, skewed_positive, skewed_negative, discrete
- Scenario distribution summarization via sorted percentile extraction
- Percentile-style downside (P10) / base (P50) / upside (P90) / tail-risk (P5) extraction
- Weak confidence widens the uncertainty range via a bandwidth multiplier on the half-width
- Confidence multipliers: CONFIRMED (0.6), LIKELY (1.0), PLAUSIBLE (1.3), SPECULATIVE (1.6), UNLIKELY (2.0)
- High/critical sensitivity variables are surfaced in output
- Advisory-only output — no canon, no autonomous action

## 6. Safety Rules Enforced

- No uncontrolled `Math.random` in implementation or tests
- No Evidence Router imports
- No Predictability Kernel imports
- No Bayesian updater imports
- No UI/API/DB/auth
- No filesystem/network access
- No `current.md` writes
- No protected source mutation
- No shell-promoter activation
- No certainty language in warnings (verified by test)
- `advisoryOnly` always `true` (hardcoded)
- `humanReviewRequired` always `true` (hardcoded)
- No autonomous action

## 7. Verification

- Monte Carlo scenario tests: 29/29 passing
- Full predictability suite: 265/265 passing (14 test files)
- Build: clean — no type errors
- Only two M-D files committed
- `next-env.d.ts` restored (not committed)
- Logs remain uncommitted (untracked only)
- `PHASE_3_IMPLEMENTATION_PLAN.md` remains untracked

## 8. Current Classification

Stage M-D is local, deterministic, fixture-based simulation logic.
It does not consume live Evidence Router output.
It does not call the Predictability Kernel.
It does not produce live prediction claims.
It does not write canon.
It does not take autonomous action.

## 9. Stage M-E Boundary

Stage M-E remains NOT STARTED.
Stage M-E may later define Markov regime transition contracts only after explicit authorization.
Stage M-E must not be started by this handoff.

## 10. Freeze Line

This handoff does not authorize:
- Stage M-E implementation
- Markov transition implementation
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
