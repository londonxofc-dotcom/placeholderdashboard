# Predictability RI-3 — Runtime Pipeline Function Spec

**Document ID:** PREDICTABILITY_RI3_RUNTIME_PIPELINE_FUNCTION_SPEC
**Stage:** RI-3 (Runtime Pipeline — Function Orchestration Contract)
**Status:** SPEC — implementation not yet authorized
**Created:** 2026-05-14
**Author:** Nick London (authorization) / Claude Code (documentation)
**Branch:** night-build/2026-04-25

---

## 1. Purpose

This document specifies the exact orchestration contract for `runPredictabilityRuntimePipeline`,
the runtime wiring function whose type signature was established in RI-2. The function is not yet
implemented. This spec is the gate that unblocks RI-4 (tests against fixtures) and, after RI-4,
RI-5 (live implementation).

This document:
- Names the function and its exact TypeScript signature
- Specifies the ordered execution sequence (5 steps, fail-closed)
- Specifies the exact return value for each result branch
- Identifies all functions the wiring function is authorized to call
- Documents naming discrepancies between gate spec and codebase
- Records what the wiring function must not do
- Describes the fixture-based test model for RI-4

RI-3 is a pure orchestration contract document. It does not contain implementation. It does not
authorize implementation. Implementation requires a separate `AUTHORIZE ORACLE IMPLEMENTATION TASK`.

---

## 2. Repo / Branch / HEAD at Spec Authorship

| Item | Value |
|---|---|
| Repo | `/Users/Malachi/Missipn Control Builder Agent` |
| Branch | `night-build/2026-04-25` |
| RI-2 commit | `bccc0d4` (runtime-pipeline-types.ts, tests) |
| RI-2 handoff commit | `42617a2` (ri2-runtime-pipeline-types-handoff.md) |
| Runtime implementation | not started |

---

## 3. Authoritative Prior Documents

This spec is derived from the following documents, all committed and pushed:

| Document | Commit | Key contribution |
|---|---|---|
| `docs/PREDICTABILITY_RUNTIME_INTEGRATION_GATE_SPEC.md` | prior to RI-0 | 8-step execution model, allowed/forbidden touchpoints, fail-closed rules |
| `docs/PREDICTABILITY_RI0_RUNTIME_INTEGRATION_READINESS_REVIEW.md` | prior to RI-1 | All Gate A–G-3 confirmed locked; Gate F function line numbers |
| `docs/PREDICTABILITY_RI1_AUDIT_WRITE_COUPLING_DECISION.md` | `6b0998a` | Option D selected; audit wiring sequence; persistence state semantics |
| `docs/PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION.md` | `131e2a2` | Ratified 5-branch discriminated union; success conditions; failure semantics |
| `docs/PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION.md` | `a599cd4` | All 6 supplemented fields caller-supplied; bridge enforces required at runtime |
| `docs/handoffs/ri2-runtime-pipeline-types-handoff.md` | `42617a2` | RI-2 type contracts; naming resolution; RI-3 risks |
| `ui/lib/oracle/predictability/runtime-pipeline-types.ts` | `bccc0d4` | Frozen type contracts — input and result |

---

## 4. Function Signature

```typescript
export function runPredictabilityRuntimePipeline(
  input: RuntimePipelineInput
): RuntimePipelineResult
```

- **Import location (future):** `ui/lib/oracle/predictability/runtime-pipeline.ts` (new file — does not yet exist)
- **Input type:** `RuntimePipelineInput` from `./runtime-pipeline-types`
- **Return type:** `RuntimePipelineResult` from `./runtime-pipeline-types`
- **Pure:** No side effects. No mutation of input. No I/O.
- **Synchronous:** Returns `RuntimePipelineResult` directly (no `Promise<...>`).

All 7 fields of `RuntimePipelineInput` are `readonly` and required. The function may not default,
infer, or generate any value for any field. All 6 supplemented fields are caller-supplied.

