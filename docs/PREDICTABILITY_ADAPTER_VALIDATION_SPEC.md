# Predictability Adapter Validation Specification — Gate C

## 1. Canon Boundary

This is specification only. No implementation is authorized by this document.

**Explicit non-authorizations:**
- Gate C implementation is not authorized
- No Evidence Router wiring
- No Predictability Kernel integration
- No UI/API/DB/auth additions
- No current.md edits
- No protected source mutation
- No shell-promoter activation
- Predictions remain advisory, not canon-establishing

This document defines what validation logic *would* do if implemented. It does not implement it.

---

## 2. Gate Position

The adapter integration architecture uses sequential authorization gates:

- **Gate A** (✓ committed: cb60775 + fd111d5): Adapter specification, safety review, audit of autonomous-activation wording
- **Gate B** (✓ committed: 52a497d): Type contracts only — vocabulary shared between Evidence Router and Predictability Kernel
- **Gate C** (this document): Validation logic specification — what checks must pass before evidence packets adapt forecasts
- **Gate D** (future): Adapter implementation review — kernel integration, Evidence Router wiring, validation function testing

Gate C validates whether evidence packets *can be safely adapted*. It does not adapt them.

---

## 3. Inputs

Gate C validation accepts inputs defined in Gate B type contracts. Reference only:

- `AdapterEvidenceItem` — single piece of evidence with source tier, confidence, status, provenance
- `AdapterPromptContextPacket` — collection of allowed evidence, blocked evidence, warnings, boundaries, output contract
- `AdapterWarning` — warning code, severity, optional evidence ID
- `AdapterGateDecision` — allowed/reason/requiredNextGate shape
- `AdapterContractRule` — rule ID, description, severity, appliesTo
- `AdapterForecastExplanation` — scenario, confidence, evidence basis, assumptions, warnings, failure modes

These are type definitions only. Gate C validation logic does not yet import, instantiate, or manipulate them.

---

## 4. Validation Responsibilities

If implemented, Gate C validation must check:

1. **Blocked evidence exclusion** — evidence marked blocked must not contribute to forecast strength
2. **Scaffold downgrade** — T3_SCAFFOLD evidence cannot create STRONG forecasts (>80% confidence) alone
3. **Unverified downgrade** — UNVERIFIED confidence status cannot create STRONG forecasts alone
4. **Conflicted warning propagation** — CONFLICTED evidence must be preserved with warning labels, not discarded
5. **Stale evidence handling** — STALE evidence must either decay in confidence weight or be labeled with warning
6. **Inference label retention** — T4_INFERENCE evidence must remain labeled as inference in output, not presented as verified
7. **User-direct boundary enforcement** — T0_USER_DIRECT can define task objective but cannot override hard safety rules
8. **Provenance trail presence** — forecast explanation must include evidence sources and tier information
9. **Canon boundary preservation** — no prediction can claim to be canon-establishing or override locked canon
10. **Immutability preservation** — validation must not mutate input packet; all decisions are read-only transformations

---

## 5. Evidence-Level Validation Rules

If implemented, Gate C must enforce eight rules specified in Gate B:

### BLOCKED_ZERO_CONTRIBUTION
- Evidence with `status === 'blocked'` OR `confidence === 'BLOCKED'` must result in block decision
- Blocked evidence must contribute zero to future adapter scoring logic
- Blocked items are isolated; they cannot be silently dropped or ignored — the blocker must be visible to user

### SCAFFOLD_NO_STRONG_FORECAST_ALONE
- T3_SCAFFOLD evidence is placeholder/exploratory; it must be explicitly labeled
- Scaffold evidence alone cannot produce forecast confidence >80% (STRONG)
- Requires pairing with T0–T2 evidence to reach STRONG confidence
- If packet contains only scaffold + lower-tier evidence, forecast must be downgraded to LIKELY or lower

### UNTRUSTED_NO_STRONG_FORECAST_ALONE
- T5_UNTRUSTED evidence (unvetted, third-party, unreliable source) cannot create STRONG forecasts alone
- Requires pairing with verified evidence (T0–T2)
- If packet contains only untrusted evidence, forecast must be downgraded

### UNVERIFIED_NO_STRONG_FORECAST_ALONE
- UNVERIFIED confidence status means source/claim has not been cross-checked
- UNVERIFIED evidence alone cannot produce STRONG forecast
- Must be paired with VERIFIED or LIKELY evidence to reach STRONG

