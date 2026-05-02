# Stage M-H Pure Functions Handoff

## Scope

Stage M-H implements the Cycle Phase Model pure functions — five exported functions that classify multi-model evidence into discrete cycle phases with calibrated confidence, transition risk, and ambiguity detection.

### Exported Functions

1. **`classifyCyclePhase(input)`** — Orchestrator. Aggregates upstream warnings, computes phase scores, applies hysteresis, detects ambiguity, computes confidence, and builds the final result.
2. **`computePhaseConfidence(phaseScore, input)`** — Multiplicative penalty chain: `confidence = phaseScore × upstreamConfidence × qualityPenalty × warningPenalty × stalenessPenalty`.
3. **`assessPhaseTransitionRisk(input, ambiguityScore)`** — Four equal-weighted components: regime transition probability, trend reversal signal, scenario dispersion, and ambiguity score.
4. **`detectPhaseAmbiguity(scores)`** — Formula: `1 - (topScore - runnerUpScore) / topScore`. Returns 1.0 when scores are tied.
5. **`buildCyclePhaseResult(params)`** — Assembles the `CyclePhaseResult` with safety flags from `CYCLE_PHASE_DEFAULT_SAFETY_FLAGS`.

### Internal Helpers

- `computePhaseScores` — Scores each of six phases based on evidence signature matching, normalizes to sum=1.
- `applyPhaseHysteresis` — Entry threshold 0.6 / retention threshold 0.4 to prevent oscillation at phase boundaries.
- `aggregateUpstreamWarnings` — Collects UPSTREAM_MISSING and LOW_CONFIDENCE warnings from input.
- `buildEvidenceSummary` — Generates hedged language summary per spec Section 9.

### Six Cycle Phases

`accumulation` | `expansion` | `distribution` | `contraction` | `recovery` | `uncertain`

## Files

| File | Purpose |
|------|---------|
| `ui/lib/oracle/predictability/cycle-phase.ts` | Pure functions implementation |
| `ui/lib/oracle/predictability/__tests__/cycle-phase.test.ts` | 68 tests covering all functions |

## M-H Locked Chain

| Artifact | Commit | Tag |
|----------|--------|-----|
| Spec | `5bd4371` | `oracle-predictability-stage-mh-cycle-phase-spec-locked` |
| Type contracts | `76926aa` | `oracle-predictability-stage-mh-cycle-phase-types-locked` |
| Type-contracts handoff | `c739e56` | — |
| Pure functions | `7bd3b7c` | `oracle-predictability-stage-mh-cycle-phase-functions-locked` |

## Tests

- Targeted M-H function tests: **113/113 passed** (68 cycle-phase + 45 cycle-phase-types)
- Full predictability suite: **522/522 passed** (20 test files)
- Build: **clean**

## Safety Boundaries

- `current.md` — untouched
- `~/.claude/oracle-memory/sources/` — untouched
- `cycle-analysis.ts` — untouched, not imported
- `shell-promoter` — remains `KEEP_DEFERRED`
- Gate E implementation — not started
- Evidence Router live wiring — absent
- Predictability Kernel runtime calls — absent
- UI/API/DB/auth changes — absent
- Live prediction claims — absent
- Autonomous forecasting/action — absent
- All results enforce `advisoryOnly: true`, `humanReviewRequired: true`, `noActionRecommended: true`

## Imports

`cycle-phase.ts` imports only from `./cycle-phase-types`. No other imports.

## Freeze Line

- Stage M-H pure functions are **sealed**.
- Stage M-I (Calibration Ledger) remains **locked**.
- Gate E (Live Evidence Router consumption) remains **locked**.
- No further changes to M-H files without explicit authorization.
