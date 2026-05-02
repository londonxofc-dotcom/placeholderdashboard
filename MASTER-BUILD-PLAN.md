# Mission Control OS — Master Build Plan

**Current Phase:** Phase 5 docs/polish (Resonance OS implementation blocked pending source/surface decision)
**Progress:** Phase 0: 100% | Phase 1: 100% | Phase 2: 100% | Phase 3: 100% — Jarvis ✅ Wakanda ✅ Cockpit mode switcher ✅ Cockpit page tests ✅. Phase 4 service contracts are partially landed: memory isolation service ✅, executor isolation write path ✅, graph/tool-wrapper isolation write paths ✅, role registry ✅, ABAC role-layer tests ✅, Batman actor-role propagation ✅, tool/role vocabulary alignment ✅, Batman multi-approver chain ✅, Resonance OS scoping ✅. Phase 5 operator guide ✅, README refresh ✅, deployment guide ✅, deployment decision record ✅, monitoring runbook ✅, cockpit idle-polling optimization ✅, backend readiness probe ✅, required credential readiness check ✅, placeholder credential readiness guard ✅, local deployment preflight ✅, generated UI churn restore option ✅, launch-gate decision preflight ✅, launch-gate production env preflight ✅, launch-gate probe preflight ✅, CORS origin normalization ✅, runtime wildcard CORS guard ✅, runtime exact-origin CORS guard ✅, protected-file preflight guard ✅, cockpit summary-based observability ✅, runtime status endpoint ✅, runtime probe discovery ✅, pre-launch degraded-readiness probe mode ✅, probe base-url shape guard ✅, probe JSON status guard ✅, probe verdict/policy alignment ✅, non-secret env readiness check ✅, production database URL guard ✅, production wildcard CORS env guard ✅, production exact-origin env guard ✅, production exact frontend API URL guard ✅, non-secret deployment decision checker ✅, deployment probe checker ✅, backend task lookup optimization ✅, supervisor task lookup optimization ✅.
**Active Worktrees:** none
**Blockers:** Production deployment target decisions; Resonance OS source/surface decision needed before implementation
**Next Approval Gate:** Phase 5 deployment decision record completion, or Resonance OS source/surface decision
**Session State:** see `current.md` (16D shell — read on session open)

### Mode → Business Mapping (CONFIRMED 2026-04-24)
- **Batman** = Vampire Sex / London X — artist work, approval-gated
- **Jarvis** = Fractal Web Solutions — dev agency, command-execute (single-shot)
- **Wakanda** = ATS / All the Smoke — label, mixed/selective approval

---

## Phase 0 — Foundation (Week 1) ✅ COMPLETE
- Mission Object Pydantic model
- Folder structure, pyproject.toml, package.json
- Git init, DB schema, pytest fixtures
- TypeScript/Next.js config (full scaffold landed in Phase 2)

---

## Phase 1 — Batman Mode MVP (Weeks 2–5) ✅ COMPLETE
- DecomposerAgent + BatmanGraph + ExecutorAgent + BatmanSupervisor
- Approval queue, full FastAPI route surface
- React cockpit (cockpit.tsx + components)
- 56/56 tests at Phase 1 close

---

## Phase 2 — Reviewer Agents + Guardrails (Weeks 6–7) ✅ COMPLETE

### Objectives — ALL MET
- [x] Reviewer Agents (code, memory, security)
- [x] Cost alert service with hysteresis
- [x] ReviewGate wired into BatmanGraph between approval and execution
- [x] CostAlertService.check wired into `_execute_task_node` after each cost track
- [x] Per-mission ABAC policy (`Mission.abac_policy`)
- [x] AuditService persistence (SQLite tests, Postgres prod via `DATABASE_URL`)
- [x] Cockpit ReviewPanel + AlertsPanel
- [x] End-to-end cockpit smoke test through ASGI transport
- [x] Next.js scaffold + typed api client (`npx tsc --noEmit` clean)
- [x] **ABAC enforcement consolidation** — `ABACEnforcer` service is the single tool-invocation gate; integrated into `BatmanGraph._execute_task_node` before tool execute (Spec §2.2 + §5.3)

