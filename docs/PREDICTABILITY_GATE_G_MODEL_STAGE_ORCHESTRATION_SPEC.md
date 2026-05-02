# Gate G: Model Stage Orchestration Boundary — Spec/Design

## 1. Title

**Gate G — Model Stage Orchestration Boundary**

Spec and design document for composing model stages M-A through M-I into an ordered pipeline, bridging the adapter-local / kernel-native type gap, and satisfying Gate F audit boundary requirements.

## 2. Classification

| Field | Value |
|---|---|
| Gate | G — Model Stage Orchestration Boundary |
| Classification | spec/design only |
| Scope | Documentation — no source code, no type contracts, no implementation |
| Branch | `night-build/2026-04-25` |
| Prerequisite gates | A (adapter spec), B (adapter types), C (adapter validation), D (fixture adapter integration), F (forecast audit boundary) |
| Prerequisite model stages | M-A, M-B, M-C, M-D, M-E, M-F, M-G, M-H, M-I (all complete as isolated pure functions) |

## 3. Current Canon State

| Component | Status | Commit/Tag |
|---|---|---|
| Adapter spec (Gate A) | Complete | Tagged |
| Adapter types (Gate B) | Complete | Tagged |
| Adapter validation (Gate C) | Complete | Tagged |
| Fixture adapter integration (Gate D) | Complete | Tagged |
| Evidence Router bridge (Gate E) | Locked — spec only authorized, not implemented | — |
| Forecast audit boundary (Gate F) | Complete — spec, types, functions, tests | `2a57451` / `oracle-predictability-gate-f-forecast-audit-functions-locked` |
| Gate F handoff | Complete | `3710e7a` |
| Existing Gate F-related tags | Unchanged; no new Gate F handoff tag created |
| Model stages M-A through M-I | Complete as isolated pure functions — no cross-stage calls, no orchestration | Individual tags |
| Predictability kernel | Monolithic — does NOT use M-A through M-I | `predictability-kernel.ts` |
| Shell-promoter | `KEEP_DEFERRED` — not activated |

### Model Stage Inventory

| Stage | File | Exported Functions | Status |
|---|---|---|---|
| M-A | `bayesian-updater-types.ts` | Type contracts | Complete |
| M-B | `bayesian-updater.ts` | `clampProbability`, `normalizeLikelihood`, `calculateBayesianPosterior`, `calculateProbabilityDelta`, `classifyBayesianEvidenceWeight`, `updateBayesianBelief` | Complete |
| M-C | `monte-carlo-scenarios-types.ts` | Type contracts | Complete |
| M-D | `monte-carlo-scenarios.ts` | `createDeterministicRandomSource`, `sampleVariable`, `runScenarioIteration`, `summarizeScenarioDistribution`, `detectTailRisk`, `calculateUncertaintyBand`, `runMonteCarloScenario` | Complete |
| M-E | `markov-regime-transitions-types.ts` | Type contracts | Complete |
| M-F | `markov-regime-transitions.ts` | `normalizeMatrixRow`, `validateTransitionMatrix`, `getTransitionRow`, `computeNextStateDistribution`, `applyConfidenceWidening`, `enforceQuarantineConstraint`, `findMostLikelyNextState`, `buildTransitionPath`, `computeMarkovTransition` | Complete |
| M-G | `trend-baseline-comparison.ts` | `validateBaselineWindows`, `computeLinearSlope`, `computeTrendDelta`, `computeAcceleration`, `classifyBaselineDirection`, `computeReversalIndicator`, `computeBaselineDeviation`, `assessDataQuality`, `computeOverallConfidence`, `computeTrendBaselineComparison` | Complete |
| M-H | `cycle-phase.ts` | `detectPhaseAmbiguity`, `computePhaseConfidence`, `assessPhaseTransitionRisk`, `buildCyclePhaseResult`, `classifyCyclePhase` | Complete |
| M-I | `calibration-ledger.ts` | `recordForecast`, `resolveOutcome`, `expireEntry`, `invalidateEntry`, `computeBrierScore`, `computeCalibrationCurve`, `computeExpectedCalibrationError`, `detectConfidenceBias`, `computeAdjustmentFactor`, `buildAggregateResult` | Complete |

## 4. Problem Statement

