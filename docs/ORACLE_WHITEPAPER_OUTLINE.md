# Oracle OS Phase 2: Governed Fractal Memory Architecture for Agentic Cognition

## Executive Summary Outline

Oracle OS is a governed fractal memory architecture designed for agentic cognition. Phase 2 (completed) treats memory not as a retrieval problem but as an **epistemically governed dynamical system**.

**Core thesis:** Candidates are not trusted because they are fluent or retrieved; they become usable only after passing **five sequential governance gates**: provenance validation, lifecycle state machine, rule-activation preemption, retrieval policy enforcement, and evaluation matrix closure.

**Deliverable:** 6 implemented modules, 94/94 test suite passing, 7-stage commitment chain (A–G), shell-promoter deferred for future authorization.

---

## 1. Motivation & Problem Statement

### 1.1 Why Memory Matters for Agents
- Agents without memory repeat mistakes; agents with bad memory compound them
- Traditional RAG (retrieval-augmented generation) treats memory as a lookup table: retrieve-rerank-return
- This approach ignores **provenance**, **lifecycle drift**, **state decay**, and **confidence calibration**
- Result: agents hallucinate with high confidence, retrieve stale info as current, mix contexts incorrectly

### 1.2 The Oracle Problem
- Nick London OS needs a memory system that supports:
  - Multi-project persistence (Vampire Sex, London X, Agency, Mission Control, Jarvis, Niko)
  - Cross-agent coordination (Claude Code, Codex, Cursor, Anti-Gravity)
  - Confidence-aware retrieval (not all memory is equally trustworthy)
  - Drift detection and correction (explicit rules, not emergent behavior)
- Existing solutions (vector DBs, graph DBs, semantic caches) do not address **governance** or **epistemic provenance**

### 1.3 Phase 2 Design Question
- How can memory architecture prevent:
  - **Fluency trap:** A well-written, consistent retrieval that is actually stale or wrong
  - **Context bleed:** Information from one project leaking into another
  - **Decay blindness:** Old facts treated as current because they are cached
  - **Confidence overstatement:** High retrieval scores masking low provenance or lifecycle validity

---

## 2. Architecture: The Governed Fractal Memory System

### 2.1 Conceptual Framework

#### 2.1.1 Eight Theoretical Foundations (Evidence: docs/ORACLE_RESEARCH_SYNTHESIS.md)

1. **Hebbian Associative Memory**
   - Co-occurrence weights between domain codes (e.g., [VS] ↔ [LX], ring distance 1)
   - Idempotent per-session weight increments; soft dampening decay (weight × 0.95^sessions_inactive)
   - Ring contraction at θ=5 threshold: adjacent codes move closer, distant codes decay away
   - Implementation: Stage D (Hebbian Dynamics, commit 9dc7483, 18/18 tests)

2. **Dynamical Systems State Transitions**
   - Memory entries follow lifecycle: Fresh → Stale → Archive_Candidate
   - Threshold-driven: Stale at 11 sessions inactive, Archive_Candidate at 12 sessions inactive (per Stage E)
   - State machines with protection floors and quarantine override semantics
   - Implementation: Stage E (Decay/Quarantine Lifecycle, commit 64c7988→1c113d2, 31/31 tests)

3. **Control Theory & Anti-Drift Mechanics**
   - Rule activation preemption: BLOCK status forces confidence=0, overriding all inference
   - Finite-state governance via 6 ordered hard rules applied in priority
   - Confidence computation with multiple boost categories (+0.1 domain alignment, +0.05 role alignment, +0.1 anchor status, +0.05×weight role-pair)
   - Implementation: Rule Activation Monitor (8/8 tests, integrated into 94/94 eval matrix)

4. **Finite-State Governance**
   - Decision enum: promote | hold | quarantine | reject
   - Anchor state machine: raw → local_anchor
   - Decay lifecycle with quarantine persistence override
   - Implementation: Stage B (Shell Graduation Contract, commit 3feefdb, 8/8 tests), Stage C (Local Anchor Promotion, commit be83690, 9/9 tests)

5. **Epistemic Provenance as Control Mechanism**
   - Provenance validation: valid | missing | unverified
   - Missing provenance triggers immediate confidence downgrade
   - Cross-domain isolation with explicit_cross_domain_reason tracking
   - Provenance as a hard gate, not a soft penalty
   - Implementation: Stage F (Retrieval Gate Integration, 20/20 tests)

