# Predictability Runtime Integration Gate — Spec/Design

## 1. Classification

| Field | Value |
|---|---|
| Gate | Runtime Integration |
| Parent gate | G (Model Stage Orchestration Boundary) |
| Sub-position | After G-3 (Adapter-to-Kernel Bridge) |
| Classification | spec / design only |
| Status | design-locked — no implementation, no runtime, no persistence |
| Author | Claude (authorized by Nick London) |
| Date | 2026-05-14 |

This document defines the rules for runtime integration. It does **not** implement runtime integration. Implementation requires explicit separate authorization.

---

## 2. Current Locked Baseline

| Field | Value |
|---|---|
| Branch | `night-build/2026-04-25` |
| HEAD | `eaf9fb0` |
| Remote | `origin/night-build/2026-04-25` — aligned |
| Tracked working tree | clean |
| Typecheck | PASS (post-G-3 session verified) |
| Full test suite | 44 files / 1273 tests / 0 failures |
| Runtime wiring | **NOT STARTED** |

### Locked Gate Inventory

| Gate | Commit / Tag | Status |
|---|---|---|
| A — Adapter spec | Tagged | Locked |
| B — Adapter type contracts | Tagged | Locked |
| C — Adapter validation | Tagged | Locked |
| D — Fixture adapter integration | Tagged | Locked |
| E — Evidence Router bridge | Spec: locked. Implementation: authorized separately | Spec-locked |
| F — Forecast audit boundary | `oracle-predictability-gate-f-forecast-audit-functions-locked` | Locked |
| G — Model Stage Orchestration spec | `oracle-predictability-gate-g-model-stage-orchestration-spec-locked` | Locked |
| G-1 — Type contracts | `oracle-predictability-gate-g-model-stage-orchestration-types-locked` | Locked |
| G-2 — Pipeline plan functions | `oracle-predictability-gate-g-model-stage-orchestration-functions-locked` | Locked |
| G-3.0 — Bridge spec | `oracle-predictability-gate-g3-adapter-kernel-bridge-spec-locked` | Locked |
| G-3.1 — Bridge type contracts | `oracle-predictability-gate-g3-adapter-kernel-bridge-types-locked` | Locked |
| G-3.2 — Bridge pure functions | `oracle-predictability-gate-g3-adapter-kernel-bridge-functions-locked` | Locked |
| G-3.3 — Gate F compatibility | `oracle-predictability-gate-g3-adapter-kernel-bridge-gate-f-tests-locked` | Locked |
| G-3.4 — Gate G-2 compatibility | `oracle-predictability-gate-g3-adapter-kernel-bridge-gate-g2-tests-locked` | Locked |
| G-3.5 — Handoff | `oracle-predictability-gate-g3-adapter-kernel-bridge-handoff-locked` | Locked |
| Post-G-3 verification handoff | `eaf9fb0` | Locked |

### Model Stage Inventory

All nine model stages are sealed as isolated pure functions. None are wired to runtime, each other, or the kernel.

| Stage | File | Status |
|---|---|---|
| M-A | `bayesian-updater-types.ts` | Pure / isolated |
| M-B | `bayesian-updater.ts` | Pure / isolated |
| M-C | `monte-carlo-scenarios-types.ts` | Pure / isolated |
| M-D | `monte-carlo-scenarios.ts` | Pure / isolated |
| M-E | `markov-regime-transitions-types.ts` | Pure / isolated |
| M-F | `markov-regime-transitions.ts` | Pure / isolated |
| M-G | `trend-baseline-comparison.ts` | Pure / isolated |
| M-H | `cycle-phase.ts` | Pure / isolated |
| M-I | `calibration-ledger.ts` | Pure / isolated |

---

## 3. Relationship to Gate E — Evidence Router Consumption

Gate E defines how live Evidence Router output may be consumed by the adapter. Its spec is locked. Its implementation was authorized separately and is the upstream boundary for any runtime integration.

**Runtime integration dependency on Gate E:**

