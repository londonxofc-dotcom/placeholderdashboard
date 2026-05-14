# Predictability RI-1 Q1 — Supplemented Field Runtime Source Decision

**Document ID:** PREDICTABILITY_RI1_Q1_SUPPLEMENTED_FIELD_SOURCE_DECISION
**Stage:** RI-1 (Audit Write Coupling) — Pre-Implementation Open Question 1
**Status:** DECIDED
**Created:** 2026-05-14
**Author:** Nick London (decision) / Claude Code (documentation)
**Branch:** night-build/2026-04-25

---

## 1. Purpose

This document records the runtime source decision for the six supplemented fields required by
`bridgeAdapterToKernelInput()` (Gate G-3). These fields are optional in
`ModelStageOrchestrationInput` but required by the bridge's `validateAdapterInput` guard — any
field that is `undefined`, `null`, empty string, or empty array causes the bridge to return
`bridgeStatus: 'failed'`, which fails closed (kernel is never called).

Without a decided source for each field, RI-2 type contracts cannot be written safely because the
caller shape is unknown.

**Core rule established here:**
> No required supplemented field may be inferred casually or defaulted silently inside the wiring
> function. Missing or invalid runtime context fails closed. All six fields must be caller-supplied.

---

## 2. Scope

This document covers only the six fields listed as `REQUIRED_SUPPLEMENTED_FIELDS` in
`ui/lib/oracle/predictability/model-stage-orchestration-bridge.ts` lines 26–33:

```typescript
const REQUIRED_SUPPLEMENTED_FIELDS = [
  'targetDate',
  'domain',
  'horizon',
  'trendWindows',
  'behavioralPatterns',
  'cycleWindows',
] as const
```

Fields already fully sourced from the adapter (`historicalEvents`, `objective`) are out of scope.
Gate F audit fields are out of scope (covered by RI-1 main decision).

---

## 3. Why Q1 Was Opened

RI-0 identified that none of the six supplemented fields had a defined runtime source. They are
optional in the adapter-local `ModelStageOrchestrationInput` type, meaning callers are not forced
to supply them. However, the bridge's `validateAdapterInput` function treats any missing field as a
bridge failure. This creates a gap: the type system permits omission, but the runtime behavior
punishes it with a fail-closed bridge.

If the wiring function were written without resolving Q1, the implementer would face an implicit
choice: either (a) silently default these fields inside the wiring layer, creating invisible data
integrity loss, or (b) leave them undefined and get consistent bridge failures in production. Option
(a) is the "smuggled-in unsafe default" this document is designed to prevent.

---

## 4. Source Inspection — Adapter-Local vs. Kernel-Native Shapes

The bridge performs field-by-field transformation. Understanding which fields the bridge transforms
(vs. passes through) determines what the runtime caller must supply.

### 4.1 Fields passed through with bridge augmentation

Three fields have adapter-local shapes that differ from kernel-native shapes. The bridge maps them
via dedicated functions. The caller supplies adapter-local shape; the bridge produces kernel-native
shape.

**`trendWindows`** — `mapTrendWindow()` (bridge line 345–358)
- Adapter-local fields: `id`, `label`, `start`, `end`, `signalType`, `value`, `confidence`
- Bridge adds: `scale` (derived from `value` magnitude), `sourceTier` (hardcoded `'T2'`)
- Caller supplies adapter-local shape. Bridge handles kernel enrichment.

**`behavioralPatterns`** — `mapBehavioralPattern()` (bridge line 361–377)
- Adapter-local fields: `id`, `triggerCondition`, `repeatedBehavior`, `observedCount`, `confidence`
- Bridge adds: `actorScope` (hardcoded `'system'`), `positiveOutcomes` (0), `negativeOutcomes` (0),
  `neutralOutcomes` (= `observedCount`), `sourceTier` (hardcoded `'T2'`), `tags` (`['supplemented']`)
- Caller supplies adapter-local shape. Bridge handles kernel enrichment.