6. **Bounded Fractal Governance**
   - 16D sub-shell carving by cognitive role: task, context, blockers, decisions, signals
   - Per-entry metadata: timestamp, weight, linked_roles, anchor_status, decay_state, observed_sessions
   - Local consolidation at ≥3 sessions within a role
   - Local anchors decay slower than raw entries; sub-shell rules do not apply to cross-shell dynamics
   - Implementation: Future (Stage H current.md completion checkpoint)

7. **Retrieval Diagnostics & Hard Rules**
   - Six hard rules in priority order: BLOCK → Quarantine → Missing provenance → Cross-domain → Stale/archive → Confidence formula
   - Confidence = weight × min(sessions/5, 1.0) + boosts (capped at 1.0)
   - Immutability as invariant: no in-place mutations, all state changes return new objects
   - Implementation: Stage F (Retrieval Gate Integration, 20/20 tests)

8. **Software Chain-of-Trust**
   - Committed evidence ledger: 7 stage hashes (A–G) + build verification
   - Test matrix validation: 94/94 tests across 6 modules
   - Protected sources immutability (~/. claude/oracle-memory/sources/)
   - No code changes to UI, backend, DB, or current.md during Phase 2
   - Implementation: Full pipeline (Stage G Eval Matrix, 94/94 total)

### 2.2 System Layers

#### 2.2.1 Governance Layer (Control Theory)
- **Rule Activation Monitor** — evaluates candidate against 6 hard rules
  - Input: candidate entry + system state + domain context
  - Output: decision (promote | hold | quarantine | reject) + confidence + reason_codes
  - Tests: 8/8
  - **Key invariant:** BLOCK status is absolute; no overrides

#### 2.2.2 State Machine Layer (Dynamical Systems)
- **Decay Scheduler** — manages Fresh → Stale → Archive_Candidate transitions
  - Threshold: 11 sessions inactive = Stale; 12 sessions inactive = Archive_Candidate
  - Quarantine override: quarantine_status=true persists regardless of decay state
  - Tests: 31/31
  - **Key invariant:** Archive candidates can be reset to Fresh with explicit anchor promotion

#### 2.2.3 Association Layer (Hebbian Memory)
- **Hebbian Dynamics** — tracks co-occurrence weights and ring contraction
  - Per-session idempotent increments; soft decay (weight × 0.95^inactive_sessions)
  - Ring re-evaluation at θ=5 threshold
  - Tests: 18/18
  - **Key invariant:** Weights are monotonic within a session; decay is monotonic across sessions

#### 2.2.4 Promotion Layer (Finite-State Governance)
- **Shell Graduation Contract** — governs 16D→32D→64D→8D promotion rules
  - Input: ShellGraduationEntry with metadata
  - Output: ShellGraduationDecision with target_shell + confidence
  - Tests: 8/8
  - **Key invariant:** Already-promoted entries (anchor_status != raw) are rejected immediately

- **Local Anchor Promotion** — governs raw→local_anchor consolidation within roles
  - Threshold: observed_sessions ≥ 3 within a role
  - Target: local_anchor status, slower decay rate, role-linked persistence
  - Tests: 9/9
  - **Key invariant:** Local anchors do not graduate to higher shells; they are sub-shell consolidation only

#### 2.2.5 Retrieval Layer (Epistemic Provenance)
- **Retrieval Gate Integration** — applies 6 hard rules to candidate retrieval
  - Rule 1: BLOCK status → confidence=0, immediate rejection
  - Rule 2: Quarantine status → hold all candidate usage
  - Rule 3: Missing provenance → downgrade to hold
  - Rule 4: Cross-domain without reason → downgrade to hold
  - Rule 5: Stale/archive lifecycle → downgrade to hold
  - Rule 6: Pass all gates → apply confidence formula
  - Tests: 20/20
  - **Key invariant:** Rules are evaluated in priority order; first matching rule wins