### Phase 2 close
- **Total tests at close: 147/147 passing**
- ABAC consolidation landed in commit `c51a22d` (+20 tests for ABACEnforcer)

---

## Phase 3 — Jarvis & Wakanda Modes (Weeks 8–10) — ACTIVE ~33%

### Phase 3 Task Log

1. ✅ **JarvisSupervisor** (`backend/agents/jarvis_supervisor.py`) — commit `8deab03`
   - Spec §9–11: single-shot decompose → review → execute → done
   - Shares ToolService / CostService / MemoryService / CostAlertService / AuditService with Batman supervisor
   - 6 unit tests + 2 integration tests
   - Mode mapping: **Jarvis = Fractal Web Solutions** (dev agency)

2. ✅ **POST /missions/{id}/run route** — commit `8deab03`
   - Jarvis-only single-shot execution
   - Rejects Batman missions with 400
   - Mode-aware `create_mission` (Jarvis skips create-time decomposition)

3. ✅ **Wakanda spec + conservative defaults** — `docs/SPEC_PHASE3_WAKANDA.md`
   - Selective approval rule: gate iff public-facing / contractual / irreversible / cross-artist / manually flagged
   - 6 spec questions answered with conservative defaults (gate-when-unsure, single operator, no cascade on reject)
   - Mode mapping: **Wakanda = ATS / All the Smoke** (label)

4. ✅ **WakandaSupervisor + GateClassifier** (`backend/agents/wakanda_supervisor.py`)
   - GateClassifier: 7-rule priority lattice (safety floor → ABAC overrides → manual flag → registry flag → unknown-default-gate → pass)
   - run_mission(): classify each task, run pass-through immediately, queue gated for operator
   - approve_gated_task(): on approve runs review→execute, on reject marks rejected (no cascade)
   - Shares ToolService / CostService / MemoryService / CostAlertService / AuditService with Batman + Jarvis supervisors
   - 16 unit tests (`tests/unit/test_wakanda_supervisor.py`) — classifier rules + lifecycle

5. ✅ **Wakanda routes** (`backend/api/routes.py`)
   - `POST /missions/{id}/run-wakanda` — kicks off classify + auto-run pass-through
   - `POST /missions/{id}/wakanda/tasks/{tid}/approve` — operator decision on gated tasks
   - Both reject non-Wakanda missions with 400
   - `create_mission` now skips create-time decomposition for both Jarvis AND Wakanda
   - 3 integration tests (`tests/integration/test_wakanda_route.py`)

**Total tests at Phase 3 close: 166 backend + 47 UI (was 33) = 213 total passing**

6. ✅ **Cockpit brand-aware mode switcher** (`ui/pages/cockpit.tsx`)
   - Brand picker (VS/LX, Fractal, ATS) replaces mode dropdown — operator thinks in brands
   - Per-brand accent color (violet / emerald / amber) for instant visual identity
   - `handleLaunch` branches per brand: Batman creates+waits, Jarvis fires `/run` immediately, Wakanda fires `/run-wakanda` then renders gated queue
   - `handleApprove`/`handleReject` branch per mode: Batman uses `/tasks/.../approve` + `/execute` (only when queue empties), Wakanda uses `/wakanda/tasks/.../approve`
   - Approval queue shown only for Batman + Wakanda (when gated tasks exist)
   - Operator-friendly status: "Waiting on you — N to review" / "Running…" / "Done"
   - `npx tsc --noEmit` clean
   - Bug fix: previous `handleApprove` called `/missions/{id}/approve` (not a real endpoint) and `/execute` on every approve