**`cycleWindows`** — `mapCycleWindow()` (bridge line 379–388)
- Adapter-local fields: `period`, `confidence`, `lastObserved`
- Bridge adds: `scale` (derived from `period` magnitude via `deriveCycleScale`)
- Caller supplies adapter-local shape. Bridge handles kernel enrichment.

### 4.2 Fields passed through as-is (scalar types)

**`targetDate`** — `string` — passed as `input.targetDate as string`. Caller supplies ISO date string.

**`domain`** — `string` — passed as `input.domain as string`. Caller supplies domain identifier.

**`horizon`** — `'short' | 'medium' | 'long'` — passed directly. Caller supplies one of three
literal values. Source type in `ui/lib/oracle/predictability/types.ts` line 5:
`type Horizon = "short" | "medium" | "long"`.

### 4.3 Bridge audit interaction

`buildFieldAudit` (bridge line 256–292) explicitly lists adapter-local → kernel-native
transformations in `defaultedFields`. These are tracked in the `BridgeFieldAudit` for traceability.
Supplemented fields that the caller supplies are listed in `supplementedFields` in every bridge
result. This means every caller-supplied field is auditable by the Gate G-3 result.

---

## 5. Decision — Six Fields, Six Sources

The decision for all six fields is the same at the top level:

> **All six required supplemented fields must be caller-supplied to the runtime wiring function.
> No field may be defaulted, inferred, or generated inside the wiring function. No field may be
> sourced from ambient module-level state, process.env, or any implicit context. Missing any field
> fails closed.**

Field-by-field detail:

---

### 5.1 `targetDate` — ISO date string

**Decision:** Caller-supplied. Must be an ISO 8601 date string (e.g., `"2026-05-14"`).

**Source at runtime:** The caller invoking the runtime wiring function must pass this value. It
represents the date for which the forecast is being generated. It is not "today" by default — a
caller might generate a forecast for a future or past date. The wiring function must not substitute
`new Date().toISOString()` or any equivalent.

**Fail-closed behavior:** If `targetDate` is `undefined`, `null`, or empty string,
`validateAdapterInput` pushes an error and the bridge returns `bridgeStatus: 'failed'`.
The wiring function returns `{ status: 'bridge_failed', forecast: null }`.

**RI-2 contract implication:** `RuntimePipelineInput` must include `targetDate: string` as a
required field. No optional or defaulted variant is permitted.

---

### 5.2 `domain` — string

**Decision:** Caller-supplied. Must be a non-empty string identifying the forecast domain.

**Source at runtime:** The caller must provide the domain context for which the forecast applies.
The bridge uses it as `domain` in every mapped `KernelLandmarkEvent` (bridge line 332), so it is
load-bearing for kernel input correctness — not just metadata.

**Fail-closed behavior:** If `domain` is `undefined`, `null`, or empty string after trim,
`validateAdapterInput` fails and bridge returns `bridgeStatus: 'failed'`.

**RI-2 contract implication:** `RuntimePipelineInput` must include `domain: string` as a required
field.

---

### 5.3 `horizon` — `'short' | 'medium' | 'long'`

**Decision:** Caller-supplied. Must be one of the three literal values defined in `Horizon`.

**Source at runtime:** The caller must declare the forecast horizon explicitly. The kernel uses this
value to configure time-scale weighting. A default of `'medium'` would be semantically plausible
but is explicitly prohibited by this document — silent defaults smuggle assumptions into forecast
quality without audit visibility.

**Fail-closed behavior:** If `horizon` is `undefined` or `null`, `validateAdapterInput` pushes an
error (field present check at line ~145 in bridge). Bridge returns `bridgeStatus: 'failed'`.

**RI-2 contract implication:** `RuntimePipelineInput` must include
`horizon: 'short' | 'medium' | 'long'` as a required field. The `Horizon` type alias from
`ui/lib/oracle/predictability/types.ts` should be imported and used directly.

---

