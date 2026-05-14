# PREDICTABILITY RI-1 — Audit Write Coupling Decision

**Sub-stage:** RI-1  
**Type:** Doc-only design decision  
**Status:** DECIDED  
**Branch:** night-build/2026-04-25  
**Baseline commit:** 3376d07  
**Date:** 2026-05-14  

---

## 1. Purpose

This document records the RI-1 design decision for how Oracle runtime integration must behave when Gate F forecast audit creation or persistence fails during future runtime wiring.

This decision must be made before RI-2 (type contracts) because the type contract for the wiring function's return value depends directly on whether a failed audit write produces a partial result, a null result, or a hard throw.

This document is doc-only. No source files, test files, or configuration files are modified here. The decision recorded in this document governs future implementation behavior in RI-2 through RI-4.

---

## 2. Decision Question

When the Oracle runtime pipeline has completed kernel execution and attempts to create or record a Gate F forecast audit entry, and that attempt fails — what must the runtime integration do?

Specifically:

> **Must the pipeline surface a completed forecast result to the caller when audit creation or persistence fails?**

The options are:
1. Throw immediately and surface no forecast result (fail-closed).
2. Queue or defer the audit write and surface the forecast result optimistically.
3. Return the forecast result with an incomplete audit marker attached.
4. Block forecast output entirely until audit compatibility is satisfied.

---

## 3. Current Locked Baseline

| Item | Value |
|---|---|
| Branch | night-build/2026-04-25 |
| HEAD | 3376d07 |
| Upstream HEAD | 3376d07 |
| Tests | 1273 passing / 44 files |
| Typecheck | PASS (pre-existing backlog frozen at G-3.5) |
| Gate G-3 | Locked and verified |
| Runtime wiring | Not started |
| RI-0 readiness review | Committed and pushed at 3376d07 |
| Runtime integration gate spec | Committed and pushed at eca964a |

The following Gate F functions are locked and must not be modified by runtime integration:

| Function | Location | Line |
|---|---|---|
| `createForecastAuditEntry` | `forecast-audit.ts` | 96 |
| `assertForecastAuditSafetyFlags` | `forecast-audit.ts` | 144 |
| `validateForecastAuditLineage` | `forecast-audit.ts` | 166 |
| `validateForecastAuditEntry` | `forecast-audit.ts` | 215 |
| `validateForecastAuditAuthorization` | `forecast-audit.ts` | 287 |
| `validateForecastAuditPersistenceBoundary` | `forecast-audit.ts` | 305 |
| `isForecastAuditConsumable` | `forecast-audit.ts` | 330 |

The `ForecastAuditPersistenceState` type has four defined values:

```
'not_persisted'
'persistence_not_authorized'
'pending_future_gate'
'persisted_by_future_gate'
```

Defined in `forecast-audit-types.ts` lines 43–49.  
`isForecastAuditConsumable` requires `authorizationState === 'acknowledged'` and all safety flags true. It does not gate on `persistenceState`.

**Open question from RI-0 (Q2):** The runtime integration gate spec references `logForecastAuditEntry` in 7 sections. This function does not exist. The correct function is `createForecastAuditEntry`. This discrepancy must be corrected in the gate spec before RI-2. It does not affect the RI-1 decision.

---

## 4. Relationship to Gate F — Forecast Audit Boundary

Gate F defines the audit contract for every forecast. Its purpose is to ensure that every forecast execution is traceable, attributable, and carries a full lineage record. Gate F is locked.

Runtime integration inherits the following requirements from Gate F:

- Every forecast execution must produce a `ForecastAuditEntry` via `createForecastAuditEntry`.
- The produced entry must pass `validateForecastAuditEntry` without errors.
- The safety flags on the entry must satisfy `assertForecastAuditSafetyFlags`.
- The persistence state must be a valid `ForecastAuditPersistenceState`.
- `isForecastAuditConsumable` is the downstream gate on whether an audit entry can be used. It requires acknowledged authorization and valid safety flags but does not require `persistenceState === 'persisted_by_future_gate'`.

Gate F does not define what the runtime pipeline does when audit creation fails. That behavior is determined here, in RI-1, constrained by Gate F's contracts.

**Critical observation:** Gate F's own `persistenceState` type includes `'pending_future_gate'` and `'persisted_by_future_gate'`. These states exist to mark entries whose persistence has been deferred to a future architectural gate. This is a Gate F-native concept — not a loophole. These states exist because persistence (writing to storage) is architecturally deferred, not because audit entry *creation* is deferrable.

