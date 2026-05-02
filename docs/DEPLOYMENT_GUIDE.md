# Mission Control Deployment Guide

## Status

This repo does not currently include production deployment config.

Supported today:

- Local backend via `uvicorn`
- Local cockpit via `npm --prefix ui run dev`
- Backend tests, UI typecheck/build/tests

Not yet committed:

- Dockerfile
- `docker-compose.yml`
- Vercel config
- Railway/Render/Fly config
- Production database migration workflow
- Secret manager wiring

## Local Runbook

Install backend dependencies:

```bash
python3 -m pip install -e '.[dev]'
```

Install UI dependencies:

```bash
npm --prefix ui install
```

Create local env:

```bash
cp .env.example .env
```

Required for real Claude-backed decomposition:

```text
ANTHROPIC_API_KEY=...
```

Start backend:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Check backend liveness and readiness:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/status
curl http://localhost:8000/ready
```

`/health` is a lightweight liveness probe. `/status` is a non-secret runtime
snapshot for monitors and dashboards, including uptime and the `/health`,
`/status`, and `/ready` probe locations.
`/ready` checks deployment readiness
and returns dependency status for the API router, database, and required
Claude credential presence without exposing connection strings, secret values,
or raw exception text. Placeholder secret values such as `your-api-key-here`
are treated as missing.

Start UI:

```bash
npm --prefix ui run dev
```

## Environment Variables

Backend:

| Name | Required | Notes |
|---|---:|---|
| `HOST` | No | Defaults to `0.0.0.0` for local run commands |
| `PORT` | No | Defaults to `8000` |
| `ENV` | No | `dev` enables uvicorn reload in direct main execution |
| `DATABASE_URL` | Yes for DB-backed runtime | Defaults to local Postgres URL in code |
| `SQL_ECHO` | No | SQL logging toggle |
| `ANTHROPIC_API_KEY` | Yes for real missions | Needed by Claude-backed decomposition/review paths |
| `ALLOWED_ORIGINS` | Production yes | Comma-separated CORS allow-list; whitespace is trimmed and empty entries are ignored |

Frontend:

| Name | Required | Notes |
|---|---:|---|
| `NEXT_PUBLIC_API_URL` | Production yes | Defaults to `http://localhost:8000/api` |

## Verification Before Any Deployment

Run the combined local preflight:

```bash
.venv/bin/python tools/deployment_preflight.py
```

For launch-gate verification, include the deployment decision record check:

```bash
.venv/bin/python tools/deployment_preflight.py --include-decision-check
```

This variant is expected to fail until `docs/DEPLOYMENT_DECISION_RECORD.md`
has real target, secrets, access, and budget decisions.

Or run the checks directly:

```bash
.venv/bin/python -m pytest tests/ -v
npm --prefix ui run typecheck
npm --prefix ui run build
npm --prefix ui test
```

If UI build touches `ui/next-env.d.ts`, restore it unless that generated file is intentionally in scope.

`tools/deployment_preflight.py` fails if `ui/next-env.d.ts` changes during the UI build, so generated churn is caught before commit.

The preflight also checks protected tracked files before and after verification. If `current.md` or `ui/next-env.d.ts` is already dirty, or becomes dirty during verification, the run fails until that churn is restored or intentionally scoped.

For backend deployment probes, also verify:

```bash
.venv/bin/python -m pytest tests/unit/test_backend_health.py -v
```

Check deployment environment readiness without printing secret values:

```bash
.venv/bin/python tools/deployment_env_check.py --production
```

This check reports only variable names and readiness status. It treats empty
values and obvious placeholders like `your-api-key-here` as missing, and
rejects wildcard `ALLOWED_ORIGINS` in production mode.

At runtime, wildcard CORS entries are ignored. If no exact origins remain, the
backend falls back to local cockpit development origin `http://localhost:3000`.

Check that production target decisions have been filled in:

```bash
.venv/bin/python tools/deployment_decision_check.py
```

This check fails while `docs/DEPLOYMENT_DECISION_RECORD.md` still contains
`TBD` values. Keep it failing until the deployment host, database, secrets,
CORS, access model, and budget decisions are real.

After a backend is running locally or on a host, check the public probes:

```bash
.venv/bin/python tools/deployment_probe_check.py --base-url http://localhost:8000
```

Use the deployed backend base URL for production. The base URL should not
include `/api`; the checker calls `/health`, `/status`, and `/ready`, and
fails fast if `/api` is included in the base URL path. It also verifies the
expected JSON status values: `/health` and `/status` must report `ok`, and
`/ready` must report `ready`. The printed verdict uses the same policy as the
exit code.

Before all production dependencies are configured, use pre-launch reachability
mode to allow `/ready` to report `degraded` while still requiring `/health` and
`/status` to pass:

```bash
.venv/bin/python tools/deployment_probe_check.py --base-url <backend-base-url> --allow-degraded-ready
```

For monitor setup, alert triage, and post-deploy smoke expectations, use
`docs/MONITORING_RUNBOOK.md`.

## Production Deployment Decision Points

Record these decisions in `docs/DEPLOYMENT_DECISION_RECORD.md` before adding
host-specific deployment config.

Before writing deployment config, decide:

1. Backend host: Railway, Render, Fly, VPS, or other.
2. Frontend host: Vercel, Netlify, same backend host, or other.
3. Database: managed Postgres provider and migration process.
4. Secret storage: host-level environment variables or external secret manager.
5. CORS: exact cockpit origins.
6. Public access model: local-only, authenticated private app, or public URL.
7. Real mission budget: Anthropic spend cap and operational cost limit.

## Recommended First Production Shape

Conservative first pass:

- Backend on a managed Python host with Postgres.
- Frontend on Vercel or Netlify with `NEXT_PUBLIC_API_URL` pointing to backend `/api`.
- Secrets only in host environment settings.
- CORS locked to the deployed cockpit URL.
- Backend host readiness probe pointed at `/ready`; liveness probe pointed at `/health`.
- Dashboards can poll `/status` for version, phase, environment, uptime, and probe paths.
- `/ready` must return `status: ready` before real missions are enabled; `status: degraded`
  means the host is reachable but a dependency or required credential is missing.
- Monitoring should track `/health`, `/status`, and `/ready` independently so
  process failure, runtime drift, and dependency readiness failures are triaged
  separately.
- No real external music/label integrations until a workflow-specific gate is approved.

## Non-Goals

- Do not commit `.env`.
- Do not commit generated build output.
- Do not deploy with placeholder API keys.
- Do not expose a public cockpit without an explicit access-control decision.
- Do not wire Resonance OS as part of deployment.

## Current Blockers

Production deployment is not blocked by code, but it is blocked by deployment target decisions and secret management choices.
