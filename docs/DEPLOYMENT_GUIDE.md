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
curl http://localhost:8000/ready
```

`/health` is a lightweight liveness probe. `/ready` checks deployment readiness
and returns dependency status for the API router and database without exposing
connection strings, secrets, or raw exception text.

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
| `ALLOWED_ORIGINS` | Production yes | Comma-separated CORS allow-list |

Frontend:

| Name | Required | Notes |
|---|---:|---|
| `NEXT_PUBLIC_API_URL` | Production yes | Defaults to `http://localhost:8000/api` |

## Verification Before Any Deployment

Run:

```bash
.venv/bin/python -m pytest tests/ -v
npm --prefix ui run typecheck
npm --prefix ui run build
npm --prefix ui test
```

If UI build touches `ui/next-env.d.ts`, restore it unless that generated file is intentionally in scope.

For backend deployment probes, also verify:

```bash
.venv/bin/python -m pytest tests/unit/test_backend_health.py -v
```

## Production Deployment Decision Points

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
- No real external music/label integrations until a workflow-specific gate is approved.

## Non-Goals

- Do not commit `.env`.
- Do not commit generated build output.
- Do not deploy with placeholder API keys.
- Do not expose a public cockpit without an explicit access-control decision.
- Do not wire Resonance OS as part of deployment.

## Current Blockers

Production deployment is not blocked by code, but it is blocked by deployment target decisions and secret management choices.