The distinction that governs this decision:

- **Audit entry creation** (`createForecastAuditEntry`) — must succeed synchronously before any forecast result is surfaced.
- **Audit entry persistence** (writing to storage) — deferred by Gate F design; `'persisted_by_future_gate'` is a valid terminal state for RI-2 through RI-4.

This distinction means the RI-1 decision applies specifically to audit *creation and validation* failure, not to storage persistence deferral.

---

## 5. Relationship to G-3 Adapter-to-Kernel Bridge

Gate G-3's bridge (`bridgeAdapterToKernelInput`) is fail-closed at the bridge level: if `bridgeStatus !== 'success'`, the kernel must not be called. This is already enforced in the locked bridge contract.

The RI-1 decision is downstream of G-3: it governs what happens *after* the bridge succeeds and the kernel executes. G-3 does not affect the audit write decision, but the pattern it establishes — fail-closed at every gate boundary — is the architectural precedent that RI-1 follows.

---

## 6. Relationship to Runtime Integration Gate Spec

The runtime integration gate spec (committed at `eca964a`) states at section 10 (Fail-Closed Rules):

> "Audit log write failure = execution failure. If `logForecastAuditEntry` fails, the forecast result must not be surfaced."

And at the failure mode table:

> "Audit write fails → Do not surface forecast result. Surface audit failure to caller."

And at the risk register:

> "Audit write coupling: If audit log write is tightly coupled to forecast execution, a storage failure could block all forecasts. Audit write must be fail-closed but the failure mode (throw vs. queue) requires explicit decision before implementation."

The gate spec established the *principle* (fail-closed) but explicitly deferred the *mechanism* (throw vs. queue) to RI-1. This document resolves that deferral.

Note: The gate spec's reference to `logForecastAuditEntry` is an error — the correct function is `createForecastAuditEntry`. The principle stated in the gate spec is correct regardless of the naming discrepancy.

---

## 7. Options Considered

### Option A — Throw / Fail Closed

When audit entry creation, validation, or the call to `createForecastAuditEntry` fails, the wiring function throws synchronously. No forecast result is returned. The caller receives an error.

**Behavior:** Forecast execution halts. No partial result. No deferred operation. Error propagates to caller immediately.

---

### Option B — Queue / Defer Audit Write

When audit entry creation or persistence fails, the failure is captured in a queue or retry mechanism. The forecast result is returned to the caller optimistically. The audit write is retried asynchronously.

**Behavior:** Forecast result is surfaced. Audit write is eventually consistent. Audit and forecast become temporarily decoupled.

---

### Option C — Return Forecast With Incomplete Audit Marker

When audit entry creation or persistence fails, the wiring function returns a result object that contains the forecast output alongside an explicit marker indicating the audit record is incomplete or unavailable.

**Behavior:** Caller receives forecast. Caller receives audit failure signal simultaneously. Caller is responsible for deciding whether to use the forecast.

---

### Option D — Block Forecast Output Until Audit Compatibility Satisfied

No forecast result is returned to the caller under any circumstance unless a valid `ForecastAuditEntry` has been created and passes `validateForecastAuditEntry`. If audit creation fails, no result is returned — not even a partial one.

**Behavior:** Forecast result is strictly gated on audit entry validity. Fail-closed at the output boundary, not at the throw boundary. The wiring function returns an explicit failure result (not a throw) when audit compatibility is not met.

---

## 8. Evaluation Criteria

### Safety

| Option | Assessment |
|---|---|
| A — Throw | High safety. No forecast escapes without a valid audit. Exception: throw may be caught and suppressed by callers. |
| B — Queue/defer | Low safety. Forecast and audit become decoupled. Audit record may never be written. |
| C — Incomplete marker | Medium safety. Forecast escapes without a complete audit. Relies on caller discipline. |
| D — Block at output | Highest safety. Forecast cannot escape unless audit entry is valid. Return type enforces the contract without relying on throw/catch mechanics. |

### Auditability

| Option | Assessment |
|---|---|
| A — Throw | Full auditability of successful paths. Failed paths produce no audit record and no forecast, which is traceable but not auditable. |
| B — Queue/defer | Auditability at risk. Deferred writes may fail silently. Forecast provenance becomes uncertain. |
| C — Incomplete marker | Partial auditability. Forecast exists with a known-incomplete audit. This is an inconsistent state. |
| D — Block at output | Full auditability. Every surfaced forecast has a validated audit entry. Failed audit = no surfaced forecast. |

