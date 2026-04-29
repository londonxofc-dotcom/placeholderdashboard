# Predictability Evidence Router Adapter Specification

**Date:** 2026-04-29

**Status:** DESIGN ONLY — Specification document. No implementation authorized. No code changes to Predictability Kernel, Evidence Router, or integration layer until this specification is reviewed and approved.

---

## 1. Canon Boundary

This document specifies the **interface contract** between the Evidence Router (Phase 3) and the Predictability Kernel (Stage P). It defines:

- What data flows from Evidence Router to Predictability
- How provenance, confidence, and status labels must be preserved
- What safety gates must hold before predictions can be used
- What does **not** happen until explicit authorization is given

**What this spec does NOT authorize:**
- Code implementation of the adapter
- Modifications to Predictability modules
- Evidence Router wiring
- Database schema changes
- API endpoint creation
- UI component integration
- Live prediction claims
- Autonomous forecasting
- Shell-promoter activation

---

## 2. The Bridge Question

> **How can the Predictability Kernel consume Evidence Router outputs while preserving provenance (T0–T5 source tiers), confidence labels (VERIFIED/LIKELY/INFERRED/STALE/CONFLICTED/UNVERIFIED/BLOCKED), scaffold downgrades, and drift boundaries?**

**Answer framework:**

The kernel receives a curated evidence package from the Evidence Router. This package includes:
- Source evidence items with their original metadata (tier, confidence, status, provenance chain)
- A mapping layer that converts Evidence Router field structure to Predictability input structure
- Safety gates that prevent BLOCKED evidence from contributing, that downgrade SCAFFOLD-only forecasts, and that flag CONFLICTED evidence for escalation
- A confidence calibration rule that respects source tier authority and evidence agreement
- A drift detection layer that monitors when lens conclusions diverge sharply, triggering Phase 3 review

The kernel processes this evidence through its 7 deterministic lenses, outputs a forecast with confidence and supporting metadata, and returns the result with full lineage — showing which evidence items contributed, which were rejected, and why.

---

## 3. Current Layers

### Evidence Router (Phase 3 — exists)
- **Input:** Raw observations, user context, external data sources
- **Output:** `PromptContextPacket` — an array of `EvidenceItem` objects with metadata
- **Metadata per item:** `sourceTier` (T0–T5), `confidence` (0.0–1.0), `status` (enum), `provenance` (chain of origin), `weight` (router-assigned importance)
- **Status enum values:** VERIFIED, LIKELY, INFERRED, STALE, CONFLICTED, UNVERIFIED, BLOCKED

### Predictability Kernel (Stage P — complete, currently isolated)
- **Input:** `HistoricalEvidenceEvent[]` — array of past events with trend, magnitude, regime markers, behavioral patterns
- **Processing:** 7 pure deterministic lenses (trend-delta, regime-shift, behavioral-repetition, cycle-analysis, trend-velocity, landmark-response, predictability-kernel)
- **Output:** `PredictabilityForecast` — probability band, supporting signals, opposing evidence, confidence score, failure modes

### Proposed Adapter Layer (specification phase)
- **Purpose:** Bridge Evidence Router outputs to Predictability inputs
- **Scope:** Field mapping, confidence translation, safety gate enforcement
- **Status:** Specification only, no implementation until approved

### Oracle Reasoning Protocol (Canon standard)
- **Active reference:** `docs/ORACLE_REASONING_PROTOCOL.md`
- **Requirement:** All forecasts must pass Ten Reasoning Lenses before confidence declaration
- **Constraints:** Forbidden claims (certainty language, diagnosis language, protected trait inference, pattern-as-destiny claims, scaffold-only strong forecasts)
- **Provenance rule:** STRONG forecasts (>80% confidence) cannot rest solely on T3–T5 sources — must include T0–T2 evidence

---

## 4. Proposed Future Data Flow