- Evidence Router output is the entry point for any live data flowing into the adapter pipeline.
- Runtime integration may not bypass Gate E's validation contract.
- Any live evidence arriving at the adapter must have passed through Gate C's `validateThenAdaptPacket()` pipeline — this requirement does not change under runtime wiring.
- Gate E's `EvidenceRouterAdapterPacket` type is the canonical input shape at the upstream boundary. Runtime wiring must not accept raw Evidence Router output that has not been transformed through this shape.

**What Gate E does not authorize:**
Gate E authorizes the consumption *design*. It does not authorize the kernel call, model stage execution, or forecast output. Those are downstream of Gate E and are governed by this gate.

---

## 4. Relationship to Gate F — Forecast Audit Boundary

Gate F defines the audit contract for every forecast. It is locked and its functions are implemented.

**Runtime integration dependency on Gate F:**

- Every forecast execution in runtime — regardless of the pathway — must produce a `ForecastAuditModelStageLineage` record.
- No forecast result may be surfaced to any consumer (UI, API, log, downstream service) without an audit record.
- The audit record must include: which stages executed, in what order, what orchestration gate id was used, and what composition method was applied.
- Fixtures used during gate development had `stagesExecuted: []`, `orchestrationGateId: undefined`, and `compositionMethod: undefined`. Runtime integration must populate all three fields — empty is not valid in runtime context.
- Gate F's `createForecastAuditEntry` and `validateForecastAuditEntry` functions are the gate interface. Runtime wiring must call these.

**What runtime integration must not do to Gate F:**
- Must not bypass audit logging to increase speed.
- Must not produce a forecast result and defer the audit write.
- Must not modify audit types, functions, or test files inherited from Gate F.

---

## 5. Relationship to Gate G — Model Stage Orchestration

Gate G defines the composition layer between model stages M-A through M-I. Its spec, type contracts, and pipeline plan functions are locked.

**Runtime integration dependency on Gate G:**

- The nine model stages must be orchestrated in the order and with the composition method defined in Gate G-2's plan functions.
- `isModelStageOrchestrationPlanExecutable` returning `true` is a precondition for any runtime model stage call. Runtime code must check this before invoking stages.
- `assertModelStageOrchestrationSafetyFlags` must pass before any pipeline execution. Fail-closed behavior applies: if any flag fails, no stages run.
- Cross-stage data flow must follow the Gate G composition contract — no stage may receive output that was not produced by the immediately upstream stage in the defined order.
- No stage may be called in isolation in a runtime context. Stages are pure functions in isolation; in runtime they are pipeline steps and must be treated as such.

**What runtime integration must not do to Gate G:**
- Must not reorder model stages.
- Must not skip stages to improve latency.
- Must not call stages in parallel when Gate G defines sequential composition.
- Must not modify `model-stage-orchestration.ts` or `model-stage-orchestration-types.ts` without a new explicit gate.

---

## 6. Relationship to Gate G-3 — Adapter-to-Kernel Bridge

Gate G-3 is the final locked gate before runtime. It defines the pure bridge between adapter-local `PredictabilityInput` and kernel-native `PredictabilityInput`.

**Runtime integration dependency on Gate G-3:**

- `bridgeAdapterToKernelInput()` is the canonical bridge function. Runtime integration must call this function — not a copy of it, not a reimplementation of it.
- The bridge must receive a complete adapter-local `PredictabilityInput` and the required supplemented fields. Runtime integration is responsible for providing those supplemented fields from the appropriate runtime context.
- `BridgeResult.bridgeStatus` must be `'success'` before the kernel is called. If the status is `'partial'`, `'failed'`, or `'not_required'` without explicit justification, the kernel call must not proceed.
- Lossy transform records (`LossyTransformRecord[]`) produced by the bridge must be preserved in the audit trail.
- The bridge version must match the expected contract version at call time. A version mismatch must be treated as a hard failure.

**What runtime integration must not do to Gate G-3:**
- Must not modify `model-stage-orchestration-bridge.ts` or `model-stage-orchestration-types.ts` without a new explicit gate.
- Must not inline the bridge logic.
- Must not short-circuit the bridge for inputs that are "already kernel-native."
- Must not discard `BridgeFieldAudit` or `LossyTransformRecord` data.

