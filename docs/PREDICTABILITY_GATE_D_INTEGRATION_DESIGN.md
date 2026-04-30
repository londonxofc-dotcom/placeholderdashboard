# Predictability Gate D Integration Design

## 1. Canon Boundary

**This is design documentation only.**

- Gate D code remains locked. No implementation authorized by this document.
- Evidence Router wiring remains locked.
- Predictability Kernel integration remains locked.
- No UI/API/DB/auth modifications authorized.
- No current.md edits authorized.
- No protected source mutation authorized.
- No shell-promoter activation authorized.

This document shapes a future implementation path without claiming to implement it.

## 2. Gate Position

The predictability system unfolds across four sequential gates:

**Gate A:** `docs/PREDICTABILITY_EVIDENCE_ROUTER_ADAPTER_SPEC.md`  
Defines the Evidence Router → Predictability adapter interface, canon boundaries, freeze line, and authorization limits. Design-only specification.

**Gate B:** `ui/lib/oracle/predictability/evidence-router-adapter-types.ts`  
Type contracts and validation rule constants. Pure types, no logic. Committed, tested (21 tests passing).

**Gate C:** `ui/lib/oracle/predictability/adapter-validation.ts` + tests  
Validation logic implementation. Eight core rules enforced. Pure, immutable, synchronous. Committed (b4cc5ec), tested (31/31 passing), verified (119/119 full suite).

**Gate D:** (This document)  
Future adapter integration design. Specifies conceptual flow from validated packets through Predictability Kernel to forecast output. No code. No wiring. Design-only blueprint for eventual integration.

## 3. Bridge Objective

Gate C validates whether an Evidence Router packet is safe to adapt. Gate D (future) must answer: **How should validated packets become Predictability Kernel inputs without losing provenance, confidence labeling, warnings, canon boundaries, or mathematical critical thinking triggers?**

The bridge must:
- **Preserve provenance** — track evidence sources through adaptation
- **Retain warnings** — propagate validation concerns into forecast explanation
- **Maintain confidence labels** — downgraded evidence stays labeled downgraded
- **Protect boundaries** — blocked evidence never scores, canon limits enforced
- **Trigger critical thinking** — heuristics activate only when appropriate
- **Remain advisory** — forecasts inform, do not command

## 4. Required Future Flow

Conceptual pipeline (design only, no code):

```
Evidence Router output
  ↓
AdapterPromptContextPacket (structured input)
  ↓
Gate C: validateEvidenceItem() → ValidationItemResult
  ↓
Gate C: evaluateAdapterGate() → AdapterValidationResult
  ↓
Gate D: Adapter transformation (future, not implemented)
  ↓
PredictabilityInput (kernel-ready structure)
  ↓
Predictability Kernel orchestration (7 modules)
  ↓
PredictabilityForecast (raw signal + confidence)
  ↓
Mathematical Critical Thinking Protocol (if triggered)
  ↓
ForecastExplanation (advisory, with reasoning)
  ↓
Human review / decision support (no autonomous action)
```

## 5. Integration Preconditions

Gate D implementation, if ever authorized, requires:

1. ✓ Gate A specification accepted
2. ✓ Gate B type contracts committed
3. ✓ Gate C validation committed and all tests passing (119/119)
4. ✓ Gate C handoff documentation committed (3bf6218)
5. Gate D design documented and approved (this document)
6. Validation must run before transformation — no bypass path
7. No blocked evidence enters PredictabilityInput
8. Warnings must be preserved through kernel to forecast
9. Provenance references retained throughout
10. Mathematical Critical Thinking Protocol triggers preserved
11. Forecast remains advisory — no autonomous execution
12. Freeze line enforced: no autonomous action, autonomous forecasting, autonomous outreach, or uncertainty suppression

## 6. Mapping Design

Conceptual structure transformations (future adapter responsibility):

```
AdapterEvidenceItem.id
  → HistoricalEvidenceEvent.sourceId
  
AdapterEvidenceItem.confidence + ValidationItemResult.confidenceMultiplier
  → HistoricalEvidenceEvent.adjustedConfidence
  
AdapterEvidenceItem.sourceTier
  → HistoricalEvidenceEvent.sourceReliability
  
AdapterEvidenceItem.timestamp
  → HistoricalEvidenceEvent.observedAt
  
AdapterPromptContextPacket.task
  → PredictabilityInput.objective
  
AdapterPromptContextPacket.allowedEvidence
  → PredictabilityInput.historicalEvents
  
AdapterPromptContextPacket.blockedEvidence
  → PredictabilityInput.excludedEvidenceIds + blockedReason
  
AdapterValidationResult.warnings
  → PredictabilityInput.validationWarnings + PredictabilityForecast.warnings
  
AdapterValidationResult.downgradedEvidenceIds
  → PredictabilityInput.confidenceAdjustments
  
AdapterPromptContextPacket.canonBoundaries
  → PredictabilityInput.hardConstraints + PredictabilityForecast.assumptionsBoundary
  
AdapterPromptContextPacket.outputContract
  → PredictabilityForecast.explanationConstraints
  
ValidationItemResult.warningsToAdd
  → ProvenanceTrail (warnings preserved in explanation)
```