Nine model stages exist as isolated pure functions. Each stage has its own type contracts and implementations. No stage imports or calls any other stage. There is no composition layer that feeds data from one stage to the next.

The existing `predictability-kernel.ts` is a monolithic function that computes its own scores using direct imports from `trend-delta`, `regime-shift`, and `behavioral-repetition`. It does **not** import or use any of the M-A through M-I model stages.

Two structurally incompatible `PredictabilityInput` types exist:

1. **Adapter-local** (`adapter-integration.ts`, lines 35–44): `objective`, `historicalEvents`, `excludedEvidenceIds`, `validationWarnings`, `hardConstraints`, `outputConstraints`, `provenanceTrail`, `shouldTriggerMCT`

2. **Kernel-native** (`types.ts`, lines 86–96): `targetDate`, `domain`, `objective`, `horizon`, `historicalEvents` (different type), `trendWindows`, `landmarkEvents`, `behavioralPatterns`, `cycleWindows`

Gate F's audit boundary expects a `ForecastAuditModelStageLineage` record documenting which stages executed, in what order, with what composition method. Currently, all Gate F fixtures have `stagesExecuted: []`, `orchestrationGateId: undefined`, and `compositionMethod: undefined`.

**The gap:** There is no orchestration layer, no type bridge, and no audit trail connecting the nine model stages into a pipeline that downstream consumers (Gate F) can verify.

## 5. Current Boundary Map

```
Evidence Router (Gate E — locked)
        │
        ▼
┌─────────────────────────────┐
│  Adapter Validation (Gate C) │
│  validateThenAdaptPacket()   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Adapter Integration (Gate D)    │
│  adapterPacketToPredictability   │
│  Input()                         │
│  Output: adapter-local           │
│  PredictabilityInput             │
└──────────┬──────────────────────┘
           │
           ▼
    ╔═══════════════════╗
    ║   TYPE GAP         ║
    ║   adapter-local    ║
    ║   ≠ kernel-native  ║
    ╚═══════════════════╝
           │
           ▼
┌─────────────────────────────────┐
│  Predictability Kernel           │
│  (monolithic — does NOT use     │
│   M-A through M-I)              │
│  Input: kernel-native            │
│  PredictabilityInput             │
└──────────┬──────────────────────┘
           │
           ▼
    ╔═══════════════════════════╗
    ║   ORCHESTRATION GAP       ║
    ║   M-A through M-I exist   ║
    ║   but are never called    ║
    ║   by anything             ║
    ╚═══════════════════════════╝
           │
           ▼
┌─────────────────────────────────┐
│  Forecast Audit Boundary         │
│  (Gate F)                        │
│  Expects: modelStageLineage      │
│  with stagesExecuted,            │
│  orchestrationGateId,            │
│  compositionMethod               │
│  Currently: all empty/undefined  │
└─────────────────────────────────┘
```

## 6. Gate G Purpose

Gate G defines — in spec/design only — how to:

1. **Compose model stages M-A through M-I** into an ordered pipeline where each stage's output feeds the next stage's input.

2. **Bridge the adapter-local / kernel-native type gap** so that data flowing from the adapter layer can reach model stages without structural mismatch.

3. **Produce audit-compatible lineage** that satisfies Gate F's `ForecastAuditModelStageLineage` requirements: which stages executed, in what order, with what composition method, and what the orchestration gate ID is.

4. **Remain pure** — no I/O, no mutation, no side effects. The orchestration layer is a pure function that takes input and returns output plus lineage.

5. **Not replace the existing monolithic kernel** — Gate G defines a parallel composition path. Whether the monolithic kernel is eventually replaced, wrapped, or retired is a separate decision requiring separate authorization.

## 7. Gate G Non-Goals

Gate G explicitly does NOT:

- Implement any source code
- Create any TypeScript files
- Modify any existing files
- Wire any live Evidence Router connections
- Replace or modify `predictability-kernel.ts`
- Activate `shell-promoter` or unwire `KEEP_DEFERRED`
- Define database schemas, API endpoints, or UI components
- Perform any persistence operations
- Make any calibration ledger reads or writes at runtime
- Define or modify authorization or authentication flows
- Create git tags or push to remote
- Commit any files

## 8. Adapter-to-Kernel Type Gap

### The Two Incompatible Interfaces

