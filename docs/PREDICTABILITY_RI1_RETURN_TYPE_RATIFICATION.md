# Predictability RI-1 — RuntimePipelineResult Return Type Ratification

**Document ID:** PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION
**Stage:** RI-1 (Audit Write Coupling) — Return Type Ratification
**Status:** RATIFIED
**Created:** 2026-05-14
**Author:** Nick London (decision) / Claude Code (documentation)
**Branch:** night-build/2026-04-25

---

## 1. Purpose

This document ratifies the `RuntimePipelineResult` discriminated union shape before RI-2 type
contracts are written. It supersedes the candidate shape sketched in
`docs/PREDICTABILITY_RI1_AUDIT_WRITE_COUPLING_DECISION.md` Section 12, incorporating one
improvement: every failure branch includes `auditEntry: null` to make the result uniformly
consumable without narrowing to check auditEntry presence.

Ratification here is a gate. RI-2 may not begin until this document exists and is committed.

---

## 2. Decision Question

> What is the exact TypeScript discriminated union shape for `RuntimePipelineResult`, such that:
> - Type safety prevents callers from accessing `forecast` or `auditEntry` on failure branches
> - The compiler enforces fail-closed behavior through the return type itself
> - No partial success state exists
> - Queue/defer patterns are structurally absent from the type

---

## 3. Current Locked Baseline

| Item | State |
|---|---|
| Branch | night-build/2026-04-25 |
| HEAD | a599cd4 |
| Local/upstream | aligned |
| Runtime integration gate spec | committed, pushed |
| RI-0 readiness review | committed, pushed |
| RI-1 audit write coupling decision | committed, pushed |
| Q2 function-name correction | committed, pushed |
| Q1 supplemented field source decision | committed, pushed |
| G-3 Adapter-to-Kernel Bridge | locked, verified |
| Runtime wiring | not started |
| RI-2 type contracts | blocked pending this ratification |

---

## 4. Relationship to RI-1 Audit Write Coupling Decision

`docs/PREDICTABILITY_RI1_AUDIT_WRITE_COUPLING_DECISION.md` (commit `6b0998a`) established:

- Option D selected: block forecast output at the return-type boundary
- The wiring function returns a discriminated union; `forecast` is null on every non-success branch
- Queue/defer explicitly excluded from RI-2 through RI-6
- Audit entry creation must succeed synchronously; persistence deferred via
  `'persisted_by_future_gate'` (a Gate F-native state, not a loophole)

Section 12 of that document contained the candidate shape. This document ratifies a revised version
of that shape with one additive change: `auditEntry: null` on all failure branches.

The RI-1 main decision is not reopened by this ratification. The Option D selection, the
fail-closed principle, and the queue/defer exclusion remain in full force.

---

## 5. Relationship to Q1 Supplemented Field Source Decision

`docs/PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION.md` (commit `a599cd4`) established:

- All six supplemented fields are caller-supplied; no defaults permitted
- Missing or invalid fields cause bridge failure
- Bridge failure causes the wiring function to return `{ status: 'bridge_failed', forecast: null }`

The `bridge_failed` branch in the ratified union directly encodes this decision. The
`bridgeError` field carries the bridge's error message, which will contain the names of any missing
supplemented fields as produced by `validateAdapterInput`.

This ratification does not reopen Q1. The caller-supplied / no-defaults rule remains in full force.

---

## 6. Relationship to G-3 Adapter-to-Kernel Bridge

The G-3 bridge (`bridgeAdapterToKernelInput()`) returns a `BridgeResult` with
`bridgeStatus: 'success' | 'failed'`. The wiring function consumes this result.

The `bridge_failed` branch of `RuntimePipelineResult` maps directly to `bridgeStatus: 'failed'`.
When `bridgeStatus !== 'success'`, the wiring function must:
1. Not call the kernel
2. Not call `createForecastAuditEntry`
3. Return `{ status: 'bridge_failed', bridgeError: <bridge error message>, forecast: null, auditEntry: null }`

Bridge success is a prerequisite for audit entry creation. The union shape encodes this ordering
structurally — there is no branch where `auditEntry` is non-null without bridge success having
already occurred.

---

## 7. Candidate Result Union

The candidate shape from RI-1 Section 12 (before this ratification):