---

## 7. Definition of Runtime Integration

**Runtime integration** is the act of connecting the locked pure-function pipeline to a live execution context such that:

1. A live evidence packet enters the adapter pipeline.
2. The adapter validates, transforms, and produces adapter-local `PredictabilityInput`.
3. Gate G-2 confirms plan executability.
4. Safety flags are asserted via Gate G.
5. The G-3 bridge transforms adapter-local input to kernel-native input.
6. The Predictability Kernel (`calculatePredictabilityForecast`) executes with kernel-native input.
7. The kernel output (`PredictabilityForecast`) flows back through `predictabilityForecastToAdapterExplanation` (Gate D path).
8. A Gate F audit record is written for the full execution.

**Runtime integration is complete** when the above eight steps execute in order, with no step skipped, no boundary violated, and all outputs verified against the contracts defined in the respective gates.

**Runtime integration is not:**
- Wiring only part of the pipeline.
- Calling the kernel directly without the bridge.
- Calling model stages without the orchestration layer.
- Running the pipeline without audit logging.
- Any of the eight steps in isolation without the full chain.

---

## 8. Non-Goals

This gate explicitly excludes the following from its scope:

| Non-goal | Reason |
|---|---|
| Wiring live Evidence Router into runtime | Gate E governs this; requires separate authorization |
| Calling Predictability Kernel from app runtime outside this gate | Not authorized until preconditions are satisfied |
| Autonomous forecasts | No self-initiated kernel calls. All execution is user- or system-triggered with audit |
| Database or storage writes beyond audit log | Not part of runtime integration definition |
| UI controls for triggering forecasts | UI layer is separate from the integration wiring |
| New API routes | Runtime wiring does not imply new routes |
| Modifying any locked gate's source files | All prior gate deliverables are frozen |
| Activating shell-promoter | Deferred; `KEEP_DEFERRED` status unchanged |
| Resonance OS integration | Separate system; out of scope |
| Obsidian vault | Out of scope |

---

## 9. Allowed Touchpoints

During runtime integration implementation (when authorized), the following touchpoints are permitted:

| Touchpoint | Allowed Action |
|---|---|
| `model-stage-orchestration-bridge.ts` | Call only — no modification |
| `model-stage-orchestration.ts` | Call `isModelStageOrchestrationPlanExecutable` and `assertModelStageOrchestrationSafetyFlags` — no modification |
| `predictability-kernel.ts` | Call `calculatePredictabilityForecast` only — no modification |
| `adapter-integration.ts` | Call `adapterPacketToPredictability` and `predictabilityForecastToAdapterExplanation` only — no modification |
| `adapter-validation.ts` | Call `validateThenAdaptPacket` only — no modification |
| Gate F audit functions | Call `createForecastAuditEntry` and `validateForecastAuditEntry` — no modification |
| New runtime wiring file (if created) | New file only — must not import or re-export locked gate internals beyond the defined call interfaces |
| New integration tests | Test the wired pipeline end-to-end against locked contracts |

No action is permitted on source files not listed above.

---

## 10. Forbidden Touchpoints

The following are unconditionally forbidden during runtime integration:

| Forbidden | Reason |
|---|---|
| Editing any model stage file (M-A through M-I) | Locked pure functions |
| Editing `model-stage-orchestration-types.ts` | Locked type contracts |
| Editing `model-stage-orchestration-bridge.ts` | Locked bridge functions |
| Editing any Gate F file | Locked audit boundary |
| Editing `types.ts` (kernel-native types) | Changes the kernel contract; requires new gate |
| Calling model stages directly from runtime wiring | Stages must be called through the orchestration layer |
| Calling the kernel without the G-3 bridge | Bridge is mandatory; direct kernel call bypasses contract |
| Bypassing Gate C validation | All input must be validated before adapter transformation |
| Writing forecast output without Gate F audit | Audit is a hard requirement, not optional |
| Skipping safety flag assertion | Fail-closed rule; no exceptions |
| Touching `current.md` | Protected session memory |
| Touching `oracle-memory/sources` | Protected memory sources |
| Touching Resonance OS | Separate system |
| Touching Obsidian vault | Out of scope |