```
[Evidence Router]
       ↓
[PromptContextPacket with EvidenceItem[]]
       ↓
[Adapter: Validation + Mapping]
       ├─ Filter BLOCKED items → exclude from forecast
       ├─ Check source tier distribution
       ├─ Map EvidenceItem → HistoricalEvidenceEvent
       ├─ Attach provenance chain
       └─ Flag scaffold-only inputs
       ↓
[Predictability Kernel]
       ├─ trend-delta lens
       ├─ regime-shift lens
       ├─ behavioral-repetition lens
       ├─ cycle-analysis lens
       ├─ trend-velocity lens
       ├─ landmark-response lens
       └─ predictability-kernel (composite)
       ↓
[Forecast Output with Lineage]
       ├─ probability band
       ├─ confidence (computed)
       ├─ supporting signals (with source tier + status)
       ├─ opposing evidence (with source tier + status)
       ├─ evidence contributed (EvidenceItem IDs)
       ├─ evidence rejected (IDs + reason: BLOCKED | tier too low | status flag)
       └─ failure modes
       ↓
[Safety Gate Check]
       ├─ Is confidence > 0.65?
       ├─ Is there T0–T2 evidence for STRONG forecasts?
       ├─ Are there CONFLICTED items flagged for escalation?
       ├─ Do lenses agree or diverge sharply?
       └─ If gates pass → forecast usable; if fail → escalate to Phase 3
       ↓
[Forecast Consumer]
```

---

## 5. Mapping Table: EvidenceItem → HistoricalEvidenceEvent

| EvidenceItem (Evidence Router) | HistoricalEvidenceEvent (Predictability) | Mapping Rule |
|---|---|---|
| `id` | `event_id` | Direct pass-through |
| `content` | `description` | Evidence summary text |
| `sourceTier` (T0–T5) | `source_tier` | Direct pass-through, controls authority weight |
| `confidence` | `confidence_level` | Direct pass-through (0.0–1.0) |
| `status` (VERIFIED\|LIKELY\|...) | `status_label` | Direct pass-through, used in safety gates |
| `provenance` (chain) | `provenance_chain` | Full chain preserved — shows origin and verification path |
| `weight` (router-assigned) | `router_weight` | Used to calibrate lens contribution percentages |
| `timestamp` | `timestamp` | Direct pass-through, used for trend-delta time windows |
| `domain` | `domain` | Direct pass-through, used for regime-shift domain checks |
| `magnitude` (if present) | `magnitude` | Optional, used for landmark-response lens if provided |
| `pattern_type` (if behavioral) | `pattern_label` | Optional, used for behavioral-repetition lens if provided |

---

## 6. Confidence Mapping Rules

### Per-Status Rules

| Status | Kernel Handling | Confidence Impact | Contribution Rule |
|---|---|---|---|
| VERIFIED | Use directly | Full weight (1.0×) | Contributes to all lenses at full strength |
| LIKELY | Use, mark as inferred | 0.85× weight | Contributes but marked as supportive (not primary) |
| INFERRED | Use, mark as scaffold | 0.7× weight | Can support but cannot alone produce STRONG (>80%) forecast |
| STALE | Use with recency penalty | 0.5× weight | Marks trend-delta lens to check for regime shift since timestamp |
| CONFLICTED | Flag for escalation | 0.3× weight | Included in output with conflict warning; triggers Phase 3 review gate |
| UNVERIFIED | Use, mark provisional | 0.4× weight | Cannot contribute to T0–T2 requirement for STRONG forecasts |
| BLOCKED | **Exclude entirely** | 0.0× weight | Does not appear in computation; listed in rejected_evidence array with reason "BLOCKED" |

### Composite Confidence Calculation

```
Base Confidence = (
  trend_delta_weight × trend_strength
  + regime_shift_weight × landmark_influence
  + behavioral_repetition_weight × pattern_score
  + cycle_analysis_weight × cycle_strength
  + trend_velocity_weight × velocity_score
  + landmark_response_weight × response_score
) × source_tier_authority_multiplier × evidence_agreement_boost

source_tier_authority_multiplier = {
  T0: 1.0,
  T1: 0.95,
  T2: 0.90,
  T3: 0.70,
  T4: 0.50,
  T5: 0.30
}

evidence_agreement_boost = {
  all 7 lenses agree: +0.15 (capped at 1.0)
  6 of 7 agree: +0.10
  5 of 7 agree: +0.05
  otherwise: 0.0
}
```

---

## 7. Source Tier Rules

### Authority Hierarchy (T0 → T5)