---

## 5. Naming Discrepancy — Gate Spec vs RI-2

The gate spec (Section 20) names:
- Function: `runPredictabilityPipeline`
- Input type: `RuntimeIntegrationRequest`
- Return type: `RuntimeIntegrationResult`

These names predate RI-2. The RI-2 type contracts established the authoritative names:
- Function: `runPredictabilityRuntimePipeline`
- Input type: `RuntimePipelineInput`
- Return type: `RuntimePipelineResult`

RI-3 and all subsequent stages use the RI-2 names. The gate spec names are documentation
artifacts only and must not appear in the codebase.

---

## 6. Naming Discrepancy — `BridgeResult.success` vs `bridgeStatus`

The RI-1 decision documents and gate spec describe checking `bridgeStatus: 'success' | 'failed'`
on the bridge result. The actual `BridgeResult` interface in
`ui/lib/oracle/predictability/model-stage-orchestration-types.ts` uses:

```typescript
export interface BridgeResult {
  readonly success: boolean          // ← boolean field, not a string status
  readonly kernelInput?: { ... }     // optional — only present when success === true
  readonly bridgeContract: AdapterToKernelBridgeContract
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly fieldAudit: BridgeFieldAudit
}
```

Note: `bridgeStatus` appears on `BridgeResult.bridgeContract` (an `AdapterToKernelBridgeContract`
sub-object), not on `BridgeResult` itself.

**The wiring function must check `bridgeResult.success` (boolean), not `bridgeResult.bridgeStatus`.**

When bridge fails (`bridgeResult.success === false`):
- Error message for `bridgeError` field: `bridgeResult.errors.join('; ')` or
  `bridgeResult.errors[0]` — use `errors` array on `BridgeResult`, not a `bridgeStatus` string.

When bridge succeeds (`bridgeResult.success === true`):
- `bridgeResult.kernelInput` is defined and contains the kernel-native input.
- Pass `bridgeResult.kernelInput` to `calculatePredictabilityForecast`.

---

## 7. Naming Discrepancy — `KernelOutput` Does Not Exist

The RI-1 return type ratification (Section 8) uses `KernelOutput` as a placeholder for the
forecast type. This type does not exist in the codebase.

The actual forecast type is `PredictabilityForecast`, exported from
`ui/lib/oracle/predictability/types.ts` and returned by `calculatePredictabilityForecast`.

`runtime-pipeline-types.ts` already uses `PredictabilityForecast` correctly. The wiring function
implementation must also use `PredictabilityForecast`. `KernelOutput` must not be imported,
defined, or referenced anywhere in the codebase.

---

## 8. Authorized Functions

The wiring function may call only the following functions. Calling any other function is a
boundary violation requiring a new gate document.

| Function | Source file | Import path | Purpose in wiring |
|---|---|---|---|
| `bridgeAdapterToKernelInput` | `model-stage-orchestration-bridge.ts` | `./model-stage-orchestration-bridge` | Convert adapter-local input to kernel-native input |
| `calculatePredictabilityForecast` | `predictability-kernel.ts` | `./predictability-kernel` | Run kernel forecast computation |
| `createForecastAuditEntry` | `forecast-audit.ts` | `./forecast-audit` | Construct the audit entry |
| `validateForecastAuditEntry` | `forecast-audit.ts` | `./forecast-audit` | Full structural validation of audit entry |
| `assertForecastAuditSafetyFlags` | `forecast-audit.ts` | `./forecast-audit` | Check all 9 safety flags are true |

No other functions from any source file may be called by the wiring function in RI-3 through RI-6.

Note: `isForecastAuditConsumable` (also in `forecast-audit.ts`) is NOT in the authorized call
list. The wiring function uses `assertForecastAuditSafetyFlags` for the safety flag check.
`isForecastAuditConsumable` additionally gates on `authorizationState === 'acknowledged'`, which
is a consumer-side concern, not a wiring-function concern. The audit entry is constructed by the
wiring function with default `authorizationState: 'pending_user_acknowledgment'` — calling
`isForecastAuditConsumable` at wiring time would always return false on the authorization gate.