### Determinism

| Option | Assessment |
|---|---|
| A — Throw | Deterministic per call. Throw is synchronous and non-conditional. |
| B — Queue/defer | Non-deterministic. Audit write outcome is eventually consistent. |
| C — Incomplete marker | Deterministic output type but non-deterministic audit state. |
| D — Block at output | Fully deterministic. Return type is a discriminated union: success (forecast + audit) or failure (no forecast, error description). |

### Operational Usability

| Option | Assessment |
|---|---|
| A — Throw | Operational behavior depends on caller error handling. Storage failures block all forecasts — no partial degradation possible. |
| B — Queue/defer | High usability during storage outages. At the cost of audit integrity. |
| C — Incomplete marker | Usable but shifts responsibility to caller. Risk of caller ignoring the incomplete marker. |
| D — Block at output | Storage outages block forecasts. This is the intended behavior: Oracle does not guess when it cannot audit. |

### Failure Transparency

| Option | Assessment |
|---|---|
| A — Throw | Transparent at the throw site. May become opaque if caller catches and swallows. |
| B — Queue/defer | Opaque. Audit failure is deferred and may never surface. |
| C — Incomplete marker | Transparent to callers who inspect the marker. Opaque to callers who ignore it. |
| D — Block at output | Maximally transparent. Failure is encoded in the return type. Caller cannot receive a forecast without also receiving the audit result. |

### Testability

| Option | Assessment |
|---|---|
| A — Throw | Testable via try/catch in test harness. Standard pattern. |
| B — Queue/defer | Requires async test infrastructure, eventual consistency helpers. Complexity increases substantially. |
| C — Incomplete marker | Testable. Requires tests that verify caller behavior on incomplete marker — adds surface area. |
| D — Block at output | Highly testable. Discriminated union return type allows exhaustive pattern matching. Tests verify both success and failure branches via return value inspection. |

### Implementation Complexity

| Option | Assessment |
|---|---|
| A — Throw | Low complexity. Throw at the failure site. |
| B — Queue/defer | High complexity. Requires queue infrastructure, retry logic, consistency guarantees, eventual persistence verification. |
| C — Incomplete marker | Medium complexity. Requires a result type with an audit status field. |
| D — Block at output | Low-to-medium complexity. Requires a discriminated union return type for the wiring function. No queue infrastructure. No async mechanisms. |

---

## 9. Recommended Decision

**Option D — Block forecast output until audit compatibility is satisfied.**

**No completed forecast result is returned to the caller unless a valid `ForecastAuditEntry` has been created and passes `validateForecastAuditEntry`.**

If audit entry creation or validation fails, the wiring function returns an explicit failure result with an audit error description. The forecast kernel output is not surfaced. No partial result is returned.

Queue and defer mechanisms are explicitly excluded from RI-2 through RI-6 scope. If a queue/defer recovery mechanism is ever needed, it must be defined as a separate, explicit architectural gate — not as a fallback behavior inside the runtime wiring function.

---

## 10. Rationale

Oracle's value proposition depends entirely on the integrity of its audit trail. A forecast without a valid audit entry is not a forecast — it is an unattributed output. Surfacing an unaudited forecast, even with a marker, opens a path for callers to consume outputs that cannot be traced, reviewed, or challenged.

The distinction between Option A (throw) and Option D (block at output) is meaningful:

- **Throw** relies on the exception handling discipline of the caller. A caller that wraps the wiring call in a broad try/catch can receive no forecast and no audit, with no clear signal about *why*. The failure is opaque at the call site unless the caller inspects the thrown error specifically.
- **Block at output** encodes the failure in the return type. The wiring function's return type is a discriminated union. The caller cannot obtain a forecast value without also handling the audit-failure branch. The type system enforces the contract. There is no mechanism for the caller to accidentally ignore the failure.

The `ForecastAuditPersistenceState` type already includes `'persisted_by_future_gate'` and `'pending_future_gate'`. These states exist precisely because Gate F was designed knowing that persistence to storage would be deferred. This means the RI-1 decision applies specifically to **audit entry creation and validation**, not to storage persistence. The wiring function must:

1. Call `createForecastAuditEntry` — if this fails, block and return failure.
2. Call `validateForecastAuditEntry` on the created entry — if this fails, block and return failure.
3. Set `persistenceState` to `'persisted_by_future_gate'` — this is valid by Gate F contract.
4. Only after steps 1–3 succeed: surface the forecast result alongside the audit entry.