### Phase 3 Closure (2026-04-25 night-build)
- [x] Tailwind install in `ui/` — landed in `355350e` (Tailwind v3 + autoprefixer + postcss)
- [x] Component-level Vitest tests — `355350e` (33 tests across 6 components)
- [x] **Cockpit page tests** — `6fd5be1` on `night-build/2026-04-25` (14 new tests; brand picker, Batman/Jarvis/Wakanda launch flows, approval flows including the `/execute`-only-when-queue-empty regression guard, polling)
- [x] JSDOM `scrollIntoView` stub in `vitest.setup.ts` (unblocked any future test rendering ExecutionLog with non-empty tasks)

### Deferred / Needs Nick Input
- [ ] Wakanda-specific tool registry entries — needs concrete ATS workflow examples
- [ ] Multi-approver chain — Phase 4
- [x] **Resonance OS integration scoping** — `docs/RESONANCE_OS_INTEGRATION_SCOPE.md`; implementation blocked until source/surface/memory relationship is answered

---

## Phase 4 — Memory Scoping & ABAC (Weeks 11–12) — PARTIAL / RECONCILED
- [x] Storage-level memory isolation contract — `backend/services/memory_isolation.py` + `tests/unit/test_phase4_memory_isolation.py` (`f153c43`)
- [x] Executor memory writes route through `MemoryIsolationService` — `backend/agents/executor.py` + `tests/unit/test_executor.py` (`ad138bc`)
- [x] BatmanGraph and ToolWrapper task result writes route through `MemoryIsolationService`; runtime read paths audit clean/missional — `backend/agents/batman_graph.py`, `backend/agents/tool_wrapper.py`, `tests/unit/test_batman_graph.py`, `tests/unit/test_tool_wrapper.py` (`605e221`)
- [x] Role registry and role-based tool permissions — `backend/services/role_registry.py` + `tests/unit/test_phase4_role_registry.py` (`f153c43`)
- [x] ABACEnforcer role-layer extension remains backward-compatible — `tests/unit/test_phase4_abac_enforcer.py` (`f153c43`)
- [x] Batman actor roles propagate through API mission state, `BatmanSupervisor`, and `BatmanGraph` into ABAC enforcement — `backend/api/schemas.py`, `backend/api/routes.py`, `backend/agents/supervisor.py`, `backend/agents/batman_graph.py` (`10d8ad1`)
- [x] `ToolService` registry aligns with reviewer defaults and role registry vocabulary for safe mocked tools — `backend/services/tool_service.py`, `backend/services/role_registry.py`, `tests/unit/test_tool_service.py` (`47a4731`)
- [x] Batman named-approver chain requires all listed approvers before task execution; unlisted approvers are rejected — `backend/api/routes.py`, `tests/integration/test_batman_workflow.py` (`6722a43`)
- [x] Resonance OS integration scoping — documented in `docs/RESONANCE_OS_INTEGRATION_SCOPE.md`; source integration not started.

---

