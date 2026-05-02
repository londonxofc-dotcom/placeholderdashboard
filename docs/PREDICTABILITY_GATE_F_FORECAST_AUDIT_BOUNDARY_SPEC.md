# Predictability Gate F — Forecast Authorization and Audit Boundary Spec

## 1. Classification

| Field | Value |
|---|---|
| Gate | F |
| Name | Forecast Authorization and Audit Boundary |
| Classification | design/spec only |
| Implementation status | locked / not started |
| Runtime status | no runtime calls |
| Persistence status | no persistence implementation |
| UI/API/auth status | none |
| Forecast status | no live predictions |
| Date | 2026-05-02 |

---

## 2. Current Canon State

| Field | Value |
|---|---|
| Branch | `night-build/2026-04-25` |
| Gate E implementation | `8cdca70` |
| Gate E handoff | `18c5632` |
| Gate E lock tag | `oracle-predictability-gate-e-evidence-router-bridge-locked` |
| Gate E status | fully closed / pushed / tagged / audited |
| Tests | 862/862 passing |
| Build | clean |
| Drift verdict | NO DRIFT |
| Gate F implementation | locked / not started |

---

## 3. Existing Gate F Source Material

The original adapter spec (`docs/PREDICTABILITY_EVIDENCE_ROUTER_ADAPTER_SPEC.md`, lines 465–474) partially defines Gate F as "Forecast Authorization and Audit":

> **What it is:** Forecasts are logged with full lineage. User must acknowledge before results are used for decisions.
>
> **What it unlocks:** Forecasts are visible to users but require explicit acceptance.
>
> **Scope:** Create `ui/lib/oracle/adapter/audit.ts` — logs each forecast with decision, user, timestamp, and lineage.

That partial definition remains directionally correct. This spec refines the boundary after:

1. Gate E closure (evidence-router bridge now implemented and sealed).
2. Model chain M-A through M-I completion (all nine model stages sealed as pure functions).
3. Discovery of the adapter/kernel input type gap (two structurally different `PredictabilityInput` types with no bridge).

This spec does not supersede the original adapter spec's Gate F definition. It extends it with concrete boundary contracts informed by the current system state.

---

## 4. Current Boundary Map

```
Evidence Router (live output — NOT WIRED)
   │
   ▼
[Gate E] — evidence-router-bridge.ts
   │  validateRouterOutput → mapRouterOutputToAdapterPacket
   │  Output: AdapterPromptContextPacket
   │
   ▼
[Gate C] — adapter-validation.ts
   │  evaluateAdapterGate
   │  Output: AdapterValidationResult
   │
   ▼
[Gate D] — adapter-integration.ts
   │  integratePacketWithKernel → adaptPacketToKernelInput
   │  Output: adapter-local PredictabilityInput
   │
   ▼
[ORCHESTRATION GAP — NO BRIDGE EXISTS]
   │  adapter-local PredictabilityInput ≠ kernel-native PredictabilityInput
   │  No mapping function exists between these types
   │
   ▼
[Predictability Kernel] — predictability-kernel.ts
   │  calculatePredictabilityForecast(input: kernel-native PredictabilityInput)
   │  Output: PredictabilityForecast (kernel-native)
   │
   ▼
[M-A through M-I] — sealed pure-function model stages
   │  All outputs carry advisoryOnly: true
   │  No orchestration calls these stages
   │
   ▼
[Forecast Output — ADVISORY ONLY]
   │  No runtime consumer exists
   │
   ▼
[GATE F BOUNDARY — THIS SPEC]
   │  Forecast audit entry design
   │  Authorization/acknowledgment contract
   │  Lineage preservation requirements
   │
   ▼
[Gate G — NOT AUTHORIZED]
   │  Human-approved forecast surface
   │  Requires Gates A–F + 30 days audit trail + zero safety incidents
```

**Critical constraints:**

- Gate F does not close the orchestration gap.
- Gate F defines the audit contract that future orchestration must satisfy.
- Any future orchestration/type-bridge design is a separate gate concern.

---

## 5. Critical Type Gap

Two structurally different `PredictabilityInput` types exist in the codebase:

### Adapter-local PredictabilityInput (`adapter-integration.ts:35`)