This separation means that storage outages do not block the creation of audit entries — only the persistence of them. The audit entry is in-memory and complete before any forecast result is surfaced. Persistence to storage is a separate, future-gated concern.

**Decision bias applied:** Fail-closed unless a safer explicit queue/defer contract can be fully specified without weakening Gate F audit guarantees. No such contract was specified. Option D was chosen.

---

## 11. Rejected Alternatives

### Option B — Queue / Defer Audit Write — Rejected

Reason: Decouples forecast output from audit integrity. A surfaced forecast may have no corresponding audit record if the queue drains asynchronously or the retry mechanism fails. This weakens Gate F's contract at the runtime boundary. The architectural complexity of a queue — retry logic, durability guarantees, consistency verification — is not justified given that Gate F already provides a persistence deferral mechanism (`'persisted_by_future_gate'`) that does not require a queue.

Queue/defer is not prohibited in all future contexts. It is prohibited as a mechanism inside RI-2 through RI-6. If it is needed later, it requires a separate explicit gate definition.

### Option A — Throw / Fail Closed — Considered but superseded by D

Reason: Option A is functionally equivalent to Option D for well-behaved callers. Option D is preferred because it encodes the failure contract in the return type rather than the exception path. This makes the contract inspectable by the type checker and testable without exception handling machinery. Option A is not wrong — it is a weaker version of Option D.

### Option C — Return Forecast With Incomplete Audit Marker — Rejected

Reason: Surfaces a forecast result without a valid audit entry. The incomplete marker shifts responsibility to the caller. Callers may ignore the marker. The type contract does not prevent consumption of an unaudited forecast. This is incompatible with Gate F's purpose.

---

## 12. Required Future Implementation Behavior

The RI-2 type contract for the runtime wiring function must encode the following:

**Return type:** A discriminated union. Approximately:

```
type RuntimePipelineResult =
  | { status: 'success'; forecast: KernelOutput; auditEntry: ForecastAuditEntry }
  | { status: 'audit_creation_failed'; error: string; forecast: null }
  | { status: 'audit_validation_failed'; errors: readonly string[]; forecast: null }
  | { status: 'bridge_failed'; bridgeError: string; forecast: null }
  | { status: 'safety_flag_failed'; flagErrors: readonly string[]; forecast: null }
```

The exact type names and shape are determined in RI-2. The constraint here is:
- `forecast` must be `null` (or absent) on every non-success branch.
- `auditEntry` must be present on the `success` branch.
- There must be no branch where both `forecast` is non-null and `auditEntry` is absent.

**Wiring sequence for audit (RI-3 implementation target):**

1. After kernel execution produces output:
2. Call `createForecastAuditEntry(...)` → if throws or returns invalid shape, return `audit_creation_failed`.
3. Call `validateForecastAuditEntry(entry)` → if `errors.length > 0`, return `audit_validation_failed`.
4. Set `persistenceState` to `'persisted_by_future_gate'` on the entry (valid by Gate F contract).
5. Only after step 3 passes: return `{ status: 'success', forecast: kernelOutput, auditEntry: entry }`.

**`logForecastAuditEntry` note:** The runtime integration gate spec references `logForecastAuditEntry` in 7 sections. This function does not exist. The correct function is `createForecastAuditEntry`. The gate spec must be corrected before RI-2 type contracts are written. This correction requires separate authorization.

---

## 13. Required Future Tests

The following test types must be present in RI-4. These are requirements — not implementation instructions for this stage.

| Test | Description |
|---|---|
| Audit creation success | Audit entry created and validated; forecast surfaced with audit entry in `success` branch. |
| Audit creation failure | `createForecastAuditEntry` fails (invalid input); result is `audit_creation_failed`; `forecast` is null. |
| Audit validation failure | Entry created but `validateForecastAuditEntry` returns errors; result is `audit_validation_failed`; `forecast` is null. |
| No forecast without valid audit | In all failure branches, verify `forecast` field is null — exhaustive across all discriminant values. |
| Persistence state deferral | Successful path produces entry with `persistenceState === 'persisted_by_future_gate'`; this is valid. |
| `isForecastAuditConsumable` alignment | Successful path entry passes `isForecastAuditConsumable` (acknowledged auth + valid safety flags). |
| Safety flag failure propagation | Safety flag failure from step 4 of the pipeline produces `safety_flag_failed`; no audit entry created; no forecast. |
| Bridge failure propagation | G-3 bridge failure produces `bridge_failed`; audit entry not created; no forecast. |

