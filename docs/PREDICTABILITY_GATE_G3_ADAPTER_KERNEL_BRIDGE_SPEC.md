# Gate G-3: Adapter-to-Kernel Bridge Boundary Spec

## 1. Classification

| Field | Value |
|---|---|
| Gate | G-3 — Adapter-to-Kernel Bridge Boundary |
| Parent gate | G — Model Stage Orchestration Boundary |
| Classification | spec / design only |
| Status | design-locked — no implementation, no runtime, no persistence |
| Author | Claude (authorized by Nick London) |
| Date | 2026-05-02 |
| Contract version | `0.1.0-design-only` |

---

## 2. Current Canon State

| Field | Value |
|---|---|
| Branch | `night-build/2026-04-25` |
| HEAD | `ac18ebb` |
| Tests | 1214/1214 passing (40 test files) |
| Build | clean |
| Gate G spec | locked at `0413a9f` |
| Gate G-1 type contracts | locked at `a8e02f0` |
| Gate G-2 pipeline plan functions | locked at `1c1187f` |
| Gate G handoff | committed at `ac18ebb` |
| Gate G-3 implementation | not started |
| Runtime wiring | none |
| Persistence | none |
| UI/API/auth | none |

### Relevant Tags (all synced local + remote)

| Tag | Target |
|---|---|
| `oracle-predictability-gate-g-model-stage-orchestration-spec-locked` | `0413a9f` |
| `oracle-predictability-gate-g-model-stage-orchestration-types-locked` | `a8e02f0` |
| `oracle-predictability-gate-g-model-stage-orchestration-functions-locked` | `1c1187f` |

---

## 3. Problem Statement

Two structurally incompatible `PredictabilityInput` types exist in the codebase:

1. **Adapter-local** `PredictabilityInput` — defined in `ui/lib/oracle/predictability/adapter-integration.ts` (lines 35–44). This is the shape produced by the adapter pipeline from Evidence Router packets.

2. **Kernel-native** `PredictabilityInput` — defined in `ui/lib/oracle/predictability/types.ts` (lines 86–96). This is the shape consumed by the Predictability Kernel's `calculatePredictabilityForecast` function.

These two types share a name but have almost entirely different fields. No executable bridge exists between them. No import crosses the boundary. Gate G-2's `isModelStageOrchestrationPlanExecutable` returns a boolean about theoretical readiness — but even when it returns `true`, no mechanism exists to actually transform adapter-local input into kernel-native input.

### What G-3 Must Answer

1. What is the exact field-by-field mapping between adapter-local and kernel-native inputs?
2. Which fields can be derived (computed from adapter-local data)?
3. Which fields must be supplemented (provided from external context, not available in adapter-local data)?
4. Which fields can be defaulted (safe fallback values exist)?
5. Which fields are unmappable (no safe derivation, supplementation, or default)?
6. What is the bridge result contract — what does a successful bridge produce?
7. What happens when the bridge fails — what is the fail-closed behavior?
8. How does the bridge interact with the 13 safety flags?
9. How does the bridge interact with Gate F audit compatibility?
10. How does the bridge interact with Gate G-2 plan executability?

---

## 4. Boundary Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADAPTER BOUNDARY                             │
│                                                                 │
│  Evidence Router → adapter-integration.ts → PredictabilityInput │
│                                              (adapter-local)    │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │  ← G-3 BRIDGE (this spec)
                             │     No executable code yet.
                             │     Design contract only.
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    KERNEL BOUNDARY                              │
│                                                                 │
│  PredictabilityInput → calculatePredictabilityForecast          │
│  (kernel-native)        (predictability-kernel.ts)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What Crosses the Bridge

- **Input direction:** Adapter-local `PredictabilityInput` → Kernel-native `PredictabilityInput`
- **Output direction:** Not in scope for G-3. The kernel output (`PredictabilityForecast`) flows back through `predictabilityForecastToAdapterExplanation` in `adapter-integration.ts`. That path is already defined (Gate D) and is not part of the bridge.

### What Does NOT Cross the Bridge

- Safety flags (validated separately by `assertModelStageOrchestrationSafetyFlags`)
- Orchestration plan (validated separately by `validateModelStageOrchestrationPlan`)
- Audit compatibility (validated separately by `validateGateFAuditCompatibility`)
- Forecast assembly (output-side, not input-side)

---

## 5. Adapter-Local Input Inventory

Source: `ui/lib/oracle/predictability/adapter-integration.ts`, lines 35–44.

| # | Field | Type | Source | Required |
|---|---|---|---|---|
| A1 | `objective` | `string` | Adapter pipeline — extracted from Evidence Router packet | Yes |
| A2 | `historicalEvents` | `readonly HistoricalEvidenceEvent[]` | Adapter pipeline — transformed from Evidence Router events | Yes |
| A3 | `excludedEvidenceIds` | `readonly string[]` | Adapter pipeline — IDs filtered during validation | Yes |
| A4 | `validationWarnings` | `readonly AdapterWarning[]` | Adapter pipeline — warnings from `validateThenAdaptPacket` | Yes |
| A5 | `hardConstraints` | `readonly string[]` | Adapter pipeline — constraints from packet | Yes |
| A6 | `outputConstraints` | `{ readonly forbidAutonomousAction: boolean }` | Adapter pipeline — safety constraint | Yes |
| A7 | `provenanceTrail` | `readonly string[]` | Adapter pipeline — lineage strings | Yes |
| A8 | `shouldTriggerMCT` | `boolean` | Adapter pipeline — Monte Carlo trigger flag | Yes |

