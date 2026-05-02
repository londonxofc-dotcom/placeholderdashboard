# Mission Control Deployment Decision Record

Use this record before adding host-specific deployment config. Leave unknown
items as `TBD`; do not fill placeholders with secrets.

## Status

- Decision state: TBD
- Decision owner: TBD
- Target deploy date: TBD
- Last reviewed: TBD

## Hosting

| Decision | Selection | Notes |
|---|---|---|
| Backend host | TBD | Railway, Render, Fly, VPS, or other |
| Frontend host | TBD | Vercel, Netlify, same backend host, or other |
| Database provider | TBD | Managed Postgres provider and backup policy |
| Migration workflow | TBD | Manual, CI, host release phase, or other |
| Secret storage | TBD | Host env vars or external secret manager |

## Runtime URLs

| Surface | URL |
|---|---|
| Backend base URL | TBD |
| Backend API URL | TBD |
| Frontend cockpit URL | TBD |
| Liveness probe | `/health` |
| Status probe | `/status` |
| Readiness probe | `/ready` |

## Required Environment

| Variable | Production value source | Ready |
|---|---|---|
| `DATABASE_URL` | TBD | no |
| `ANTHROPIC_API_KEY` | TBD | no |
| `ALLOWED_ORIGINS` | TBD | no |
| `NEXT_PUBLIC_API_URL` | TBD | no |

## Access And Safety

| Decision | Selection | Notes |
|---|---|---|
| Public access model | TBD | local-only, private authenticated app, or public URL |
| Mission budget cap | TBD | Anthropic spend cap and operational limit |
| Allowed CORS origins | TBD | Exact cockpit origins only |
| Real external integrations | none | Keep disabled until workflow-specific gate |

## Pre-Deployment Verification

Run before writing host config:

```bash
.venv/bin/python tools/deployment_preflight.py
.venv/bin/python tools/deployment_env_check.py --production
```

Run after backend is reachable:

```bash
.venv/bin/python tools/deployment_probe_check.py --base-url <backend-base-url>
```

## Open Questions

1. Which backend host should run FastAPI and `/ready`?
2. Which frontend host should serve the cockpit?
3. Which managed Postgres provider should own production data?
4. Where should production secrets live?
5. What exact cockpit origins should be allowed by CORS?
6. Should the first deployed cockpit be local-only, private authenticated, or public?
7. What initial Anthropic spend cap should govern real missions?

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| TBD | TBD | TBD |