---

## 9. Execution Sequence — 5 Steps, Fail-Closed

The wiring function executes in exactly this order. No step may be skipped. No step may be
reordered. Each failure terminates execution immediately and returns the corresponding result branch.

```
Step 1: Bridge
  → bridgeAdapterToKernelInput(adapterInput)
  → if bridgeResult.success === false: return bridge_failed

Step 2: Kernel
  → calculatePredictabilityForecast(bridgeResult.kernelInput)
  → forecast computed (not yet returned)

Step 3: Audit Creation
  → createForecastAuditEntry({ ...lineage data, persistenceState: 'not_persisted' })
  → if throws: return audit_creation_failed
  → audit entry created (not yet returned)

Step 4: Audit Validation
  → validateForecastAuditEntry(auditEntry)
  → if validation.errors.length > 0: return audit_validation_failed

Step 5: Safety Flags
  → assertForecastAuditSafetyFlags(auditEntry.safetyFlags)
  → if flagResult.errors.length > 0: return safety_flag_failed

  → All conditions passed:
  → Set persistenceState: 'persisted_by_future_gate' on audit entry
  → return success
```

This is the only valid execution path. The function is fail-closed at every step.

---

## 10. Building the Adapter Input

Before Step 1 (bridge call), the wiring function must construct the adapter-local input object
from `RuntimePipelineInput`. This object is passed to `bridgeAdapterToKernelInput`.

The adapter input (`ModelStageOrchestrationInput`) has supplemented fields typed as optional at
the TypeScript level. The wiring function must supply all 6 supplemented fields from the caller
via `RuntimePipelineInput`. The bridge enforces non-empty at runtime.

**Mapping from `RuntimePipelineInput` to adapter input:**

| RuntimePipelineInput field | Adapter input field | Notes |
|---|---|---|
| `input.objective` | `objective` | Pass directly |
| `input.targetDate` | `targetDate` | Pass directly — ISO 8601 string |
| `input.domain` | `domain` | Pass directly — non-empty string |
| `input.horizon` | `horizon` | Pass directly — `'short' \| 'medium' \| 'long'` |
| `input.trendWindows` | `trendWindows` | Adapter-local shape — bridge enriches |
| `input.behavioralPatterns` | `behavioralPatterns` | Adapter-local shape — bridge enriches |
| `input.cycleWindows` | `cycleWindows` | Adapter-local shape — bridge enriches |

The wiring function must NOT transform, enrich, or default any of these values. Pass them
unchanged from `RuntimePipelineInput` to the adapter input.

---

## 11. Step 1 — Bridge Call

```typescript
const bridgeResult = bridgeAdapterToKernelInput(adapterInput)

if (!bridgeResult.success) {
  return {
    status: 'bridge_failed',
    bridgeError: bridgeResult.errors.join('; '),
    forecast: null,
    auditEntry: null,
  }
}
```

- Check `bridgeResult.success` (boolean field on `BridgeResult`).
- Do NOT check `bridgeResult.bridgeStatus` — that field is on `bridgeResult.bridgeContract`, not on `bridgeResult` directly.
- `bridgeResult.errors` is a `readonly string[]` on `BridgeResult` — available whether success or failure.
- If `bridgeResult.errors` is empty on failure, `bridgeError` may be set to a fallback string (e.g. `'bridge failure: no error detail'`).
- On success, `bridgeResult.kernelInput` is defined and must be passed to Step 2.

**Early return:** Kernel is NOT called if bridge fails. Audit is NOT called if bridge fails.

---

## 12. Step 2 — Kernel Call

```typescript
const forecast = calculatePredictabilityForecast(bridgeResult.kernelInput!)
```