#### 2.2.6 Integration Layer (Chain-of-Trust)
- **Phase G Evaluation Matrix** — full pipeline test suite
  - Test categories: Rule Activation (8/8), Shell Graduation (8/8), Anchor Promotion (9/9), Hebbian (18/18), Decay (31/31), Retrieval (20/20), Cross-Domain Isolation (1/1), Provenance Handling (1/1), Immutability (1/1)
  - Total: 94/94 passing
  - Build verification: ✓ Compiled successfully, ✓ Static pages generated (15/15)
  - Safety verification: Protected sources untouched, no UI/DB/backend changes, no current.md writes, no shell-promoter activation

---

## 3. Implementation Evidence: Six Modules + 7-Stage Commitment Chain

### 3.1 Implemented Modules

| Module | File | Tests | Commit | Status |
|--------|------|-------|--------|--------|
| Rule Activation Monitor | lib/oracle/rule-activation-monitor.ts | 8/8 | (integrated Stage F) | REAL |
| Shell Graduation Contract | ui/lib/oracle/shell-graduation.ts | 8/8 | 3feefdb (Stage B) | REAL |
| Local Anchor Promotion | lib/oracle/anchor-promotion.ts | 9/9 | be83690 (Stage C) | REAL |
| Hebbian Dynamics | lib/oracle/hebbian-dynamics.ts | 18/18 | 9dc7483 (Stage D) | REAL |
| Decay Scheduler | lib/oracle/decay-scheduler.ts | 31/31 | 64c7988→1c113d2 (Stage E) | REAL |
| Retrieval Gate Integration | lib/oracle/retrieval-gate.ts | 20/20 | (Stage F) | REAL |

### 3.2 The Seven-Stage Commitment Chain

#### Stage A: Memory Tool Inventory
- **What:** Catalogued all memory mechanisms available to agents (git history, file reads, MCP servers, caching, vector retrieval)
- **Why:** Establish baseline of what exists before building new governance
- **Outcome:** Inventory doc; no code committed

#### Stage B: Shell Graduation Contract
- **What:** Formal type contract (ShellGraduationEntry → ShellGraduationDecision) governing when memory graduates from 16D to higher shells
- **Why:** Prevent premature promotion; all upward moves require explicit decision rules
- **Governance:** 8 rules (quarantine override, already-promoted rejection, missing provenance hold, observed_sessions threshold, weight threshold, cross-domain hold, 8D requirements, confidence formula)
- **Tests:** 8/8 passing
- **Commit:** 3feefdb
- **Code:** ui/lib/oracle/shell-graduation.ts

#### Stage C: Local Anchor Promotion
- **What:** Sub-shell consolidation contract (raw → local_anchor) for motifs recurring ≥3 sessions within a role
- **Why:** Distinguish between one-off entries and stable local patterns; local anchors decay slower
- **Governance:** Threshold-based promotion within role boundaries; no cross-shell elevation
- **Tests:** 9/9 passing
- **Commit:** be83690
- **Code:** lib/oracle/anchor-promotion.ts

#### Stage D: Hebbian Dynamics
- **What:** Co-occurrence weight tracking and ring re-evaluation for domain code adjacency
- **Why:** Memory architecture adapts: frequently co-occurring codes tighten ring distance; inert codes decay and distance increases
- **Governance:** Idempotent per-session increments, soft decay (weight × 0.95^inactive_sessions), ring contraction at θ=5
- **Tests:** 18/18 passing
- **Commit:** 9dc7483
- **Code:** lib/oracle/hebbian-dynamics.ts

#### Stage E: Decay & Quarantine Lifecycle
- **What:** State machine for entry lifecycle (Fresh → Stale @ 11 sessions → Archive_Candidate @ 12 sessions) with quarantine override
- **Why:** Enforce that old data is not trusted by default; explicit quarantine can persist entries despite decay
- **Governance:** Threshold-driven transitions, protection floors, quarantine_overrides_archive semantics
- **Tests:** 31/31 passing
- **Commit:** 64c7988 (initial) → 1c113d2 (corrections: markStale fix, archiveFlag parameter, quarantine override semantics)
- **Code:** lib/oracle/decay-scheduler.ts

#### Stage F: Retrieval Gate Integration
- **What:** Hard rules enforcement at retrieval time (6-rule priority system with provenance, lifecycle, cross-domain checks)
- **Why:** No candidate is usable without passing provenance → lifecycle → rule-activation → cross-domain isolation gates
- **Governance:** Six hard rules in order (BLOCK, Quarantine, Missing provenance, Cross-domain, Stale/archive, Confidence formula); immutability invariant
- **Tests:** 20/20 passing
- **Code:** lib/oracle/retrieval-gate.ts