```typescript
type RuntimePipelineResult =
  | { status: 'success'; forecast: KernelOutput; auditEntry: ForecastAuditEntry }
  | { status: 'audit_creation_failed'; error: string; forecast: null }
  | { status: 'audit_validation_failed'; errors: readonly string[]; forecast: null }
  | { status: 'bridge_failed'; bridgeError: string; forecast: null }
  | { status: 'safety_flag_failed'; flagErrors: readonly string[]; forecast: null }
```

**Gap identified:** Failure branches did not include `auditEntry`. A consumer narrowing to a failure
branch would need to know, out-of-band, that `auditEntry` is unavailable on failure branches — the
type did not enforce this. Adding `auditEntry: null` to all failure branches makes the contract
self-describing and allows consumers to destructure `{ status, forecast, auditEntry }` uniformly
without conditional access patterns.

---

## 8. Ratified Result Union

**This is the authoritative shape. RI-2 must use this exactly.**

```typescript
type RuntimePipelineResult =
  | {
      status: 'success'
      forecast: KernelOutput
      auditEntry: ForecastAuditEntry
    }
  | {
      status: 'audit_creation_failed'
      error: string
      forecast: null
      auditEntry: null
    }
  | {
      status: 'audit_validation_failed'
      errors: readonly string[]
      forecast: null
      auditEntry: null
    }
  | {
      status: 'bridge_failed'
      bridgeError: string
      forecast: null
      auditEntry: null
    }
  | {
      status: 'safety_flag_failed'
      flagErrors: readonly string[]
      forecast: null
      auditEntry: null
    }
```

**Key rules encoded in this shape:**
- Only `status: 'success'` may carry a forecast.
- Only `status: 'success'` may carry an auditEntry.
- Every failure state returns `forecast: null`.
- Every failure state returns `auditEntry: null`.
- No partial success state exists.
- No forecast may escape if bridge, safety, audit creation, or audit validation fails.

---

## 9. Success Semantics

`status: 'success'` means all of the following are true:

1. Bridge completed without error (`bridgeStatus === 'success'`)
2. `createForecastAuditEntry` returned a `ForecastAuditEntry` without throwing
3. `validateForecastAuditEntry` returned zero validation errors
4. All safety flags on the audit entry are true
5. `persistenceState` has been set to `'persisted_by_future_gate'` (Gate F-native deferred
   persistence — not a loophole; audit entry creation succeeded synchronously)
6. `isForecastAuditConsumable` would return true (authorizationState acknowledged, safety flags
   true — persistenceState is not a consumability gate)

Only after all six conditions are satisfied may the wiring function return the `success` branch
with non-null `forecast` and `auditEntry`.

---

## 10. Failure Semantics

Each failure branch has a distinct status string that identifies where in the wiring sequence the
failure occurred.

### `bridge_failed`
- Cause: `bridgeAdapterToKernelInput()` returned `bridgeStatus: 'failed'`
- `bridgeError`: the bridge's error message (contains missing/invalid field names from
  `validateAdapterInput`)
- Kernel was NOT called
- `createForecastAuditEntry` was NOT called
- Both `forecast` and `auditEntry` are null

### `audit_creation_failed`
- Cause: `createForecastAuditEntry` threw an exception
- `error`: the caught error message
- Bridge succeeded (kernel was called)
- Forecast output exists internally but must NOT be returned
- `auditEntry` is null (creation failed)
- `forecast` is null (audit integrity not satisfied)

### `audit_validation_failed`
- Cause: `validateForecastAuditEntry` returned one or more validation errors
- `errors`: readonly array of validation error strings
- Bridge succeeded, audit entry was created, but entry failed structural validation
- Forecast output exists internally but must NOT be returned
- `auditEntry` is null (validation failed — entry is not trustworthy)
- `forecast` is null

### `safety_flag_failed`
- Cause: one or more safety flags on the audit entry are false
- `flagErrors`: readonly array of flag failure descriptions
- Bridge succeeded, audit entry was created and structurally valid, but safety flags indicate
  the forecast is not safe to return
- `auditEntry` is null (not safe to expose)
- `forecast` is null

---

## 11. Why Partial Forecast Output Is Rejected

