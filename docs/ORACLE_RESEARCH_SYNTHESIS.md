# Research Synthesis: Phase 2 Fractal Memory — Theoretical Foundations

**Date:** 2026-04-28  
**Scope:** Phase 2 Memory Observatory (Stages A–G, 94/94 tests passing)  
**Evidence:** Committed hashes 08b68d8–85ea19b, RECONCILIATION_REPORT.md, PHASE_2_STAGE_G_EVAL_REPORT.md

---

## 1. Hebbian Associative Memory

**Principle:** "Neurons that fire together, wire together" — co-occurrence strengthens associations.

**Implementation in Phase 2:**
- Domain code pairs track cumulative co-activation weight
- Each session pairing increments weight; idempotent (same pair, same session = one increment)
- Weights decay via soft dampening (not deletion) — `weight × 0.95^sessions_inactive`
- Re-ring events trigger when adjacency weight crosses θ=5, contracting ring distance by 1

**Evidence:**
- Stage D (Hebbian Dynamics): 18/18 tests verify co-occurrence accumulation without oscillation
- Weight increments are idempotent; re-ring events fire smoothly; ring distance contracts without churn
- Weights decay over time via soft dampening, preserving history while reducing stale influence

**Connection to system:** Hebbian dynamics are the *learning mechanism* — how adjacent domains strengthen their proximity. Without this, shell memory is static partitioning. With it, the system learns which domain pairs should be co-loaded (Ring 1) and which should load only on signal (Ring 2).

---

## 2. Dynamical Systems — State Transitions & Equilibrium

**Principle:** Systems move through stable states; transitions are governed by rules, not randomness.

**Implementation in Phase 2:**
- Entry lifecycle: Fresh → Stale → Archive_Candidate → (Archive or delete)
- State transitions driven by `sessions_inactive` threshold crossing (11 for stale, 12 for archive_candidate)
- Decay state transitions respect protection floors (boosts can prevent stale; anchor status can prevent archive)
- Quarantine status persists across transitions as an override mechanism

**Evidence:**
- Stage E (Decay Scheduler): 31/31 tests verify state machine correctness, decay scheduling, and lifecycle transitions
- Fresh entries stay fresh with sufficient observations; stale entries transition to archive_candidate after 12 sessions inactive
- Quarantine status set by rules and persists through retrieval, blocking access immediately (confidence=0)
- No state gets stuck; all transitions are well-defined and reach equilibrium

**Connection to system:** Dynamical systems prevent memory bloat and drift. The state machine ensures old, unused entries gradually fade without sharp deletion events. Quarantine provides a hard stop for rule violations. Together they maintain bounded, predictable system behavior.

---

## 3. Control Theory & Anti-Drift Mechanics

**Principle:** Feedback loops and preemption prevent unwanted state changes; hard rules override soft heuristics.

**Implementation in Phase 2:**
- **Rule Activation Preemption:** BLOCK status immediately blocks retrieval, overriding all other checks. Confidence forced to 0.
- **Quarantine Override (Stage E):** Quarantine status overrides decay protection; prevents promotion; blocks retrieval.
- **Finite-State Governance (Stage F, integrated in Stage G):** 6 hard rules applied in priority order:
  1. BLOCK rule activation → confidence=0
  2. Quarantine status → confidence=0
  3. Missing provenance → downgrade
  4. Cross-domain without reason → downgrade
  5. Stale/archive without justification → downgrade
  6. Confidence = weight × min(sessions/5, 1.0) + boosts, capped at 1.0

**Evidence:**
- Rule Activation Monitor (implemented module, included in 94/94 eval): 8/8 tests confirm BLOCK preemption before shell graduation, anchor promotion, decay, retrieval gates
- Stage F (Retrieval Gate): 20/20 tests verify all 6 rules applied in priority order, confidence capped at 1.0
- No rule can be bypassed; preemption is enforced at every decision point

**Connection to system:** Control theory prevents drift by enforcing hard constraints at decision gates. BLOCK and quarantine are circuit breakers. The 6-rule retrieval gate is a control system that keeps confidence bounded and decision logic deterministic. Without these overrides, soft heuristics would accumulate exceptions and the system would drift.

---

## 4. Finite-State Governance — Decision Enums & Confidence

**Principle:** Decisions are discrete states (promote | hold | quarantine | reject), not continuous scores. Confidence is computable from quantifiable factors.

**Implementation in Phase 2:**
- **Shell Graduation Decision:** 4-state enum (promote | hold | quarantine | reject) with reason_codes array, confidence, explanation
- **Anchor Promotion State:** raw → local_anchor (binary transition, triggered by successful promotion)
- **Confidence Computation:**
  - Base: `weight × min(observed_sessions / 5, 1.0)`
  - Boosts: domain alignment +0.1, role alignment +0.05, anchor status +0.1, role-pair +0.05×weight
  - Cap: 1.0 (no score above certainty)
