# Predictability Stage M-A Handoff

## 1. Status

**Stage M-A: Bayesian Updater Type Contracts — COMPLETE**

All type definitions, interfaces, enum-like constants, contract rules, and type-only tests are implemented, passing, and committed. No implementation functions exist. No Bayesian calculation logic exists. No Evidence Router imports. No Predictability Kernel imports.

## 2. Commit and Tag

- **Commit:** `9dbb83b` — `feat(predictability): add bayesian updater type contracts`
- **Tag:** `oracle-predictability-stage-ma-bayesian-contracts-locked`
- **Branch:** `night-build/2026-04-25`
- **Parent commit:** `490c089` — `docs(predictability): specify model expansion roadmap`

## 3. Files Added

| File | Purpose | Lines |
|------|---------|-------|
| `ui/lib/oracle/predictability/bayesian-updater-types.ts` | Type contracts for Bayesian updater system | 184 |
| `ui/lib/oracle/predictability/__tests__/bayesian-updater-types.test.ts` | Type shape and contract validation tests | 394 |

No existing files were modified.

## 4. Type Contracts Defined

### Constrained Scalar
- `BayesianProbability` — `number` constrained to [0, 1] by contract rules, not by the type system

### Enum-Like Constants (all `as const`)
- `BAYESIAN_EVIDENCE_DIRECTIONS` — supports, opposes, neutral, mixed
- `BAYESIAN_EVIDENCE_STRENGTHS` — weak, moderate, strong, decisive
- `BAYESIAN_UPDATE_MODES` — conservative, balanced, aggressive
- `BAYESIAN_WARNING_SEVERITIES` — info, warn, block

### Derived Union Types
- `BayesianEvidenceDirection` — derived from `BAYESIAN_EVIDENCE_DIRECTIONS`
- `BayesianEvidenceStrength` — derived from `BAYESIAN_EVIDENCE_STRENGTHS`
- `BayesianUpdateMode` — derived from `BAYESIAN_UPDATE_MODES`
- `BayesianWarningSeverity` — derived from `BAYESIAN_WARNING_SEVERITIES`

### Interfaces (all fields `readonly`)
- `BayesianPrior` — id, hypothesis, priorProbability, sourceTier, confidence, assumptions, optional createdAt, notes
- `BayesianEvidenceItem` — id, claim, direction, strength, likelihoodGivenHypothesis, likelihoodGivenNotHypothesis, sourceTier, confidence, provenance, optional tags, notes
- `BayesianUpdateInput` — hypothesis, prior, evidence, mode, optional objective, canonBoundaries, outputContract
- `BayesianUpdateWarning` — code, message, severity, optional evidenceId
- `BayesianUpdateResult` — hypothesis, priorProbability, posteriorProbability, probabilityDelta, evidenceUsed, evidenceWarnings, assumptions, uncertainty, explanation, advisoryOnly (literal `true`)
- `BayesianContractRule` — id, description, severity, appliesTo

## 5. Contract Rules (10 rules)

| ID | Severity | Applies To |
|----|----------|------------|
| PRIOR_MUST_BE_BOUNDED | block | BayesianPrior.priorProbability |
| POSTERIOR_MUST_BE_BOUNDED | block | BayesianUpdateResult.posteriorProbability |
| EVIDENCE_REQUIRES_PROVENANCE | block | BayesianEvidenceItem.provenance |
| WEAK_EVIDENCE_CANNOT_FORCE_DECISIVE_UPDATE | warn | BayesianUpdateResult.posteriorProbability |
| CONFLICTED_EVIDENCE_MUST_WARN | warn | BayesianUpdateResult.evidenceWarnings |
| SOURCE_TIER_AFFECTS_WEIGHT | info | BayesianEvidenceItem.sourceTier |
| ADVISORY_ONLY_OUTPUT | block | BayesianUpdateResult.advisoryOnly |
| NO_CERTAINTY_CLAIMS | block | BayesianUpdateResult.explanation |
| HUMAN_REVIEW_REQUIRED_FOR_STRATEGIC_USE | block | BayesianUpdateResult |
| NO_AUTONOMOUS_ACTION | block | BayesianUpdateResult |

## 6. Verification

- **Tests:** 31 tests in `bayesian-updater-types.test.ts` — all passing
- **Full suite:** 172/172 tests passing (no regressions)
- **Build:** `npm run build` — clean (0 errors, 0 warnings after next-env.d.ts restore)
- **No lint errors** in new files

### Test Coverage Summary

Tests validate:
1. All enum-like constant shapes (directions, strengths, modes, severities)
2. All interface shapes (required and optional fields)
3. All 10 contract rules exist with correct id, severity, description, appliesTo
4. No Evidence Router or adapter imports leak into exports
5. No Predictability Kernel types leak into exports
6. No filesystem, API, UI, DB, current.md, or shell-promoter references in exports
7. No implementation functions exported
8. No Bayesian calculation functions exist yet
9. Warning type shape with optional evidenceId
10. `advisoryOnly` is always `true` in result shape

## 7. Classification

- **Stage:** M-A (first stage of Model Expansion)
- **Type:** Type contracts only — no implementation
- **Pattern:** Matches Gates A–E gated adapter chain
- **Style reference:** `evidence-router-adapter-types.ts` (same `as const` + derived union pattern)

## 8. Stage M-B Boundary

Stage M-B (Bayesian Updater Pure Functions) is **NOT AUTHORIZED** until this handoff is acknowledged and M-B is explicitly authorized.

Stage M-B scope (when authorized):
- Pure stateless functions only
- Fixture-based tests (no external dependencies)
- Imports only from `bayesian-updater-types.ts`
- No Evidence Router, no Predictability Kernel, no UI/API/DB/auth
- Must enforce all 10 contract rules at runtime

Expected M-B functions (spec reference only — not authorized):
- `clampProbability` — enforce [0, 1] bounds
- `normalizeLikelihood` — ensure likelihood ratios are valid
- `calculateBayesianPosterior` — P(H|E) = P(E|H) × P(H) / P(E)
- `calculateProbabilityDelta` — posterior minus prior
- `classifyBayesianEvidenceWeight` — label evidence impact
- `updateBayesianBelief` — orchestrate full Bayesian update pipeline

## 9. Freeze Line

This handoff does not authorize:

- Implementation of any Bayesian calculation function
- Gate E implementation
- Evidence Router wiring
- Predictability Kernel runtime calls
- UI/API/DB/auth wiring
- current.md edits
- Protected source mutation
- shell-promoter activation
- Live prediction claims
- Autonomous forecasting or action
- Any modification to files committed under this tag