### 5.4 `trendWindows` — adapter-local array

**Decision:** Caller-supplied. Must be a non-empty `readonly` array of adapter-local trend window
objects. Empty array fails closed.

**Adapter-local shape (from `ModelStageOrchestrationInput`):**
```typescript
readonly {
  id: string
  label: string
  start: string
  end: string
  signalType: string
  value: number
  confidence: number
}[]
```

**Source at runtime:** The caller must provide current trend windows derived from the active
evidence context (e.g., Evidence Router output, signal aggregation layer). The bridge adds `scale`
and `sourceTier` automatically — the caller does not supply those.

**Fail-closed behavior:** If `trendWindows` is `undefined`, `null`, or an empty array,
`validateAdapterInput` fails. Bridge returns `bridgeStatus: 'failed'`.

**RI-2 contract implication:** `RuntimePipelineInput` must include `trendWindows` as a required
non-empty array using the adapter-local shape. The type should be defined inline or as a named
adapter-local type — not imported from `types.ts` (which contains the kernel-native shape).

---

### 5.5 `behavioralPatterns` — adapter-local array

**Decision:** Caller-supplied. Must be a non-empty `readonly` array of adapter-local behavioral
pattern objects. Empty array fails closed.

**Adapter-local shape (from `ModelStageOrchestrationInput`):**
```typescript
readonly {
  id: string
  triggerCondition: string
  repeatedBehavior: string
  observedCount: number
  confidence: number
}[]
```

**Source at runtime:** The caller must provide behavioral patterns derived from observed actor
behavior in the active context. The bridge hardcodes `actorScope: 'system'`, `positiveOutcomes: 0`,
`negativeOutcomes: 0`, `neutralOutcomes: observedCount`, and `sourceTier: 'T2'`. Callers must be
aware these bridge defaults apply — if richer behavioral data exists, it is discarded at the bridge
boundary under current Gate G-3 design.

**Fail-closed behavior:** If `behavioralPatterns` is `undefined`, `null`, or empty array,
`validateAdapterInput` fails. Bridge returns `bridgeStatus: 'failed'`.

**RI-2 contract implication:** `RuntimePipelineInput` must include `behavioralPatterns` as a
required non-empty array using the adapter-local shape. Bridge-added fields (`actorScope`,
`positiveOutcomes`, `negativeOutcomes`, `neutralOutcomes`, `sourceTier`, `tags`) must not appear
in the RI-2 input type.

---

### 5.6 `cycleWindows` — adapter-local array

**Decision:** Caller-supplied. Must be a non-empty `readonly` array of adapter-local cycle window
objects. Empty array fails closed.

**Adapter-local shape (from `ModelStageOrchestrationInput`):**
```typescript
readonly {
  period: number
  confidence: number
  lastObserved: string
}[]
```

**Source at runtime:** The caller must provide cycle windows from the active periodicity detection
context. The bridge adds `scale` via `deriveCycleScale(window.period)` — the caller does not supply
scale.

**Fail-closed behavior:** If `cycleWindows` is `undefined`, `null`, or empty array,
`validateAdapterInput` fails. Bridge returns `bridgeStatus: 'failed'`.

**RI-2 contract implication:** `RuntimePipelineInput` must include `cycleWindows` as a required
non-empty array using the adapter-local shape. The kernel-native `scale` field must not appear in
the RI-2 input type for cycle windows.

---

## 6. Ruled Out — What the Wiring Function Must NOT Do

The following approaches are explicitly prohibited. They are recorded here so RI-2 and RI-3
implementers cannot reintroduce them:

| Prohibited approach | Why |
|---|---|
| Default `targetDate` to `new Date().toISOString()` | Silent temporal assumption; forecast date must be explicit |
| Default `horizon` to `'medium'` | Silent forecast scope assumption; callers must declare intent |
| Generate `trendWindows: []` if source unavailable | Empty array fails at bridge; wiring layer must not bypass this |
| Generate `behavioralPatterns: []` if source unavailable | Same as above |
| Generate `cycleWindows: []` if source unavailable | Same as above |
| Read any field from `process.env` or module-level ambient state | Implicit context; breaks determinism and testability |
| Read any field from a singleton or cached global | Same as above |
| Return partial `RuntimePipelineInput` with some fields undefined | RI-2 type must make all six required — type system enforces this |
| Catch bridge failures and substitute defaults on retry | Retry loop that strips fail-closed behavior — explicitly prohibited |

---

## 7. Impact on Bridge Audit Traceability

The `BridgeFieldAudit.supplementedFields` array always contains all six field names regardless of
whether the bridge succeeds or fails (bridge line 287: `supplementedFields: [...REQUIRED_SUPPLEMENTED_FIELDS]`).

This means the Gate G-3 audit result will always record that these six fields were caller-supplied.
If any field was missing, the bridge will have failed before producing a kernel input — but the
audit trail still records the supplemented field names, enabling post-failure analysis.

The wiring function must not suppress or transform this audit output.

---

## 8. Impact on RI-1 Return Type

The Q1 decision does not change the RI-1 Option D return type shape. It clarifies what must be
true about `RuntimePipelineInput` for the `bridge_failed` branch to never be caused by
wiring-layer omissions:

- If the caller supplies all six fields correctly → bridge proceeds → `bridge_failed` branch is
  only reachable if the bridge has an internal mapping error
- If the caller omits or invalidates any field → bridge fails → `bridge_failed` branch fires with
  `bridgeError` naming the missing field(s)
- The wiring function must never patch missing fields to avoid the `bridge_failed` branch

This is the correct fail-closed behavior as specified in RI-1.

---

## 9. Impact on `ForecastAuditEntry` Creation

Gate F's `createForecastAuditEntry` receives `PredictabilityInput` (kernel-native) — not
`ModelStageOrchestrationInput` (adapter-local). By the time `createForecastAuditEntry` is called,
all six supplemented fields have already been mapped to their kernel-native shapes by the bridge.

The Q1 decision therefore has no direct impact on audit entry creation. The audit entry sees
kernel-native field shapes. The supplemented field provenance is captured in the `BridgeFieldAudit`
attached to the bridge result, which is a separate record from the `ForecastAuditEntry`.

---

## 10. Impact on Existing Typecheck Backlog

The Q1 decision is doc-only. No source files are modified here. The existing typecheck backlog
(frozen at G-3.5) is not affected.

When RI-2 adds the new `RuntimePipelineInput` type, it must be added to a new type file and must
not activate any frozen typecheck errors. The six supplemented field types in `RuntimePipelineInput`
should reference adapter-local shapes only — not kernel-native shapes from `types.ts` — to avoid
pulling in kernel-native type dependencies prematurely.

---

## 11. Relationship to RI-0 Findings

RI-0 identified Q1 as a blocker with the following finding:

> "No runtime sources defined for the six supplemented fields. If the wiring function is written
> before sources are decided, implementers will face implicit pressure to default these fields
> silently. Q1 must be resolved before RI-2 type contracts."

This document resolves that finding. The resolution is: all six fields are caller-supplied with no
wiring-layer defaults permitted.

---

## 12. Relationship to Q2 Correction

Q2 (committed `dbe9dd8`) corrected stale function naming in the gate spec. Q1 and Q2 are
independent. Q2 is fully closed. This document does not depend on or modify Q2 output.

---

## 13. RI-2 Prerequisites — Field Checklist

Before RI-2 type contracts can be written, the following must be confirmed complete:

- [x] Q2 correction committed and pushed (`dbe9dd8`)
- [x] Q1 source decision decided (this document)
- [x] Q1 source decision committed
- [x] Q1 source decision pushed
- [ ] Nick ratifies RI-1 Section 12 return type shape before RI-2 type file is created

