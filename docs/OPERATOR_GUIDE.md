# Mission Control Operator Guide

Before reading this guide as the whole system, read
`docs/MISSION_CONTROL_CANONICAL_VISION.md`.

The current repo implements the orchestration backbone of Mission Control OS.
It should not be read as reducing the canonical system scope, which also
includes Fractal Memory as the memory architecture and
Oracle/Predictability as the reasoning layer.

## Current Status

Mission Control OS currently supports three modes:

| Brand | Mode | Behavior |
|---|---|---|
| Vampire Sex / London X | Batman | Approval-gated; named approvers must all approve before execution |
| Fractal Web Solutions | Jarvis | Command-execute; runs immediately through `/run` |
| ATS / All the Smoke | Wakanda | Selective approval; safe/internal tasks run, gated tasks wait for operator approval |

The cockpit UI uses brand names. The backend API uses mode values: `batman`, `jarvis`, and `wakanda`.

## Running Locally

Backend:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
npm --prefix ui run dev
```

Default cockpit API target:

```text
http://localhost:8000/api
```

Set `NEXT_PUBLIC_API_URL` if the backend runs elsewhere.

## Verification Commands

Backend:

```bash
.venv/bin/python -m pytest tests/ -v
```

Frontend:

```bash
npm --prefix ui run typecheck
npm --prefix ui run build
npm --prefix ui test
```

## Batman Mode

Batman mode is for VS/LX work where public-facing or reputation-sensitive actions need human approval.

Flow:

1. `POST /api/missions` with `mode: "batman"`.
2. Backend decomposes the objective into approval-queue tasks immediately.
3. Approvers call `POST /api/missions/{mission_id}/tasks/{task_id}/approve`.
4. When all required approvers have approved a task, the task becomes executable.
5. `POST /api/missions/{mission_id}/execute` runs approved tasks only.

Approval rule:

- If `approvers` is non-empty, every listed approver must approve each task before it reaches `approved`.
- Approvers outside the mission's list receive `403`.
- If `approvers` is empty, the first approver acts as the single-operator fallback.
- A rejection marks the task rejected.

The cockpit currently launches Batman missions with a single `operator` approver.

## Jarvis Mode

Jarvis mode is for Fractal Web Solutions work where command-execute is preferred.

Flow:

1. `POST /api/missions` with `mode: "jarvis"`.
2. `POST /api/missions/{mission_id}/run`.
3. Backend decomposes, reviews, executes, and returns the summary in one shot.

Batman approval endpoints reject Jarvis missions.

## Wakanda Mode

Wakanda mode is for ATS / All the Smoke workflows where only some tasks need review.

Flow:

1. `POST /api/missions` with `mode: "wakanda"`.
2. `POST /api/missions/{mission_id}/run-wakanda`.
3. Backend classifies tasks as pass-through or gated.
4. Pass-through tasks run immediately.
5. Gated tasks wait for `POST /api/missions/{mission_id}/wakanda/tasks/{task_id}/approve`.

Current conservative defaults:

- High-risk tasks gate.
- Unknown tools gate.
- Manual flags can force gate or pass.
- Rejecting one gated task does not cascade to other tasks.
- Wakanda approval remains single-operator in this build.

## Review And ABAC

Before execution, tasks pass through:

- Code review: known tool name, no shell-injection-looking parameters, non-empty description.
- Memory review: no cross-mode parameter-key access.
- Security review: mission ABAC allow-list and forbidden parameters.
- Runtime ABAC: when `actor_roles` are supplied, both role permissions and mission policy must allow the tool.

If `actor_roles` are omitted, Phase 2 policy-only behavior remains backwards-compatible.

## Memory Boundaries

Task result writes route through `MemoryIsolationService` for:

- `ExecutorAgent`
- `BatmanGraph`
- `ToolWrapper`

Runtime memory display endpoints read mission-scoped entries by `mission_id`.

## Current Non-Goals

- No Resonance OS source integration until `docs/RESONANCE_OS_INTEGRATION_SCOPE.md` is answered.
- No live production external integrations.
- No secrets in repo.
- No generated files, logs, `.env*`, `.next/`, or `node_modules/` committed.

## Known Follow-Ups

- Decide Resonance OS source/surface/memory relationship.
- Add concrete ATS tool registry entries once real Wakanda workflow examples are available.
- Decide whether the cockpit needs a multi-approver UI beyond the backend API support.

## Canonical References

- `docs/MISSION_CONTROL_CANONICAL_VISION.md`
- `docs/MISSION_CONTROL_SYSTEM_LAYERS.md`
- `docs/FRACTAL_MEMORY_ROLE_IN_MISSION_CONTROL.md`
- `docs/ORACLE_PREDICTABILITY_ROLE_IN_MISSION_CONTROL.md`
- `docs/MISSION_CONTROL_IMPLEMENTATION_STATE_AND_BOUNDARY.md`