**Adapter-local `PredictabilityInput`** (from `adapter-integration.ts`):

```
Fields:
  objective: string
  historicalEvents: readonly HistoricalEvidenceEvent[]
  excludedEvidenceIds: readonly string[]
  validationWarnings: readonly AdapterWarning[]
  hardConstraints: readonly string[]
  outputConstraints: { readonly forbidAutonomousAction: boolean }
  provenanceTrail: readonly string[]
  shouldTriggerMCT: boolean
```

**Kernel-native `PredictabilityInput`** (from `types.ts`):

```
Fields:
  targetDate: string
  domain: string
  objective: string
  horizon: Horizon
  historicalEvents: LandmarkEvent[]
  trendWindows: TrendWindow[]
  landmarkEvents: LandmarkEvent[]
  behavioralPatterns: BehavioralPattern[]
  cycleWindows: CycleWindow[]
```

### Gap Analysis

| Aspect | Adapter-local | Kernel-native | Gap |
|---|---|---|---|
| `objective` | Present | Present | Compatible — same type |
| `historicalEvents` | `HistoricalEvidenceEvent[]` | `LandmarkEvent[]` | Incompatible — different interfaces |
| `targetDate` | Absent | Present | Missing in adapter |
| `domain` | Absent | Present | Missing in adapter |
| `horizon` | Absent | Present (`Horizon` enum) | Missing in adapter |
| `trendWindows` | Absent | Present | Missing in adapter |
| `landmarkEvents` | Absent | Present | Missing in adapter |
| `behavioralPatterns` | Absent | Present | Missing in adapter |
| `cycleWindows` | Absent | Present | Missing in adapter |
| `excludedEvidenceIds` | Present | Absent | Not consumed by kernel |
| `validationWarnings` | Present | Absent | Not consumed by kernel |
| `hardConstraints` | Present | Absent | Not consumed by kernel |
| `outputConstraints` | Present | Absent | Not consumed by kernel |
| `provenanceTrail` | Present | Absent | Not consumed by kernel |
| `shouldTriggerMCT` | Present | Absent | Not consumed by kernel |

### Bridge Design Principle

The type bridge must:

1. Accept adapter-local input as the upstream source of truth.
2. Transform adapter-local fields into kernel-native equivalents where possible.
3. Explicitly mark fields that cannot be derived (e.g., `targetDate`, `domain`, `horizon`, `trendWindows`) as requiring supplementary input or reasonable defaults.
4. Preserve adapter-local fields that are not consumed by the kernel but are needed for audit lineage (e.g., `provenanceTrail`, `validationWarnings`).
5. Record which input path was used (`adapter_local`, `kernel_native`, or `bridged`) in the `ForecastAuditKernelInputLineage` for Gate F compatibility.
6. When the `kernel_native` path is used without a bridge, set `unbridgedWarning: true` per Gate F's bridge consistency rule.

### Proposed Bridge Strategy

Define a new `OrchestrationInput` type that:

- Accepts the adapter-local `PredictabilityInput` as its primary payload.
- Accepts optional supplementary fields (target date, domain, horizon, trend windows, etc.) that the adapter layer does not provide.
- Contains a `bridgeMetadata` field recording which fields were derived, which were supplemented, and which were defaulted.
- Is consumed by the orchestration pipeline — NOT by the existing monolithic kernel.

This avoids modifying either existing `PredictabilityInput` type. The bridge is a new layer between adapter output and orchestration input.

## 9. Model Stage Orchestration Requirements

### Pipeline Order

The model stages compose in this order:

```
Stage 1: M-A/M-B — Bayesian Updater
  Input:  Prior beliefs + evidence from adapter
  Output: Posterior beliefs, probability deltas, evidence weights

Stage 2: M-G — Trend Baseline Comparison
  Input:  Trend windows (from supplementary input or derived from historical events)
  Output: Trend deltas, acceleration, baseline direction, reversal indicators, confidence

Stage 3: M-E/M-F — Markov Regime Transitions
  Input:  Regime state (from Bayesian posterior + trend direction)
  Output: Next state distribution, transition path, confidence-widened probabilities

Stage 4: M-H — Cycle Phase
  Input:  Cycle windows (from supplementary input or derived from patterns)
  Output: Phase classification, phase confidence, transition risk

Stage 5: M-C/M-D — Monte Carlo Scenarios
  Input:  All prior stage outputs (posteriors, trends, regimes, cycles) as variable distributions
  Output: Scenario distribution, tail risk, uncertainty bands

Stage 6: M-I — Calibration Ledger
  Input:  Final forecast from Monte Carlo + historical calibration data
  Output: Calibration adjustment factor, confidence bias detection, Brier scores
```