### HistoricalEvidenceEvent Shape

Source: `ui/lib/oracle/predictability/adapter-integration.ts`, lines 26–33.

| Field | Type |
|---|---|
| `sourceId` | `string` |
| `claim` | `string` |
| `sourceReliability` | `number` (0–1) |
| `originalConfidence` | `number` (0–1) |
| `adjustedConfidence` | `number` (0–1) |
| `observedAt` | `string` (ISO date) |

---

## 6. Kernel-Native Input Inventory

Source: `ui/lib/oracle/predictability/types.ts`, lines 86–96.

| # | Field | Type | Purpose | Required |
|---|---|---|---|---|
| K1 | `targetDate` | `string` | When the forecast targets | Yes |
| K2 | `domain` | `string` | Domain classification | Yes |
| K3 | `objective` | `string` | What is being forecast | Yes |
| K4 | `horizon` | `Horizon` (`"short"│"medium"│"long"`) | Forecast time horizon | Yes |
| K5 | `historicalEvents` | `LandmarkEvent[]` | Historical landmark events for Bayesian updating | Yes |
| K6 | `trendWindows` | `TrendWindow[]` | Trend analysis windows for M-G stage | Yes |
| K7 | `landmarkEvents` | `LandmarkEvent[]` | Landmark events (distinct from historicalEvents — used by M-E/M-F) | Yes |
| K8 | `behavioralPatterns` | `BehavioralPattern[]` | Behavioral patterns for regime detection | Yes |
| K9 | `cycleWindows` | `CycleWindow[]` | Cycle phase windows for M-H stage | Yes |

### Supporting Type Shapes

**LandmarkEvent** (`types.ts`, lines 31–44):

| Field | Type |
|---|---|
| `id` | `string` |
| `date` | `string` |
| `description` | `string` |
| `impact` | `EventImpact` (`"high"│"medium"│"low"`) |
| `domain` | `string` |
| `confidence` | `number` (0–1) |
| `source` | `string` |
| `sourceTier` | `SourceTier` (`"primary"│"secondary"│"tertiary"`) |
| `signalScale` | `SignalScale` (`"strong"│"moderate"│"weak"`) |
| `verified` | `boolean` |

**TrendWindow** (`types.ts`, lines 9–19):

| Field | Type |
|---|---|
| `id` | `string` |
| `label` | `string` |
| `startDate` | `string` |
| `endDate` | `string` |
| `direction` | `TrendDirection` (`"up"│"down"│"stable"│"volatile"`) |
| `strength` | `number` (0–1) |
| `dataPoints` | `number` |

**BehavioralPattern** (`types.ts`, lines 58–70):

| Field | Type |
|---|---|
| `id` | `string` |
| `pattern` | `string` |
| `frequency` | `string` |
| `confidence` | `number` (0–1) |
| `firstObserved` | `string` |
| `lastObserved` | `string` |
| `observationCount` | `number` |
| `domain` | `string` |

**CycleWindow** (`types.ts`, lines 72–77):

| Field | Type |
|---|---|
| `id` | `string` |
| `label` | `string` |
| `periodDays` | `number` |
| `phase` | `number` (0–1) |

---

## 7. Mapping Matrix

This matrix defines the exact field-by-field relationship between adapter-local fields (A1–A8) and kernel-native fields (K1–K9).

| Kernel Field | Adapter Source | Bridge Action | Classification | Notes |
|---|---|---|---|---|
| K1 `targetDate` | None | **Supplement** | `supplementedFields` | Not available in adapter-local input. Must be provided externally (from `ModelStageOrchestrationInput.targetDate` or caller). No safe default — fail-closed if missing. |
| K2 `domain` | None | **Supplement** | `supplementedFields` | Not available in adapter-local input. Must be provided externally (from `ModelStageOrchestrationInput.domain` or caller). No safe default — fail-closed if missing. |
| K3 `objective` | A1 `objective` | **Direct map** | `derivedFields` | 1:1 string copy. Both types use the same field name and type. |
| K4 `horizon` | None | **Supplement** | `supplementedFields` | Not available in adapter-local input. Must be provided externally (from `ModelStageOrchestrationInput.horizon` or caller). No safe default — fail-closed if missing. |
| K5 `historicalEvents` | A2 `historicalEvents` | **Transform** | `derivedFields` | `HistoricalEvidenceEvent[]` → `LandmarkEvent[]`. Lossy transformation — adapter events have fewer fields than landmark events. See Transform Rules below. |
| K6 `trendWindows` | None | **Supplement** | `supplementedFields` | Not available in adapter-local input. Must be provided externally (from `ModelStageOrchestrationInput.trendWindows` or caller). Empty array `[]` is NOT a safe default — M-G stage requires at least one trend window. Fail-closed if missing. |
| K7 `landmarkEvents` | A2 `historicalEvents` | **Transform** | `derivedFields` | Same source as K5 but semantically distinct in the kernel. May use the same transformation or a filtered subset. Bridge must document which events become `landmarkEvents` vs `historicalEvents`. |
| K8 `behavioralPatterns` | None | **Supplement** | `supplementedFields` | Not available in adapter-local input. Must be provided externally (from `ModelStageOrchestrationInput.behavioralPatterns` or caller). Empty array `[]` is NOT a safe default — M-H stage may require patterns. Fail-closed if missing. |
| K9 `cycleWindows` | None | **Supplement** | `supplementedFields` | Not available in adapter-local input. Must be provided externally (from `ModelStageOrchestrationInput.cycleWindows` or caller). Empty array `[]` is NOT a safe default — M-H stage requires cycle data. Fail-closed if missing. |