- `bridgeResult.kernelInput` is defined at this point (bridge succeeded).
- `calculatePredictabilityForecast` takes `PredictabilityInput` (kernel-native type) and returns
  `PredictabilityForecast`.
- The function does not throw under normal operation; it returns a result with warnings.
- `forecast` must not be returned until Steps 3–5 complete successfully.

---

## 13. Step 3 — Audit Entry Creation

```typescript
let auditEntry: ForecastAuditEntry
try {
  auditEntry = createForecastAuditEntry({
    auditEntryId: /* caller-generated or derived unique ID */,
    forecastId:   /* derived from forecast or generated */,
    createdAt:    /* current ISO timestamp */,
    evidenceLineage:      /* from adapterInput.evidenceLineage */,
    adapterPacketLineage: /* constructed from adapter input */,
    validationLineage:    /* from bridge result */,
    kernelInputLineage:   /* from bridgeResult.kernelInput */,
    modelStageLineage:    /* from bridge contract */,
    assumptions:          forecast.assumptions,
    failureModes:         /* derived from forecast.warnings or explicit list */,
    uncertaintyStatement: /* derived from forecast or explicit string */,
    forbiddenClaims:      /* derived from gate spec or explicit list */,
    persistenceState:     'not_persisted',
    lineageComplete:      /* bridge confirms no gaps */,
    lineageGaps:          /* bridgeResult.warnings */,
  })
} catch (err: unknown) {
  return {
    status: 'audit_creation_failed',
    error: err instanceof Error ? err.message : 'createForecastAuditEntry threw unknown error',
    forecast: null,
    auditEntry: null,
  }
}
```

- `createForecastAuditEntry` may throw. The wiring function must catch.
- On throw: `forecast` must NOT be returned. Return `audit_creation_failed`.
- The exact lineage data construction is an implementation concern — this spec identifies the
  field names and their sources. RI-4 (tests) will validate the mapping.
- `persistenceState` starts as `'not_persisted'` — it is set to `'persisted_by_future_gate'`
  only after Steps 4 and 5 pass (see Step 5).
- `authorizationState` defaults inside `createForecastAuditEntry` to
  `'pending_user_acknowledgment'` when not supplied. The wiring function does not override this.

---

## 14. Step 4 — Audit Validation

```typescript
const validationResult = validateForecastAuditEntry(auditEntry)

if (!validationResult.valid) {
  return {
    status: 'audit_validation_failed',
    errors: validationResult.errors,
    forecast: null,
    auditEntry: null,
  }
}
```

- `validateForecastAuditEntry` does not throw — it returns `{ valid: boolean, errors: readonly string[] }`.
- Check `validationResult.valid` (not `validationResult.errors.length === 0` — use the `valid` field).
- On failure: `forecast` must NOT be returned. Return `audit_validation_failed` with the error array.
- `validationResult.errors` is `readonly string[]` — assign directly to the `errors` field.

---

## 15. Step 5 — Safety Flag Check and Success Return

```typescript
const flagResult = assertForecastAuditSafetyFlags(auditEntry.safetyFlags)

if (!flagResult.valid) {
  return {
    status: 'safety_flag_failed',
    flagErrors: flagResult.errors,
    forecast: null,
    auditEntry: null,
  }
}

// All conditions passed — set persistence marker and return success
const finalAuditEntry: ForecastAuditEntry = {
  ...auditEntry,
  persistenceState: 'persisted_by_future_gate',
}

return {
  status: 'success',
  forecast,
  auditEntry: finalAuditEntry,
}
```

- `assertForecastAuditSafetyFlags` checks all 9 safety flags against the `SEALED_SAFETY_FLAGS`
  constant. Since `createForecastAuditEntry` forces all flags to `true` via `SEALED_SAFETY_FLAGS`,
  this check will pass for any entry constructed by `createForecastAuditEntry`. The check remains
  required — it is the structural gate, not an optimization.