### CONFLICTED_MUST_WARN
- CONFLICTED confidence means evidence contradicts other evidence in the packet
- Conflicted items must be preserved with warning metadata
- Warning must propagate to forecast explanation and user display
- Conflicted evidence is included in packet, not excluded

### STALE_MUST_DECAY_OR_WARN
- STALE status means evidence is old relative to current session/cycle
- Stale evidence must either:
  - Have confidence weight decayed (e.g., 0.9 → 0.7) OR
  - Produce warning in output (or both)
- Do not use stale evidence at full confidence

### INFERENCE_MUST_RETAIN_LABEL
- T4_INFERENCE evidence is derived/computed, not directly observed
- Inference must remain labeled as inference in forecast explanation
- Cannot be promoted to "verified" or "canon" status
- Provenance trail must show the inference step

### USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES
- T0_USER_DIRECT (user input) can specify task objective and scope
- User input cannot override hard safety/canon rules:
  - Cannot suppress blocked evidence
  - Cannot claim certainty (>99% confidence)
  - Cannot disable autonomous-action boundary
  - Cannot suppress uncertainty
- User is author of objective, not validator of safety rules

---

## 6. Packet-Level Validation Rules

If implemented, Gate C must validate entire evidence packets:

1. **Allowed/blocked separation** — `allowedEvidence` and `blockedEvidence` must remain separate; cross-contamination is a validation failure
2. **Blocked evidence visibility** — blocked items cannot be silently dropped; validation must signal blockers to user
3. **Warning preservation** — all warnings in packet must be carried forward to forecast explanation
4. **Canon boundaries** — `canonBoundaries` array must be preserved and enforced (predictions cannot claim to establish canon)
5. **Output contract preservation** — `outputContract` fields (requireProvenanceTrail, forbidCertaintyLanguage, forbidAutonomousAction, etc.) must be carried forward
6. **Empty packet handling** — packet with zero evidence cannot produce STRONG forecast (can produce UNLIKELY or diagnostic output only)
7. **Low-trust-only handling** — packet containing only T4_INFERENCE, T5_UNTRUSTED, and UNVERIFIED evidence must be downgraded and warned
8. **Confidence consistency** — packet confidence score must align with evidence tier mix; high confidence requires T0–T2 evidence, not just quantity

---

## 7. Validation Decision Shape

If implemented, Gate C validation would produce a decision structure (type definition future-only, not authorized for implementation yet):

**Conceptual shape only:**

```typescript
type AdapterValidationDecision =
  | { allowed: true; decision: 'allow'; warnings: readonly AdapterWarning[] }
  | {
      allowed: true
      decision: 'allow_with_warnings'
      warnings: readonly AdapterWarning[]
      downgradedEvidenceIds: readonly string[]
    }
  | {
      allowed: false
      decision: 'quarantine'
      reasons: readonly string[]
      blockedEvidenceIds: readonly string[]
      requiredNextGate: 'MANUAL_REVIEW'
    }
  | {
      allowed: false
      decision: 'block'
      reasons: readonly string[]
      blockedEvidenceIds: readonly string[]
    }
```

**Fields:**
- `allowed` — boolean: can packet be adapted?
- `decision` — enum: allow / allow_with_warnings / quarantine / block
- `warnings` — array: list of all warnings in packet (preserved, not dropped)
- `downgradedEvidenceIds` — array: evidence IDs that were downgraded (e.g., stale → lower confidence)
- `blockedEvidenceIds` — array: evidence IDs that triggered blockers
- `requiredNextGate` — optional string: if decision is quarantine, which gate?
- `reasons` — array: human-readable explanation of validation result

This is design specification only. The type itself is not authorized for creation unless Gate C implementation is separately approved.

---

## 8. Mathematical Critical Thinking Activation

If implemented, Gate C validation must proactively trigger the Mathematical Critical Thinking Protocol (per docs/SPEC_PHASE1_BATMAN_MVP.md) when:

1. **Forecast affects strategy** — if evidence packet informs a decision (timing, spend, positioning, outreach)
2. **High confidence, narrow evidence** — strong forecast backed by only one or two evidence items
3. **Opposing evidence exists** — packet contains both supporting and conflicting evidence
4. **Trend divergence** — current trend contradicts historical trend or behavioral pattern
5. **Landmark response load-bearing** — a single landmark response carries >50% of forecast weight
6. **High downside risk** — recommended action has asymmetric downside (e.g., recommending release timing, public statement, spend increase)
7. **Canon boundary at risk** — forecast could be misinterpreted as establishing canon or overriding locked boundaries