- **Decay States:** fresh | stale | archive_candidate (discrete, not continuous time)

**Evidence:**
- Stage B (Shell Graduation): 8/8 tests verify decision enum, reason_codes, confidence, explanation in all cases
- Stage C (Anchor Promotion): 9/9 tests verify anchor_status transition and confidence boost
- Confidence is always a number ∈ [0, 1]; decisions are always one of 4 states; reason_codes always present
- Every output is fully formed: decision + reason_codes + confidence + explanation

**Connection to system:** Finite-state governance makes decisions auditable and reproducible. Unlike continuous scores that drift with heuristic tweaks, discrete states and enumerated reasons are testable. Confidence is computed, not guessed. This is how the system stays predictable.

---

## 5. Epistemic Provenance — Source Validation & Cross-Domain Isolation

**Principle:** Claims about evidence must cite their source. Evidence from one domain should not bleed into another without explicit reason.

**Implementation in Phase 2:**
- **Provenance Status:** valid | missing | unverified
- **Missing provenance rule:** Immediate downgrade. Stale/archive entries with missing provenance are held, not promoted.
- **Cross-Domain Isolation:** Request in domain A should not retrieve from domain B unless `explicit_cross_domain_reason` is set.
- **Provenance Handling (Stage F, integrated in Stage G):** Missing provenance downgrades confidence immediately. Unverified does not block but affects confidence. Valid provenance + other conditions allow promotion.

**Evidence:**
- Stage G, Provenance Handling tests: Missing provenance immediately downgrades candidates. Unverified does not block. Stale/archive entries with missing provenance are held.
- Stage G, Cross-Domain Isolation tests: Requests in one domain without explicit_cross_domain_reason downgrade candidates from other domains. With reason, allowed.
- Domain alignment boost only applies when domains match

**Connection to system:** Provenance and cross-domain isolation prevent false memory mergers. A fact from domain A is not valid in domain B unless there is a stated reason. This prevents accidental contamination and keeps memory semantically coherent.

---

## 6. Bounded Fractal Governance — Sub-Shell Carving & Local Consolidation

**Principle:** The top-level torus (8D identity, 16D state, 32D vision, 64D reference) recurses *inside* 16D via role-based sub-sections. Local consolidation promotes recurring motifs to anchors.

**Implementation in Phase 2:**
- **16D Role Carving:** task → context → blockers → decisions → signals (circular, ring distance = steps on cycle)
- **Per-Entry Metadata:** timestamp, weight, linked_roles, anchor_status (raw | local_anchor), decay_state, observed_sessions
- **Local Consolidation Threshold:** Motif recurs ≥3 sessions within a role → promoted to local_anchor
- **Local Anchor Semantics:** Local anchors decay slower than raw entries; they pass stale/archive checks without other justification; they add confidence boost (+0.1)
- **Hebbian Pairs Inside 16D:** task↔context, task↔blockers, blockers↔decisions, decisions↔signals

**Evidence:**
- Stage C (Anchor Promotion): 9/9 tests verify local_anchor state transition, confidence boost, and role-aware consolidation
- Entry marked local_anchor after successful promotion
- Local anchors pass stale/archive decay checks without other justification
- Anchor status boost properly conditioned on other checks (not applied if rule preemption fires)

**Connection to system:** Bounded fractal governance prevents the 16D sub-shell from growing unbounded. Local consolidation is sub-shell-level shell graduation — recurring patterns get promoted to anchors, which decay slower and take up less space. The role ring (task→context→blockers→decisions→signals) mirrors the top-level domain adjacency structure, making the recursion coherent.

---

## 7. Retrieval Diagnostics — Confidence Computation & Immutability

**Principle:** Every retrieval decision is auditable: confidence is computed from quantifiable factors, and the decision object is immutable (never modifies input).

**Implementation in Phase 2:**
- **6 Hard Rules Applied in Priority Order:**
  1. BLOCK rule → confidence=0
  2. Quarantine → confidence=0
  3. Missing provenance → downgrade
  4. Cross-domain without reason → downgrade
  5. Stale/archive without justification → downgrade
  6. Confidence = weight × min(sessions/5, 1.0) + boosts, capped at 1.0
- **Boosts:** domain alignment +0.1, role alignment +0.05, anchor status +0.1, role-pair +0.05×weight
- **Immutability:** `evaluateRetrievalCandidate` does not mutate candidate or request; `shouldPromote` does not mutate input entry
- **Verification:** JSON.stringify(input) before and after equals for all inputs (proof of immutability)