```
objective: string
historicalEvents: HistoricalEvidenceEvent[]
excludedEvidenceIds: string[]
validationWarnings: AdapterWarning[]
hardConstraints: string[]
outputConstraints: { forbidAutonomousAction: boolean }
provenanceTrail: string[]
shouldTriggerMCT: boolean
```

### Kernel-native PredictabilityInput (`types.ts:86`)

```
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

- The only shared field is `objective` (both `string`).
- `historicalEvents` exists in both but with incompatible element types (`HistoricalEvidenceEvent` vs `LandmarkEvent`).
- The adapter-local type carries validation metadata (`validationWarnings`, `hardConstraints`, `outputConstraints`, `provenanceTrail`, `shouldTriggerMCT`) that the kernel-native type does not accept.
- The kernel-native type requires time-series data (`trendWindows`, `cycleWindows`, `behavioralPatterns`, `landmarkEvents`) that the adapter-local type does not produce.
- No bridge function maps between these types.

### Implications for Gate F

- Gate F must not silently conflate these types.
- Gate F audit entries must record which input type was used and whether a bridge was applied.
- Any future type bridge requires separate design authorization — it is not part of Gate F.
- If a forecast is produced using the kernel-native input without passing through the adapter pipeline, the audit entry must flag this as an unbridged execution path.

---

## 6. Gate F Purpose

Gate F defines the design boundary for forecast audit and authorization. It answers:

1. **What must an auditable forecast record contain?** — The complete lineage from evidence source through adapter pipeline through forecast output, with all safety flags preserved.

2. **What lineage must be preserved?** — Every transformation step must be traceable: evidence origin → Gate E mapping → adapter validation → adapter integration → (future) kernel execution → (future) model-stage composition → forecast output → audit entry.

3. **What authorization is required before forecast consumption?** — User acknowledgment is mandatory. No forecast may be consumed, acted upon, or displayed without explicit user acceptance. No automated consumption path may exist.

4. **What safety flags must be carried?** — `advisoryOnly`, `humanReviewRequired`, `forbidAutonomousAction`, `forbidCertaintyLanguage`, `requireAssumptions`, `requireFailureModes`, `requireProvenanceTrail`.

5. **What must never happen at this boundary?** — Autonomous action, certainty claims, canon writes, persistence writes without separate authorization, hidden execution paths, suppression of uncertainty or failure modes.

---

## 7. Gate F Non-Goals

This spec explicitly does NOT include and does NOT authorize:

- Implementation (source code of any kind)
- Test code of any kind
- Kernel runtime calls
- Model-chain orchestration
- Adapter-to-kernel type bridge
- Persistence implementation (database, schema, storage, migration)
- UI/API/auth implementation
- Calibration ledger runtime writes
- Live prediction claims
- Autonomous forecasting or action
- Certainty language
- Evidence Router live wiring
- Edits to `current.md`
- Mutations to `~/.claude/oracle-memory/sources/`
- Activation of `shell-promoter` (remains `KEEP_DEFERRED`)

---

## 8. Forecast Audit Entry — Conceptual Shape

The following is a design-only conceptual shape. It is not a TypeScript interface and not an implementation contract. Future Gate F type contracts must be separately authorized.

```
Forecast Audit Entry (conceptual)

  auditEntryId           — unique identifier for this audit record
  forecastId             — unique identifier for the forecast being audited
  createdAt              — timestamp of audit entry creation
  advisoryOnly           — must be true; forecast is advisory, not decision law
  humanReviewRequired    — must be true; no autonomous consumption
  userAcknowledgmentRequired — must be true; forecast locked until user accepts

  evidenceLineage        — trace from Evidence Router output through Gate E
  adapterPacketLineage   — trace from AdapterPromptContextPacket through Gate C
  validationLineage      — trace from Gate C validation result
  kernelInputLineage     — future only; trace from adapter-local or kernel-native input
  modelStageLineage      — future only; trace from M-A through M-I outputs

  assumptions            — all assumptions underlying the forecast
  failureModes           — conditions under which this forecast would be wrong
  uncertaintyStatement   — explicit statement of what is unknown

  forbiddenClaims        — list of claims this forecast must NOT be interpreted as
  safetyFlags            — all safety flags carried through the pipeline

  authorizationState     — one of: pending_review, acknowledged, rejected, expired
  persistenceState       — one of: in_memory_only, not_persisted
                           (no persistence implementation exists)

  inputTypePath          — which PredictabilityInput type was used:
                           adapter_local, kernel_native, or bridged
  bridgeApplied          — whether a type bridge was used (future only)
  unbridgedWarning       — flag if kernel-native input bypassed adapter pipeline