- On flag failure: `forecast` must NOT be returned. Return `safety_flag_failed` with the flag errors.
- On all-pass: construct `finalAuditEntry` with `persistenceState: 'persisted_by_future_gate'`.
  This is an immutable update — do not mutate `auditEntry`.
- `'persisted_by_future_gate'` is a valid terminal `ForecastAuditPersistenceState`. It is not a
  loophole — it signals that Gate F persistence is deferred to a future gate (Gate F native). Audit
  entry creation succeeded synchronously; persistence is a later concern.
- Return `{ status: 'success', forecast, auditEntry: finalAuditEntry }`.

This is the only code path where `forecast` is returned non-null. All 5 conditions must be true:
1. Bridge succeeded (`bridgeResult.success === true`)
2. Kernel returned a `PredictabilityForecast`
3. `createForecastAuditEntry` did not throw
4. `validateForecastAuditEntry` returned zero errors
5. `assertForecastAuditSafetyFlags` returned zero errors

---

## 16. Return Value Specification — All 5 Branches

### `success`

```typescript
{
  status: 'success',
  forecast: PredictabilityForecast,   // non-null — kernel output
  auditEntry: ForecastAuditEntry,     // non-null — persistenceState: 'persisted_by_future_gate'
}
```

Returned only after all 5 conditions in Section 15 are satisfied.

---

### `bridge_failed`

```typescript
{
  status: 'bridge_failed',
  bridgeError: string,   // bridgeResult.errors.join('; ')
  forecast: null,
  auditEntry: null,
}
```

Returned when `bridgeResult.success === false`. Kernel not called. Audit not called.

---

### `audit_creation_failed`

```typescript
{
  status: 'audit_creation_failed',
  error: string,         // caught error message from createForecastAuditEntry throw
  forecast: null,
  auditEntry: null,
}
```

Returned when `createForecastAuditEntry` throws. Forecast computed internally — must NOT be
returned.

---

### `audit_validation_failed`

```typescript
{
  status: 'audit_validation_failed',
  errors: readonly string[],   // validationResult.errors from validateForecastAuditEntry
  forecast: null,
  auditEntry: null,
}
```

Returned when `validateForecastAuditEntry` returns `valid: false`. Forecast computed — must NOT
be returned.

---

### `safety_flag_failed`

```typescript
{
  status: 'safety_flag_failed',
  flagErrors: readonly string[],   // flagResult.errors from assertForecastAuditSafetyFlags
  forecast: null,
  auditEntry: null,
}
```

Returned when `assertForecastAuditSafetyFlags` returns `valid: false`. Forecast computed — must
NOT be returned.

---

## 17. Supplemented Field Rules — Enforced Throughout

These rules originate in `docs/PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION.md` and
remain binding through all RI stages.

| Field | Rule |
|---|---|
| `targetDate` | Caller-supplied ISO 8601. Never set to today's date internally. |
| `domain` | Caller-supplied non-empty string. Never fall back to a default domain. |
| `horizon` | Caller-supplied `'short' \| 'medium' \| 'long'`. Never default to `'medium'`. |
| `trendWindows` | Caller-supplied adapter-local array. Never generate synthetic windows. Bridge enforces non-empty at runtime. |
| `behavioralPatterns` | Caller-supplied adapter-local array. Never generate synthetic patterns. Bridge enforces non-empty at runtime. |
| `cycleWindows` | Caller-supplied adapter-local array. Never generate synthetic windows. Bridge enforces non-empty at runtime. |

If any of these fields is missing or invalid, `bridgeAdapterToKernelInput` will fail and the
function returns `bridge_failed`. The wiring function does NOT validate supplemented fields itself —
that is the bridge's responsibility.

---

## 18. Forbidden Actions

The wiring function must NOT:

1. Default any supplemented field (`targetDate`, `domain`, `horizon`, `trendWindows`,
   `behavioralPatterns`, `cycleWindows`)
