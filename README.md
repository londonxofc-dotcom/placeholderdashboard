# Mission Control OS

Mission Control OS is an AI orchestration cockpit with three operating modes:

| Brand | Mode | What It Does |
|---|---|---|
| Vampire Sex / London X | Batman | Approval-gated execution for public or reputation-sensitive work |
| Fractal Web Solutions | Jarvis | Command-execute workflow for agency/dev tasks |
| ATS / All the Smoke | Wakanda | Selective approval for label workflows |

The backend exposes a FastAPI API. The cockpit is a Next.js UI under `ui/`.

## Current State

- Phase 0-3 are complete.
- Phase 4 core runtime wiring is largely reconciled: memory isolation, role registry, ABAC role layer, actor-role propagation, tool/role vocabulary alignment, and Batman named-approver chains are landed.
- Phase 5 docs/polish is active.
- Resonance OS integration is scoped but intentionally not implemented until its source/surface/memory relationship is decided.

See [MASTER-BUILD-PLAN.md](MASTER-BUILD-PLAN.md) for the live phase tracker.

## Quick Start

Install backend dependencies:

```bash
python3 -m pip install -e '.[dev]'
```

Install UI dependencies:

```bash
npm --prefix ui install
```

Copy environment template:

```bash
cp .env.example .env
```

Do not commit `.env`.

Run backend:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Run cockpit UI:

```bash
npm --prefix ui run dev
```

Default API base:

```text
http://localhost:8000/api
```

## Verification

Backend:

```bash
.venv/bin/python -m pytest tests/ -v
```

UI:

```bash
npm --prefix ui run typecheck
npm --prefix ui run build
npm --prefix ui test
```

When `npm --prefix ui run build` updates `ui/next-env.d.ts`, restore it before committing unless that file is intentionally in scope.

Deployment preflight:

```bash
.venv/bin/python tools/deployment_preflight.py
.venv/bin/python tools/deployment_preflight.py --include-decision-check
.venv/bin/python tools/deployment_preflight.py --include-decision-check --include-production-env-check
.venv/bin/python tools/deployment_env_check.py --production
.venv/bin/python tools/deployment_decision_check.py
.venv/bin/python tools/deployment_probe_check.py --base-url http://localhost:8000
```

The environment check reports variable names and readiness only; it does not print secret values, rejects malformed production database/CORS/API URLs, and requires `NEXT_PUBLIC_API_URL` to be an HTTP(S) URL ending in `/api`. Runtime CORS parsing also ignores wildcard or malformed origin entries. The decision check fails while the deployment decision record still contains `TBD` values and reports only unresolved line numbers/sections. The probe checker expects an HTTP(S) backend base URL without `/api`, fails fast if the URL is malformed or `/api` is included, and verifies expected JSON status values; use `--allow-degraded-ready` only for pre-launch reachability checks.

## Operating Modes

### Batman

Batman mode is approval-gated.

Flow:

1. `POST /api/missions` with `mode: "batman"`.
2. Backend decomposes immediately into approval-queue tasks.
3. Approvers call `POST /api/missions/{mission_id}/tasks/{task_id}/approve`.
4. When a task is approved, `POST /api/missions/{mission_id}/execute` runs approved tasks only.

If a Batman mission declares `approvers`, every listed approver must approve a task before it becomes executable. Unknown approvers receive `403`. If no approvers are listed, the first approver is the single-operator fallback.

### Jarvis

Jarvis mode is command-execute.

Flow:

1. `POST /api/missions` with `mode: "jarvis"`.
2. `POST /api/missions/{mission_id}/run`.

The supervisor decomposes, reviews, executes, and returns results in one request.

### Wakanda

Wakanda mode is selective approval.

Flow:

1. `POST /api/missions` with `mode: "wakanda"`.
2. `POST /api/missions/{mission_id}/run-wakanda`.
3. Pass-through tasks run immediately.
4. Gated tasks wait for `POST /api/missions/{mission_id}/wakanda/tasks/{task_id}/approve`.

Current defaults are conservative: high-risk and unknown-tool tasks gate, rejecting one gated task does not cascade, and Wakanda remains single-operator in this build.

## Guardrails

Before execution, tasks pass:

- Code review
- Memory-scope review
- Security/ABAC review
- Runtime ABAC when `actor_roles` are supplied
- ToolService permission checks

Task result memory writes route through `MemoryIsolationService` for `ExecutorAgent`, `BatmanGraph`, and `ToolWrapper`.

## Important Docs

- [Operator Guide](docs/OPERATOR_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Deployment Decision Record](docs/DEPLOYMENT_DECISION_RECORD.md)
- [Monitoring Runbook](docs/MONITORING_RUNBOOK.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Phase 4 Memory / ABAC Reconciliation](docs/PHASE_4_MEMORY_ABAC_RECONCILIATION.md)
- [Resonance OS Integration Scope](docs/RESONANCE_OS_INTEGRATION_SCOPE.md)
- [Phase 3 Wakanda Spec](docs/SPEC_PHASE3_WAKANDA.md)

## Project Structure

```text
backend/   FastAPI routes, supervisors, agents, services, models
ui/        Next.js cockpit
tests/     Backend unit/integration tests
db/        Database schema and ORM assets
docs/      Specs, phase plans, reconciliation notes, handoffs
```

## Do Not Commit

- `.env*`
- secrets or API keys
- `.next/`
- `node_modules/`
- logs
- caches
- generated churn such as `ui/next-env.d.ts` unless intentionally scoped

## Current Blockers

Production deployment config is blocked until the target decisions in [docs/DEPLOYMENT_DECISION_RECORD.md](docs/DEPLOYMENT_DECISION_RECORD.md) are answered. Resonance OS source integration is blocked until the decision gate in [docs/RESONANCE_OS_INTEGRATION_SCOPE.md](docs/RESONANCE_OS_INTEGRATION_SCOPE.md) is answered.
