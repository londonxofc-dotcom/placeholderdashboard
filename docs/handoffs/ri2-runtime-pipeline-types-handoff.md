# RI-2 Runtime Pipeline Type Contracts — Handoff

**Document ID:** RI2_RUNTIME_PIPELINE_TYPES_HANDOFF
**Stage:** RI-2 (Runtime Integration — Type Contracts)
**Status:** COMPLETE — committed, pushed, aligned
**Created:** 2026-05-14
**Author:** Nick London (decision) / Claude Code (documentation)
**Branch:** night-build/2026-04-25

---

## 1. Purpose

This document records what RI-2 produced, what the type contracts encode, what verification
passed, and what RI-3 must respect before any runtime function work begins.

RI-2 was the first post-planning code task in the runtime integration sequence. It added pure
TypeScript type contracts only — no implementation, no runtime logic, no wiring. The contracts
serve as the locked interface boundary that all future runtime work must consume without widening.

---

## 2. Repo / Branch / HEAD

| Item | Value |
|---|---|
| Repo | `/Users/Malachi/Missipn Control Builder Agent` |
| Branch | `night-build/2026-04-25` |
| RI-2 commit | `bccc0d4` |
| Local/upstream | aligned |
| Prior commit | `131e2a2` (RI-1 return type ratification) |

---

## 3. RI-2 Scope

RI-2 was authorized to:
- Create one new type file (pure types, no implementation)
- Create one new test file (structural assertions against the type file)
- Import `Horizon` and `PredictabilityForecast` from `types.ts`
- Import `ForecastAuditEntry` from `forecast-audit-types.ts`

RI-2 was explicitly prohibited from:
- Writing any runtime function or implementation
- Calling `bridgeAdapterToKernelInput`, `calculatePredictabilityForecast`, `createForecastAuditEntry`,
  or any other Gate-locked function
- Modifying any existing source file or test file
- Committing anything other than the two RI-2 files
- Pushing without separate authorization

---

## 4. Files Created

| File | Purpose | Status |
|---|---|---|
| `ui/lib/oracle/predictability/runtime-pipeline-types.ts` | Pure type contracts for RI-2 | Committed, pushed |
| `ui/lib/oracle/predictability/__tests__/runtime-pipeline-types.test.ts` | Structural contract tests | Committed, pushed |

No other files were created, modified, staged, or committed in this task.

---

## 5. Type Contracts Added

The following exports are new in `runtime-pipeline-types.ts`:

| Export | Kind | Description |
|---|---|---|
| `RUNTIME_PIPELINE_CONTRACT_VERSION` | const | Version string `'ri2-v1'` |
| `RuntimePipelineContractVersion` | type | Literal type of the version const |
| `RUNTIME_PIPELINE_RESULT_STATUSES` | const | Readonly tuple of exactly 5 status strings |
| `RuntimePipelineResultStatus` | type | Union of the 5 status strings |
| `RuntimePipelineTrendWindow` | interface | Adapter-local trend window shape |
| `RuntimePipelineBehavioralPattern` | interface | Adapter-local behavioral pattern shape |
| `RuntimePipelineCycleWindow` | interface | Adapter-local cycle window shape |
| `RuntimePipelineInput` | interface | Caller-supplied input type (all fields required) |
| `RuntimePipelineResult` | type | Discriminated union result (5 branches) |

---

## 6. RuntimePipelineInput Summary

`RuntimePipelineInput` is the caller-supplied input to the future runtime wiring function.

All fields are `readonly`. All fields are required. No optional fields. No default values.

| Field | Type | Notes |
|---|---|---|
| `objective` | `string` | Kernel objective; non-supplemented |
| `targetDate` | `string` | ISO 8601; never default to today |
| `domain` | `string` | Non-empty domain identifier |
| `horizon` | `Horizon` | `'short' \| 'medium' \| 'long'`; never default to `'medium'` |
| `trendWindows` | `readonly RuntimePipelineTrendWindow[]` | Adapter-local; bridge enriches |
| `behavioralPatterns` | `readonly RuntimePipelineBehavioralPattern[]` | Adapter-local; bridge enriches |
| `cycleWindows` | `readonly RuntimePipelineCycleWindow[]` | Adapter-local; bridge enriches |