```

This shape is intentionally incomplete. Fields marked "future only" depend on orchestration and type-bridge gates that do not yet exist.

---

## 9. Lineage Requirements

Every forecast audit entry must preserve an unbroken chain from evidence source to forecast output. The required lineage points are:

| Stage | Lineage Record | Status |
|---|---|---|
| Evidence Router output | `evidenceId`, `claim`, `sourceTier`, `provenanceRefs` | Available via Gate E |
| Gate E bridge mapping | `AdapterPromptContextPacket` fields preserved | Available via Gate E |
| Gate C validation | `AdapterValidationResult` with per-item results | Available via Gate C |
| Gate D integration | `AdapterIntegrationResult` with decision, warnings, reasons | Available via Gate D |
| Adapter-local input | `PredictabilityInput` (adapter-integration.ts) | Available via Gate D |
| Type bridge | Mapping from adapter-local to kernel-native input | **NOT AVAILABLE — future gate** |
| Kernel execution | `PredictabilityForecast` (types.ts) | **NOT AVAILABLE — no orchestration** |
| Model-stage outputs | M-A through M-I results | **NOT AVAILABLE — no orchestration** |
| Calibration ledger | Brier score, calibration curve entries | **NOT AVAILABLE — no persistence** |

**Fail-closed rule:** If any required lineage point is missing at implementation time, the audit entry must record the gap explicitly. Missing lineage must never be silently omitted. A forecast with incomplete lineage must be flagged as `lineage_incomplete` and must not be presented as fully audited.

---

## 10. Authorization Model

### Core Rules

1. All forecasts remain **advisory only**. No forecast may be treated as a decision, recommendation, or action trigger.
2. **User acknowledgment** is required before any forecast is consumed, displayed, or acted upon. No automated consumption path may exist.
3. **No autonomous actions** may be derived from forecasts. No outreach, no purchases, no public-facing actions, no canon updates.
4. **No certainty claims.** All forecasts must carry explicit uncertainty statements, assumptions, and failure modes.
5. **No canon writes.** Forecasts do not modify the canonical state of any system.
6. **No persistence writes** without a separate persistence gate authorization. Audit entries exist in-memory only until a persistence layer is independently authorized.
7. **No hidden execution paths.** Every path from evidence to forecast must be traceable through the lineage chain.

### Authorization States

```
pending_review  — forecast produced, awaiting user review
acknowledged    — user has reviewed and accepted the advisory forecast
rejected        — user has reviewed and rejected the forecast
expired         — forecast has exceeded its validity window without acknowledgment
```

No state transition may occur without explicit user action. No automatic promotion from `pending_review` to `acknowledged`.

---

## 11. Persistence Boundary

Gate F may discuss audit persistence conceptually. Gate F does **not** implement persistence.

| Statement | Status |
|---|---|
| Conceptual discussion of what audit persistence would need | Allowed in this spec |
| Implementation of database, schema, storage, or migration | FORBIDDEN |
| Selection of persistence technology | FORBIDDEN in this spec |
| Design of storage schema | Allowed conceptually only — no DDL, no ORM, no migration files |
| Runtime writes to any storage | FORBIDDEN |
| File-system writes for audit logs | FORBIDDEN |

Any future persistence requires a separate gate with its own:
- Design spec
- Type contracts
- Implementation authorization
- Safety review
- Test suite
- Handoff

---

## 12. Safety Invariants

The following safety flags must be enforced at every layer of the forecast audit boundary. These are inherited from the existing adapter pipeline and model chain.

| Flag | Required Value | Source |
|---|---|---|
| `advisoryOnly` | `true` | M-C, M-E, M-H, M-I type contracts |
| `humanReviewRequired` | `true` | M-C, M-E, M-H, M-I type contracts |
| `forbidAutonomousAction` | `true` | Gate E output contract |
| `forbidCertaintyLanguage` | `true` | Gate E output contract |
| `requireAssumptions` | `true` | Gate E output contract |
| `requireFailureModes` | `true` | Gate E output contract |
| `requireProvenanceTrail` | `true` | Gate E output contract |
| `noActionRecommended` | `true` | M-C type contracts |
| No runtime ledger writes | enforced | M-I boundary |
| No live prediction claims | enforced | All gates |

If any safety flag is missing or set to a non-safe value at any point in the pipeline, the audit entry must record the violation and the forecast must be blocked from consumption.

---

## 13. Failure Modes

| ID | Failure Mode | Severity | Mitigation |
|---|---|---|---|
| F-1 | Missing evidence lineage | HIGH | Fail closed — audit entry records gap, forecast flagged `lineage_incomplete` |
| F-2 | Missing adapter lineage | HIGH | Fail closed — same as F-1 |
| F-3 | Missing validation result | HIGH | Fail closed — forecast cannot be audited without validation |
| F-4 | Adapter-local input mistaken for kernel-native input | HIGH | Audit entry must record `inputTypePath` — type confusion flagged |
| F-5 | Kernel-native input produced without bridge authorization | HIGH | `unbridgedWarning` flag set, lineage marked incomplete |
| F-6 | Forecast produced without audit entry | CRITICAL | Must not be possible — audit wraps forecast production |
| F-7 | Audit entry produced without user acknowledgment requirement | CRITICAL | `userAcknowledgmentRequired` hardcoded true at type level |
| F-8 | Autonomous action inferred from advisory output | CRITICAL | `forbidAutonomousAction` enforced, no action path exists |
| F-9 | Certainty language leaks into output | HIGH | `forbidCertaintyLanguage` enforced, uncertainty statement required |
| F-10 | Persistence implied without implementation gate | MEDIUM | `persistenceState` locked to `not_persisted` / `in_memory_only` |
| F-11 | Calibration ledger write attempted at runtime | MEDIUM | No runtime write mechanism exists; M-I is pure-function-only |
| F-12 | Model-stage output composed without orchestration spec | HIGH | No orchestration exists; `modelStageLineage` remains empty |
| F-13 | UI/API exposes forecast before audit authorization | CRITICAL | No UI/API layer exists; Gate G requires Gates A–F + 30 days |

---

## 14. Risk Analysis

| Boundary | Risk Level | Explanation |
|---|---|---|
| Gate E output → adapter validation | LOW | Gate E's `AdapterPromptContextPacket` is already validated by Gate C's `evaluateAdapterGate`. 47 tests verify the bridge. |
| Adapter validation → adapter integration | LOW | Gate D's integration functions accept validated packets. 22 tests cover this path. |
| Adapter integration → kernel input | **HIGH** | Two structurally different `PredictabilityInput` types exist with no bridge. This is the most dangerous boundary in the system. |
| Kernel input → model stages | MEDIUM | The kernel (`calculatePredictabilityForecast`) imports from `trend-delta`, `regime-shift`, `behavioral-repetition` — but does NOT call M-A through M-I stages directly. The model stages are standalone. No orchestration composes them. |
| Model-stage output → auditable forecast | **HIGH** | No orchestration exists to compose M-A→M-I outputs into a single auditable forecast. Individual stage outputs exist but are not assembled. |
| Advisory output → user-facing claim | **HIGH** | No UI surface exists. If one is built without audit infrastructure, advisory-only boundaries could be bypassed. Gate G explicitly requires 30 days of audit trail before any user-facing display. |
| Calibration ledger writes | MEDIUM | M-I functions are pure but have no runtime persistence. Any write layer requires its own gate. Risk is that a future implementer adds writes without authorization. |

---

## 15. Required Future Tests

These are test categories only. No test code is included or authorized by this spec.

| Category | Description |
|---|---|
| Audit entry shape validation | Verify audit entry contains all required fields |
| Lineage preservation | Verify unbroken chain from evidence → audit entry |
| Advisory flag enforcement | Verify `advisoryOnly: true` on all entries |
| Authorization requirement | Verify `userAcknowledgmentRequired: true` enforced |
| Forbidden action prevention | Verify no autonomous action derivable from output |
| Certainty language prevention | Verify no certainty claims in output |
| No persistence side effects | Verify no database/file/storage writes |
| No UI/API/auth dependency | Verify no import from UI/API/auth modules |
| No kernel runtime call | Verify no call to `calculatePredictabilityForecast` unless authorized by future gate |
| No M-A through M-I orchestration | Verify no direct call to model-stage functions unless authorized by future gate |
| Immutability | Verify all functions return new data, no mutation |
| Fixture-only execution | Verify all tests use hardcoded fixtures, no live computation |
| Forbidden import detection | Verify no imports from Evidence Router, kernel, or model stages |
| Failure-closed behavior | Verify missing lineage causes explicit gap recording, not silent omission |
| Input type path recording | Verify `inputTypePath` correctly identifies which PredictabilityInput was used |

---

## 16. Proposed Safe Sub-Stages

| Sub-stage | Name | Scope | Status |
|---|---|---|---|
| F-spec | Forecast audit boundary design | This document | Current |
| F-types | Forecast audit type contracts | TypeScript interfaces for audit entries, lineage records, authorization states | Future — requires authorization |
| F-pure | Forecast audit pure functions | Pure validation/formatting of audit entries from fixture data | Future — requires authorization |
| F-fixture-tests | Fixture-based audit tests | Tests using hardcoded forecast fixtures, no kernel calls | Future — requires authorization |
| F-handoff | Handoff document | Post-implementation closure | Future — requires authorization |

**Separate future concern (not part of Gate F):**

| Concern | Name | Why Separate |
|---|---|---|
| Orchestration/type-bridge design | Future orchestration gate | The adapter-local → kernel-native type bridge and model-chain orchestration are prerequisites for producing auditable forecasts but are architecturally distinct from audit. Bundling them into Gate F would violate single-responsibility and create scope creep risk. |

---

## 17. Forbidden Files and Actions

### Forbidden to Modify

- All Gate A–E implementation files
- All M-A through M-I files
- `predictability-kernel.ts`
- `adapter-validation.ts`
- `adapter-integration.ts`
- `evidence-router-adapter-types.ts`
- `evidence-router-bridge-types.ts`
- `evidence-router-bridge.ts`
- `current.md`
- `~/.claude/oracle-memory/sources/`
- `shell-promoter`
- Any UI/API/auth files
- Any persistence/database/schema/storage files
- Any log files
- `docs/PHASE_3_IMPLEMENTATION_PLAN.md`

### Forbidden Actions

- Live Evidence Router wiring
- Kernel runtime calls
- Model-chain orchestration
- Calibration ledger runtime writes
- Autonomous forecasting or action
- Certainty language or live prediction claims
- Persistence implementation
- UI/API/auth implementation
- `git add .` or `git add -A`
- Committing log files

---

## 18. Acceptance Criteria for This Spec

- [ ] One document created: `docs/PREDICTABILITY_GATE_F_FORECAST_AUDIT_BOUNDARY_SPEC.md`
- [ ] No implementation files created or modified
- [ ] No test files created or modified
- [ ] Gate E files untouched
- [ ] M-A through M-I files untouched
- [ ] Predictability kernel untouched
- [ ] Adapter files untouched
- [ ] No UI/API/auth added
- [ ] No persistence/database/schema/storage added
- [ ] No live prediction claims
- [ ] No autonomous action
- [ ] `current.md` unchanged
- [ ] `~/.claude/oracle-memory/sources/` unchanged
- [ ] `shell-promoter` unchanged (`KEEP_DEFERRED`)
- [ ] Working tree clean except expected untracked after commit
- [ ] Drift verdict remains NO DRIFT

---

## 19. Next Safe Action

After this spec is committed:

1. Post-Gate-F-spec drift audit (optional but recommended)
2. Gate F type-contract prompt (F-types) — requires separate authorization
3. Orchestration/type-bridge design gate — requires separate authorization, independent of Gate F

Gate F implementation remains locked until F-types is authorized.

---

## Document History

- **Created:** 2026-05-02
- **Purpose:** Define the forecast audit and authorization boundary after Gate E closure
- **Status:** Spec complete, Gate F implementation not authorized
- **Related:** Original adapter spec Gate F definition (lines 465–474), Gate E spec, Gate E addendum, Gate E handoff
- **Next:** User decision on Gate F type contracts or orchestration boundary design