### Stage Dependency Graph

```
M-A/M-B (Bayesian) ──┐
                      ├──→ M-E/M-F (Markov) ──┐
M-G (Trend) ─────────┘                        │
                                               ├──→ M-C/M-D (Monte Carlo) ──→ M-I (Calibration)
M-H (Cycle) ──────────────────────────────────┘
```

Key constraints:
- Bayesian and Trend can run in parallel (no mutual dependency).
- Markov depends on both Bayesian and Trend outputs.
- Cycle is independent of Bayesian, Trend, and Markov — can run in parallel with any of them.
- Monte Carlo depends on all four prior stages (Bayesian, Trend, Markov, Cycle).
- Calibration depends on Monte Carlo output.

### Inter-Stage Data Flow

Each stage must:

1. Receive its input as a read-only object — no mutation of upstream outputs.
2. Return its output as a new object — no side effects.
3. Include stage-level metadata: stage ID, execution order position, input hash (for determinism verification), output hash.
4. Report any internal validation failures as errors in the output — not as thrown exceptions.

### Composition Function Signature (Conceptual)

```
orchestrateModelStages(input: OrchestrationInput): OrchestrationResult

OrchestrationResult = {
  stageResults: Map<StageId, StageOutput>
  lineage: ForecastAuditModelStageLineage
  assembledForecast: AssembledForecast
  errors: readonly string[]
  deterministic: boolean
}
```

This is a spec-level conceptual signature — not a type contract. The actual type contracts require separate authorization (Gate G types).

## 10. Forecast Assembly Boundary

After all model stages complete, their outputs must be assembled into a single forecast result. This assembly step is NOT a model stage — it is a boundary function.

### Assembly Requirements

1. **Weighted composition** — each stage's contribution to the final forecast must be weighted. The current monolithic kernel uses: trend (0.35), landmark (0.30), behavioral (0.25), cycle (0.10). Gate G does not prescribe specific weights but requires the weights to be explicit and configurable at the type level.

2. **Forecast band mapping** — the assembled score must map to a forecast band (unlikely, possible, likely, strong) or equivalent classification. The specific thresholds are implementation detail, not spec concern.

3. **Uncertainty quantification** — the assembly must produce an uncertainty statement derived from Monte Carlo uncertainty bands and calibration adjustment factors, not from heuristic text generation.

4. **Assumption extraction** — each stage may produce assumptions (e.g., "assumes trend continues linearly"). The assembly must collect all stage-level assumptions into the forecast's assumption list for Gate F audit compatibility.

5. **Failure mode extraction** — each stage may produce failure modes (e.g., "if regime shift occurs, Bayesian posterior is stale"). The assembly must collect all stage-level failure modes for Gate F audit compatibility.

6. **Forbidden claim enforcement** — the assembly must check the assembled forecast against forbidden claims (certainty language, autonomous action recommendations) before returning.

## 11. Gate F Audit Compatibility

Gate G's orchestration output must satisfy Gate F's `ForecastAuditEntry` requirements. Specifically:

### ForecastAuditModelStageLineage Fields

| Field | Gate G Responsibility |
|---|---|
| `stagesExecuted` | Array of stage IDs in execution order — currently `[]` in all fixtures |
| `orchestrationGateId` | `'gate-g'` — identifies this orchestration boundary |
| `compositionMethod` | String describing the composition strategy (e.g., `'sequential-pipeline-v1'`) |
| `stageCount` | Number of stages executed |
| `finalStageId` | ID of the last stage in the pipeline |

### ForecastAuditKernelInputLineage Fields

| Field | Gate G Responsibility |
|---|---|
| `inputTypePath` | `'adapter_local'`, `'kernel_native'`, or `'bridged'` — records which input path was used |
| `bridgeApplied` | `true` if the type bridge was applied |
| `bridgeVersion` | Version string if bridge was applied |
| `unbridgedWarning` | `true` if `kernel_native` path was used without bridge |