### Adapter Fields Not Consumed by Kernel

| Adapter Field | Disposition | Notes |
|---|---|---|
| A3 `excludedEvidenceIds` | **Audit-only** | Recorded in provenance trail / audit lineage. Not consumed by kernel. |
| A4 `validationWarnings` | **Audit-only** | Recorded in provenance trail / audit lineage. Not consumed by kernel. |
| A5 `hardConstraints` | **Audit-only** | May influence safety flag validation but not kernel input fields. |
| A6 `outputConstraints` | **Safety-only** | Maps to `forbidAutonomousAction` safety flag. Not a kernel input field. |
| A7 `provenanceTrail` | **Audit-only** | Flows to `ForecastAuditEntry.kernelInputLineage`. Not a kernel input field. |
| A8 `shouldTriggerMCT` | **Orchestration-only** | Informs whether M-C/M-D stages execute. Not a kernel input field. |

### Transform Rules: HistoricalEvidenceEvent → LandmarkEvent

This is the only derivable transformation in the bridge. It is **lossy** — the kernel's `LandmarkEvent` has fields that do not exist in the adapter's `HistoricalEvidenceEvent`.

| LandmarkEvent Field | Source | Rule |
|---|---|---|
| `id` | `sourceId` | Direct map |
| `date` | `observedAt` | Direct map (both ISO strings) |
| `description` | `claim` | Direct map |
| `impact` | — | **Must be derived or defaulted.** No direct equivalent. Could derive from `adjustedConfidence`: `≥0.7 → "high"`, `≥0.4 → "medium"`, `<0.4 → "low"`. This is a lossy heuristic. Mark as `defaultedFields` entry. |
| `domain` | — | **Must be supplemented.** Not available in `HistoricalEvidenceEvent`. Must come from external context (same source as K2 `domain`). |
| `confidence` | `adjustedConfidence` | Direct map |
| `source` | `sourceId` | Direct map (reuse sourceId as source identifier) |
| `sourceTier` | `sourceReliability` | **Must be derived.** Could derive from `sourceReliability`: `≥0.8 → "primary"`, `≥0.5 → "secondary"`, `<0.5 → "tertiary"`. Lossy heuristic. Mark as `defaultedFields` entry. |
| `signalScale` | `originalConfidence` | **Must be derived.** Could derive from `originalConfidence`: `≥0.7 → "strong"`, `≥0.4 → "moderate"`, `<0.4 → "weak"`. Lossy heuristic. Mark as `defaultedFields` entry. |
| `verified` | — | **Must be defaulted.** No equivalent in adapter data. Default: `false` (conservative). Mark as `defaultedFields` entry. |

**Lossy fields summary:** `impact`, `sourceTier`, `signalScale` are derived via threshold heuristics. `verified` is defaulted to `false`. `domain` is supplemented from external context. These 5 fields represent information loss in the bridge — the audit trail must record this.

---

## 8. Bridge Result Contract — Conceptual

When the bridge executes (future G-3 implementation), it produces a result with this conceptual shape:

```
BridgeResult {
  success: boolean
  kernelInput?: PredictabilityInput (kernel-native)
  bridgeContract: AdapterToKernelBridgeContract
  errors: string[]
  warnings: string[]
  fieldAudit: BridgeFieldAudit
}
```

### BridgeFieldAudit — Conceptual

Records the disposition of every field for audit/lineage purposes:

```
BridgeFieldAudit {
  derivedFields: string[]        // Fields computed from adapter-local data
  supplementedFields: string[]   // Fields provided from external context
  defaultedFields: string[]      // Fields given safe fallback values
  unmappableFields: string[]     // Fields with no safe bridge path
  lossyTransforms: LossyTransformRecord[]  // Fields where information was lost
}
```

### LossyTransformRecord — Conceptual

```
LossyTransformRecord {
  targetField: string            // Kernel field that received lossy data
  sourceField: string            // Adapter field that was the source
  transformRule: string          // Description of the heuristic applied
  informationLost: string        // What was lost or approximated
}
```

### Expected Field Classifications

Based on the Mapping Matrix (Section 7):

| Classification | Fields | Count |
|---|---|---|
| `derivedFields` | `objective`, `historicalEvents`, `landmarkEvents` | 3 |
| `supplementedFields` | `targetDate`, `domain`, `horizon`, `trendWindows`, `behavioralPatterns`, `cycleWindows` | 6 |
| `defaultedFields` | `impact` (within LandmarkEvent), `sourceTier`, `signalScale`, `verified`, `domain` (within LandmarkEvent) | 5 (sub-field level) |
| `unmappableFields` | None identified — all fields have a derivation, supplementation, or default path | 0 |

**Key observation:** 6 of 9 kernel fields require supplementation (external data not present in the adapter-local input). The bridge is majority-supplemented, not majority-derived. This means the bridge's value is primarily in **structural transformation and audit recording**, not in data derivation.

---