| Tier | Definition | Example | Kernel Rule |
|---|---|---|---|
| T0 | User direct input, verified by user | "I saw X happen" | Full authority (1.0×); required for STRONG forecasts |
| T1 | Canon locked source (approved protocol, immutable record) | Previous Oracle decision, locked fact | High authority (0.95×); counts toward T0–T2 requirement |
| T2 | Verified module output (e.g., Evidence Router's own VERIFIED items) | Cross-validated evidence, multiple sources agree | High authority (0.90×); counts toward T0–T2 requirement |
| T3 | Scaffold (rules-of-thumb, heuristics, template-based inference) | Playbook-derived assumption | Medium authority (0.70×); cannot alone produce STRONG forecast |
| T4 | Inference layer (model-generated hypothesis, reasoned guess) | AI-generated prediction, induction from pattern | Low authority (0.50×); informational only for STRONG forecasts |
| T5 | Untrusted external source (third-party claim, uncross-checked) | Rumor, single-source report, external API without verification | Very low authority (0.30×); used for robustness testing only |

### STRONG Forecast T0–T2 Requirement

**Rule:** A forecast with confidence >80% (labeled STRONG) cannot rest solely on T3–T5 sources.

**Enforcement:** Adapter checks source tier distribution before kernel output. If forecast would be labeled STRONG and contributing evidence is entirely T3–T5:
1. Downgrade confidence to ≤0.80
2. Add reason code: `"strong_forecast_requires_t0_t2_evidence"`
3. Include escalation note in output: "This forecast is supported by heuristic and inferred evidence only. Upgrade to STRONG confidence requires T0–T2 verification."

---

## 8. Hard Adapter Rules

### Rule 1: BLOCKED Evidence Excluded Entirely
Evidence with `status === BLOCKED` does not enter any computation. It appears only in the `rejected_evidence` array with reason `"BLOCKED"`.

### Rule 2: Scaffold Cannot Produce STRONG Alone
If all contributing evidence has `status === INFERRED` (scaffold) and no VERIFIED or LIKELY items present, the forecast confidence must be capped at ≤0.80, even if individual lenses score high.

### Rule 3: CONFLICTED Items Trigger Escalation
If any EvidenceItem has `status === CONFLICTED`:
1. Compute the forecast normally
2. Add `conflicted_evidence_detected: true` to output
3. List conflicting items with their contradiction detail
4. Flag for Phase 3 human review before the forecast is used for decisions
5. Prevent autonomous use of the forecast (requires user acknowledgment)

### Rule 4: Provenance Chain Preserved in Lineage
The output includes a `lineage` object showing:
- `evidence_used: [{ id, source_tier, status, provenance_chain }]`
- `evidence_rejected: [{ id, reason }]`
- `lens_contributions: { trend_delta: 0.35, ... }`
- This lineage allows tracing any forecast back to its source evidence

### Rule 5: STALE Evidence Triggers Recency Check
If any EvidenceItem has `status === STALE`, the trend-delta lens adds a recency penalty and checks whether a regime shift has occurred since the stale timestamp. Output includes `stale_evidence_recency_warning: "check for regime shifts since [timestamp]"`.

### Rule 6: UNVERIFIED Cannot Contribute to T0–T2 Requirement
Evidence with `status === UNVERIFIED` is included in the forecast but does not count toward the T0–T2 evidence requirement for STRONG confidence. It appears in output as `supporting_evidence_unverified`.

### Rule 7: Cross-Domain Evidence Requires Explicit Reason
If Evidence Router marks an EvidenceItem with `target_domain` different from `domain`, the item requires an explicit `cross_domain_reason` field. If missing, the adapter flags it as `cross_domain_evidence_without_justification` and limits its contribution weight to 0.5×.

---

## 9. Future Adapter Shape (Interface Contracts Only)

These are TypeScript-like interface definitions. **No implementation code is authorized.**

```typescript
// Input from Evidence Router
interface EvidenceItem {
  id: string
  content: string
  sourceTier: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
  confidence: number // 0.0–1.0
  status: 'VERIFIED' | 'LIKELY' | 'INFERRED' | 'STALE' | 'CONFLICTED' | 'UNVERIFIED' | 'BLOCKED'
  provenance: ProvenanceChain
  weight: number // 0.0–1.0, router-assigned
  timestamp: string // ISO 8601
  domain: string
  targetDomain?: string
  crossDomainReason?: string
  magnitude?: number
  patternType?: string
}

interface ProvenanceChain {
  origin: string // "user" | "module" | "external"
  path: string[] // chain of verification steps
  verifiedAt: string // ISO 8601
}

// Intermediate representation after mapping
interface HistoricalEvidenceEvent {
  eventId: string
  description: string
  sourceTier: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
  confidenceLevel: number
  statusLabel: 'VERIFIED' | 'LIKELY' | 'INFERRED' | 'STALE' | 'CONFLICTED' | 'UNVERIFIED' | 'BLOCKED'
  provenanceChain: ProvenanceChain
  routerWeight: number
  timestamp: string
  domain: string
  magnitude?: number
  patternLabel?: string
}

// Adapter validation result
interface AdapterValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  evidenceToUse: HistoricalEvidenceEvent[]
  evidenceToReject: { eventId: string; reason: string }[]
  sourceDistribution: {
    t0: number
    t1: number
    t2: number
    t3: number
    t4: number
    t5: number
  }
  hasConflictedEvidence: boolean
  hasStaleEvidence: boolean
  hasBlockedEvidence: boolean
  scaffoldOnly: boolean
}

// Output from Predictability Kernel with adapter lineage
interface PredictabilityForecast {
  probabilityBand: 'unlikely' | 'possible' | 'likely' | 'strong'
  confidence: number // 0.0–1.0
  summary: string
  supportingSignals: SignalWithLineage[]
  opposingEvidence: SignalWithLineage[]
  keyAssumptions: Assumption[]
  failureModes: FailureMode[]
  lineage: ForecastLineage
  conflictedEvidenceDetected: boolean
  escalationRequired: boolean
  nextTest: string
}

interface SignalWithLineage {
  text: string
  sourceIds: string[] // EvidenceItem IDs that contributed
  sourceTiers: string[]
  statuses: string[]
}

interface Assumption {
  text: string
  sensitivity: 'low' | 'medium' | 'high' // does forecast flip if assumption is wrong by ±10–20%?
}

interface FailureMode {
  scenario: string
  likelihood: 'low' | 'medium' | 'high'
  cascades: string[]
}

interface ForecastLineage {
  evidenceUsed: {
    id: string
    sourceTier: string
    status: string
    provenanceChain: ProvenanceChain
  }[]
  evidenceRejected: { id: string; reason: string }[]
  lensContributions: {
    trendDelta: number
    regimeShift: number
    behavioralRepetition: number
    cycleAnalysis: number
    trendVelocity: number
    landmarkResponse: number
  }
  sourceAuthorityMultiplier: number
  evidenceAgreementBoost: number
}
```

---

## 10. Drift and Safety Tests Required Later

**These tests are NOT implemented yet. They define what must be verified before integration is approved.**

### Test 1: Lens Divergence Detection
**Purpose:** When lenses disagree sharply, escalate rather than averaging.

**Implementation trigger:** If 3+ lenses produce opposite conclusions (e.g., trend-delta says "rising" but regime-shift says "regime broken"), set `escalationRequired = true` and flag for Phase 3 review.

### Test 2: BLOCKED Evidence Isolation
**Purpose:** Verify that BLOCKED evidence contributes zero to any metric.

**Implementation trigger:** Run forecast with same evidence package, once with 1 item marked BLOCKED, once without. Verify output differs only in the `evidenceRejected` array and lineage, not in confidence or supporting_signals.

### Test 3: Scaffold-Only Downgrade
**Purpose:** Verify STRONG forecasts cannot rest on scaffold alone.

**Implementation trigger:** Feed all-INFERRED evidence to adapter. Verify output confidence ≤0.80 and reason_codes includes `"strong_forecast_requires_t0_t2_evidence"`.

### Test 4: Provenance Chain Preservation
**Purpose:** Verify lineage traces back to origin.

**Implementation trigger:** Compute forecast with evidence chain. Verify each supporting_signal item can be traced through lineage back to original EvidenceItem.id and provenanceChain.

### Test 5: Confidence Calibration
**Purpose:** Verify confidence matches uncertainty in inputs.

**Implementation trigger:** If evidence agreement is low (2 lenses agree, 5 diverge), verify confidence ≤0.65. If agreement is high (6+ agree), verify confidence ≥0.65 (assuming other gates pass).

### Test 6: T0–T2 Authority Enforcement
**Purpose:** Verify STRONG forecasts include T0–T2 evidence.

**Implementation trigger:** Produce forecast with 80%+ confidence from all-T3/T4/T5 sources. Verify confidence is downgraded to ≤0.80 and escalation reason is included.

### Test 7: CONFLICTED Escalation
**Purpose:** Verify conflicted evidence prevents autonomous use.

**Implementation trigger:** Include one EvidenceItem with `status === CONFLICTED`. Verify output includes `conflicted_evidence_detected: true` and `escalationRequired: true`, and forecast is not usable without Phase 3 acknowledgment.

---

## 11. Integration Gate Sequence

Before any of the following gates, explicit authorization is required.

### Gate A: Adapter Specification Approval (CURRENT)
**Status:** Pending

**What it unlocks:** Adapter interface design only (no code).

**Required action:** User approves this specification document or requests changes.

---

### Gate B: Adapter Type Contracts (Conditional)
**Status:** Not yet authorized

**Prerequisite:** Gate A approved

**What it is:** Pure TypeScript interfaces only (no implementation logic), matching the contracts in Section 9.

**What it unlocks:** Code review of interface shape, no runtime behavior.

**Scope:** Create `ui/lib/oracle/adapter/types.ts` with interface contracts only. No mapping functions, no validation logic, no Evidence Router imports.

---

### Gate C: Adapter Validation Logic (Conditional)
**Status:** Not yet authorized

**Prerequisite:** Gate B approved + code review clean

**What it is:** Mapping and validation functions that implement the rules from Section 8 (BLOCKED evidence filtering, SCAFFOLD downgrade, CONFLICTED flagging, etc.).

**What it unlocks:** Pre-kernel safety gate enforcement.

**Scope:** Create `ui/lib/oracle/adapter/validate.ts` with pure functions only. No database writes, no Evidence Router calls, no kernel invocation.

---

### Gate D: Kernel-Adapter Integration (Conditional)
**Status:** Not yet authorized

**Prerequisite:** Gate C approved + validation tests pass (80%+ coverage)

**What it is:** Wiring the adapter output into the kernel's input, preserving lineage through the forecast.

**What it unlocks:** End-to-end forecast computation with provenance.

**Scope:** Create `ui/lib/oracle/adapter/integrate.ts` — pure functions only. No Evidence Router wiring yet.

---

### Gate E: Evidence Router Consumption (Conditional)
**Status:** Not yet authorized

**Prerequisite:** Gate D approved + integration tests pass + Math Critical Thinking Protocol review

**What it is:** Adapter accepts actual Evidence Router `PromptContextPacket` output instead of fixture data.

**What it unlocks:** Live evidence flowing through the kernel.

**Scope:** Create `ui/lib/oracle/adapter/evidence-router-bridge.ts`. Import Evidence Router types. No autonomous forecast use yet.

---

### Gate F: Forecast Authorization and Audit (Conditional)
**Status:** Not yet authorized

**Prerequisite:** Gate E approved + Phase 3 safety review + audit trail established

**What it is:** Forecasts are logged with full lineage. User must acknowledge before results are used for decisions.

**What it unlocks:** Forecasts are visible to users but require explicit acceptance.

**Scope:** Create `ui/lib/oracle/adapter/audit.ts` — logs each forecast with decision, user, timestamp, and lineage.

---

### Gate G: Autonomous Activation (Not authorized, requires special decision)
**Status:** Not yet authorized

**Prerequisite:** Gates A–F all approved and 30+ days of audit trail with zero safety incidents

**What it is:** System can suggest forecasts without requiring explicit user approval first.

**What it unlocks:** Forecast is surfaced in UI proactively.

**Scope:** Modify Oracle UI to show forecast suggestions (not decisions) with confidence bands and failure modes clearly displayed.

**Note:** This gate requires explicit approval from Phase 3 leadership. Do not implement without written authorization.

---

## 12. Recommendation

**Do not implement the adapter yet.**

Reason: The Predictability Kernel is currently pure and isolated. It has 67 passing tests and works correctly on fixture data. Before adding Evidence Router consumption, the specification must be reviewed, approved, and amended if needed.

**Next steps (in order):**

1. User reviews this specification and approves, requests changes, or rejects it
2. If approved: Proceed to Gate B (adapter types only, no implementation logic)
3. If changes requested: Revise specification and resubmit
4. If rejected: Archive this spec and pursue alternative integration approach

**Timeline:** No implementation until explicit Gate A + Gate B approval is given.

---

## 13. Freeze Line

**This specification does NOT authorize:**

- Modifying the Predictability Kernel itself
- Integrating Evidence Router
- Creating database schemas
- Adding API endpoints
- Wiring UI components
- Editing `current.md`
- Modifying protected sources (`~/.claude/oracle-memory/sources/`)
- Activating shell-promoter
- Making live prediction claims
- Treating predictions as canonical Oracle decisions
- Autonomous forecasting
- Bypassing provenance, confidence, or drift boundaries

**This specification ONLY:**

- Defines the interface contract between Evidence Router and Predictability Kernel
- Specifies how provenance, confidence, and safety gates must be preserved
- Outlines the gate sequence for future authorized work
- Clarifies what requires explicit approval before implementation

---

**End of specification — 2026-04-29**

Next authorization decision required: Gate A approval (this spec) or amendments requested.