The three scalar fields (`targetDate`, `domain`, `horizon`) and three array fields
(`trendWindows`, `behavioralPatterns`, `cycleWindows`) are the six supplemented fields
established as caller-supplied in `docs/PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION.md`.

---

## 7. RuntimePipelineResult Summary

`RuntimePipelineResult` is a discriminated union on `status`. It is the return type of the
future runtime wiring function.

Key invariants encoded in the type:
- Only `status: 'success'` may carry non-null `forecast` and `auditEntry`.
- Every failure branch carries `forecast: null` and `auditEntry: null`.
- No partial success state exists.
- No queue or defer state exists.
- `auditEntry: null` on all failure branches enables uniform destructuring:
  `const { status, forecast, auditEntry } = result` is safe on any branch without
  optional chaining.

---

## 8. Ratified Status Union

The five branches exactly as ratified in
`docs/PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION.md` Section 8:

```typescript
export type RuntimePipelineResult =
  | {
      readonly status: 'success'
      readonly forecast: PredictabilityForecast
      readonly auditEntry: ForecastAuditEntry
    }
  | {
      readonly status: 'bridge_failed'
      readonly bridgeError: string
      readonly forecast: null
      readonly auditEntry: null
    }
  | {
      readonly status: 'audit_creation_failed'
      readonly error: string
      readonly forecast: null
      readonly auditEntry: null
    }
  | {
      readonly status: 'audit_validation_failed'
      readonly errors: readonly string[]
      readonly forecast: null
      readonly auditEntry: null
    }
  | {
      readonly status: 'safety_flag_failed'
      readonly flagErrors: readonly string[]
      readonly forecast: null
      readonly auditEntry: null
    }
```

Note: The ratification doc used `KernelOutput` as a placeholder name. The actual codebase type
is `PredictabilityForecast` (from `types.ts`, returned by `calculatePredictabilityForecast`).
The RI-2 type file correctly imports and uses `PredictabilityForecast`. This is not a deviation
from the ratification — it is the correct resolution of the placeholder.

---

## 9. Required Supplemented Fields

All six are required at compile time in `RuntimePipelineInput`. The bridge enforces non-empty
arrays at runtime. The wiring function (RI-3) must NOT default, infer, or generate any of these
internally.

| Field | Rule | Prohibited default |
|---|---|---|
| `targetDate` | Caller-supplied ISO 8601 | Never default to today's date |
| `domain` | Caller-supplied non-empty string | Never default to a fallback domain |
| `horizon` | Caller-supplied `Horizon` | Never default to `'medium'` |
| `trendWindows` | Caller-supplied non-empty array (bridge-enforced) | Never generate synthetic windows |
| `behavioralPatterns` | Caller-supplied non-empty array (bridge-enforced) | Never generate synthetic patterns |
| `cycleWindows` | Caller-supplied non-empty array (bridge-enforced) | Never generate synthetic windows |

Source: `docs/PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION.md`

---

## 10. Failure-State Semantics

Each failure branch has a distinct `status` that identifies where in the wiring sequence the
failure occurred.

### `bridge_failed`
- Cause: `bridgeAdapterToKernelInput()` returned `bridgeStatus: 'failed'`
- `bridgeError`: bridge error message (contains missing/invalid field names)
- Kernel was NOT called
- `createForecastAuditEntry` was NOT called

### `audit_creation_failed`
- Cause: `createForecastAuditEntry` threw an exception
- `error`: caught error message
- Bridge succeeded; kernel was called
- Forecast computed internally but must NOT be returned

### `audit_validation_failed`
- Cause: `validateForecastAuditEntry` returned one or more errors
- `errors`: readonly string array of validation errors
- Audit entry was created but failed structural validation; not trustworthy
- Forecast must NOT be returned

### `safety_flag_failed`
- Cause: one or more safety flags on the audit entry are false
- `flagErrors`: readonly string array of flag failure descriptions
- Audit entry structurally valid but not safe to expose
- Forecast must NOT be returned