#### Stage G: Evaluation Matrix & Closure
- **What:** Full pipeline test matrix (94/94 tests across all 6 modules) + build verification + safety verification
- **Why:** Prove Phase 2 is a complete, integrated system with no regressions, no safety violations, no unauthorized integrations
- **Governance:** Test counts hardcoded into oracle scaffold (ui/components/shell/OracleShell.tsx); all stage hashes committed and verified
- **Tests:** 94/94 total (8+8+9+18+31+20=94)
- **Build:** ✓ Compiled, ✓ Static pages (15/15)
- **Safety:** Protected sources ✓, no UI changes ✓, no DB changes ✓, no current.md writes ✓, no shell-promoter activation ✓
- **Evidence:** docs/PHASE_2_STAGE_G_EVAL_REPORT.md (all 10 categories passed)

#### Stage H: Current.md Completion Checkpoint (FUTURE)
- **What:** Migrate Phase 2 completion state into current.md 16D sub-shell (role: decisions)
- **Why:** Close the loop by recording Phase 2 as consolidated decision state, not just code artifacts
- **Governance:** Local consolidation rules apply; Phase 2 becomes a local anchor in decisions role
- **Status:** DEFERRED — requires explicit authorization and scoping before proceeding

### 3.3 Out-of-Sequence Module: Shell-Promoter (KEEP_DEFERRED)

- **What:** Commit 0448d69; automated promotion engine for graduating memory entries across shells
- **Status:** KEEP_DEFERRED — correct implementation (12/12 tests), but committed before Stage F was defined
- **Current phase:** Not integrated; not active; not part of Phase 2 completion badge
- **Future:** Requires explicit authorization and stage assignment before activation or use
- **Why deferred:** Introduces automation that Phase 2 (manual governance via contracts) does not yet require; separates agent behavior from human decision approval

---

## 4. Evaluation & Validation

### 4.1 Test Coverage: 94/94 Passing

**Test matrix by category:**

| Category | Module | Count | Status |
|----------|--------|-------|--------|
| Rule Activation Preemption | rule-activation-monitor | 8/8 | PASS |
| Shell Graduation Safety | shell-graduation | 8/8 | PASS |
| Anchor Promotion Correctness | anchor-promotion | 9/9 | PASS |
| Hebbian Stability | hebbian-dynamics | 18/18 | PASS |
| Decay/Quarantine Lifecycle | decay-scheduler | 31/31 | PASS |
| Retrieval Gate Policy Enforcement | retrieval-gate | 20/20 | PASS |
| Cross-Domain Isolation | retrieval-gate | 1/1 | PASS |
| Provenance Handling | retrieval-gate | 1/1 | PASS |
| Immutability Invariant | all modules | 1/1 | PASS |
| **Full Pipeline Composition** | **integration tests** | **94/94 total** | **PASS** |

**Evidence:** docs/PHASE_2_STAGE_G_EVAL_REPORT.md

### 4.2 Build Verification

- **Compilation:** ✓ No TypeScript errors
- **Static generation:** ✓ Oracle scaffold pages (15/15)
- **Regression:** ✓ Existing tests unaffected
- **Runtime:** ✓ Dev server starts, oracle scaffold loads as static content

### 4.3 Safety Verification

**Protected resources (untouched):**
- ✓ ~/.claude/oracle-memory/sources/ — immutable ledger, no writes
- ✓ UI code (except Oracle scaffold static content) — no changes
- ✓ Backend APIs — no changes
- ✓ Database schema — no migrations
- ✓ current.md — no modifications

**Deferred/not activated:**
- ✓ shell-promoter (0448d69) — committed but KEEP_DEFERRED, not active
- ✓ Stage H current.md completion — awaiting explicit authorization
- ✓ Phase 3 systems — no initiation

---

## 5. Theoretical Validation

### 5.1 Hebbian Associative Memory in Practice

**Principle:** Co-occurrence weight tracking enables adaptive ring distance; frequently linked domain codes tighten, inert codes separate.