## 7. Non-Bypass Rules

Gate D adapter must enforce:

- ❌ **No direct Evidence Router → Predictability Kernel path** — all packets must pass Gate C validation
- ❌ **No validation skip** — even if Evidence Router claims pre-validation, adapter must re-validate
- ❌ **No blocked evidence scoring** — blockedEvidence IDs must exclude from kernel input
- ❌ **No downgrade suppression** — downgraded evidence confidence multiplier must apply
- ❌ **No warning loss** — all validation warnings propagate to forecast explanation
- ❌ **No provenance loss** — source references and tiers retained through transformation
- ❌ **No confidence inflation** — downgraded evidence cannot be re-weighted upward
- ❌ **No scaffold claim** — T3_SCAFFOLD evidence cannot claim live prediction without explicit pairing rule
- ❌ **No autonomous forecast claim** — kernel output is advisory only
- ❌ **No autonomous action** — no system can act without human approval
- ❌ **No current.md mutation** — forecast results do not write to fractal memory without explicit authorization
- ❌ **No shell-promoter activation** — memory shell graduation never triggers from forecast
- ❌ **No Mathematical Critical Thinking suppression** — heuristics trigger when criteria met

## 8. Failure Modes

Gate D design must guard against:

1. **Validation Bypass** — adapter accepting packets without re-validating  
   *Prevention:* Gate C validation required; packet acceptance only if allowed/allow_with_warnings  

2. **Provenance Loss** — source tiers and confidence adjustments lost in transformation  
   *Prevention:* Mapping design (Section 6) ensures tier + multiplier → adjustedConfidence  

3. **Confidence Inflation** — downgraded evidence weighted back to original confidence  
   *Prevention:* confidenceMultiplier stored in HistoricalEvidenceEvent; kernel respects  

4. **Scaffold Treated as Live** — T3_SCAFFOLD evidence scored without pairing requirement  
   *Prevention:* sourceTier mapped explicitly; kernel pairing rule enforced  

5. **Untrusted Evidence Over-Weighted** — T5_UNTRUSTED confidence not capped  
   *Prevention:* 0.5× downgrade multiplier applied; confidence capped at effective 0.5  

6. **Warnings Dropped** — validation warnings not propagated to forecast explanation  
   *Prevention:* warnings array mapped to explanation provenanceTrail  

7. **Forecast Stated as Certainty** — kernel signal presented as fact, not advisory  
   *Prevention:* ForecastExplanation.disclaimers and outputContract enforced  

8. **Autonomous Action Enabled** — forecast signal triggers action without human gate  
   *Prevention:* Freeze line enforced; no autonomous action path exists  

9. **Current.md Mutation** — forecast written to fractal memory without approval  
   *Prevention:* No write path from adapter → current.md; explicit authorization required  

10. **Shell-Promoter Activation** — forecast triggers memory shell graduation  
    *Prevention:* shell-promoter remains KEEP_DEFERRED; no input from forecasting system  

## 9. Future Test Requirements

When/if Gate D implementation is authorized, it must pass:

1. **Validation Pre-Requisite** — `testValidationMustRunBeforeTransformation`  
   Packet must pass Gate C before adapter transformation; rejected packets raise error

2. **Blocked Evidence Exclusion** — `testBlockedEvidenceExcludedFromKernelInput`  
   blockedEvidence IDs must not appear in PredictabilityInput.historicalEvents

3. **Blocked IDs Preserved** — `testBlockedEvidenceIdPreservedInExplanation`  
   Forecast explanation must reference which evidence was excluded and why

4. **Warnings Preserved** — `testValidationWarningsPreservedInForecast`  
   All AdapterWarning entries must appear in ForecastExplanation

5. **Provenance Preserved** — `testProvenanceTrailPreservedThroughKernel`  
   Source tiers, confidence adjustments, timestamps traceable end-to-end

6. **Canon Boundaries Preserved** — `testCanonBoundariesEnforcedInForecast`  
   canonBoundaries constraints must appear in forecast assumptions/disclaimers

7. **Output Contract Preserved** — `testOutputContractConstraintsEnforced`  
   forecast explanation must respect outputContract restrictions (e.g., forbidAutonomousAction)

8. **Downgrade Applied** — `testScaffoldUntrustedUnverifiedDowngraded`  
   T3/T5/deferred evidence confidence multiplier applied; effective confidence reduced

9. **No Direct Kernel Call** — `testNoDirect KernelAccessWithoutAdapterMediation`  
   Predictability Kernel imported/called only through adapter mediation; no bypass path

10. **Evidence Router Not Live** — `testNoLiveEvidenceRouterImport`  
    Evidence Router imported as type reference only; no live runtime dependency on Evidence Router