## 9. Bridge Status Rules

The `AdapterToKernelBridgeContract.bridgeStatus` field (defined in Gate G-1, `model-stage-orchestration-types.ts` line 103) has four possible values. G-3 defines the rules for each:

| Status | Condition | Bridge Outcome | Plan Executability |
|---|---|---|---|
| `'applied'` | All derivedFields computed successfully. All supplementedFields provided. All defaultedFields applied. No unmappableFields. `bridgeApplied` = `true`. | Kernel-native input produced. | `true` (if plan + safety also valid) |
| `'not_required'` | Caller provides kernel-native input directly (bypasses adapter path). No bridge transformation needed. `bridgeApplied` = `false`. | No transformation. Kernel input used as-is. | `true` (if plan + safety also valid) |
| `'degraded'` | Bridge partially succeeded. Some supplementedFields missing but defaultable. Some lossy transforms exceeded acceptable thresholds. `unbridgedWarning` = `true`. | Kernel-native input produced but with known gaps. | `false` — degraded bridge must not execute. Fail-closed. |
| `'failed'` | Bridge could not produce kernel-native input. Required supplementedFields missing with no defaults. Transform errors. `unbridgedWarning` = `true`. | No kernel-native input produced. | `false` — failed bridge must not execute. Fail-closed. |

### Status Transition Rules

- `'applied'` → only valid status for execution. No exceptions.
- `'not_required'` → only valid when caller bypasses the adapter path entirely.
- `'degraded'` → MUST fail-closed. Bridge produced output but with known deficiencies. The output MUST NOT be passed to the kernel. This is a design decision: degraded is not "good enough." The system does not silently degrade.
- `'failed'` → MUST fail-closed. No output to pass.

### Interaction with `isModelStageOrchestrationPlanExecutable`

Gate G-2's composite check (line 434–440 of `model-stage-orchestration.ts`) already enforces:

```typescript
if (bridge.bridgeStatus !== 'applied' && bridge.bridgeStatus !== 'not_required') {
  return false
}
```

This means `'degraded'` and `'failed'` already block execution at the plan level. G-3 does not need to add new enforcement — the existing check is sufficient. G-3's contribution is defining **when each status applies**.

---

## 10. Fail-Closed Rules

The bridge operates under a strict fail-closed policy. Every failure mode results in the bridge refusing to produce kernel-native input, rather than producing degraded or partial input.

### Rule F-1: Missing Required Supplemented Field

If any of the 6 supplemented fields (`targetDate`, `domain`, `horizon`, `trendWindows`, `behavioralPatterns`, `cycleWindows`) is missing and has no safe default:

- **Action:** Bridge status → `'failed'`
- **Rationale:** These fields are required by the kernel. Without them, the kernel cannot produce a valid forecast. Producing a forecast with missing structural input would violate the advisory-only safety constraint — the system would be making claims based on incomplete data.

### Rule F-2: Empty Required Array

If `trendWindows`, `behavioralPatterns`, or `cycleWindows` is provided as an empty array `[]`:

- **Action:** Bridge status → `'failed'`
- **Rationale:** Empty arrays are structurally valid but semantically empty. The kernel stages that consume these fields (M-G, M-H) cannot produce meaningful output from empty input. An empty array is not the same as "no data available" — it is "data was expected but not provided."

### Rule F-3: Transform Error

If the `HistoricalEvidenceEvent[]` → `LandmarkEvent[]` transformation fails for any event (e.g., missing `sourceId`, invalid `observedAt` format, `adjustedConfidence` outside 0–1):

- **Action:** Bridge status → `'failed'`
- **Rationale:** Partial transformation (some events succeed, some fail) would produce a biased sample. The kernel would receive a subset of historical events without knowing which were excluded or why. Fail-closed on any transform error.

### Rule F-4: Threshold Derivation Failure

If any threshold-based derivation (`sourceReliability` → `sourceTier`, `originalConfidence` → `signalScale`, `adjustedConfidence` → `impact`) receives a value outside the expected range [0, 1]:

- **Action:** Bridge status → `'failed'`
- **Rationale:** Out-of-range values indicate upstream data corruption. The bridge should not attempt to clamp or normalize — it should fail and surface the error.

### Rule F-5: Bridge Version Mismatch

If the bridge contract's `bridgeVersion` does not match the expected version for this gate:

- **Action:** Bridge status → `'failed'`
- **Rationale:** Version mismatch indicates the bridge was constructed by a different gate version. Running mismatched bridge logic against mismatched type contracts could produce silently incorrect results.

### Rule F-6: Safety Flag Violation

If any of the 13 safety flags is not literal `true` at bridge execution time:

- **Action:** Bridge does not execute. Status → `'failed'`
- **Rationale:** Safety flags are pre-conditions for all orchestration activity, including the bridge. The bridge is part of the orchestration pipeline and is subject to the same safety constraints.

---

## 11. Safety Invariants (13 Flags)

All 13 safety flags from `ModelStageOrchestrationSafetyFlags` (defined in Gate G-1, `model-stage-orchestration-types.ts` lines 163–179) must be literal `true` before, during, and after bridge execution.

### Inherited from Gate F (9 flags)