A partial success state — e.g. `{ status: 'forecast_without_audit', forecast: KernelOutput }` —
was considered and rejected for the following reasons:

1. **Audit integrity is non-negotiable at Gate F.** The gate spec requires every forecast to produce
   a `ForecastAuditEntry` that passes `validateForecastAuditEntry` and has all safety flags true.
   A forecast returned without a valid audit entry would silently violate Gate F.

2. **Downstream consumers cannot compensate.** If the wiring function returns a forecast without
   an audit entry, consumers have no mechanism to retroactively create or attach one. The forecast
   would circulate in the system without audit lineage.

3. **The type must make the invariant unbreakable.** If `forecast: KernelOutput` is only reachable
   via `status: 'success'`, the TypeScript compiler prevents any consumer from accessing a forecast
   on a failure branch — not through documentation, but through type narrowing. Partial states
   break this guarantee.

4. **RI-1 Option D was selected precisely for this reason.** Option D encodes the failure contract
   in the return type. Partial states are Option B territory (return with flags) and were rejected
   in the RI-1 main decision.

---

## 12. Why All Failure States Use `forecast: null`

`forecast: null` on every non-success branch serves three purposes:

1. **Type narrowing safety.** Consumers that destructure the result can check `status === 'success'`
   once and rely on the compiler to guarantee `forecast` is non-null in that branch and null
   everywhere else. No defensive null checks scattered through consumer code.

2. **No implicit data flow.** A non-null `forecast` in a failure branch would imply the forecast
   was computed successfully but something else failed. This is dangerous — it invites callers to
   extract the forecast and ignore the failure. `null` closes that door structurally.

3. **Uniform destructuring.** `const { status, forecast, auditEntry } = result` is safe on any
   branch. Consumer code does not need to know which branches have `forecast` before accessing it.

---

## 13. Why All Failure States Use `auditEntry: null`

The improvement from the candidate shape to the ratified shape. `auditEntry: null` on all failure
branches serves two purposes:

1. **Consistent field presence.** Without `auditEntry` on failure branches, consumers accessing
   `result.auditEntry` in a failure context would get a TypeScript error (`Property 'auditEntry'
   does not exist on type ...`). This forces per-branch access patterns that obscure intent.
   With `auditEntry: null` on all branches, `result.auditEntry` is always accessible — it is
   either a `ForecastAuditEntry` (on success) or `null` (on failure).

2. **Explicit contract for logging and observability.** A failure handler that wants to log both
   `forecast` and `auditEntry` can do so with a single destructure pattern regardless of which
   failure branch fired. `auditEntry: null` is an explicit, typed signal — not an absent field
   that requires optional chaining.

---

## 14. Required RI-2 Type-Contract Implications

RI-2 must produce a new type file (pure types only, no implementation) that encodes:

1. `RuntimePipelineResult` — exactly the ratified union from Section 8. No variants.

2. `RuntimePipelineInput` — the caller-supplied input type derived from Q1:
   - `targetDate: string` (required)
   - `domain: string` (required)
   - `horizon: 'short' | 'medium' | 'long'` (required, import `Horizon` from `types.ts`)
   - `trendWindows: readonly { id, label, start, end, signalType, value, confidence }[]` (required,
     adapter-local shape only — not kernel-native)
   - `behavioralPatterns: readonly { id, triggerCondition, repeatedBehavior, observedCount,
     confidence }[]` (required, adapter-local shape only)
   - `cycleWindows: readonly { period, confidence, lastObserved }[]` (required, adapter-local shape
     only)
   - All fields required. No optional variants. No defaults.

3. `KernelOutput` and `ForecastAuditEntry` must be imported from their existing Gate-locked source
   files — not redefined in the RI-2 type file. Type imports only; no implementation imports.

4. The RI-2 type file must not activate any typecheck errors from the existing backlog (frozen at
   G-3.5). Imports must be scoped to the minimum required.

5. No `RuntimePipelineInput` optional fields. Q1 established all six supplemented fields as
   required. The type must enforce this at compile time.

---

## 15. Required Future Tests

These test requirements are recorded here for RI-4. Not implemented now.