11. **No Side Effects** — `testNoUIAPIDBFilesystemCurrentmdShellpromoterSideEffects`  
    Adapter produces PredictabilityInput/ForecastExplanation only; no writes to UI, API, DB, filesystem, current.md, or shell-promoter activation

12. **Forecast Advisory** — `testForecastRemainsAdvisory`  
    ForecastExplanation must include disclaimer that forecast is advisory; no autonomous execution

13. **Mathematical Critical Thinking Preserved** — `testMathematicalCriticalThinkingTriggersPreserved`  
    shouldTriggerMathematicalCriticalThinking() heuristic still triggers; MCT protocol signals preserved

## 10. Future Implementation Shape

Conceptual function signatures for eventual Gate D adapter (design only, no code):

```typescript
// Main adapter orchestrator
function validateThenAdaptPacket(
  packet: AdapterPromptContextPacket,
  options?: AdapterIntegrationOptions
): AdapterIntegrationResult
// Input: unprocessed Evidence Router packet
// Output: either validated PredictabilityInput or error with reason
// Responsibility: run Gate C validation, then transform if valid

// Packet → Kernel input transformation
function adapterPacketToPredictabilityInput(
  packet: AdapterPromptContextPacket,
  validation: AdapterValidationResult
): PredictabilityInput
// Input: packet + validation result
// Output: kernel-ready input with provenance, warnings, confidence adjustments
// Responsibility: map evidence, preserve metadata, apply downgrades

// Kernel output → Forecast explanation transformation
function predictabilityForecastToAdapterExplanation(
  forecast: PredictabilityForecast,
  input: PredictabilityInput,
  validation: AdapterValidationResult,
  packet: AdapterPromptContextPacket
): AdapterForecastExplanation
// Input: raw kernel output + original packet + validation context
// Output: advisory forecast with provenance trail, warnings, boundaries, disclaimers
// Responsibility: explain reasoning, surface uncertainty, enforce freeze line

// Integration result envelope
interface AdapterIntegrationResult {
  allowed: boolean
  validation: AdapterValidationResult
  input?: PredictabilityInput
  forecast?: PredictabilityForecast
  explanation?: AdapterForecastExplanation
  error?: string
}
```

All three functions must be:
- Pure (no I/O, no state mutation)
- Testable with fixtures (no Evidence Router live dependency)
- Immutable (inputs never modified)
- Synchronous (no async)
- Documented with inline provenance mapping

## 11. Gate D Acceptance Criteria

If Gate D implementation is ever authorized:

**Before any code:**
1. Gate D design documented and approved (this document)
2. Integration test plan written (fixtures only, no live Evidence Router)

**During implementation:**
1. Pure adapter functions first (validate → transform → explain, no orchestration)
2. Tests written before code (TDD)
3. No live Evidence Router imports initially (fixtures only)
4. No Predictability Kernel behavior modification
5. No UI/API/DB/auth wiring
6. No current.md write path
7. No shell-promoter activation
8. All predictability tests remain passing (119/119 + new adapter tests)

**Before wiring to Evidence Router:**
1. 100% test passing (adapter + predictability + integration)
2. Code review passing (five-axis: correctness, readability, architecture, security, performance)
3. Explicit user authorization for Evidence Router wiring
4. Explicit user authorization for Predictability Kernel integration
5. Explicit user authorization for any UI/API/DB/auth wiring

**Live operation (if authorized):**
1. Freeze line enforced: no autonomous action, autonomous forecasting, autonomous outreach
2. Forecast remains advisory in all user-facing output
3. Warning preservation verified in sample forecasts
4. Provenance tracing verified end-to-end
5. Monitoring/logging in place for validation failures

## 12. Recommendation

**Do not implement Gate D yet.**

1. Commit this design document first.
2. Optionally authorize pure fixture-based adapter functions only (no Evidence Router wiring).
3. Defer Predictability Kernel integration until explicit authorization.
4. Allow time for review and feedback on integration approach.

Gate C is stable, committed, and verified. Gate D design shapes the path forward without forcing immediate implementation. This gives clarity while preserving the ability to refine the approach.

The system is safer when each gate is committed, reviewed, and understood before the next gate opens.

## 13. Freeze Line

This design document does **not** authorize:

- ❌ Gate D implementation
- ❌ Adapter integration code
- ❌ Evidence Router wiring or import
- ❌ Predictability Kernel integration
- ❌ UI/API/DB/auth wiring
- ❌ current.md edits
- ❌ protected source mutation
- ❌ shell-promoter activation
- ❌ live prediction claims
- ❌ autonomous forecasting
- ❌ autonomous action
- ❌ uncertainty suppression

This document is a blueprint. Implementation is not authorized by its publication.

---

**Design Date:** 2026-04-29  
**Gate D Status:** DESIGN ONLY — NO IMPLEMENTATION AUTHORIZED  
**Authorization Scope:** Design/specification documentation only  
**Next Step:** Awaits explicit authorization for implementation or alternative path