When triggered, validation output must include:
- Base-rate analysis (is this outcome likely a priori?)
- Bayesian update (how much does evidence shift prior?)
- Confidence calibration (is stated confidence justified?)
- Second-order effects (what else changes if forecast is true?)
- Failure modes (how could the forecast be wrong despite high confidence?)

---

## 9. Future Test Requirements

If Gate C implementation is authorized, the test suite must include (minimum):

1. **Blocked evidence block decision** — evidence with `status === 'blocked'` → validation returns `allowed: false, decision: 'block'`
2. **Scaffold-only downgrade** — packet with only T3_SCAFFOLD evidence → downgraded below STRONG
3. **Unverified-only downgrade** — packet with only UNVERIFIED confidence → downgraded
4. **Conflicted warning propagation** — CONFLICTED evidence → warning in output, evidence preserved
5. **Stale evidence decay** — STALE evidence with no decay → warning produced
6. **Inference label retention** — T4_INFERENCE evidence → labeled as inference in output, not as verified
7. **User-direct cannot override blocked** — user objective cannot suppress blocked evidence
8. **Allowed/blocked separation preserved** — validation preserves distinct lists
9. **Canon boundaries preserved** — validation rejects any forecast claiming canon status
10. **Output contract preserved** — validation output includes outputContract fields
11. **Empty packet handling** — zero-evidence packet → UNLIKELY or diagnostic only, not STRONG
12. **Validation does not mutate inputs** — input packet unchanged after validation
13. **No Evidence Router imports** — validation code does not import Evidence Router modules
14. **No Predictability Kernel imports** — validation code does not import kernel.ts
15. **No filesystem/API/UI/DB/current.md/shell-promoter** — validation is pure function, no I/O

---

## 10. Non-Goals

Gate C specification explicitly excludes:

- Adapter implementation (that is Gate D)
- Evidence mapping (Evidence Router's job, not validation's)
- Forecast generation (Predictability Kernel's job)
- Kernel integration (future work)
- UI display of forecasts (future work)
- API endpoint creation (future work)
- Database persistence (future work)
- Live prediction serving (future work)
- Autonomous action triggering (frozen by design)
- current.md mutation (off-limits)
- Protected source mutation (off-limits)
- shell-promoter activation (deferred indefinitely)

This is a validation spec, not an implementation plan.

---

## 11. Gate C Acceptance Criteria

Gate C specification is accepted only when:

- [ ] All eight evidence-level rules are listed (BLOCKED_ZERO_CONTRIBUTION, SCAFFOLD_NO_STRONG_FORECAST_ALONE, UNTRUSTED_NO_STRONG_FORECAST_ALONE, UNVERIFIED_NO_STRONG_FORECAST_ALONE, CONFLICTED_MUST_WARN, STALE_MUST_DECAY_OR_WARN, INFERENCE_MUST_RETAIN_LABEL, USER_DIRECT_CANNOT_OVERRIDE_BOUNDARIES)
- [ ] All packet-level validation rules are defined
- [ ] Validation decision shape is specified (type design only, not implemented)
- [ ] Future test requirements are enumerated
- [ ] No implementation code is added
- [ ] No Evidence Router wiring is added
- [ ] No Predictability Kernel modification is added
- [ ] Gate D remains locked
- [ ] All safety boundaries are explicit and non-negotiable

---

## 12. Recommended Next Step

After this specification is committed, the next possible authorized step is:

**Gate C Implementation (pure validation functions + tests only)**

Scope:
- Create `ui/lib/oracle/predictability/adapter-validation.ts` — validation logic only
- Create `ui/lib/oracle/predictability/__tests__/adapter-validation.test.ts` — 15 tests per section 9
- No Evidence Router imports
- No Predictability Kernel imports
- No I/O, no side effects
- All inputs from Gate B types

But this requires explicit separate user authorization.

---

## 13. Freeze Line

**This specification does not authorize:**
- Implementation of validation logic
- Adapter function creation
- Evidence Router wiring
- Predictability Kernel integration
- UI/API/DB/auth additions
- current.md edits
- Protected source mutation
- shell-promoter activation
- Live prediction claims
- Autonomous forecasting
- Certainty language (>99%)
- Suppression of uncertainty

Validation remains pure specification until explicitly authorized to implement.

---

**Status:** Specification only. Awaiting review and commit approval.
