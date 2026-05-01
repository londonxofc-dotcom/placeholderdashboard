# Predictability Model Expansion — Stage M-C Handoff

## 1. Stage M-C Status

**Stage M-C: Monte Carlo Scenario Type Contracts — COMPLETE**

Stage M-C is complete and committed. It added Monte Carlo scenario type contracts only — enum-like constants, derived union types, interfaces, and contract rules.

Stage M-C did NOT:
- Implement Monte Carlo simulation
- Implement random sampling
- Modify Bayesian updater files (`bayesian-updater-types.ts`, `bayesian-updater.ts`)
- Modify Predictability Kernel (`predictability-kernel.ts`)
- Implement Gate E
- Wire Evidence Router
- Add UI/API/DB/auth

## 2. Commit

- **Commit:** `1baa8c2` — `feat(predictability): add monte carlo scenario type contracts`
- **Branch:** `night-build/2026-04-25`
- **Parent commit:** `5c33a35` — `docs(predictability): capture stage m-b handoff`

## 3. Files Added

| File | Purpose | Lines |
|------|---------|-------|
| `ui/lib/oracle/predictability/monte-carlo-scenario-types.ts` | Monte Carlo scenario type contracts | 183 |
| `ui/lib/oracle/predictability/__tests__/monte-carlo-scenario-types.test.ts` | TDD tests for all type contracts and boundary checks | 361 |

No existing files were modified.

## 4. Type Contracts Added

### Enum-like Constants (as const objects + derived union types)

| Constant | Type | Values |
|----------|------|--------|
| `MONTE_CARLO_SCENARIO_BANDS` | `MonteCarloScenarioBand` | `downside`, `base`, `upside`, `tail_risk`, `breakout` |
| `MONTE_CARLO_ASSUMPTION_SENSITIVITIES` | `MonteCarloAssumptionSensitivity` | `low`, `medium`, `high`, `critical` |
| `MONTE_CARLO_DISTRIBUTION_SHAPES` | `MonteCarloDistributionShape` | `uniform`, `triangular`, `normal_like`, `skewed_positive`, `skewed_negative`, `discrete` |
| `MONTE_CARLO_WARNING_SEVERITIES` | `MonteCarloWarningSeverity` | `info`, `warn`, `block` |

### Interfaces

| Interface | Key Fields |
|-----------|------------|
| `MonteCarloVariable` | id, label, baseline, min, max, distributionShape, sensitivity, confidence, notes? |
| `MonteCarloAssumption` | id, statement, sensitivity, confidence, sourceTier, provenance, notes? |
| `MonteCarloScenarioInput` | id, objective, baseProbability, assumptions[], variables[], constraints[], horizon, sourceTier, confidence, provenance, notes? |
| `MonteCarloScenarioResult` | scenarioId, band, probabilityRange: [number, number], medianEstimate, downsideEstimate, upsideEstimate, tailRiskEstimate, assumptionsUsed[], sensitiveVariables[], warnings[], advisoryOnly: true |
| `MonteCarloWarning` | code, message, severity, variableId?, assumptionId? |
| `MonteCarloContractRule` | id, description, severity, appliesTo |

## 5. Contract Rules