### Safety Flags

Gate G does not modify or relax any of the 9 sealed safety flags. All flags remain literal `true`:

1. `advisoryOnly: true`
2. `humanReviewRequired: true`
3. `userAcknowledgmentRequired: true`
4. `forbidAutonomousAction: true`
5. `forbidCertaintyLanguage: true`
6. `requireAssumptions: true`
7. `requireFailureModes: true`
8. `requireProvenanceTrail: true`
9. `noActionRecommended: true`

The orchestration layer must pass these through unchanged. Any attempt to set a safety flag to `false` is a spec violation.

### Content Requirements for Audit Compatibility

The orchestration output must include:

- Non-empty `assumptions` array (from stage-level assumption extraction)
- Non-empty `failureModes` array (from stage-level failure mode extraction)
- Non-empty `uncertaintyStatement` (from Monte Carlo + calibration)
- Non-empty `forbiddenClaims` array (from assembly enforcement)

These are required for `isForecastAuditConsumable()` to return `true`.

## 12. Safety Invariants

### Orchestration-Level Safety

1. **Pure function boundary** — `orchestrateModelStages()` is a pure function. No I/O. No network calls. No database reads or writes. No file system access. No mutation of inputs.

2. **Deterministic execution** — given the same `OrchestrationInput`, the function must produce the same `OrchestrationResult`. If any stage uses randomness (Monte Carlo), the random source must be seeded and the seed included in the lineage.

3. **No autonomous action** — the orchestration output is advisory only. It does not trigger any action, send any message, or modify any state. `forbidAutonomousAction` remains `true`.

4. **No certainty language** — the orchestration output must not contain certainty claims ("will happen", "guaranteed", "certain"). `forbidCertaintyLanguage` remains `true`.

5. **Fail-open to safe state** — if any stage fails, the orchestration must:
   - Record the failure in the lineage (`stagesExecuted` stops at the failed stage)
   - Set `lineageComplete: false`
   - Add the failure to `lineageGaps`
   - Return a result with `authorizationState: 'not_requested'` (not consumable)
   - Never throw an exception

6. **No stage skipping** — if stage N depends on stage N-1 and stage N-1 failed, stage N must not execute. The pipeline stops at the first critical failure.

7. **Immutability chain** — each stage receives a frozen copy of upstream outputs. No stage can modify another stage's output.

### Data Safety

8. **No data fabrication** — if a required field cannot be derived from input, it must be marked as missing in `lineageGaps`, not filled with synthetic data.

9. **Provenance preservation** — the `provenanceTrail` from the adapter-local input must appear in the final audit entry. No provenance entries may be dropped.

10. **Validation warning forwarding** — `validationWarnings` from the adapter layer must be included in the orchestration output's metadata, not silently discarded.

## 13. Failure Modes

| ID | Failure Mode | Severity | Detection | Mitigation |
|---|---|---|---|---|
| FM-1 | Type bridge produces structurally invalid kernel input | CRITICAL | Type-level validation at bridge output | Bridge output validator (future Gate G implementation) |
| FM-2 | Stage N receives output from wrong stage | CRITICAL | Stage ID mismatch check in pipeline runner | Explicit stage wiring with typed connections |
| FM-3 | Monte Carlo seed not recorded — breaks determinism | HIGH | Lineage audit: check seed presence | Require seed in `OrchestrationInput`; reject seedless Monte Carlo |
| FM-4 | Calibration ledger has no historical data — adjustment factor undefined | HIGH | Empty calibration data check | Default adjustment factor to 1.0 with explicit `noCalibrationData` flag |
| FM-5 | All stages succeed but assembly fails — partial result | HIGH | Assembly error count > 0 with all stages passed | Assembly is a separate validation boundary with its own error reporting |
| FM-6 | Orchestration output missing required Gate F fields | MEDIUM | Gate F `validateForecastAuditEntry()` on orchestration output | Integration test: orchestration output → Gate F validation |
| FM-7 | Stage produces assumptions but assembly drops them | MEDIUM | Assumption count check: sum of stage assumptions ≤ assembly assumptions | Assembly must collect, not filter, stage assumptions |
| FM-8 | Bridge defaults a field that should have been explicit | MEDIUM | Bridge metadata records which fields were defaulted | Review bridge defaults in audit lineage |