| Test | Branch covered | Assertion |
|---|---|---|
| Bridge failure propagates correctly | `bridge_failed` | Result has `status: 'bridge_failed'`, `forecast: null`, `auditEntry: null`, `bridgeError` contains missing field name |
| Audit creation failure propagates correctly | `audit_creation_failed` | Result has `status: 'audit_creation_failed'`, `forecast: null`, `auditEntry: null`, `error` is non-empty |
| Audit validation failure propagates correctly | `audit_validation_failed` | Result has `status: 'audit_validation_failed'`, `forecast: null`, `auditEntry: null`, `errors` is non-empty array |
| Safety flag failure propagates correctly | `safety_flag_failed` | Result has `status: 'safety_flag_failed'`, `forecast: null`, `auditEntry: null`, `flagErrors` is non-empty array |
| Success returns forecast and auditEntry | `success` | Result has `status: 'success'`, `forecast` is non-null `KernelOutput`, `auditEntry` is non-null `ForecastAuditEntry` |
| No partial state exists | type-level | TypeScript compiler rejects any consumer accessing `forecast` or `auditEntry` without narrowing to `success` first |
| `auditEntry: null` is typed on failure branches | type-level | `result.auditEntry` is accessible (type `ForecastAuditEntry \| null`) on any branch without optional chaining error |

---

## 16. Failure Modes

Risks that could undermine this ratification during RI-2 or RI-3:

| Risk | Description | Mitigation |
|---|---|---|
| Union widening | RI-2 adds a `status: 'partial_success'` or similar branch | Not permitted. This document is the freeze line. Any new branch requires a new ratification doc. |
| Optional `forecast` instead of `null` | RI-2 uses `forecast?: KernelOutput` instead of `forecast: null` on failure branches | Prohibited. Optional fields allow `undefined`, which breaks uniform destructuring. Must be explicitly `null`. |
| `auditEntry` omitted from failure branches | RI-2 reverts to candidate shape without `auditEntry: null` | Prohibited. Section 13 rationale is binding. |
| `KernelOutput` redefined in RI-2 type file | Duplicate type definition diverges from Gate-locked source | RI-2 must import, not redefine. |
| Failure branch error fields made optional | e.g. `bridgeError?: string` instead of `bridgeError: string` | All error fields are required on their respective branches. Optional error fields allow silent suppression. |

---

## 17. Acceptance Criteria

This ratification is complete when all of the following are true:

- [x] Ratified union shape recorded in Section 8 of this document
- [x] All five branches enumerated with full field definitions
- [x] Success semantics defined (Section 9)
- [x] All four failure semantics defined (Section 10)
- [x] Partial forecast rejection rationale documented (Section 11)
- [x] `forecast: null` rationale documented (Section 12)
- [x] `auditEntry: null` rationale documented (Section 13)
- [x] RI-2 type-contract implications specified (Section 14)
- [x] Future test requirements recorded for RI-4 (Section 15)
- [x] Failure modes identified (Section 16)
- [ ] This document committed to `night-build/2026-04-25`
- [ ] This document pushed to `origin/night-build/2026-04-25`
- [ ] RI-2 authorization issued separately

---

## 18. Freeze Line

**This shape is frozen as of commit of this document.**

The `RuntimePipelineResult` union may not be modified after RI-2 begins without:
1. A new ratification document superseding this one
2. Explicit authorization from Nick London
3. The new document committed and pushed before RI-2 implementation proceeds

No new branches may be added. No fields may be made optional. No error fields may be removed.
`forecast: null` and `auditEntry: null` are required on all failure branches — this is not
subject to implementer discretion in RI-2 or RI-3.

---

## 19. Next Safe Action

After this document is committed and pushed:

**RI-2 — Type Contracts** becomes unblocked.

RI-2 scope:
- Create one new type file (pure types, no implementation)
- Define `RuntimePipelineInput` (all six supplemented fields required, adapter-local shapes)
- Define `RuntimePipelineResult` (exactly the ratified union from Section 8)
- Import `KernelOutput`, `ForecastAuditEntry`, `Horizon` from existing Gate-locked files
- No source edits, no test edits, no wiring, no implementation
- Separate authorization required

RI-2 remains blocked until:
- [x] Q2 committed and pushed
- [x] Q1 committed and pushed
- [ ] This ratification committed and pushed

---

*Document complete. No source files modified. No type files created. No implementation artifacts.*