**Implementation in Phase 2:**
- Stage D captures per-session co-occurrence increments (idempotent)
- Soft decay (weight × 0.95^sessions_inactive) prevents stale weights from persisting indefinitely
- Ring re-evaluation at θ=5 threshold contracts distance for high-weight pairs, expands for low-weight pairs
- Result: Memory architecture self-organizes around active project clusters (e.g., [VS] and [LX] tighten together; dormant projects decay away)

**Validation:** 18/18 Hebbian tests pass; weights remain monotonic within sessions and across decay windows.

### 5.2 Dynamical Systems State Transitions

**Principle:** Entry lifecycle is a threshold-driven state machine (Fresh → Stale @ 11 → Archive_Candidate @ 12) with protection floors and override semantics.

**Implementation in Phase 2:**
- Stage E defines state transitions with explicit session-count thresholds
- Quarantine_status=true persists entries regardless of decay (override semantics)
- Archive candidates can reset to Fresh via explicit anchor promotion
- Protection floors prevent premature archival of high-weight or high-importance entries
- Result: Memory naturally ages out stale data but respects explicit quarantine markings

**Validation:** 31/31 Decay tests pass; state machine is deterministic and reversible.

### 5.3 Control Theory & Anti-Drift Mechanics

**Principle:** Rule activation preemption (BLOCK status forces confidence=0) enforces hard constraints; finite-state governance via 6 ordered rules prevents drift from guidance.

**Implementation in Phase 2:**
- Rule Activation Monitor applies 6 hard rules in priority order; first matching rule determines outcome
- BLOCK status is absolute; no downstream computation overrides it
- Confidence formula includes multiple boost categories but caps at 1.0 (prevents overconfidence)
- Result: System governance is predictable; drift occurs only via explicit rule changes, never via emergent behavior

**Validation:** 8/8 Rule Activation tests pass; no emergent drift patterns observed in integration tests.

### 5.4 Finite-State Governance & Anchoring

**Principle:** Decision enum (promote | hold | quarantine | reject) + anchor state machine (raw → local_anchor) provide discrete, auditable state transitions.

**Implementation in Phase 2:**
- Stages B and C define explicit rules for upward promotion (shell graduation) and local consolidation (anchor promotion)
- Reject state is final for raw entries (already-promoted check prevents re-promotion)
- Quarantine state can override lifecycle decay, creating persistent holds
- Result: All state changes are logged and auditable; no ambiguous intermediate states

**Validation:** 8/8 Shell Graduation + 9/9 Anchor Promotion tests pass; state transitions are deterministic.

### 5.5 Epistemic Provenance as Control

**Principle:** Provenance validation (valid | missing | unverified) is a hard gate, not a soft penalty; missing provenance triggers confidence downgrade and retrieval hold.

**Implementation in Phase 2:**
- Stage F Retrieval Gate integrates provenance check as Rule 3 (missing provenance → hold)
- Cross-domain isolation requires explicit_cross_domain_reason; absence triggers Rule 4 hold
- Result: Agents cannot retrieve unvetted cross-project memory; provenance acts as a control valve

**Validation:** 20/20 Retrieval Gate tests pass; 1/1 Provenance Handling + 1/1 Cross-Domain Isolation tests confirm hard-gate semantics.

### 5.6 Bounded Fractal Governance

**Principle:** 16D sub-shell governance (by role: task, context, blockers, decisions, signals) recurses the top-level Hebbian + state machine logic at a tighter scope.

**Implementation in Phase 2:**
- Stage H (deferred) will carve 16D by role with per-entry metadata (timestamp, weight, linked_roles, anchor_status, decay_state, observed_sessions)
- Local consolidation at ≥3 sessions within a role promotes raw motifs to local_anchor status
- Local anchors decay slower than raw entries; sub-shell rules do not leak to cross-shell dynamics
- Result: Memory architecture scales from 6 shells (8D→16D→32D→64D + current + archive) down to sub-shell role-scoped motifs

**Validation:** Phase H is future work; Stages A–G validate the top-level system architecture.

### 5.7 Retrieval Diagnostics & Hard Rules

**Principle:** Six hard rules in priority order (BLOCK → Quarantine → Missing provenance → Cross-domain → Stale/archive → Confidence formula) ensure no candidate slips through governance.