The return type shape from RI-1 Section 12 (recorded in
`docs/PREDICTABILITY_RI1_AUDIT_WRITE_COUPLING_DECISION.md`) must be explicitly ratified before
RI-2 begins. This is a separate authorization step — not covered by this document.

---

## 14. RI-2 Type Contract Summary (Forward Reference Only)

This section records the RI-2 implications identified during Q1 analysis. It is a forward reference
only — the actual RI-2 type file does not exist yet and requires separate authorization.

`RuntimePipelineInput` required fields derived from Q1:

```typescript
// Forward reference — RI-2 type file not yet created
// All fields required. No optional variants permitted.
type RuntimePipelineInput = {
  // Scalar supplemented fields
  readonly targetDate: string                    // ISO 8601 date string
  readonly domain: string                        // non-empty domain identifier
  readonly horizon: 'short' | 'medium' | 'long' // explicit; no default

  // Array supplemented fields (adapter-local shapes — bridge handles kernel enrichment)
  readonly trendWindows: readonly {
    readonly id: string
    readonly label: string
    readonly start: string
    readonly end: string
    readonly signalType: string
    readonly value: number
    readonly confidence: number
  }[]  // non-empty enforced by bridge at runtime; type cannot enforce non-empty

  readonly behavioralPatterns: readonly {
    readonly id: string
    readonly triggerCondition: string
    readonly repeatedBehavior: string
    readonly observedCount: number
    readonly confidence: number
  }[]  // non-empty enforced by bridge at runtime

  readonly cycleWindows: readonly {
    readonly period: number
    readonly confidence: number
    readonly lastObserved: string
  }[]  // non-empty enforced by bridge at runtime
}
```

Note: TypeScript cannot enforce non-empty arrays at the type level without `[T, ...T[]]` tuple
syntax. Whether to use tuple syntax or rely on bridge runtime validation is an RI-2 decision — not
decided here. Both are valid; the tuple approach shifts the empty-array error earlier (compile
time) but adds type verbosity.

---

## 15. Out of Scope

The following are not decided by this document:

- Who constructs `RuntimePipelineInput` at the call site (Evidence Router, session context,
  direct caller, etc.) — this is an RI-5 concern
- How the call site obtains trend windows, behavioral patterns, and cycle windows from live signals
  — this is an RI-5 concern
- Whether a future gateway or adapter layer validates these fields before calling the wiring
  function — not prohibited, but not specified here
- Queue/defer recovery for failed supplemented field supply — explicitly out of scope for RI-2
  through RI-6 (per RI-1 main decision)
- Any change to `ModelStageOrchestrationInput` types — out of scope, no source edits

---

## 16. Constraints Confirmed Active for This Document

- No source file edits — confirmed
- No test file edits — confirmed
- No implementation artifacts — confirmed
- No modification to oracle-memory/sources — confirmed
- No modification to Resonance OS, Obsidian vault — confirmed
- No modification to `current.md` — confirmed
- No modification to `docs/CHATGPT_CODEX_HANDOFF_LOOP.md` — confirmed
- Typecheck backlog not activated — confirmed

---

## 17. Decision Record

| Field | Decision |
|---|---|
| `targetDate` | Caller-supplied. Required. No default. |
| `domain` | Caller-supplied. Required. No default. |
| `horizon` | Caller-supplied. Required. No default. Must be one of `'short' \| 'medium' \| 'long'`. |
| `trendWindows` | Caller-supplied. Required. Non-empty. Adapter-local shape only. |
| `behavioralPatterns` | Caller-supplied. Required. Non-empty. Adapter-local shape only. |
| `cycleWindows` | Caller-supplied. Required. Non-empty. Adapter-local shape only. |
| Wiring-layer defaults | **PROHIBITED** for all six fields. |
| Silent inference | **PROHIBITED** for all six fields. |
| Ambient/global state | **PROHIBITED** as a source for any field. |
| Fail-closed on missing field | **REQUIRED** — bridge fails, wiring returns `bridge_failed` branch. |

---

*Document complete. No source files modified. No implementation artifacts created.*