## Phase 5 — Polish & Launch (Week 13) — ACTIVE
- [x] Operator guide — `docs/OPERATOR_GUIDE.md`
- [x] README refresh — `README.md`
- [x] Deployment guide — `docs/DEPLOYMENT_GUIDE.md`
- [x] Deployment decision record template — `docs/DEPLOYMENT_DECISION_RECORD.md`
- [x] Monitoring runbook — `docs/MONITORING_RUNBOOK.md`
- [x] Cockpit idle-polling optimization + route-safe cockpit regression tests — `ui/pages/cockpit.tsx`, `ui/__tests__/cockpit.test.tsx`
- [x] Backend liveness/readiness probes and required credential check for deployment monitoring — `backend/main.py`, `tests/unit/test_backend_health.py`
- [x] Readiness treats placeholder credentials as missing — `backend/main.py`
- [x] Runtime status snapshot for monitor dashboards — `/status`
- [x] Local deployment preflight runner catches backend/UI verification and generated UI churn — `tools/deployment_preflight.py`, `tests/unit/test_deployment_preflight.py`
- [x] Deployment preflight can restore generated `ui/next-env.d.ts` churn after verification — `tools/deployment_preflight.py --restore-generated-ui-types`
- [x] Launch-gate preflight can include deployment decision record completeness — `tools/deployment_preflight.py --include-decision-check`
- [x] Launch-gate preflight can include production environment readiness — `tools/deployment_preflight.py --include-production-env-check`
- [x] Launch-gate preflight can include public backend probe verification — `tools/deployment_preflight.py --include-probe-check`
- [x] Production CORS origin parsing trims whitespace and ignores empty entries — `backend/main.py`, `tests/unit/test_backend_health.py`
- [x] Runtime CORS origin parsing ignores wildcard entries — `backend/main.py`
- [x] Runtime CORS origin parsing ignores malformed origin entries — `backend/main.py`
- [x] Deployment preflight fails fast on protected tracked-file churn — `current.md`, `ui/next-env.d.ts`
- [x] Cockpit consumes run summaries directly instead of issuing redundant post-run observability GETs — `ui/pages/cockpit.tsx`, `ui/__tests__/cockpit.test.tsx`
- [x] Runtime status response advertises `/health`, `/status`, and `/ready` probe paths — `backend/main.py`
- [x] Probe checker can distinguish pre-launch degraded readiness from launch-ready success — `tools/deployment_probe_check.py --allow-degraded-ready`
- [x] Probe checker rejects malformed backend base URLs and paths that include `/api` — `tools/deployment_probe_check.py`
- [x] Probe checker validates expected JSON status values per path — `tools/deployment_probe_check.py`
- [x] Probe checker printed verdicts match exit-code policy — `tools/deployment_probe_check.py`
- [x] Non-secret deployment environment readiness checker — `tools/deployment_env_check.py`
- [x] Production env checker requires `DATABASE_URL` to be a PostgreSQL URL — `tools/deployment_env_check.py --production`
- [x] Production env checker rejects wildcard CORS origins — `tools/deployment_env_check.py --production`
- [x] Production env checker requires exact HTTP(S) CORS origins — `tools/deployment_env_check.py --production`
- [x] Production env checker requires `NEXT_PUBLIC_API_URL` to be an exact URL ending in `/api` — `tools/deployment_env_check.py --production`
- [x] Deployment decision record completeness checker does not echo row contents — `tools/deployment_decision_check.py`
- [x] Backend deployment probe checker for `/health`, `/status`, and `/ready` — `tools/deployment_probe_check.py`
- [x] Backend approval/execution task lookup uses per-request task-id maps — `backend/api/routes.py`
- [x] Batman supervisor execution uses per-run task-id maps — `backend/agents/supervisor.py`
- [x] Performance optimization — cockpit polling/fetch reduction plus backend task lookup indexing
- [ ] Deployment + monitoring

---

## Risks & What to Avoid
- **Swarm behavior** — Agents spinning up without coordination
- **Free-form agent chat** — Approval queue must be explicit
- **Cross-mode memory leakage** — Batman / Jarvis / Wakanda isolated (enforced by MemoryReviewer)
- **Mode-mapping drift** — Jarvis = FWS, Wakanda = ATS. This has drifted before; persisted to memory at `~/.claude/projects/-Users-Malachi-Missipn-Control-Builder-Agent/memory/mode_business_mapping.md`
- **Missing audit trail** — every decision logged
- **Scope creep** — stick to the 17-section spec

---

## Spec Reference
- **Phase 1:** `docs/SPEC_PHASE1_BATMAN_MVP.md`
- **Phase 3 Wakanda:** `docs/SPEC_PHASE3_WAKANDA.md` (draft, awaiting Nick review)
- **Architecture:** `docs/ARCHITECTURE.md`
- **Operator Guide:** `docs/OPERATOR_GUIDE.md`
- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`
- **Resonance OS Scoping:** `docs/RESONANCE_OS_INTEGRATION_SCOPE.md`

---

**Last Updated:** 2026-05-02 (Gate G-3 locked, UI typecheck/build restored clean, deployment guide added)
**Maintained By:** Mission Architect Agent