2. Generate synthetic data for any array supplemented field
3. Return `forecast` on any failure branch
4. Return `auditEntry` on any failure branch
5. Call `isForecastAuditConsumable` — not authorized for wiring function (see Section 8)
6. Call `validateForecastAuditLineage` directly — it is called internally by `validateForecastAuditEntry`
7. Call `validateForecastAuditAuthorization` — authorization state is a consumer concern
8. Call `validateForecastAuditPersistenceBoundary` — persistence validation is a consumer concern
9. Import or reference `KernelOutput` — this type does not exist in the codebase
10. Add a `queued`, `deferred`, `partial_success`, or `incomplete_audit_success` branch
11. Make any `RuntimePipelineResult` field optional
12. Make any `RuntimePipelineInput` field optional or add defaults
13. Modify `runtime-pipeline-types.ts`
14. Modify any existing Gate file (A through G-3)
15. Import directly from model stage files (M-A through M-I)
16. Import from `oracle-memory/sources`
17. Perform any I/O or side effects
18. Mutate the `input` object or any field within it
19. Return a `Promise<RuntimePipelineResult>` — function is synchronous
20. Return before all 5 steps complete on the success path

---

## 19. Immutability Requirements

- All `RuntimePipelineInput` fields are `readonly` — no mutation is possible at the TypeScript level.
- Adapter input constructed from `input` fields must copy, not reference: use spread (`{ ...input.field }`) or `[...input.array]`.
- `ForecastAuditEntry` is constructed via `createForecastAuditEntry`, which performs defensive copies internally (`{ ...adapterPacketLineage }`, `[...evidenceLineage]`, etc.).
- When setting `persistenceState: 'persisted_by_future_gate'` in Step 5, create a new object via spread: `{ ...auditEntry, persistenceState: 'persisted_by_future_gate' }`. Do not mutate `auditEntry`.

---

## 20. Type Import Requirements

The wiring function implementation file must use `import type { ... }` for all type-only imports:

```typescript
import type {
  RuntimePipelineInput,
  RuntimePipelineResult,
  RuntimePipelineTrendWindow,
  RuntimePipelineBehavioralPattern,
  RuntimePipelineCycleWindow,
} from './runtime-pipeline-types'

import type {
  ForecastAuditEntry,
} from './forecast-audit-types'

import type {
  PredictabilityForecast,
} from './types'
```

Value imports (functions, constants) use regular `import { ... }`:

```typescript
import { bridgeAdapterToKernelInput } from './model-stage-orchestration-bridge'
import { calculatePredictabilityForecast } from './predictability-kernel'
import {
  createForecastAuditEntry,
  validateForecastAuditEntry,
  assertForecastAuditSafetyFlags,
} from './forecast-audit'
```

No imports from model stage files (M-A through M-I) or from `oracle-memory/sources`.

---

## 21. Pre-existing Typecheck Backlog

The typecheck backlog was frozen at G-3.5. The wiring function implementation file (RI-5) must
not activate any frozen errors. The following files carry pre-existing errors — do not import
from them in the wiring function:

- `decay-scheduler`
- `shell-graduation`
- `adapter-integration`
- `predictability-kernel` (contains errors at specific lines — but export `calculatePredictabilityForecast` is safe to import)
- `trend-delta`
- `cycle-analysis`
- `evidence-router-adapter-types`
- `model-stage-orchestration.ts` (lines 285–286)

The RI-3 spec file itself (this document) is a Markdown doc — no typecheck impact.

Source: `docs/PREDICTABILITY_RI0_RUNTIME_INTEGRATION_READINESS_REVIEW.md`.

---

## 22. RI-4 Test Model

RI-4 will write tests for `runPredictabilityRuntimePipeline` using fixture inputs. Tests run
against the live function — no mocking of bridge, kernel, or audit functions.

### Fixture Requirements

Each test fixture must supply all 7 fields of `RuntimePipelineInput`:

| Field | Fixture requirement |
|---|---|
| `objective` | Non-empty string describing the scenario |
| `targetDate` | ISO 8601 date string; must not be today's date |
| `domain` | Non-empty domain identifier string |
| `horizon` | Explicit `'short'`, `'medium'`, or `'long'` — not defaulted |
| `trendWindows` | Non-empty array of `RuntimePipelineTrendWindow` objects |
| `behavioralPatterns` | Non-empty array of `RuntimePipelineBehavioralPattern` objects |
| `cycleWindows` | Non-empty array of `RuntimePipelineCycleWindow` objects |

### Required Test Coverage (minimum for RI-4)

| Test | Expected result | Assertion |
|---|---|---|
| Valid full fixture | `status: 'success'` | `forecast` non-null `PredictabilityForecast`; `auditEntry` non-null `ForecastAuditEntry`; `auditEntry.persistenceState === 'persisted_by_future_gate'` |
| Missing `targetDate` | `status: 'bridge_failed'` | `bridgeError` contains `'targetDate'`; `forecast: null`; `auditEntry: null` |
| Missing `domain` | `status: 'bridge_failed'` | `bridgeError` contains `'domain'`; `forecast: null`; `auditEntry: null` |
| Missing `horizon` | `status: 'bridge_failed'` | `bridgeError` contains `'horizon'`; `forecast: null`; `auditEntry: null` |
| Empty `trendWindows` | `status: 'bridge_failed'` | `forecast: null`; `auditEntry: null` |
| Empty `behavioralPatterns` | `status: 'bridge_failed'` | `forecast: null`; `auditEntry: null` |
| Empty `cycleWindows` | `status: 'bridge_failed'` | `forecast: null`; `auditEntry: null` |
| All 5 status strings present | type-level | `RUNTIME_PIPELINE_RESULT_STATUSES` contains all 5; no queue/defer |
| `success` branch allows `forecast` and `auditEntry` access | type-level | TypeScript narrows on `status === 'success'` |
| Failure branches yield `forecast: null` | runtime | Destructure `{ forecast }` from any failure result — always null |

Note: `audit_creation_failed`, `audit_validation_failed`, and `safety_flag_failed` scenarios
require specific fixture or mock conditions to trigger. RI-4 authorization will specify whether
those branches are tested via direct fixture construction or via a test harness. This spec does
not prescribe the mechanism — it records the coverage requirement.

---

## 23. What RI-3 Does Not Authorize

- **No implementation of `runPredictabilityRuntimePipeline`** — spec only
- **No creation of `runtime-pipeline.ts`** — that file does not yet exist; RI-5 creates it
- **No RI-4 tests** — those require separate `AUTHORIZE ORACLE TASK` for RI-4
- **No modifications to any existing source file**
- **No modifications to `runtime-pipeline-types.ts`** — type contracts are frozen at `bccc0d4`
- **No modifications to any Gate A–G-3 file**
- **No modifications to any existing test file**
- **No modifications to `oracle-memory/sources`**
- **No modifications to `docs/CHATGPT_CODEX_HANDOFF_LOOP.md`**

---

## 24. Freeze Line

**This orchestration contract is frozen as of the commit of this document.**

`runPredictabilityRuntimePipeline` may not be implemented differently from this spec without:
1. A new spec document superseding this one
2. Explicit authorization from Nick London
3. The new document committed and pushed before implementation begins

Specifically frozen:
- The 5-step execution sequence (Section 9) — order and conditions are invariant
- The 5 result branches and their exact field shapes (Section 16)
- The authorized function call list (Section 8)
- The forbidden actions list (Section 18)
- The supplemented field rules (Section 17)
- The `BridgeResult.success` (boolean) check — not `bridgeStatus` string (Section 6)
- The `PredictabilityForecast` type — not `KernelOutput` (Section 7)

RI-4 (tests) and RI-5 (implementation) require separate authorizations. They do not begin until
this spec is committed, pushed, and the respective authorizations are issued.

---

*Document complete. No source files modified. No test files modified. No implementation artifacts.*
