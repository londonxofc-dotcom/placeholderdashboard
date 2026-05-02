# Phase 4 Memory / ABAC Reconciliation

## Status

Phase 4 is not blank. Core service contracts are already tracked and passing, with runtime integration proceeding in narrow slices.

| Area | Status | Evidence |
|---|---|---|
| Storage-level memory isolation | Service contract landed | `backend/services/memory_isolation.py` |
| Memory isolation tests | Passing | `tests/unit/test_phase4_memory_isolation.py` |
| Role registry | Service contract landed | `backend/services/role_registry.py` |
| Role registry tests | Passing | `tests/unit/test_phase4_role_registry.py` |
| ABAC role layer | Contract extension landed | `backend/services/abac_enforcer.py` |
| ABAC role-layer tests | Passing | `tests/unit/test_phase4_abac_enforcer.py` |
| Runtime memory isolation wiring | Partial | `ExecutorAgent` writes through `MemoryIsolationService`; future read paths still need review |
| Runtime actor-role propagation | Batman path landed | API mission state, `BatmanSupervisor`, and `BatmanGraph` pass `actor_roles` into ABAC enforcement |
| Tool/role vocabulary alignment | Landed | Reviewer-allowed safe tools exist in `ToolService`; role registry grants matching names while preserving aliases |
| Multi-approver chains | Not started | Still needs approval-flow design |
| Resonance OS integration | Not specced | Still needs shape/source/surface decision |

## Verification

Commands run on 2026-05-02:

```bash
.venv/bin/python -m pytest tests/unit/test_phase4_memory_isolation.py tests/unit/test_phase4_role_registry.py tests/unit/test_phase4_abac_enforcer.py -v
.venv/bin/python -m pytest tests/unit/test_mission_abac_policy.py tests/unit/test_batman_graph_phase2.py tests/integration/test_phase2_cockpit_smoke.py -v
.venv/bin/python -m pytest tests/unit/test_tool_service.py tests/unit/test_phase4_role_registry.py tests/unit/test_mission_abac_policy.py -v
.venv/bin/python -m pytest tests/ -v
npm --prefix ui run typecheck
npm --prefix ui run build
npm --prefix ui test
```

Results:

| Check | Result |
|---|---|
| Phase 4 targeted backend tests | 40 passed |
| Actor-role propagation targeted backend tests | 17 passed |
| Tool/role vocabulary targeted backend tests | 29 passed |
| Full backend tests | 214 passed |
| UI typecheck | passed |
| UI build | passed |
| Full UI tests | 43 files / 1265 tests passed |

## Drift Found

`MASTER-BUILD-PLAN.md` previously said Phase 4 entry was pending. That was stale relative to tracked commit `f153c43`, which added Phase 4 memory isolation, role registry, and ABAC role-layer tests.

Follow-up commit `ad138bc` wired `ExecutorAgent` result writes through `MemoryIsolationService`, proving task result memory is stored under the mission namespace instead of the raw key.

Follow-up commit `10d8ad1` wired mission-scoped `actor_roles` through the Batman route/supervisor execution path and the BatmanGraph ABAC invocation path. Role checks remain backwards-compatible: if `actor_roles` is omitted, Phase 2 policy-only behavior remains unchanged; if roles are supplied, `ABACEnforcer` requires both role permission and mission policy permission.

Follow-up commit `47a4731` aligned the safe mocked tool vocabulary across ReviewGate defaults, `ToolService`, and `RoleRegistry`. Reviewer-approved safe tools now have ToolService definitions, and operator/agent role checks recognize canonical tool names such as `read_file` while preserving older aliases such as `file_read`.

The correct state is:

- Phase 4 service contracts: partially complete.
- Phase 4 runtime integration: partial. Executor writes now use the isolation boundary; Batman actor-role propagation now reaches ABAC enforcement; safe tool vocabulary is aligned; future cross-mission read paths still need review.
- Phase 4 docs/planning: now reconciled by this document.

## Next Implementation Gate

Completed gates:

- Phase 4 runtime memory isolation wiring for executor writes.
- Phase 4 Batman actor-role propagation into ABAC enforcement.
- Phase 4 tool/role vocabulary alignment.

Implemented scope:

- `backend/agents/executor.py`
- `tests/unit/test_executor.py`
- `backend/api/schemas.py`
- `backend/api/routes.py`
- `backend/services/mission_service.py`
- `backend/agents/supervisor.py`
- `backend/agents/batman_graph.py`
- `tests/unit/test_mission_abac_policy.py`
- `tests/unit/test_batman_graph_phase2.py`
- `tests/integration/test_phase2_cockpit_smoke.py`
- `backend/services/tool_service.py`
- `backend/services/role_registry.py`
- `tests/unit/test_phase4_role_registry.py`
- `tests/unit/test_tool_service.py`

Next recommended gate: Phase 4 memory read-path audit.

Allowed scope for that next gate should be limited to:

- finding all supervisor/API memory read paths
- deciding whether each read path already stays mission-scoped or must route through `MemoryIsolationService`
- targeted tests for any read path that needs enforcement

Do not combine that with multi-approver chains or Resonance OS integration. Those should remain separate gates.
