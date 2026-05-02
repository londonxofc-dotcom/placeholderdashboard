# Mission Control Monitoring Runbook

This runbook is host-neutral. Use it after the backend is reachable locally or
on a production host, and before enabling real missions.

## Probe Surfaces

| Probe | Expected | Purpose | Operator action |
|---|---|---|---|
| `/health` | `200` with `status: ok` | Confirms the FastAPI process is alive | Restart or inspect host logs if unavailable |
| `/status` | `200` with `status: ok` | Gives monitors a non-secret runtime snapshot | Use for dashboard heartbeat and phase visibility |
| `/ready` | `200` with `status: ready` | Confirms dependencies required for real missions | Keep real missions disabled until ready |
| `/ready` | `503` with `status: degraded` | Host is reachable but a dependency is missing | Check the named dependency status only; do not print secrets |

The `/ready` response must never expose database URLs, API key values, raw
exceptions, or connection strings. It should name only the failing dependency
class, such as `database` or `anthropic_api_key`.

The `/status` response should include the canonical probe paths for `/health`,
`/status`, and `/ready` so monitors can discover the expected surfaces without
hard-coding a stale contract.

## Pre-Launch Checklist

Run these before pointing an uptime monitor at the backend:

```bash
.venv/bin/python tools/deployment_preflight.py --include-decision-check
.venv/bin/python tools/deployment_env_check.py --production
.venv/bin/python tools/deployment_decision_check.py
.venv/bin/python tools/deployment_probe_check.py --base-url <backend-base-url>
```

The probe checker expects the backend base URL without `/api`.
Before secrets and database decisions are complete, add
`--allow-degraded-ready` to confirm host reachability without treating an
expected `/ready` degradation as launch-ready.

Before enabling real missions, confirm:

- `/health` returns `ok`.
- `/status` returns `ok` and reports the expected phase.
- `/ready` returns `ready`.
- `ALLOWED_ORIGINS` contains only exact cockpit origins.
- `ANTHROPIC_API_KEY` is configured through the deployment host or secret
  manager, never committed.
- The first production access model is recorded in
  `docs/DEPLOYMENT_DECISION_RECORD.md`.

## Suggested Monitor Configuration

Use three independent checks:

| Monitor | Path | Success condition | Alert severity |
|---|---|---|---|
| Backend liveness | `/health` | HTTP 2xx | High |
| Runtime status | `/status` | HTTP 2xx and JSON `status: ok` | Medium |
| Mission readiness | `/ready` | HTTP 2xx and JSON `status: ready` | High when real missions are enabled; medium before launch |

Recommended cadence:

- `/health`: every 1 minute.
- `/status`: every 5 minutes.
- `/ready`: every 1 minute during launch, then every 5 minutes after stable.

## Alert Triage

### `/health` fails

Treat this as process or routing failure.

1. Check host process status and recent deploy logs.
2. Confirm the backend port and host routing still point to FastAPI.
3. Roll back the deploy if the failure began after a release.

### `/status` fails but `/health` passes

Treat this as runtime surface drift.

1. Check whether a route registration or middleware change broke `/status`.
2. Run `tools/deployment_probe_check.py` against the same base URL.
3. Do not enable real missions until `/status` is restored.

### `/ready` is degraded

Treat this as dependency or credential readiness failure.

1. Read the named dependency statuses.
2. Check database reachability and migration state if `database` is degraded.
3. Check secret presence, not secret value, if `anthropic_api_key` is missing.
4. Keep real missions disabled until the response returns `ready`.

## Launch Guardrails

- Do not use placeholder environment values.
- Do not expose the cockpit publicly until the access-control decision is
  recorded.
- Do not add real external music, label, or publishing integrations as part of
  deployment monitoring.
- Do not wire Resonance OS as part of launch monitoring.
- Do not commit screenshots, logs, `.env` files, build output, or generated
  churn.

## Post-Deploy Smoke

After a deploy or host restart:

```bash
.venv/bin/python tools/deployment_probe_check.py --base-url <backend-base-url>
```

Then open the cockpit and perform a no-side-effect mission flow only if the
environment is configured for mock or non-billable execution. Do not run real
Claude-backed missions until the mission budget cap and access model are
recorded.