## 14. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Type bridge becomes a maintenance bottleneck — every adapter change requires bridge update | Medium | High | Bridge should be thin (field mapping only, no business logic) with explicit version tracking |
| Model stage APIs evolve independently — orchestration breaks on stage signature changes | Medium | High | Pin stage APIs at type contract level; orchestration imports from type contracts, not implementations |
| Orchestration adds latency that makes real-time use impractical | Low | Medium | All stages are pure functions with no I/O — latency is CPU-bound and predictable. Benchmark at implementation. |
| Calibration ledger requires historical data that doesn't exist yet | High | Medium | Calibration stage must handle empty history gracefully — spec requires `noCalibrationData` flag |
| Monolithic kernel and orchestrated pipeline produce different results for same input | Medium | High | This is expected — they use different computation paths. Clearly document that orchestration does NOT replace the monolithic kernel. Comparison testing is a future gate. |

## 15. Required Future Tests

These tests must be written as part of Gate G implementation (type contracts + pure functions). They are NOT written as part of this spec.

### Type Bridge Tests
- Bridge accepts adapter-local input and produces valid orchestration input
- Bridge records which fields were derived, supplemented, and defaulted
- Bridge sets `inputTypePath` correctly for each path (adapter_local, kernel_native, bridged)
- Bridge sets `unbridgedWarning: true` for kernel_native without bridge
- Bridge preserves `provenanceTrail` and `validationWarnings`

### Pipeline Composition Tests
- All 6 stages execute in correct order
- Stage N receives output from stage N-1 (not from wrong stage)
- Parallel stages (Bayesian + Trend, or Cycle) can execute independently
- Pipeline stops at first critical failure — no stage skipping
- Failed pipeline produces `lineageComplete: false` and populated `lineageGaps`

### Determinism Tests
- Same input → same output (with same Monte Carlo seed)
- Different seeds → different Monte Carlo output (but same non-Monte Carlo stages)

### Immutability Tests
- No stage mutates its input
- No stage mutates another stage's output
- Orchestration function does not mutate `OrchestrationInput`

### Gate F Compatibility Tests
- Orchestration output passes `validateForecastAuditEntry()`
- Orchestration output passes `assertForecastAuditSafetyFlags()`
- Orchestration output passes `validateForecastAuditLineage()`
- `isForecastAuditConsumable()` returns `true` for valid orchestration output with `acknowledged` authorization
- `ForecastAuditModelStageLineage.stagesExecuted` is non-empty
- `ForecastAuditModelStageLineage.orchestrationGateId` is `'gate-g'`
- `ForecastAuditModelStageLineage.compositionMethod` is defined

### Safety Tests
- No forbidden imports (same pattern as Gate F: no imports from sealed modules)
- All 9 safety flags remain `true` in output
- No certainty language in uncertainty statement
- No autonomous action in output
- Fail-open behavior: failed orchestration → safe, non-consumable result

### Assembly Tests
- Assembly collects all stage-level assumptions
- Assembly collects all stage-level failure modes
- Assembly produces non-empty uncertainty statement
- Assembly enforces forbidden claim checks
- Weighted composition uses explicit, configurable weights

## 16. Proposed Safe Sub-Stages

Gate G implementation should be broken into the following sub-stages, each requiring separate authorization:

| Sub-Stage | Scope | Depends On |
|---|---|---|
| G-1: Type contracts | `OrchestrationInput`, `OrchestrationResult`, `StageOutput`, inter-stage data flow types, bridge metadata types | This spec (Gate G) |
| G-2: Type bridge | Pure function: adapter-local → orchestration input. Bridge metadata recording. | G-1 types |
| G-3: Pipeline runner | Pure function: takes `OrchestrationInput`, executes stages in order, collects results and lineage. No stage logic — just wiring. | G-1 types, G-2 bridge |
| G-4: Forecast assembly | Pure function: takes all stage results, produces assembled forecast with assumptions, failure modes, uncertainty, forbidden claims. | G-1 types, G-3 runner |
| G-5: Integration tests | Full pipeline test: adapter input → bridge → pipeline → assembly → Gate F validation. | G-1 through G-4 |
| G-6: Handoff | Documentation of what was built, what was not, and what requires next authorization. | G-1 through G-5 |