In all four failure cases: `forecast: null`, `auditEntry: null`.

---

## 11. Explicitly Forbidden States

These states do not exist in `RuntimePipelineResult` and may not be added without a new
ratification document superseding
`docs/PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION.md`.

| Forbidden state | Why excluded |
|---|---|
| `queued` | Queue/defer patterns excluded from RI-2 through RI-6 by RI-1 decision |
| `deferred` | Same as above |
| `partial_success` | Option D (fail-closed return type) was selected in RI-1; partial states are Option B territory, explicitly rejected |
| `incomplete_audit_success` | No state exists where `forecast` is non-null without a valid audit entry — Gate F invariant |
| `forecast_without_audit` | Same as above; downstream consumers cannot retroactively attach an audit entry |

The status constant array `RUNTIME_PIPELINE_RESULT_STATUSES` has exactly 5 values. Any widening
requires a separate ratification and explicit authorization.

---

## 12. Verification Performed

| Check | Result |
|---|---|
| `npm --prefix ui test -- lib/oracle/predictability/__tests__/runtime-pipeline-types.test.ts` | 32/32 passed |
| `npm --prefix ui run typecheck` | Clean — zero errors |
| `git status --short` pre-commit | Only RI-2 files untracked; tracked working tree clean |
| `git status --short` post-commit | Only unrelated local logs untracked |
| `git log --oneline --decorate -5` post-push | HEAD and upstream both at `bccc0d4` |

---

## 13. Typecheck Result

`tsc --noEmit` passed with zero errors after RI-2 files were added.

No pre-existing typecheck errors were activated. The RI-2 type file uses `import type { ... }`
for all three imported types (`Horizon`, `PredictabilityForecast`, `ForecastAuditEntry`),
scoped to the minimum required. No implementation imports.

The frozen G-3.5 typecheck backlog was not disturbed.

---

## 14. Protected Boundary Review

The following files were read during RI-2 but not modified:

| File | Purpose of read | Modified? |
|---|---|---|
| `ui/lib/oracle/predictability/types.ts` | Source `Horizon`, `PredictabilityForecast` | No |
| `ui/lib/oracle/predictability/forecast-audit-types.ts` | Source `ForecastAuditEntry` | No |
| `ui/lib/oracle/predictability/model-stage-orchestration-bridge.ts` | Verify adapter-local field shapes, `REQUIRED_SUPPLEMENTED_FIELDS` | No |
| `ui/lib/oracle/predictability/__tests__/model-stage-orchestration-types.test.ts` | Style reference for test patterns | No |

All Gate-locked source files (Gates A–G-3) remain unmodified.

---

## 15. What RI-2 Did Not Do

- Did not implement any runtime function
- Did not call `bridgeAdapterToKernelInput`
- Did not call `calculatePredictabilityForecast`
- Did not call `createForecastAuditEntry` or `validateForecastAuditEntry`
- Did not write any wiring logic
- Did not modify any existing source file or test file
- Did not define `KernelOutput` (placeholder name in ratification docs) — correctly resolved to `PredictabilityForecast`
- Did not add optional variants to supplemented fields
- Did not create default values for any supplemented field
- Did not add `queued`, `deferred`, `partial_success`, or `incomplete_audit_success` states

---

## 16. What RI-3 Must Know

RI-3 will implement the runtime wiring function. Before writing any RI-3 code:

1. **The wiring function signature is determined.** Input: `RuntimePipelineInput`. Output:
   `RuntimePipelineResult`. These types may not be widened or altered by RI-3.

2. **All six supplemented fields are caller-supplied.** The wiring function must accept them
   from the caller via `RuntimePipelineInput` and pass them to the bridge unchanged. No defaults.
   No inference. No internal generation.

3. **The five result branches are frozen.** Adding a sixth branch requires a new ratification doc.
   Making any field optional requires a new ratification doc.

4. **Bridge failure returns immediately.** If `bridgeAdapterToKernelInput()` returns
   `bridgeStatus: 'failed'`, the wiring function must return `{ status: 'bridge_failed',
   bridgeError: <message>, forecast: null, auditEntry: null }` — do not call the kernel.

