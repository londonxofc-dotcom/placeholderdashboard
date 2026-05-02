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
| Runtime memory isolation wiring | Known paths landed | `ExecutorAgent`, `BatmanGraph`, and `ToolWrapper` task result writes use `MemoryIsolationService`; runtime reads are mission-scoped by mission ID |
| Runtime actor-role propagation | Batman path landed | API mission state, `BatmanSupervisor`, and `BatmanGraph` pass `actor_roles` into ABAC enforcement |
| Tool/role vocabulary alignment | Landed | Reviewer-allowed safe tools exist in `ToolService`; role registry grants matching names while preserving aliases |
| Multi-approver chains | Batman path landed | Named Batman approvers are all-required before a task reaches `approved`; unlisted approvers receive 403 |
| Resonance OS integration | Not specced | Still needs shape/source/surface decision |

## Verification

Commands run on 2026-05-02:

```bash
.venv/bin/python -m pytest tests/unit/test_phase4_memory_isolation.py tests/unit/test_phase4_role_registry.py tests/unit/test_phase4_abac_enforcer.py -v
.venv/bin/python -m pytest tests/unit/test_mission_abac_policy.py tests/unit/test_batman_graph_phase2.py tests/integration/test_phase2_cockpit_smoke.py -v
.venv/bin/python -m pytest tests/unit/test_tool_service.py tests/unit/test_phase4_role_registry.py tests/unit/test_mission_abac_policy.py -v
.venv/bin/python -m pytest tests/unit/test_batman_graph.py tests/unit/test_tool_wrapper.py -v
.venv/bin/python -m pytest tests/integration/test_batman_workflow.py -v
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
| Memory boundary targeted backend tests | 15 passed |
| Multi-approver targeted backend tests | 6 passed |
| Full backend tests | 218 passed |
| UI typecheck | passed |
| UI build | passed |
| Full UI tests | 43 files / 1265 tests passed |

## Drift Found

`MASTER-BUILD-PLAN.md` previously said Phase 4 entry was pending. That was stale relative to tracked commit `f153c43`, which added Phase 4 memory isolation, role registry, and ABAC role-layer tests.

Follow-up commit `ad138bc` wired `ExecutorAgent` result writes through `MemoryIsolationService`, proving task result memory is stored under the mission namespace instead of the raw key.

Follow-up commit `10d8ad1` wired mission-scoped `actor_roles` through the Batman route/supervisor execution path and the BatmanGraph ABAC invocation path. Role checks remain backwards-compatible: if `actor_roles` is omitted, Phase 2 policy-only behavior remains unchanged; if roles are supplied, `ABACEnforcer` requires both role permission and mission policy permission.

Follow-up commit `47a4731` aligned the safe mocked tool vocabulary across ReviewGate defaults, `ToolService`, and `RoleRegistry`. Reviewer-approved safe tools now have ToolService definitions, and operator/agent role checks recognize canonical tool names such as `read_file` while preserving older aliases such as `file_read`.

Follow-up commit `605e221` completed the known task-result memory write boundary by routing `BatmanGraph` and `ToolWrapper` writes through `MemoryIsolationService`. The read-path audit found runtime memory display endpoints already read through mission-scoped `list_memory(mission_id)` calls; no cross-mission read path is currently wired.

Follow-up commit `6722a43` landed the conservative Batman multi-approver chain: if a mission declares approvers, every listed approver must approve a task before it becomes executable; approvers outside the mission chain are rejected with 403. Missions with no approver list keep the single-operator fallback behavior. Wakanda approval semantics were not changed.

The correct state is:

- Phase 4 service contracts: partially complete.
- Phase 4 runtime integration: partial. Known task-result write paths use the isolation boundary; Batman actor-role propagation now reaches ABAC enforcement; safe tool vocabulary is aligned; Batman named approver chains are enforced.
- Phase 4 docs/planning: now reconciled by this document.

## Next Implementation Gate

Completed gates:

- Phase 4 runtime memory isolation wiring for executor writes.
- Phase 4 Batman actor-role propagation into ABAC enforcement.
- Phase 4 tool/role vocabulary alignment.
- Phase 4 memory read-path audit and graph/tool-wrapper write boundary.
- Phase 4 Batman multi-approver chain.

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
- `backend/agents/tool_wrapper.py`
- `tests/unit/test_tool_wrapper.py`
- `tests/integration/test_batman_workflow.py`

Next recommended gate: Resonance OS integration scoping.

Allowed scope for that next gate should be limited to:

- identifying what Resonance OS is and where it lives
- deciding whether it plugs into audit feed, memory layer, mode orchestration, or decomposer input
- writing a scope/spec document before any source integration

Do not start source integration until the shape/source/surface decision is written down.