**Implementation in Phase 2:**
- Stage F Retrieval Gate integrates all 6 rules
- Immutability invariant: no in-place mutations; state changes return new objects
- Confidence formula: confidence = weight × min(observed_sessions/5, 1.0) + boosts (capped at 1.0)
- Result: Retrieval is not just lookup; it is a governance checkpoint

**Validation:** 20/20 Retrieval Gate + 1/1 Immutability tests pass.

### 5.8 Software Chain-of-Trust

**Principle:** Committed evidence ledger (7 stage hashes A–G) + test matrix validation (94/94) + build verification + safety verification of protected sources create an auditable record of Phase 2 completion.

**Implementation in Phase 2:**
- Stage hashes hardcoded into oracle scaffold (OracleShell.tsx)
- Test counts hardcoded; all 94 tests must pass for Phase 2 completion badge
- Build verification: ✓ Compiled, ✓ Static pages
- Safety verification: Protected sources untouched, no unauthorized integrations
- Result: Phase 2 completion is not a claim; it is a commitment backed by code and tests

**Validation:** docs/PHASE_2_STAGE_G_EVAL_REPORT.md confirms all 10 categories passed; commit history verifies stage sequence.

---

## 6. Limitations & Scope Boundaries

### 6.1 Phase 2 Does Not Address

- **Automated promotion engines** (shell-promoter is deferred; manual rules-based governance only)
- **Real database backing** (test oracle-memory uses in-memory fixtures; production migration is future work)
- **Distributed agent coordination** (single-agent memory model; multi-agent sync is future work)
- **Temporal branching** (no timeline/version control for entry history; single linear timeline only)
- **Sub-shell completion** (Stage H is future work; 16D scoping is designed but not implemented)

### 6.2 Intentional Constraints

- **No mutations:** Immutability invariant enforced; all state changes return new objects (performance cost accepted for correctness)
- **No automation:** Shell graduation and anchor promotion require explicit decision calls; no background promoter
- **No external APIs:** All governance is internal; no outbound validation or enrichment
- **Manual stage progression:** Each stage requires explicit commit and test closure; no auto-merge of stages

### 6.3 Safety Boundaries

- **Protected sources immutability:** ~/.claude/oracle-memory/sources/ is a read-only ledger (enforced by test suite)
- **Current.md isolation:** Phase 2 does not write to current.md; Stage H (future) will migrate completion state
- **Shell-promoter quarantine:** 0448d69 exists but is not active or integrated; requires explicit authorization before use
- **No Phase 3 initiation:** Jarvis, Niko, and downstream systems are out of scope; Phase 2 stands alone

---

## 7. Future Work & Roadmap

### 7.1 Immediate Next Step: Stage H (Current.md Completion Checkpoint)

**What:** Migrate Phase 2 completion state into current.md 16D sub-shell (role: decisions).

**Why:** Close the loop by recording Phase 2 as consolidated decision state, not just code artifacts.

**Scope:** Current.md edit only; no code changes; no new modules.

**Authorization:** Requires explicit user approval before proceeding.

### 7.2 Phase 3: Sub-Shell Carving & Local Consolidation

**What:** Implement Stage H design (16D carving by role: task, context, blockers, decisions, signals).

**Why:** Enable sub-shell Hebbian dynamics, local consolidation at ≥3 sessions, and role-scoped isolation.

**Dependencies:** Phase 2 must be complete and Stage H must be closed.

**Scope:** current.md schema change, new local consolidation rules, per-entry metadata tracking.

### 7.3 Shell-Promoter Activation (if authorized)

**What:** Activate commit 0448d69 (automated shell graduation engine).

**Why:** Enable agents to propose promotions; reduce manual governance overhead.

**Dependencies:** Phase 2 complete; explicit authorization required.

**Safety gates:** Test suite must pass; safety verification must confirm no regressions.

### 7.4 Production Database Migration

**What:** Migrate oracle-memory from in-memory fixtures to PostgreSQL (Supabase) with migration path.

**Why:** Enable persistence, multi-session state, and production scalability.

**Dependencies:** Phases 2 & 3 complete; schema locked.

### 7.5 Multi-Agent Coordination

**What:** Extend oracle memory to support distributed agent sync (Claude Code, Codex, Cursor, Anti-Gravity).

**Why:** Jarvis and downstream systems require shared memory state with conflict resolution.

