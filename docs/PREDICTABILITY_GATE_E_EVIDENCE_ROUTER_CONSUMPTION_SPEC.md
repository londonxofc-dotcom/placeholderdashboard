# Predictability Gate E — Evidence Router Consumption Specification

## 1. Canon Boundary

**This document is design and specification only.**

The following are NOT authorized by this document:
- Gate E implementation (code)
- Live Evidence Router import
- Runtime wiring to Predictability Kernel
- Calls to Predictability Kernel runtime
- Modifications to `predictability-kernel.ts`
- Modifications to `adapter-integration.ts`
- Modifications to `adapter-validation.ts`
- Modifications to `evidence-router-adapter-types.ts`
- UI/API/DB/auth infrastructure
- Edits to `current.md`
- Mutations of protected sources
- Activation of shell-promoter
- Live prediction claims
- Autonomous forecasting/action
- Commit of logs or Phase 3 implementation plan

This document defines the design space. Implementation requires explicit separate authorization.

---

## 2. Gate Position

The Predictability pipeline has five gates:

| Gate | Purpose | Status |
|------|---------|--------|
| **A** | Adapter specification | ✅ Complete (cb60775) |
| **B** | Type contracts for Evidence Router → Adapter mapping | ✅ Complete (52a497d) |
| **C** | Validation logic (input sanitization, provenance preservation, confidence labeling) | ✅ Complete (b4cc5ec) |
| **D** | Fixture-based adapter integration (no live wiring) | ✅ Complete (5263849, tagged oracle-predictability-gate-d-implementation-locked) |
| **E** | Live Evidence Router consumption design | 🔴 Design/spec phase (this document) |

Gate E is the **conceptual bridge** between live Evidence Router output and the Gate D adapter. It does not implement that bridge—it designs how it *could* work safely if authorization is later granted.

---

## 3. Bridge Question

**How can live Evidence Router output be consumed by the adapter without creating a direct unsafe path into PredictabilityInput or forecast output?**

The problem: Evidence Router produces evidence items. Gate D accepts only fixtures. We need a design for how real router output could eventually flow through the same validation and integration pipeline without:
- Bypassing Gate C validation
- Losing provenance
- Inflating low-confidence evidence
- Silencing blocked/quarantined evidence
- Creating direct unsafe paths

This spec answers that question at the design level only.

---

## 4. Required Future Flow

If Gate E implementation is ever authorized, evidence must flow through this path:

```
Evidence Router live output
   ↓
Evidence Router export boundary
(output contract: EvidenceRouterOutputContract)
   ↓
AdapterPromptContextPacket construction
(maps router output to Gate B types)
   ↓
Gate C validation
(runs all Gate C validators on the packet)
   ↓
Gate D adapter integration
(uses existing fixture-based adapter logic)
   ↓
PredictabilityInput-compatible object
(ready for optional future kernel call, only after separate authorization)
   ↓
advisory ForecastExplanation
(marked as advisory, not fact)
   ↓
explicit human review
(before any decision/action)
```

No shortcuts. Every step.

---

## 5. Non-Bypass Rule

**There must never be a direct path:**

```
Evidence Router → Predictability Kernel
```

**The only allowed future path:**

```
Evidence Router 
  → AdapterPromptContextPacket construction
  → Gate C validation
  → Gate D adapter integration  
  → Predictability-compatible input
  → (optional future kernel call, only after explicit authorization)
```

This rule is non-negotiable. It prevents Evidence Router from bypassing validation.

---

## 6. Evidence Router Output Requirements

For Gate E to work, live Evidence Router output must provide these fields:

```typescript
// Conceptual only—not a live contract yet
interface EvidenceRouterOutputContract {
  // Identification
  evidenceId: string
  
  // Content
  claim: string
  domain: string  // e.g., "music", "label", "event", "artist", "trend"
  
  // Source Trust
  sourceTier: 'canonical' | 'verified' | 'scaffold' | 'unverified' | 'untrusted'
  
  // Confidence
  confidenceLabel: 'high' | 'medium' | 'low' | 'uncertain'
  
  // Status (may be blocked/quarantined, must be visible)
  status: 'active' | 'blocked' | 'quarantined' | 'warning'
  
  // Provenance (must not be lost)
  provenanceRefs: Array<{
    source: string
    url?: string
    timestamp?: string
    verificationMethod?: string
  }>
  
  // Safety Warnings
  warnings?: string[]
  
  // Canon Boundaries (what this evidence can/cannot change)
  canCanonChanges?: string[]  // e.g., ["north-star", "brand-identity"]
  canonBoundaries?: string[]  // e.g., ["current.md", "CLAUDE.md", "shell-promoter"]
  
  // Metadata
  observedTimestamp: string
  tags?: string[]
  riskFlags?: string[]
}
```

This is a design-time sketch. Actual Evidence Router output may differ. Gate E will define the real contract.

---

## 7. Mapping Requirements

Gate B type contracts must cover the mapping from router output → adapter types:

| Evidence Router Field | Gate B Adapter Type | Mapping Notes |
|---|---|---|
| `claim` | `AdapterEvidenceItem.claim` | Direct text pass-through |
| `sourceTier` | `AdapterEvidenceSourceTier` | 'canonical' → 'canonical', 'unverified' → 'scaffold', etc. |
| `confidenceLabel` | `AdapterConfidenceLabel` | 'high' → 'high', 'low' → 'low', etc. |
| `status` | `AdapterEvidenceStatus` | 'blocked' → 'blocked', 'active' → 'active', etc. |
| `provenanceRefs` | `AdapterProvenanceRef[]` | Each ref becomes a provenance entry |
| `warnings` | `AdapterWarning[]` | Each warning becomes a warning object |
| `canonBoundaries` | (validation input) | Used by Gate C to check safe zones |
| `evidenceId` | `AdapterEvidenceItem.id` | Preserved for audit trail |

This mapping must be **explicit** and **testable**. No implicit conversions.

---

## 8. Safety Preconditions

Before Gate E implementation can ever be authorized, these preconditions must hold:

- ✅ Gate C validation must pass all 31 tests
- ✅ Gate D adapter integration must pass all 22 tests  
- ☐ Live router output must match the agreed-upon Gate B contract
- ☐ Blocked evidence must remain visible (status='blocked' preserved)
- ☐ Blocked evidence must not score (adapter ignores score)
- ☐ Warnings must not be dropped (all warnings preserved)
- ☐ Provenance must not be lost (all refs preserved)
- ☐ Scaffold/unverified/untrusted evidence must be downgraded (not inflated)
- ☐ Forecasts must remain advisory (not treated as fact)
- ☐ Human review must remain explicit (not hidden in UI)

The first two are already met. The rest are future requirements.

---

## 9. Failure Modes

These are the risks that Gate E design must prevent:

**Direct wiring failures:**
1. Live router output bypasses `AdapterPromptContextPacket` construction
2. Evidence Router imports Predictability Kernel directly
3. Predictability Kernel imports Evidence Router directly

**Validation bypass:**
4. Blocked evidence silently disappears instead of being marked blocked
5. Low-trust evidence gets inflated/scored as high-confidence
6. Provenance refs are lost or truncated
7. Warnings are dropped or hidden

**Output misuse:**
8. Forecast explanation states certainty instead of advisory confidence
9. UI displays forecast as live fact instead of provisional insight
10. Forecast result leaks into `current.md` without explicit authorization

**Autonomy leak:**
11. shell-promoter gets activated through forecast result (circumventing explicit authorization gates)
12. Auth/API/DB/auth wiring sneaks in as "supporting infrastructure" without explicit authorization
13. Autonomous decision-making activates without human review

Each failure mode must be prevented by design, not by hope.

---

## 10. Future Test Requirements

If Gate E implementation is ever authorized, it must include these tests:

1. **Router output fixture → AdapterPromptContextPacket mapping** — router-like fixture with all required fields maps cleanly to packet
2. **Missing provenance handling** — router output without provenance refs fails or is quarantined with warning
3. **Blocked status preservation** — blocked evidence remains status='blocked' after packet construction
4. **Warning metadata** — all warnings from router output are preserved in packet
5. **Canon boundary preservation** — canonBoundaries and canCanonChanges fields preserved through packet
6. **Output contract preservation** — packet output contract matches what Gate D expects
7. **No direct Evidence Router → Kernel import** — no `import` statement from evidence-router to predictability-kernel
8. **No direct Kernel → Evidence Router import** — no reverse import
9. **No UI/API/DB/auth behavior** — packet construction is pure, no side effects
10. **Gate C validation runs** — packet passes through full Gate C validation before Gate D
11. **Low-trust evidence downgrade** — sourceTier='untrusted' results in low score/warning, not high confidence
12. **Forecast remains advisory** — ForecastExplanation.confidence is marked 'advisory', explanation states "not fact"
13. **Human review requirement** — forecast output includes "requires manual verification before use" or equivalent

All 13 must pass before Gate E implementation can be considered complete.

---

## 11. Future Implementation Shape

If Gate E is ever implemented, these functions would exist. **Do not implement now.**

```typescript
// Conceptual function signatures only—design shape, not code

/**
 * Convert Evidence Router live output to Gate B adapter packet.
 * Runs all field mappings, validates types, preserves provenance.
 * Does NOT call validation—that happens in the next step.
 */
function evidenceRouterOutputToAdapterPacket(
  routerOutput: EvidenceRouterOutputContract
): AdapterPromptContextPacket

/**
 * Validate router packet before adaptation.
 * Runs all Gate C validators.
 * Returns validation result (pass/warnings/fail).
 */
function validateRouterPacketBeforeAdaptation(
  packet: AdapterPromptContextPacket
): AdapterValidationResult

/**
 * Consume validated packet for predictability.
 * Uses existing Gate D adapter logic.
 * Returns integration result (ready or not-ready for kernel input).
 */
function consumeRouterPacketForPredictability(
  packet: AdapterPromptContextPacket,
  validationResult: AdapterValidationResult
): AdapterIntegrationResult
```

These are design shapes only. **Do not implement.**

---

## 12. Gate E Acceptance Criteria

If Gate E implementation is ever authorized by explicit user instruction, it must meet these criteria:

- Fixture-first: router-output tests written before any real router import
- No live Evidence Router import in first implementation
- No Predictability Kernel runtime call
- No UI/API/DB/auth infrastructure
- All predictability tests still passing (141/141)
- Build passing with no errors or warnings
- **Explicit user authorization** before any real Evidence Router wiring
- No modifications to current.md
- No activation of shell-promoter
- No live prediction claims
- No autonomous action

Gate E implementation is a multi-step process. This document is step zero (design).

---

## 13. Recommendation

**Do not implement Gate E yet.**

Recommended next steps:

1. **Commit this design spec** (this document)
2. **Review the design** — does it cover the bridge question adequately?
3. **Decide next phase:**
   - **Option A:** Stop here. Gate E remains spec-only.
   - **Option B:** Commit Gate E design, then move to a different system component (e.g., Agent Bridge, NeuroNico, Jarvis).
   - **Option C:** Authorize Gate E implementation as a separate, explicit decision with clear acceptance criteria.

No implementation should proceed without explicit authorization.

---

## 14. Freeze Line

**This document does NOT authorize:**
- Gate E implementation (code)
- Live Evidence Router wiring
- Predictability Kernel runtime calls
- UI/API/DB/auth wiring
- Edits to `current.md`
- Mutations of protected sources
- Activation of shell-promoter
- Live prediction claims
- Autonomous forecasting/action
- Autonomous decision-making

**This document provides:**
- Design of the bridge question
- Specification of how live router output could safely flow through validation
- Requirements for future implementation
- Test requirements for future implementation
- Failure modes to prevent
- Preconditions for authorization

All of these are design-time artifacts. Implementation is a separate authorization.

---

## Document History

- **Created:** 2026-04-30
- **Purpose:** Design-time specification for Gate E, following completion of Gate D
- **Status:** Spec complete, implementation not authorized
- **Next:** User decision on whether to authorize Gate E implementation