All tests must use fixtures. No live data. No actual storage writes.

---

## 14. Failure Modes

| Failure Mode | Cause | Required Behavior | Forecast Surfaced? |
|---|---|---|---|
| `createForecastAuditEntry` throws | Invalid input fields, type contract violation | Return `audit_creation_failed`; include error string | No |
| `validateForecastAuditEntry` returns errors | Entry fields fail validation | Return `audit_validation_failed`; include error list | No |
| Safety flags not all true | Safety assertion fails before kernel call | Return `safety_flag_failed`; abort before audit creation | No |
| Bridge returns non-success | G-3 bridge status is not `'success'` | Return `bridge_failed`; abort before kernel call; abort before audit creation | No |
| Kernel execution throws | Kernel internal error | Return kernel-specific error variant; no audit created | No |
| Storage write fails (future gate) | Storage layer unavailable | Not applicable in RI-2 through RI-4; `persistenceState` deferred to `'persisted_by_future_gate'` | Forecast surfaced with deferred persistence |

The storage write failure row reflects Gate F's existing `'persisted_by_future_gate'` deferral design. Storage persistence is not in scope for RI-2 through RI-4. When it becomes in scope at a future gate, that gate must define its own fail-closed behavior for storage failures — separately authorized.

---

## 15. Acceptance Criteria

RI-1 is complete when this document is committed and pushed. No source changes, test changes, or implementation artifacts are required for RI-1 completion.

RI-2 readiness requires:

- [ ] This document committed and pushed.
- [ ] Gate spec corrected: `logForecastAuditEntry` → `createForecastAuditEntry` in all 7 sections (requires separate authorization — RI-2 blocker Q2 from RI-0 review).
- [ ] Supplemented field sources defined for `targetDate`, `domain`, `horizon`, `trendWindows`, `behavioralPatterns`, `cycleWindows` (RI-2 blocker Q1 from RI-0 review).
- [ ] This document's return type shape ratified by Nick London before RI-2 type contracts are written.

The discriminated union return type shape in Section 12 is a design sketch. The canonical type is defined in RI-2. Nick London must confirm the shape before RI-2 begins.

---

## 16. Freeze Line

The following files are frozen and must not be touched during RI-1 through RI-6 except as specified in the runtime integration gate spec:

```
ui/lib/oracle/predictability/forecast-audit.ts
ui/lib/oracle/predictability/forecast-audit-types.ts
ui/lib/oracle/predictability/model-stage-orchestration-bridge.ts
ui/lib/oracle/predictability/model-stage-orchestration-types.ts
ui/lib/oracle/predictability/predictability-kernel.ts
ui/lib/oracle/predictability/gate-e-validation.ts
ui/lib/oracle/predictability/evidence-router-adapter.ts
ui/lib/oracle/predictability/evidence-router-adapter-types.ts
```

All test files in `ui/lib/oracle/predictability/` are frozen until RI-4, at which point new test files may be added (not existing ones modified).

This document does not modify any of the above files.

---

## 17. Next Safe Action

**RI-1 is complete** upon commit and push of this document.

The next sequential actions before RI-2 can begin:

1. **AUTHORIZE ORACLE COMMIT** — commit `docs/PREDICTABILITY_RI1_AUDIT_WRITE_COUPLING_DECISION.md` only.
2. **AUTHORIZE ORACLE PUSH** — push `night-build/2026-04-25` only.
3. **AUTHORIZE ORACLE CORRECTION TASK** — correct `logForecastAuditEntry` → `createForecastAuditEntry` in `docs/PREDICTABILITY_RUNTIME_INTEGRATION_GATE_SPEC.md` (7 occurrences). Doc edit only. Requires separate authorization. Commit and push separately.
4. **Supplemented field source decision** — Nick London defines runtime context sources for the 6 supplemented fields (Q1 from RI-0 review). This may be a doc-only task or a direct decision recorded in the RI-2 type contract document.
5. **Return type shape ratification** — Nick London confirms or modifies the discriminated union sketch in Section 12 before RI-2 type contracts are written.
6. **AUTHORIZE ORACLE DOC-ONLY TASK** — RI-2: type contracts for the runtime wiring function.

RI-2 must not begin until steps 1–5 above are complete.