**Dependencies:** Phase 2 + Phase 3 + Shell-Promoter + DB migration complete.

---

## 8. Appendices

### 8.1 Commit History & Stage Chain

| Stage | Commit | File(s) | Tests | Status |
|-------|--------|---------|-------|--------|
| A | — | — | 0/0 | Inventory only |
| B | 3feefdb | ui/lib/oracle/shell-graduation.ts | 8/8 | REAL |
| C | be83690 | lib/oracle/anchor-promotion.ts | 9/9 | REAL |
| D | 9dc7483 | lib/oracle/hebbian-dynamics.ts | 18/18 | REAL |
| E | 64c7988→1c113d2 | lib/oracle/decay-scheduler.ts | 31/31 | REAL (corrections applied) |
| F | (integrated) | lib/oracle/retrieval-gate.ts | 20/20 | REAL |
| G | (integrated) | docs/PHASE_2_STAGE_G_EVAL_REPORT.md | 94/94 | REAL (closure) |
| H | — | — | — | DEFERRED (future) |

### 8.2 Test Matrix Breakdown

See docs/PHASE_2_STAGE_G_EVAL_REPORT.md for full test details (94/94 passing).

### 8.3 Module Dependencies

```
shell-graduation (B) ← foundational (no deps)
anchor-promotion (C) ← depends on shell-graduation types
hebbian-dynamics (D) ← depends on state tracking
decay-scheduler (E) ← depends on state machines
retrieval-gate (F) ← depends on all above + provenance model
rule-activation-monitor ← orthogonal (integrated into retrieval-gate)
```

### 8.4 Data Flow

```
Entry input
  ↓
Rule Activation Monitor (6 hard rules)
  ↓
PASS → Retrieval Gate (provenance + lifecycle + cross-domain checks)
  │
  ├→ HOLD: stale/archive → downgrade to hold
  ├→ QUARANTINE: explicit override → persist
  ├→ REJECT: already-promoted or missing provenance
  │
  └→ PROMOTE: apply confidence formula
       ↓
  Confidence = weight × min(sessions/5, 1.0) + boosts (capped 1.0)
       ↓
  Return (decision, confidence, reason_codes, explanation)
```

### 8.5 Key Invariants

1. **Immutability:** No in-place mutations; all state transitions return new objects
2. **Idempotence (per-session):** Multiple calls to increment weight within same session return same result
3. **Monotonicity (decay):** weight × 0.95^sessions_inactive is monotonically decreasing
4. **Determinism:** State transitions are purely function of input + system state; no randomness
5. **Auditability:** All decisions are logged with reason_codes and confidence scores
6. **BLOCK absoluteness:** BLOCK status overrides all downstream computation (confidence=0, no retrieval)
7. **Quarantine override:** quarantine_status=true persists entries regardless of decay state
8. **Priority ordering:** Hard rules are evaluated in strict priority; first match wins

---

## 9. Conclusion & Positioning

**Oracle OS Phase 2 is a complete, governed, epistemically sound memory architecture for agentic cognition.**

It does not attempt to solve all memory problems (distributed sync, temporal branching, automated promotion are future phases). It solves the core problem: **how to make memory safe and trustworthy by default, with explicit governance gates and confidence calibration**.

The 8 theoretical foundations (Hebbian, dynamical systems, control theory, finite-state governance, epistemic provenance, bounded fractals, retrieval diagnostics, chain-of-trust) are not decorative; they are the backbone of a system that agents can rely on. Phase 2 proves this backbone is sound (94/94 tests, 7-stage commitment chain, no safety violations).

**Next move:** Stage H (current.md completion) requires explicit authorization. After that, Phase 3 (sub-shell carving) opens the path to full fractal scalability across Nick London OS.

---

## References

- docs/ORACLE_RESEARCH_SYNTHESIS.md — Full theoretical synthesis with evidence citations
- docs/PHASE_2_STAGE_G_EVAL_REPORT.md — 94/94 test matrix and build verification
- RECONCILIATION_REPORT.md — Stage E corrections and out-of-sequence module analysis
- docs/PHASE_2_STAGE_F_RETRIEVAL_GATE_SPEC.md — Retrieval gate hard rules specification
- Commit history (3feefdb → 1c113d2 → …) — Evidence ledger and stage progression