Each sub-stage follows the Oracle Gate Runner state machine (STATE 0 through STATE 10). No sub-stage may begin without explicit authorization.

## 17. Forbidden Files and Actions

### Forbidden Files (must NOT be modified)

| File | Reason |
|---|---|
| `current.md` | Protected state file |
| `~/.claude/oracle-memory/sources/*` | Protected memory sources |
| `ui/lib/oracle/predictability/predictability-kernel.ts` | Existing monolithic kernel — not replaced by Gate G |
| `ui/lib/oracle/predictability/evidence-router-bridge.ts` | Sealed — Gate E locked |
| `ui/lib/oracle/predictability/evidence-router-bridge-types.ts` | Sealed — Gate E locked |
| `ui/lib/oracle/predictability/adapter-validation.ts` | Sealed — Gate C complete |
| `ui/lib/oracle/predictability/adapter-integration.ts` | Sealed — Gate D complete |
| `ui/lib/oracle/predictability/forecast-audit-types.ts` | Sealed — Gate F complete |
| `ui/lib/oracle/predictability/forecast-audit.ts` | Sealed — Gate F complete |
| `ui/lib/oracle/predictability/bayesian-updater.ts` | Sealed — M-B complete |
| `ui/lib/oracle/predictability/bayesian-updater-types.ts` | Sealed — M-A complete |
| `ui/lib/oracle/predictability/monte-carlo-scenarios.ts` | Sealed — M-D complete |
| `ui/lib/oracle/predictability/monte-carlo-scenarios-types.ts` | Sealed — M-C complete |
| `ui/lib/oracle/predictability/markov-regime-transitions.ts` | Sealed — M-F complete |
| `ui/lib/oracle/predictability/markov-regime-transitions-types.ts` | Sealed — M-E complete |
| `ui/lib/oracle/predictability/trend-baseline-comparison.ts` | Sealed — M-G complete |
| `ui/lib/oracle/predictability/cycle-phase.ts` | Sealed — M-H complete |
| `ui/lib/oracle/predictability/calibration-ledger.ts` | Sealed — M-I complete |

### Forbidden Actions

| Action | Status |
|---|---|
| Creating or modifying any `.ts` or `.tsx` file | FORBIDDEN for this spec gate |
| Importing from sealed modules in new code | FORBIDDEN |
| Activating `shell-promoter` | FORBIDDEN |
| Unwiring `KEEP_DEFERRED` | FORBIDDEN |
| Wiring live Evidence Router | FORBIDDEN |
| Any I/O, mutation, or side effects | FORBIDDEN |
| Any UI, API, database, or auth changes | FORBIDDEN |
| Committing, tagging, or pushing | FORBIDDEN for this spec gate (requires separate authorization) |

## 18. Acceptance Criteria for This Spec

This spec is complete when:

- [ ] All 19 sections are present and non-empty
- [ ] The adapter-to-kernel type gap is fully documented with field-by-field analysis
- [ ] The model stage pipeline order and dependency graph are defined
- [ ] Inter-stage data flow requirements are specified
- [ ] Gate F audit compatibility requirements are mapped field by field
- [ ] All 9 safety flags are listed and confirmed unchanged
- [ ] Safety invariants are enumerated (minimum 10)
- [ ] Failure modes are documented with severity, detection, and mitigation
- [ ] Risk analysis covers type bridge, stage evolution, latency, calibration, and kernel divergence
- [ ] Required future tests are categorized (bridge, pipeline, determinism, immutability, Gate F compatibility, safety, assembly)
- [ ] Sub-stages for implementation are defined with dependency order
- [ ] Forbidden files and actions are listed exhaustively
- [ ] No source code files were created or modified
- [ ] No existing files were modified
- [ ] The spec file is the only new file in `git status`

## 19. Next Safe Action

1. **This spec** — review and approve (current step)
2. **Commit this spec** — requires explicit authorization (separate gate run)
3. **Gate G-1: Type contracts** — requires explicit authorization after spec commit
4. **Gate G-2 through G-5** — each requires separate explicit authorization in sequence
5. **Gate G-6: Handoff** — after all sub-stages complete

All subsequent actions remain locked until explicitly authorized.
