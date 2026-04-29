# Predictability Kernel Handoff — Stage P-A/P-B

**Date:** 2026-04-29

---

## 1. Canon Label Correction

**State:** This is **NOT** Phase 2 Stage B.

Phase 2 Stage B is the **Shell Graduation Contract** (separate work, pending).

This checkpoint is the **Predictability Kernel Stage P-A/P-B** — a local pure implementation, committed but not integrated.

---

## 2. Current Commits

- **e33d8f6** — `docs(oracle): add mathematical critical thinking protocol`
- **8b54bcb** — `feat(predictability): add historical cycle forecasting kernel`

Both on branch `night-build/2026-04-25`.

---

## 3. What Was Added

### Documentation
- **Section 2.5** added to `docs/ORACLE_WHITEPAPER_V0_1.md`
  - 10 Independent Reasoning Lenses
  - Required Output Structure
  - Forbidden Claims
  - Freeze Line with explicit authorization boundaries

### Implementation
- **Module**: `ui/lib/oracle/predictability/`
  - `trend-delta.ts` — Delta classification (rising/falling/flat), momentum scoring, floating-point precision fix
  - `regime-shift.ts` — Landmark influence scoring, regime detection
  - `behavioral-repetition.ts` — Pattern scoring with weighted additive formula
  - `predictability-kernel.ts` — Composite forecast with confidence calibration (trend 35% + landmark 30% + behavioral 25% + cycle 10%)
  - `types.ts` — Exported type contracts
  - `__fixtures__/` — Historical evidence fixtures (5 LandmarkEvent, 2 BehavioralPattern, 3 CycleWindow arrays)

### Tests
- 4 test suites, 24/24 tests passing (trend-delta, regime-shift, behavioral-repetition, predictability-kernel)
- All synchronous, pure functions, immutable data flows
- No console.log, no hardcoded secrets, no external dependencies

---

## 4. Test / Build Status

**Tests:** 24/24 passing
```
npm --prefix ui test -- predictability
```

**Build:** TypeScript compilation clean, no errors, no warnings
```
npm --prefix ui run build → ✓ Compiled successfully
```

**Type Safety:** Strict mode, all exports typed, immutable patterns enforced.

---

## 5. Boundary Status

✓ **What was NOT done:**
- No database schema added
- No API routes added
- No UI component wiring
- No edits to `current.md`
- No protected source mutations (`~/.claude/oracle-memory/sources/`)
- No shell-promoter activation (remains KEEP_DEFERRED)
- No live prediction wiring to Evidence Router
- No external data/model calls
- No logs committed

✓ **What remains untracked:**
- `.mission_architect_daily.*` logs
- `docs/PHASE_3_IMPLEMENTATION_PLAN.md`
- `ui/lib/oracle/predictability/__fixtures__/` (fixtures only, not wired)

---

## 6. Current Classification

**Local pure deterministic prediction kernel.**

- Committed to repository.
- Experimental but isolated.
- Not integrated into Evidence Router.
- Not live (no serving, no external input).
- Awaiting Phase 3 integration gating review.

---

## 7. Future Integration Gates

Before any of the following, explicit authorization required:

1. **Evidence Router Compatibility Review**
   - How does Predictability Kernel consume Evidence Router outputs?
   - What provenance/confidence contracts must hold?

2. **Provenance Mapping Review**
   - How do T0–T5 source tiers flow through the kernel?
   - How are assumptions/uncertainty tracked across lenses?

3. **Confidence-Label Alignment**
   - Kernel produces `confidence: 0.0–1.0`. How does this map to Oracle label system?
   - What is the lower bound for "forecast-ready" confidence?

4. **Drift-Boundary Tests**
   - How does the kernel respond when lenses diverge sharply?
   - What triggers escalation to Phase 3 review?

5. **Forecast Output Contract Review**
   - What structure do predictions return?
   - How are "opposing evidence" and "failure modes" surfaced?

6. **UI/API/DB Authorization Decision**
   - If integration proceeds, which surfaces get wired?
   - What controls prevent autonomous activation?

7. **Explicit User Authorization**
   - "Use Predictability Kernel for X" — who approves, what is the scope?

---

## 8. Next Safe Options

**Option A** — Stop. Archive this work. Do not integrate.

**Option B** — Manual code review. No integration yet. (Recommended for security/architecture audit.)

**Option C** — Design integration plan only. No wiring yet.

**Option D** — Evidence Router bridge design. How does the kernel consume Evidence outputs while respecting provenance/confidence/drift boundaries? (Bridge design before wiring.)

**Option E** — UI label design only. No backend wiring. (If visualization is needed before integration.)

**Option F** — Create external `current.md` checkpoint only if explicitly authorized. (Do NOT edit `current.md` without approval.)

---

## 9. Freeze Line

**This checkpoint does NOT authorize:**
- Database schema mutations
- API endpoint creation
- UI component wiring
- `current.md` modifications
- Protected source mutations
- `shell-promoter` activation
- Live prediction claims
- Autonomous forecasting claims
- Treating predictions as canonical Oracle decisions

Predictability Kernel is **speculative deterministic machinery** — useful for analysis, not for driving decisions without Evidence Router provenance.

---

## 10. Bridge Question for Next Phase

> **How can the Predictability Kernel consume Phase 3 Evidence Router outputs without bypassing provenance, confidence, or drift boundaries?**

This is the key question for integration design. Answer it before wiring.

---

**End of handoff.**

Next best task: **Integration gating review**, not more implementation.

The bridge question above is the gateway.