| Rule ID | Severity | Applies To | Description |
|---------|----------|------------|-------------|
| `SCENARIO_OUTPUT_MUST_BE_RANGE` | block | `MonteCarloScenarioResult.probabilityRange` | Monte Carlo output must be a range, not single-point certainty |
| `ASSUMPTIONS_MUST_BE_EXPLICIT` | block | `MonteCarloScenarioResult.assumptionsUsed` | All simulated scenarios must expose assumptions |
| `SENSITIVE_VARIABLES_MUST_BE_LISTED` | block | `MonteCarloScenarioResult.sensitiveVariables` | High-sensitivity variables must be surfaced in output |
| `TAIL_RISK_MUST_BE_PRESERVED` | block | `MonteCarloScenarioResult.tailRiskEstimate` | Downside and tail risk cannot be hidden or omitted |
| `WEAK_CONFIDENCE_EXPANDS_RANGE` | warn | `MonteCarloScenarioResult.probabilityRange` | Weak evidence or confidence widens uncertainty ranges |
| `NO_CERTAINTY_CLAIMS` | block | `MonteCarloScenarioResult` | No forecast may claim a guaranteed outcome |
| `ADVISORY_ONLY_OUTPUT` | block | `MonteCarloScenarioResult.advisoryOnly` | Scenario output remains advisory, not canon |
| `HUMAN_REVIEW_REQUIRED_FOR_ACTION` | block | `MonteCarloScenarioResult` | No autonomous decision or outreach based on scenario output |
| `PROVENANCE_REQUIRED` | block | `MonteCarloAssumption.provenance` | Assumptions and variables require provenance |
| `NO_RANDOM_RUNTIME_YET` | block | `MonteCarloScenarioResult` | Stage M-C defines contracts only, not simulation runtime |

## 6. Verification

- **Monte Carlo type tests:** 36/36 passing
- **Full predictability suite:** 236/236 passing across 13 test files (no regressions)
- **Build:** `npm run build` — compiled successfully, 0 errors, 0 warnings
- **No implementation functions:** Boundary checks confirm zero function exports
- **No random sampling:** Boundary checks confirm no random/sample/simulate/run exports
- **No Evidence Router wiring:** Boundary checks confirm no evidence router imports in exports
- **No Predictability Kernel runtime calls:** Boundary checks confirm no kernel imports in exports
- **No Gate E implementation:** Gate E remains locked
- **No UI/API/DB/auth:** Boundary checks confirm no filesystem, API, UI, DB, current.md, or shell-promoter references in exports
- **No current.md write:** current.md untouched
- **No protected source mutation:** All prior stage files confirmed unmodified
- **shell-promoter:** Remains KEEP_DEFERRED

### Test Coverage Summary

Tests validate:
1. Enum-like constants — all values present, exact count enforced (5 bands, 4 sensitivities, 6 shapes, 3 severities)
2. Interface shapes — all required fields present, optional fields supported (notes on Input, Variable, Assumption; variableId/assumptionId on Warning)
3. Contract rules — all 10 rules present with correct id, severity, appliesTo, and non-empty descriptions; unique IDs enforced
4. Boundary checks — no implementation functions exported, no random sampling functions, no Evidence Router imports, no Predictability Kernel imports, no forbidden references (filesystem, API, UI, DB, current.md, shell-promoter)

## 7. Current Classification

- **Stage:** M-C (third stage of Model Expansion)
- **Type:** Pure type contracts — no implementation functions, no side effects, no external dependencies
- **Pattern:** Matches Gates A–E gated adapter chain + Stages M-A and M-B type/function contracts
- **Imports:** None — fully standalone module (no imports from other predictability files)
- **Purpose:** Defines Monte Carlo scenario vocabulary and safety rules. Does not run simulations, sample random values, or produce forecasts.

## 8. Stage M-D Boundary

Stage M-D is **NOT STARTED** and must not be started by this handoff.

Stage M-D scope (when explicitly authorized):
- Pure fixture-based Monte Carlo scenario functions only
- No random sampling or Math.random
- No runtime simulation
- No Predictability Kernel runtime calls
- No UI/API/DB/auth
- No autonomous action or live prediction

## 9. Freeze Line

This handoff does not authorize:

- Stage M-D implementation
- Monte Carlo simulation implementation
- Random sampling or Math.random
- Markov chain implementation
- Gate E implementation
- Evidence Router → Bayesian Updater wiring
- Predictability Kernel runtime calls
- UI/API/DB/auth wiring
- current.md edits
- Protected source mutation
- shell-promoter activation
- Live prediction claims
- Autonomous forecasting or action
- Any modification to files committed under this tag
- Any modification to Stage M-A files (`bayesian-updater-types.ts`, `bayesian-updater-types.test.ts`)
- Any modification to Stage M-B files (`bayesian-updater.ts`, `bayesian-updater.test.ts`)
