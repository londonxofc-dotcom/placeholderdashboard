# Gate G-3 Adapter-to-Kernel Bridge Handoff

## 1. Classification

| Field | Value |
|---|---|
| Gate | G-3 — Adapter-to-Kernel Bridge Boundary |
| Parent gate | G — Model Stage Orchestration Boundary |
| Handoff status | complete |
| Runtime wiring | locked / not started |
| Persistence | none |
| Date | 2026-05-02 |

---

## 2. Locked State

| Sub-stage | Commit | Tag | Scope |
|---|---:|---|---|
| G-3.0 spec | `a181d37` | `oracle-predictability-gate-g3-adapter-kernel-bridge-spec-locked` | Design spec only |
| G-3.1 type contracts | `3f7cfe5` | `oracle-predictability-gate-g3-adapter-kernel-bridge-types-locked` | `BridgeResult`, `BridgeFieldAudit`, `LossyTransformRecord` |
| G-3.2 pure functions | `dbbb8aa` | `oracle-predictability-gate-g3-adapter-kernel-bridge-functions-locked` | Pure adapter-to-kernel bridge functions and unit tests |
| G-3.3 Gate F compatibility | `4e2297d` | `oracle-predictability-gate-g3-adapter-kernel-bridge-gate-f-tests-locked` | Forecast audit lineage compatibility tests |
| G-3.4 Gate G-2 compatibility | `fb5dc2b` | `oracle-predictability-gate-g3-adapter-kernel-bridge-gate-g2-tests-locked` | Plan executability compatibility tests |
| G-3.5 handoff | this handoff commit | `oracle-predictability-gate-g3-adapter-kernel-bridge-handoff-locked` | This handoff document |

---

## 3. Files Added Or Modified

| File | Purpose |
|---|---|
| `docs/PREDICTABILITY_GATE_G3_ADAPTER_KERNEL_BRIDGE_SPEC.md` | G-3.0 design spec |
| `ui/lib/oracle/predictability/model-stage-orchestration-types.ts` | G-3.1 bridge result/audit type contracts |
| `ui/lib/oracle/predictability/__tests__/model-stage-orchestration-types.test.ts` | G-3.1 type-contract tests |
| `ui/lib/oracle/predictability/model-stage-orchestration-bridge.ts` | G-3.2 pure bridge functions |
| `ui/lib/oracle/predictability/__tests__/model-stage-orchestration-bridge.test.ts` | G-3.2 unit and determinism tests |
| `ui/lib/oracle/predictability/__tests__/model-stage-orchestration-bridge-gate-f.test.ts` | G-3.3 Gate F compatibility tests |
| `ui/lib/oracle/predictability/__tests__/model-stage-orchestration-bridge-gate-g2.test.ts` | G-3.4 Gate G-2 compatibility tests |

No backend files, runtime routes, persistence, source memory files, or generated files were intentionally changed.

---

## 4. Behavioral Summary

G-3 now has a pure bridge boundary between adapter-local orchestration input and the current sealed kernel-native structural shape.

The bridge:

- Requires all safety flags to be true before transformation.
- Fails closed on missing supplemented fields, empty required arrays, invalid historical evidence, out-of-range confidence values, and bridge version mismatch.
- Produces a `BridgeResult` with kernel-native structural output, bridge contract metadata, errors/warnings, and field audit.
- Records lossy transforms for confidence-to-impact, confidence-to-magnitude, and source-reliability-to-source-tier conversions.
- Supports kernel-native pass-through via `createKernelNativeBridgeResult` with `bridgeStatus: 'not_required'`.
- Does not call model stages, the kernel, persistence, network, or runtime UI.

---

## 5. Verification Performed

| Command | Result |
|---|---|
| `npm --prefix ui test -- lib/oracle/predictability/__tests__/model-stage-orchestration-types.test.ts lib/oracle/predictability/__tests__/model-stage-orchestration-bridge.test.ts lib/oracle/predictability/__tests__/model-stage-orchestration-bridge-gate-f.test.ts lib/oracle/predictability/__tests__/model-stage-orchestration-bridge-gate-g2.test.ts` | Pass — 4 files, 172 tests |
| Narrow `tsc --noEmit` for G-3.1/G-3.2 files | Pass |
| Narrow `tsc --noEmit` including Gate F validator files | Pass |
| Narrow `tsc --noEmit` including Gate G-2 executable source | Fails on pre-existing locked G-2 cast diagnostics in `model-stage-orchestration.ts` lines 285-286 |
| `npm --prefix ui run typecheck` | Fails on existing project-wide type backlog; no diagnostics were observed in the new G-3 bridge files or G-3 tests |
| UI build | Not run after typecheck failure |

Known global typecheck failures include existing errors in `decay-scheduler`, `shell-graduation`, `adapter-integration`, `predictability-kernel`, `trend-delta`, `cycle-analysis`, `evidence-router-adapter-types`, and the locked `model-stage-orchestration.ts` safety flag cast.

---

## 6. Protected Boundary Review

| Boundary | Status |
|---|---|
| Runtime wiring | Not started |
| Model stage execution | Not started |
| Kernel source mutation | Not touched |
| Adapter pipeline mutation | Not touched |
| Gate F source mutation | Not touched |
| Gate G-2 source mutation | Not touched |
| Persistence/database/vector DB | Not touched |
| `current.md` | Not edited |
| `~/.claude/oracle-memory/sources/` | Not touched |
| shell-promoter | Not activated |
| `ui/next-env.d.ts` generated churn | Not touched |

---

## 7. Known Drift And Risk

The G-3.0 design spec described an older conceptual kernel shape with fields such as `date`, `source`, `signalScale`, and `verified` on landmark events. The sealed current kernel shape uses `timestamp`, `eventType`, `magnitude`, `affectedSignals`, `createsRegimeShift`, `sourceTier`, and `tags`.

G-3.2 resolves this by targeting the actual sealed structural shape visible in `ui/lib/oracle/predictability/types.ts`, while avoiding imports from that protected file. The drift is recorded in the bridge audit and tests. Future spec revisions should update the conceptual mapping table to match the sealed kernel shape.

---

## 8. Recommended Next Step

Do not start runtime wiring yet.

Recommended next gate:

1. Run a post-G-3 drift audit against tags, branch state, and untracked files.
2. Decide whether to address the project-wide UI typecheck backlog before any further predictability gate.
3. If continuing predictability work, create a new explicit gate for runtime integration only after reviewing the locked G-3 bridge output contract.