---

## 11. Input/Output Boundary

### Entry Point

```
Live Evidence Router output
  → Gate E consumption contract (EvidenceRouterAdapterPacket)
    → Gate C: validateThenAdaptPacket()
      → Gate D: adapterPacketToPredictability()
        → Adapter-local PredictabilityInput
```

### Bridge

```
Adapter-local PredictabilityInput + supplemented fields
  → Gate G: assertModelStageOrchestrationSafetyFlags()
    → Gate G-2: isModelStageOrchestrationPlanExecutable()
      → Gate G-3: bridgeAdapterToKernelInput()
        → BridgeResult { bridgeStatus: 'success', kernelInput: KernelNativePredictabilityInput }
```

### Execution

```
KernelNativePredictabilityInput
  → calculatePredictabilityForecast()
    → PredictabilityForecast
```

### Return Path

```
PredictabilityForecast
  → predictabilityForecastToAdapterExplanation()
    → Adapter explanation output
      → Gate F: createForecastAuditEntry()
        → Audit record written
```

### Final Output

Adapter explanation output + Gate F audit record. Both required. Neither is optional.

---

## 12. Safety and Fail-Closed Rules

These rules apply unconditionally during runtime execution:

| Rule | Enforcement |
|---|---|
| Safety flags must all be `true` before pipeline execution | `assertModelStageOrchestrationSafetyFlags()` throws on any `false` flag — do not catch and continue |
| Bridge must return `bridgeStatus: 'success'` before kernel call | Check `BridgeResult.bridgeStatus` explicitly — do not assume success |
| Bridge version must match expected contract version | Version mismatch = hard failure, no fallback |
| Missing supplemented fields = bridge failure | Do not patch missing fields in the runtime layer — fail and surface the gap |
| Invalid or empty required arrays = bridge failure | No defaulting of required arrays to empty in runtime context |
| Out-of-range confidence values = bridge failure | Clamp logic belongs in the bridge contract, not the runtime layer |
| Audit log write failure = execution failure | If `createForecastAuditEntry` fails, the forecast result must not be surfaced |
| No partial pipeline execution | All eight steps must complete or none complete — no mid-pipeline results |
| No silent error swallowing | All failures must be surfaced, logged, and traceable |
| Quarantine constraint enforced | If any evidence item is in quarantine, the Markov stage (`M-F`) must enforce the quarantine constraint before stage output flows downstream |

---

## 13. Runtime Wiring Preconditions

Before any runtime wiring implementation may begin, all of the following must be true:

- [ ] This spec is committed and pushed (doc-only, no implementation).
- [ ] Separate implementation authorization is granted by Nick London.
- [ ] All nine model stages (M-A through M-I) are passing tests at HEAD.
- [ ] Gate G-3 bridge tests are passing at HEAD (172 tests: 4 test files).
- [ ] Full test suite passes at HEAD (currently 1273 / 44 files).
- [ ] Typecheck passes clean at HEAD (currently confirmed post-G-3).
- [ ] Supplemented field sources are identified: `targetDate`, `domain`, `horizon`, `trendWindows`, `landmarkEvents`, `behavioralPatterns`, `cycleWindows` — runtime context must have a defined source for each of these before wiring begins.
- [ ] Gate F `createForecastAuditEntry` integration point is confirmed available in runtime context.
- [ ] No new type errors introduced in the wiring file (narrow typecheck pass required before full suite).

If any precondition is not met, wiring must not begin.

---

## 14. Required Tests

Runtime integration implementation must be accompanied by:

| Test type | Scope |
|---|---|
| End-to-end wiring test | A single valid evidence packet flows through all eight steps and produces a verified adapter explanation + audit record |
| Fail-closed tests | Safety flag assertion failure halts execution at step 4; bridge failure halts execution at step 5; audit write failure prevents result surfacing |
| Supplemented field missing test | Missing required supplemented field produces `bridgeStatus: 'failed'` and no kernel call |
| Audit record integrity test | Produced audit record matches Gate F's `validateForecastAuditEntry` contract |
| Version mismatch test | Bridge contract version mismatch produces hard failure before kernel call |
| Quarantine constraint test | Evidence in quarantine state does not flow through M-F without the quarantine constraint being enforced |

All existing gate tests must continue to pass without modification. New tests must not modify locked test files — new test files only.

---

## 15. Typecheck and Build Requirements

| Requirement | Standard |
|---|---|
| New wiring file | Must pass narrow `tsc --noEmit` scoped to the new file and its direct imports |
| New test files | Must pass narrow `tsc --noEmit` scoped to the test files and their dependencies |
| Full typecheck | Must not introduce new type errors beyond the known pre-existing backlog (enumerated in G-3.5 handoff) |
| Full test suite | Must continue to pass at 1273+ / 44+ files / 0 failures after wiring additions |
| Build | UI build must pass after wiring additions |

The pre-existing typecheck backlog (errors in `decay-scheduler`, `shell-graduation`, `adapter-integration`, `predictability-kernel`, `trend-delta`, `cycle-analysis`, `evidence-router-adapter-types`, and `model-stage-orchestration.ts` safety flag casts) is frozen at the G-3.5 handoff state. Runtime integration must not worsen this backlog.

---

## 16. Drift Risks

| Risk | Description | Mitigation |
|---|---|---|
| Supplemented field sourcing ambiguity | `targetDate`, `domain`, `horizon`, `trendWindows`, `landmarkEvents`, `behavioralPatterns`, `cycleWindows` have no defined runtime source yet | Identify and document runtime source for each field before implementation authorization |
| Type gap widening | The pre-existing typecheck backlog may grow if runtime wiring touches files adjacent to locked errors | Narrow typecheck required before full suite; do not open locked files |
| Audit write coupling | If audit log write is tightly coupled to forecast execution, a storage failure could block all forecasts | Audit write must be fail-closed but the failure mode (throw vs. queue) requires explicit decision before implementation |
| Bridge version drift | If bridge contract version increments without updating the runtime check, version mismatch failures will appear | Bridge version constant must be referenced from a single source — do not hardcode in wiring file |
| Partial pipeline result leakage | If an error in step 6–8 is caught and the step 5 result is surfaced anyway, forecasts appear without audit | No mid-pipeline result surfacing under any error path |
| Shell-promoter activation | `KEEP_DEFERRED` status must not be changed as a side effect of runtime wiring | Explicit constraint: shell-promoter activation is forbidden in this gate |

---

## 17. Failure Modes

| Failure | What Happens | Correct Behavior |
|---|---|---|
| Safety flag assertion fails | One or more of the 13 flags is `false` | Throw. Do not proceed to bridge. Surface which flags failed. |
| Bridge returns `'partial'` | Some fields mapped, others missing or unmappable | Do not call kernel. Surface bridge errors and field audit. |
| Bridge returns `'failed'` | Critical field mapping failed | Do not call kernel. Throw or return a typed failure. |
| Bridge version mismatch | Runtime bridge contract version ≠ expected | Hard failure. Do not attempt mapping. |
| Kernel throws | `calculatePredictabilityForecast` throws for any reason | Catch, do not surface partial result, write a failure audit record, re-throw or return typed failure. |
| Audit write fails | `createForecastAuditEntry` throws or returns error | Do not surface forecast result. Surface audit failure to caller. |
| Evidence in quarantine bypasses M-F constraint | Quarantine constraint not applied | Test gate catches this; runtime wiring must not disable the test or the constraint. |
| Supplemented field not available at runtime | `targetDate`, `domain`, etc. not present in context | Bridge fails closed. Surface which fields are missing. |

---

## 18. Acceptance Criteria

Runtime integration is accepted when all of the following are true:

- [ ] A live evidence packet flows through all eight defined steps end-to-end in a test environment.
- [ ] `BridgeResult.bridgeStatus === 'success'` is observed in integration test output.
- [ ] A valid `ForecastAuditModelStageLineage` with populated `stagesExecuted`, `orchestrationGateId`, and `compositionMethod` is produced.
- [ ] Gate F's `validateForecastAuditEntry` accepts the produced audit record without errors.
- [ ] All fail-closed failure modes produce no forecast result surfacing.
- [ ] All 1273 existing tests continue to pass.
- [ ] Typecheck does not introduce new errors beyond the frozen backlog.
- [ ] UI build passes.
- [ ] No locked gate source file has been modified (confirmed by `git diff` on protected files).
- [ ] No runtime wiring has been committed without this spec being committed first.

---

## 19. Freeze Line

The following are frozen at `eaf9fb0` and must not be modified in the runtime integration gate:

```
ui/lib/oracle/predictability/model-stage-orchestration-bridge.ts
ui/lib/oracle/predictability/model-stage-orchestration-types.ts
ui/lib/oracle/predictability/model-stage-orchestration.ts
ui/lib/oracle/predictability/adapter-integration.ts
ui/lib/oracle/predictability/adapter-validation.ts
ui/lib/oracle/predictability/predictability-kernel.ts
ui/lib/oracle/predictability/types.ts
ui/lib/oracle/predictability/__tests__/model-stage-orchestration-types.test.ts
ui/lib/oracle/predictability/__tests__/model-stage-orchestration-bridge.test.ts
ui/lib/oracle/predictability/__tests__/model-stage-orchestration-bridge-gate-f.test.ts
ui/lib/oracle/predictability/__tests__/model-stage-orchestration-bridge-gate-g2.test.ts
docs/PREDICTABILITY_GATE_G3_ADAPTER_KERNEL_BRIDGE_SPEC.md
docs/PREDICTABILITY_GATE_G3_ADAPTER_KERNEL_BRIDGE_HANDOFF.md
docs/handoffs/post-g3-verification-baseline-handoff.md
oracle-memory/sources (all)
current.md
```

Any PR that modifies a file above without a new explicit gate authorization must be rejected.

---

## 20. Next Implementation Sub-stages

When implementation authorization is granted, the work should proceed in this order:

| Sub-stage | Scope | Deliverable |
|---|---|---|
| RI-0 | Supplemented field source mapping | Doc-only: identify runtime source for each of the 7 supplemented fields. No code. |
| RI-1 | Audit write coupling decision | Doc-only: decide fail-closed behavior for audit write failure (throw vs. queue). No code. |
| RI-2 | Runtime wiring type contracts | New type file only: define `RuntimeIntegrationRequest`, `RuntimeIntegrationResult`, and `RuntimeIntegrationFailure`. Pure types. |
| RI-3 | Runtime wiring pure function (no live call) | New function file: `runPredictabilityPipeline(request: RuntimeIntegrationRequest): RuntimeIntegrationResult`. Uses all locked gate interfaces. Tests against fixtures only. No live Evidence Router call. |
| RI-4 | Integration tests | New test file: end-to-end wiring tests, fail-closed tests, audit integrity tests. All using fixtures. |
| RI-5 | Live Evidence Router connection | Wire `runPredictabilityPipeline` to receive real Evidence Router output. Requires evidence that RI-3 and RI-4 pass and Gate E consumption contract is available in runtime context. |
| RI-6 | Handoff | Handoff doc for the completed runtime integration gate. |

No sub-stage may begin without the previous sub-stage being committed, pushed, and verified. No sub-stage above RI-1 may begin without explicit implementation authorization.

---

## Session Boundary

This document is the complete deliverable for the authorized doc-only task.

**No source files were edited. No tests were edited. No commits were made. No pushes were made. No tags were applied. Resonance OS was not touched. Obsidian vault was not touched. `current.md` was not edited. `oracle-memory/sources` was not touched.**

---

*Spec written by Claude under explicit doc-only authorization from Nick London, 2026-05-14.*