| # | Flag | Bridge Relevance |
|---|---|---|
| 1 | `advisoryOnly` | Bridge output is advisory input to an advisory system. No autonomous action. |
| 2 | `humanReviewRequired` | Bridge output must be reviewed before any downstream use. |
| 3 | `userAcknowledgmentRequired` | User must acknowledge bridge results. |
| 4 | `forbidAutonomousAction` | Bridge must not trigger any autonomous action. Maps from adapter A6 `outputConstraints.forbidAutonomousAction`. |
| 5 | `forbidCertaintyLanguage` | No bridge output may use certainty language. |
| 6 | `requireAssumptions` | Bridge must document all assumptions made during transformation (e.g., threshold heuristics for `impact`, `sourceTier`, `signalScale`). |
| 7 | `requireFailureModes` | Bridge must document all failure modes. |
| 8 | `requireProvenanceTrail` | Bridge must produce a provenance trail documenting the transformation. |
| 9 | `noActionRecommended` | Bridge output carries no action recommendation. |

### Orchestration-Specific (4 flags)

| # | Flag | Bridge Relevance |
|---|---|---|
| 10 | `requireDeterministicSeed` | Bridge transformation must be deterministic — same input always produces same output. No randomness in threshold derivations. |
| 11 | `forbidStageSkipping` | Bridge must not skip any derivation or supplementation step. All fields must be accounted for. |
| 12 | `requireLineageCompleteness` | Bridge must produce a complete `BridgeFieldAudit` — every kernel field must appear in exactly one classification. |
| 13 | `failOpenToSafeState` | On any error, bridge fails to `'failed'` status — not to `'degraded'` or silent continuation. "Fail open to safe state" means the safe state is "no output." |

### Bridge-Specific Safety Invariant

The bridge introduces one additional safety invariant beyond the 13 flags:

**S-BRIDGE-1: No silent information loss.** Every lossy transformation must be recorded in `BridgeFieldAudit.lossyTransforms`. If the bridge cannot record a lossy transform (e.g., due to an internal error in audit recording), the bridge must fail-closed rather than proceed without the audit record.

---

## 12. Gate F Audit Compatibility

Source: `ui/lib/oracle/predictability/forecast-audit-types.ts`

The bridge must produce data compatible with Gate F's audit trail. Specifically:

### ForecastAuditKernelInputLineage (lines 163–168)

| Field | Bridge Responsibility |
|---|---|
| `inputTypePath` | Bridge sets to `'kernel_native'` (the output is kernel-native format). If bridge status is `'not_required'`, also `'kernel_native'` (input was already in kernel format). |
| `bridgeApplied` | `true` when bridge status is `'applied'`. `false` when `'not_required'`. |
| `unbridgedWarning` | `true` when bridge status is `'degraded'` or `'failed'`. `false` when `'applied'` or `'not_required'`. |
| `bridgeGateId` | `'gate-g-3'` — identifies which gate's bridge logic was used. |

### ForecastAuditModelStageLineage (lines 179–183)

| Field | Bridge Responsibility |
|---|---|
| `stagesExecuted` | Bridge does NOT populate this — stages have not executed yet. Remains `[]` at bridge time. |
| `orchestrationGateId` | Bridge sets to `'gate-g'` (parent gate). |
| `compositionMethod` | Bridge sets to `'sequential-pipeline-v1'` (from orchestration plan). |

### Consistency Rule (from `forecast-audit.ts` lines 192–201)

Gate F's `validateForecastAuditLineage` enforces: if `inputTypePath` is `'kernel_native'` and `bridgeApplied` is `false`, then `unbridgedWarning` must be `true`.

**Bridge compatibility:** When bridge status is `'not_required'` (caller provides kernel-native input directly, bridge not applied), the bridge must set `unbridgedWarning: true` per this rule. This is correct — the audit trail records that no bridge was applied, which is a warning condition even when intentional.

**Exception:** If future gates introduce a `'direct_kernel'` input type path that explicitly signals "no bridge needed, no warning needed," this rule can be revisited. For G-3, the conservative interpretation applies.

### Current Gate F Fixture State

The Gate F example fixtures (`forecast-audit-types.ts`) currently show:

```
stagesExecuted: []
orchestrationGateId: undefined
compositionMethod: undefined
```

These are placeholders. When G-3 implementation eventually populates bridge results, the audit lineage fields will transition from placeholder to populated. This transition must be tested (see Section 17: Required Future Tests).

---

## 13. Gate G-2 Compatibility

Source: `ui/lib/oracle/predictability/model-stage-orchestration.ts`

### isModelStageOrchestrationPlanExecutable (lines 419–442)

This composite function checks three conditions:

1. `validateModelStageOrchestrationPlan(plan).valid` — plan structure
2. `validateAdapterToKernelBridgeContract(bridge).valid` — bridge contract structure
3. `assertModelStageOrchestrationSafetyFlags(safetyFlags).valid` — all 13 flags true
4. `bridge.bridgeStatus` is `'applied'` or `'not_required'`

**G-3's role:** G-3 defines the rules for when a bridge contract transitions to each status. The G-2 function already enforces the status check. G-3 does not modify G-2 logic — it defines the preconditions that produce each status value.

### validateAdapterToKernelBridgeContract (lines 156–183)

This function validates:

- `bridgeVersion` is non-empty
- If status is `'applied'`, `bridgeApplied` must be `true`
- If status is `'failed'` or `'degraded'`, `unbridgedWarning` must be `true`

**G-3 compatibility:** All G-3 bridge status rules (Section 9) are compatible with these validation rules:

- `'applied'` → G-3 sets `bridgeApplied: true` ✓
- `'not_required'` → G-3 sets `bridgeApplied: false` (no conflict — the validator doesn't check this case) ✓
- `'degraded'` → G-3 sets `unbridgedWarning: true` ✓
- `'failed'` → G-3 sets `unbridgedWarning: true` ✓

### AdapterToKernelBridgeContract Fields

The existing contract type (Gate G-1) already includes the fields G-3 needs:

| Field | G-3 Populates | Notes |
|---|---|---|
| `bridgeStatus` | Yes | Per status rules (Section 9) |
| `bridgeVersion` | Yes | Set to G-3 contract version |
| `inputTypePath` | Yes | `'adapter_local'` (input) or `'kernel_native'` (output) |
| `derivedFields` | Yes | From mapping matrix (Section 7) |
| `supplementedFields` | Yes | From mapping matrix (Section 7) |
| `defaultedFields` | Yes | From mapping matrix (Section 7) |
| `unmappableFields` | Yes | From mapping matrix (Section 7) — currently empty |
| `unbridgedWarning` | Yes | Per status rules (Section 9) |
| `bridgeApplied` | Yes | Per status rules (Section 9) |

No new type additions needed for the existing contract. The `BridgeFieldAudit` and `LossyTransformRecord` types (Section 8) would be new additions in a future G-3 implementation gate.

---

## 14. Non-Goals

G-3 explicitly does NOT address:

| Non-Goal | Reason |
|---|---|
| Executable bridge code | G-3 is spec only. Implementation requires a separate authorized gate. |
| Runtime orchestration | No stages execute. No kernel calls. |
| Persistence / storage | No database, no schema, no writes. |
| UI / API / auth | No user-facing changes. |
| Modifying existing Gate F types | Gate F is sealed. G-3 designs around it, not through it. |
| Modifying existing Gate G-1 types | Gate G-1 is sealed. G-3 designs around it, not through it. |
| Modifying existing Gate G-2 functions | Gate G-2 is sealed. G-3 designs around it, not through it. |
| Live Evidence Router wiring | The adapter pipeline that feeds the bridge is out of scope. |
| Calibration ledger | M-I concerns. Not G-3. |
| Monte Carlo execution | M-C/M-D concerns. `shouldTriggerMCT` is an orchestration signal, not a bridge field. |
| Output-side bridging | `PredictabilityForecast` → adapter explanation path already exists (Gate D). Not G-3. |
| Modifying `predictability-kernel.ts` | Kernel is a protected file. |
| Modifying `adapter-integration.ts` | Adapter is a protected file for G-3 scope. |

---

## 15. Failure Modes

| # | Failure Mode | Severity | Detection | Recovery |
|---|---|---|---|---|
| FM-1 | All 6 supplemented fields missing | Critical | Bridge fails immediately — no external context provided | Caller must supply supplemented fields. No bridge fallback. |
| FM-2 | Partial supplemented fields | Critical | Bridge detects missing required fields | Same as FM-1. Partial is not acceptable — all or nothing. |
| FM-3 | HistoricalEvidenceEvent transform corruption | High | Individual event fails validation (missing sourceId, bad date format) | Entire bridge fails (Rule F-3). No partial transforms. |
| FM-4 | Threshold derivation out of range | High | Value outside [0, 1] detected | Bridge fails (Rule F-4). No clamping. |
| FM-5 | Bridge version mismatch | Medium | Version string comparison | Bridge fails (Rule F-5). Caller must use correct bridge version. |
| FM-6 | Safety flag violation at bridge time | Critical | `assertModelStageOrchestrationSafetyFlags` returns invalid | Bridge does not execute (Rule F-6). |
| FM-7 | Silent information loss | High | Audit recording failure during lossy transform | Bridge fails (S-BRIDGE-1). No unrecorded lossy transforms. |
| FM-8 | Gate F audit lineage inconsistency | Medium | `validateForecastAuditLineage` fails on bridge-produced lineage | Bridge contract is misconfigured. Fix contract values. |
| FM-9 | Empty historicalEvents array | Medium | Adapter provides no events | Bridge produces empty `LandmarkEvent[]` arrays for K5 and K7. This may be valid (no historical data) or may indicate upstream failure. Bridge should warn but not fail — empty events are structurally valid. |

---

## 16. Risk Analysis

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Supplementation source changes | Medium | High — field mapping becomes incorrect | Bridge contract pins field sources. Changes require spec revision. |
| R-2 | Kernel type changes | Low (types are sealed) | High — mapping matrix becomes invalid | G-3 spec is version-locked to current kernel types. Any kernel type change requires G-3 spec revision. |
| R-3 | Threshold heuristics produce misleading classifications | Medium | Medium — `impact`, `sourceTier`, `signalScale` approximations may not match true values | Audit trail records all lossy transforms. Advisory-only flag ensures no autonomous action based on approximate values. |
| R-4 | Bridge complexity exceeds design assumptions | Medium | Medium — implementation may reveal edge cases not covered by spec | Spec includes fail-closed rules for unknown conditions. Implementation gate will add tests for discovered edge cases. |
| R-5 | Adapter-local type evolves (new fields added) | Low | Low — new adapter fields would be `audit-only` unless bridge spec is updated | Bridge only maps defined fields. New adapter fields are ignored unless explicitly added to mapping matrix. |
| R-6 | Multiple bridge versions in flight | Low | Medium — version mismatch failures | Rule F-5 enforces version match. Only one bridge version active at a time. |

---

## 17. Required Future Tests

These tests must be written in a future G-3 implementation gate. They are listed here to define the verification boundary.

### Unit Tests — Bridge Transformation

| # | Test | Expected |
|---|---|---|
| T-1 | Bridge with all fields provided (derived + supplemented) → status `'applied'` | Kernel-native input produced. All audit fields populated. |
| T-2 | Bridge with missing required supplemented field → status `'failed'` | No kernel-native input. Error lists missing field. |
| T-3 | Bridge with empty required array (`trendWindows: []`) → status `'failed'` | No kernel-native input. Error lists empty array field. |
| T-4 | Bridge with invalid `HistoricalEvidenceEvent` → status `'failed'` | No kernel-native input. Error identifies corrupt event. |
| T-5 | Bridge with out-of-range confidence value → status `'failed'` | No kernel-native input. Error identifies out-of-range value. |
| T-6 | Bridge with version mismatch → status `'failed'` | No kernel-native input. Error identifies version mismatch. |
| T-7 | Bridge with safety flag violation → bridge does not execute | Error identifies which flag is false. |
| T-8 | Bridge with `'not_required'` status → no transformation | Kernel-native input passed through unchanged. |

### Unit Tests — Lossy Transform Audit

| # | Test | Expected |
|---|---|---|
| T-9 | Lossy transform (`sourceReliability` → `sourceTier`) produces audit record | `lossyTransforms` contains entry for `sourceTier` with transform rule and information lost. |
| T-10 | Lossy transform (`adjustedConfidence` → `impact`) produces audit record | `lossyTransforms` contains entry for `impact`. |
| T-11 | Lossy transform (`originalConfidence` → `signalScale`) produces audit record | `lossyTransforms` contains entry for `signalScale`. |
| T-12 | `verified` default produces audit record | `defaultedFields` contains `verified`. |
| T-13 | `domain` (sub-field in LandmarkEvent) supplementation produces audit record | `supplementedFields` or `defaultedFields` contains record. |

### Integration Tests — Gate F Compatibility

| # | Test | Expected |
|---|---|---|
| T-14 | Bridge-produced lineage passes `validateForecastAuditLineage` | No validation errors. |
| T-15 | Bridge-produced lineage passes `validateForecastAuditEntry` | Full audit entry valid. |
| T-16 | Bridge `'applied'` status produces consistent audit lineage | `bridgeApplied: true`, `unbridgedWarning: false`, `inputTypePath: 'kernel_native'`. |
| T-17 | Bridge `'not_required'` status produces consistent audit lineage | `bridgeApplied: false`, `unbridgedWarning: true`, `inputTypePath: 'kernel_native'`. |

### Integration Tests — Gate G-2 Compatibility

| # | Test | Expected |
|---|---|---|
| T-18 | Bridge `'applied'` + valid plan + valid safety → executable | `isModelStageOrchestrationPlanExecutable` returns `true`. |
| T-19 | Bridge `'degraded'` + valid plan + valid safety → NOT executable | Returns `false`. |
| T-20 | Bridge `'failed'` + valid plan + valid safety → NOT executable | Returns `false`. |
| T-21 | Bridge `'applied'` + valid plan + one safety flag false → NOT executable | Returns `false`. |

### Determinism Tests

| # | Test | Expected |
|---|---|---|
| T-22 | Same adapter input → same kernel output (100 iterations) | Byte-identical output every time. No randomness in threshold derivations. |
| T-23 | Same adapter input → same bridge contract (100 iterations) | Byte-identical contract every time. |
| T-24 | Same adapter input → same field audit (100 iterations) | Byte-identical audit every time. |

---

## 18. Proposed Safe Sub-Stages

Future implementation of G-3 should proceed in the following sub-stages, each requiring separate authorization:

| Sub-Stage | Scope | Deliverables | Prerequisites |
|---|---|---|---|
| G-3.1 — Bridge type contracts | New TypeScript interfaces for `BridgeResult`, `BridgeFieldAudit`, `LossyTransformRecord`. No functions. | Type file + type tests | This spec (G-3.0) approved |
| G-3.2 — Bridge pure functions | Bridge transformation function(s). Pure, no I/O, no side effects. | Implementation file + unit tests (T-1 through T-13, T-22 through T-24) | G-3.1 types locked |
| G-3.3 — Gate F integration tests | Tests verifying bridge output compatibility with Gate F audit trail. | Integration tests (T-14 through T-17) | G-3.2 functions locked |
| G-3.4 — Gate G-2 integration tests | Tests verifying bridge output compatibility with G-2 plan executability. | Integration tests (T-18 through T-21) | G-3.2 functions locked |
| G-3.5 — Handoff | Handoff document recording G-3 state. | Handoff doc | G-3.2 + G-3.3 + G-3.4 locked |

### Sub-Stage Dependencies

```
G-3.0 (this spec)
  └── G-3.1 (type contracts)
        └── G-3.2 (pure functions)
              ├── G-3.3 (Gate F integration tests)
              ├── G-3.4 (Gate G-2 integration tests)
              └── G-3.5 (handoff) — after G-3.3 + G-3.4
```

---

## 19. Forbidden Files and Actions

### Forbidden Files — Must NOT Be Created, Modified, or Imported

| File | Reason |
|---|---|
| `ui/lib/oracle/predictability/predictability-kernel.ts` | Kernel is a protected boundary. G-3 designs around it, not through it. |
| `ui/lib/oracle/predictability/adapter-integration.ts` | Adapter pipeline is sealed (Gate D). G-3 does not modify the adapter. |
| `ui/lib/oracle/predictability/types.ts` | Kernel-native types are sealed. G-3 does not modify kernel types. |
| `ui/lib/oracle/predictability/forecast-audit-types.ts` | Gate F types are sealed (`43267d2`). |
| `ui/lib/oracle/predictability/forecast-audit.ts` | Gate F functions are sealed (`2a57451`). |
| `ui/lib/oracle/predictability/model-stage-orchestration-types.ts` | Gate G-1 types are sealed (`a8e02f0`). |
| `ui/lib/oracle/predictability/model-stage-orchestration.ts` | Gate G-2 functions are sealed (`1c1187f`). |
| `current.md` | System memory file. Never modified by gate work. |
| `~/.claude/oracle-memory/sources/*` | Oracle memory sources. Never modified by gate work. |
| Any `*.test.ts` file | G-3 is spec only. No test files created. |
| Any `*.ts` or `*.tsx` source file | G-3 is spec only. No source files created. |

### Forbidden Actions

| Action | Status |
|---|---|
| Writing source code (`.ts`, `.tsx`, `.js`, `.jsx`) | FORBIDDEN — spec only |
| Writing test code | FORBIDDEN — spec only |
| Importing from any existing module | FORBIDDEN — spec only |
| Calling any existing function | FORBIDDEN — spec only |
| Modifying `package.json` | FORBIDDEN |
| Running any model stage (M-A through M-I) | FORBIDDEN |
| Calling `calculatePredictabilityForecast` | FORBIDDEN |
| Wiring the Evidence Router | FORBIDDEN |
| Activating `shell-promoter` | FORBIDDEN |
| Unwiring `KEEP_DEFERRED` | FORBIDDEN |
| Adding UI / API / DB / auth | FORBIDDEN |
| Committing, pushing, or tagging (this spec) | NOT YET AUTHORIZED — requires separate authorization |

---

## 20. Acceptance Criteria for This Spec

This spec is considered complete when all of the following are true:

| # | Criterion | Status |
|---|---|---|
| AC-1 | Problem statement identifies both input types with file paths and line numbers | ✓ |
| AC-2 | Complete field inventory for adapter-local input (8 fields + sub-type) | ✓ |
| AC-3 | Complete field inventory for kernel-native input (9 fields + 4 sub-types) | ✓ |
| AC-4 | Field-by-field mapping matrix with classification for every kernel field | ✓ |
| AC-5 | Transform rules for the only derivable transformation (HistoricalEvidenceEvent → LandmarkEvent) | ✓ |
| AC-6 | Disposition of adapter fields not consumed by kernel | ✓ |
| AC-7 | Bridge result contract with field audit structure | ✓ |
| AC-8 | Bridge status rules for all 4 statuses | ✓ |
| AC-9 | Fail-closed rules (at least 5 rules) | ✓ (6 rules) |
| AC-10 | Safety invariants covering all 13 flags + bridge-specific invariant | ✓ (13 + S-BRIDGE-1) |
| AC-11 | Gate F audit compatibility analysis | ✓ |
| AC-12 | Gate G-2 compatibility analysis | ✓ |
| AC-13 | Non-goals explicitly listed | ✓ |
| AC-14 | Failure modes with severity and recovery | ✓ (9 modes) |
| AC-15 | Risk analysis with probability and mitigation | ✓ (6 risks) |
| AC-16 | Required future tests (at least 20) | ✓ (24 tests) |
| AC-17 | Proposed sub-stages with dependency graph | ✓ (5 sub-stages) |
| AC-18 | Forbidden files and actions | ✓ |
| AC-19 | No source code created | ✓ |
| AC-20 | No existing files modified | ✓ |
| AC-21 | No imports added | ✓ |
| AC-22 | Document is self-contained and readable without loading other files | ✓ |

---

## 21. Next Safe Action

1. Review this spec for completeness and correctness.
2. If approved, authorize commit of this spec document only.
3. After commit, authorize tag if desired.
4. G-3.1 (type contracts) requires separate authorization.
5. Runtime wiring remains locked.
6. All sealed gates remain sealed.

---

## Appendix A: Cross-Reference to Gate G Parent Spec

| G Parent Spec Section | G-3 Coverage |
|---|---|
| Section 4 (Problem) | Sections 3, 4 |
| Section 5 (Orchestration Input) | Sections 5, 6 |
| Section 8 (Adapter/Kernel Gap) | Sections 3, 4, 7 |
| Section 9 (Pipeline Order) | Not directly — G-3 is input-side, not execution-side |
| Section 10 (Safety Flags) | Section 11 |
| Section 11 (Fail-Closed) | Section 10 |
| Section 12 (Gate F Compat) | Section 12 |
| Section 16 (Sub-Stages) | Section 18 (G-3 sub-stages specifically) |
| Section 17 (Forbidden) | Section 19 |

## Appendix B: Version History

| Version | Date | Change |
|---|---|---|
| 0.1.0-design-only | 2026-05-02 | Initial G-3 spec — design/planning document only |
