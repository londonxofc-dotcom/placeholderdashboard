# Predictability Kernel Handoff — Stage P-A/P-B

**Date:** 2026-04-29

---

## 1. Canon Label Correction

**State:** This is **NOT** Phase 2 Stage B.

Phase 2 Stage B is the **Shell Graduation Contract** (separate work, pending).

This checkpoint is the **Predictability Kernel Stage P-A/P-B** — a local pure implementation, committed but not integrated.

---

## 2. Stage P-C/P-D Status Update

**Date:** 2026-04-29 16:47 UTC

**Current Verified State:**
- Branch: `night-build/2026-04-25`
- Predictability test suite: **67/67 passing** (7 test files)
- Build: **Clean** — Next.js compilation successful
- Working tree: **Clean** — no API/UI/auth wiring
- Auth experiment quarantined at: `/Users/Malachi/.claude/oracle-quarantine/ui-auth-2026-04-29_16-47-43/`
- `current.md` untouched
- Protected sources untouched
- `shell-promoter` remains KEEP_DEFERRED

---

## 3. Current Predictability Modules

**Complete and tested:**
- `trend-delta.ts` — Delta classification, momentum scoring
- `regime-shift.ts` — Landmark influence, regime detection
- `behavioral-repetition.ts` — Pattern scoring
- `predictability-kernel.ts` — Composite forecast (trend 35% + landmark 30% + behavioral 25% + cycle 10%)
- `cycle-analysis.ts` — Cycle window detection and analysis
- `trend-velocity.ts` — Velocity-based trend strength
- `landmark-response.ts` — Landmark event response scoring

All modules are pure deterministic functions. No external I/O. No database calls. No API integration.

---

## 4. What Was Added

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

## 5. Test / Build Status (Stage P-C/P-D)

**Tests:** 67/67 passing (expanded from initial 24 with cycle-analysis, trend-velocity, landmark-response)
```
 ✓ lib/oracle/predictability/__tests__/trend-velocity.test.ts  (15 tests)
 ✓ lib/oracle/predictability/__tests__/trend-delta.test.ts  (4 tests)
 ✓ lib/oracle/predictability/__tests__/behavioral-repetition.test.ts  (6 tests)
 ✓ lib/oracle/predictability/__tests__/regime-shift.test.ts  (4 tests)
 ✓ lib/oracle/predictability/__tests__/cycle-analysis.test.ts  (10 tests)
 ✓ lib/oracle/predictability/__tests__/predictability-kernel.test.ts  (10 tests)
 ✓ lib/oracle/predictability/__tests__/landmark-response.test.ts  (18 tests)
```

**Build:** TypeScript compilation clean, no errors, no warnings
```
npm --prefix ui run build → ✓ Compiled successfully (15 routes, static prerendered)
```

**Type Safety:** Strict mode, all exports typed, immutable patterns enforced.

**Duration:** 24.84s (test setup + execution), 9 warnings in Next.js (CJS deprecation unrelated to predictability).

---

## 6. Boundary Status (Stage P-C/P-D)

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

## 7. Current Classification

**Local pure deterministic prediction kernel.**

- Committed to repository on `night-build/2026-04-25`.
- Fixture/local-test driven (no live data consumption).
- **Not integrated with Evidence Router.**
- **Not wired to UI/API/DB.**
- **Not connected to shell-promoter.**
- **Predictions are not canon.**
- Pure mathematical transformation layer: Evidence (if provided) → Forecast output.
- Awaiting Evidence Router → Predictability adapter specification review.

---

## 8. Cleanup / Quarantine Note

**Branch hygiene completed 2026-04-29 16:47 UTC:**

Unrelated UI/auth experiment was moved out of repository to preserve isolated Predictability work:
```
/Users/Malachi/.claude/oracle-quarantine/ui-auth-2026-04-29_16-47-43/
├── ui/app/api/auth/
│   ├── authorize/route.ts
│   ├── callback/route.ts
│   └── logout/route.ts
├── ui/app/login/
│   └── page.tsx
├── ui/lib/auth/
│   └── vercel-oauth.ts
├── page.tsx.patch
└── next-env.d.ts.patch
```

No auth/UI/API wiring remains in the working tree.

---

## 9. Future Integration Gates

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

## 10. Next Required Gate

**Before any more predictability module development:**

Design the **Evidence Router ↔ Predictability adapter specification** — the bridge contract that allows the kernel to safely consume Evidence Router outputs.

**Adapter scope (specification only, no implementation yet):**
1. How does `EvidenceItem` / `PromptContextPacket` map to `PredictabilityInput`?
2. How is provenance (T0–T5 source tier) preserved through the kernel?
3. How does confidence calibration respect Evidence Router confidence labels?
4. How are blocked/scaffold/unverified evidence items handled by the kernel?
5. How does the kernel respond to divergent lens conclusions (escalation rules)?
6. What is the output contract for predictions (structure, metadata, failure modes)?
7. What controls prevent autonomous activation without explicit user authorization?

**Document:** `docs/PREDICTABILITY_EVIDENCE_ROUTER_ADAPTER_SPEC.md` (design only)

Do not implement adapter, module extensions, or UI wiring until this specification is complete and approved.

---

## 11. Next Safe Options

**Option A** — Stop. Archive this work. Do not integrate.

**Option B** — Manual code review. No integration yet. (Recommended for security/architecture audit.)

**Option C** — Design Evidence Router adapter specification only. No code yet. (Recommended next step.)

**Option D** — Manual predictability walkthrough. Trace a fixture through all 7 modules end-to-end.

**Option E** — Stop and wait for Phase 3 authorization decision.

---

## 12. Freeze Line

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

## 13. Bridge Question for Next Phase

> **How can the Predictability Kernel consume Phase 3 Evidence Router outputs without bypassing provenance, confidence, or drift boundaries?**

This is the key question for integration design. Answer it in the adapter specification before any wiring.

---

**End of Stage P-C/P-D handoff update — 2026-04-29 16:47 UTC.**

Next checkpoint: **Evidence Router ↔ Predictability adapter specification design** — no implementation, specification only.