**Evidence:**
- Stage F (Retrieval Gate Integration): 20/20 tests verify all 6 rules applied in priority order, confidence capped at 1.0
- Stage G, Immutability tests: JSON.stringify before and after equals for all input fixtures
- No module mutates state it didn't compute itself
- Every decision output is newly constructed (not a modified input)

**Connection to system:** Retrieval diagnostics ensure that memory access decisions are transparent and reproducible. Confidence is not a black box; it is computed from named factors. Immutability means the act of retrieving does not corrupt the original memory. These two properties together enable safe, predictable memory access.

---

## 8. Software Chain-of-Trust — Committed Evidence & Test Matrix Validation

**Principle:** Every major decision is backed by committed, cryptographically identifiable evidence. Tests validate the entire pipeline before code is accepted.

**Implementation in Phase 2:**
- **Committed Evidence Ledger:** 7 stage hashes (A–G)
  - Stage A (08b68d8): Memory tool inventory
  - Stage B (3feefdb): Shell Graduation Contract
  - Stage C (be83690): Local Anchor Promotion
  - Stage D (9dc7483): Hebbian Dynamics
  - Stage E (64c7988, corrected at 1c113d2): Decay Scheduler Lifecycle
  - Stage F (792c527): Retrieval Gate Integration
  - Stage G (85ea19b): Eval Matrix Report
  
- **Test Matrix Validation:** 94/94 tests across 6 modules
  - rule-activation-monitor: 8/8
  - shell-graduation: 8/8
  - anchor-promotion: 9/9
  - hebbian-dynamics: 18/18
  - decay-scheduler: 31/31
  - retrieval-gate-integration: 20/20

- **Build Verification:** "✓ Compiled successfully", "✓ Generating static pages (15/15)"
- **Safety Verification:** Protected sources (~/.claude/oracle-memory/sources/) untouched, no UI/DB/backend changes, no external API calls
- **Regression Testing:** Stage F baseline (20/20 retrieval-gate, 31/31 decay) maintained; no regressions
- **Deferred Work:** Shell Promoter (0448d69) classified KEEP_DEFERRED — correct implementation (12/12 tests), committed out of sequence, requires future explicit authorization and stage assignment before activation or use

**Evidence:**
- PHASE_2_STAGE_G_EVAL_REPORT.md: All 10 eval categories passed (Rule Activation Preemption, Shell Graduation Safety, Anchor Promotion, Hebbian Stability, Decay/Quarantine, Retrieval Gate, Cross-Domain Isolation, Provenance Handling, Immutability, Full Pipeline Composition)
- RECONCILIATION_REPORT.md: Stages A–E approved and complete; Stage F implemented; Stage G eval passed; Shell Promoter deferred pending sequencing clarity and explicit authorization
- Committed hashes are cryptographically identifiable; no code changes go in without test validation

**Connection to system:** Chain-of-trust means you can audit the entire system by checking commit hashes and test results. If a bug appears in production, you can trace it back to which stage's tests failed to catch it. This is how Phase 2 is held to high standards: nothing ships without evidence.

---

## Synthesis: How These 8 Concepts Form a Coherent System

| Concept | Role | Mechanism | Result |
|---------|------|-----------|--------|
| Hebbian | Learning | Co-occurrence weights, re-ring events | System learns which domains should co-load |
| Dynamical Systems | Stability | State transitions at 11/12 sessions, decay scheduling, quarantine override | Memory stays bounded, predictable, no bloat |
| Control Theory | Safety | BLOCK preemption, 6-rule retrieval gate, hard constraints | Drift is prevented; decisions are deterministic |
| Finite-State Governance | Auditability | Decision enum (4 states), confidence computation, reason_codes | Every decision is reproducible and testable |
| Epistemic Provenance | Correctness | Provenance validation, cross-domain isolation, explicit reason tracking | False memory mergers are prevented |
| Bounded Fractal Governance | Scalability | 16D role carving, local consolidation at ≥3 sessions, anchor decay | Sub-shell learning mirrors top-level architecture |
| Retrieval Diagnostics | Transparency | 6-rule priority, confidence from quantifiable factors, immutability | Memory access is safe, auditable, predictable |
| Chain-of-Trust | Accountability | Stages A–G committed hashes, 94/94 test validation, regression testing, safety verification | Every decision is backed by evidence |

**The unified principle:** Phase 2 Fractal Memory is a system where memory evolves according to Hebbian rules, is kept stable via dynamical systems principles, is protected by control-theoretic hard constraints, is auditable via finite-state governance, is epistemically sound via provenance tracking, is scalable via bounded fractal recursion, is safely accessible via retrieval diagnostics, and is trustworthy via committed evidence.

No component stands alone. Together, they form a coherent, testable, production-grade memory system.