5. **Audit creation must succeed before `success` is returned.** If `createForecastAuditEntry`
   throws, return `{ status: 'audit_creation_failed', error: <message>, forecast: null,
   auditEntry: null }` — do not return the forecast.

6. **Validation must pass before `success` is returned.** If `validateForecastAuditEntry`
   returns errors, return `{ status: 'audit_validation_failed', errors: [...], forecast: null,
   auditEntry: null }`.

7. **Safety flags must all be true before `success` is returned.** If any flag is false, return
   `{ status: 'safety_flag_failed', flagErrors: [...], forecast: null, auditEntry: null }`.

8. **`forecast: null` and `auditEntry: null` are required on all failure branches.** Optional
   fields (`forecast?: ...`) are prohibited. Explicit `null` is required.

9. **`PredictabilityForecast` is the forecast type.** Not `KernelOutput` (a documentation
   placeholder only).

10. **Adapter-local shapes are bridge inputs.** `RuntimePipelineTrendWindow`,
    `RuntimePipelineBehavioralPattern`, and `RuntimePipelineCycleWindow` are passed to the bridge.
    The bridge handles enrichment to kernel-native shapes — the wiring function does not.

---

## 17. Risks for RI-3

| Risk | Description | Mitigation |
|---|---|---|
| Wiring function widens the result union | RI-3 adds a sixth branch not in `RuntimePipelineResult` | Prohibited — would require a new ratification doc |
| Wiring function defaults a supplemented field | RI-3 supplies a default when the caller omits a field | Prohibited by Q1 decision — bridge will catch missing fields and return `bridge_failed` |
| `forecast` returned on a failure branch | RI-3 returns forecast alongside an error status | Type system prevents this — TypeScript will reject non-null `forecast` on failure branches |
| `auditEntry: null` made optional | RI-3 uses `auditEntry?: ForecastAuditEntry` on failure branches | Prohibited — explicit `null` is required per ratification Section 13 |
| Adapter-local shapes replaced with kernel-native shapes | RI-3 uses `TrendWindow` from `types.ts` directly | Prohibited — callers supply adapter-local shapes; bridge handles enrichment |
| Success returned before all four conditions pass | RI-3 returns `success` after bridge passes but before audit validation | Fail-closed: success requires bridge + audit creation + validation + safety flags in sequence |
| `KernelOutput` imported or referenced | RI-3 looks for the ratification doc's placeholder name | Does not exist in codebase; use `PredictabilityForecast` from `types.ts` |

---

## 18. Next Safe Action

After this handoff is committed and pushed:

**RI-3 — Runtime Wiring Function** becomes the next authorized unit.

RI-3 scope:
- Implement the runtime wiring function with signature:
  `(input: RuntimePipelineInput) => RuntimePipelineResult`
- Consume `RuntimePipelineInput` and `RuntimePipelineResult` from `runtime-pipeline-types.ts`
- Call `bridgeAdapterToKernelInput`, `calculatePredictabilityForecast`,
  `createForecastAuditEntry`, `validateForecastAuditEntry`, and safety flag checks
- Return the correct branch for each failure mode
- No new types. No changes to `runtime-pipeline-types.ts`. No changes to existing Gate files.

RI-3 requires separate authorization. It does not begin until this handoff is committed, pushed,
and RI-3 authorization is issued.

---

## 19. Freeze Line

**RI-2 type contracts are frozen as of commit `bccc0d4`.**

`RuntimePipelineResult` may not be modified after RI-3 begins without:
1. A new ratification document superseding
   `docs/PREDICTABILITY_RI1_RETURN_TYPE_RATIFICATION.md`
2. Explicit authorization from Nick London
3. The new document committed and pushed before RI-3 implementation proceeds

`RuntimePipelineInput` may not have fields made optional or removed without the same process.

No new branches may be added to `RuntimePipelineResult`. No `forecast: null` or
`auditEntry: null` fields may be made optional. No error fields may be removed from their
respective branches.

This handoff is informational. It does not itself authorize RI-3.

---

*Document complete. No source files modified. No test files modified. No implementation artifacts.*
