# Resonance OS Integration Scope

## Status

Resonance OS integration is a pending architecture decision, not an implementation-ready feature.

This document captures what is known, what is unknown, and what must be decided before any Mission Control source file imports, calls, names, migrates to, or depends on Resonance OS.

## Evidence

Known references:

- Project memory: `resonance_os_integration_pending.md`
- `current.md` signal: Resonance OS was raised at the end of the 2026-04-24 Phase 3 cockpit session.
- `HANDOFF-2026-04-25.md`: open architecture call — keep memory in `.claude/`, or migrate to Resonance OS as a service.
- `WAKE_UP_REPORT.md`: explicitly says this needs a conversation, not code.
- `RESONANCE_WAKANDA_PROFILING_SPEC.md`: candidate first product surface for label-facing resonance profiling.
- `RESONANCE_WAKANDA_EVENT_TAXONOMY_V1.md`: first approved Wakanda event export set for Resonance.
- `RESONANCE_OS_INGESTION_SERVICE_SPEC.md`: required external Resonance-side service definition.
- `RESONANCE_OS_INGESTION_VERIFICATION_SPEC.md`: required verification boundary for that external service.

## Known

- Resonance OS is important enough to be tracked as a future integration.
- Working assumption: Resonance OS lives outside this repository as a separate GitHub-backed project.
- Working decision: the first Mission Control integration direction is push-only.
- Working decision: the first push contract is HTTP event ingestion v1.
- Working decision: the first auth shape is a signed shared-secret header.
- Working decision: failure posture is bounded retry, then local audit/log only, never mission-blocking.
- Its shape is not defined in this repo.
- It may affect the central data plane: memory, audit, orchestration signals, or decomposer context.
- Incorrect assumptions here have high drift risk because this touches cross-mode memory and Mission Control's source of truth.

## Unknown

Before implementation, answer:

1. What is Resonance OS: hosted service, local service, library, or conceptual layer exposed from a separate GitHub project?
2. Where does it live operationally: another repo only, a deployed service from that repo, a local process from that repo, or some combination?
3. What surface does it expose: API, events, files, memory store, queue, database, or UI?
4. What exact HTTP ingestion shape is used first: endpoint path, signed-header format, payload envelope, and timeout/retry policy?
5. Scope: one Resonance surface per mode, or one cross-mode layer above Batman/Jarvis/Wakanda?
6. Memory relationship: does it replace, augment, or observe `MemoryService` and `AuditService`?

## Candidate Integration Surfaces

These are options only, not decisions:

| Surface | Shape | Risk |
|---|---|---|
| Audit sink | Mission Control emits audit/review/execution events to Resonance OS | Low if append-only and async |
| Memory observer | Resonance OS receives selected memory events but does not replace `MemoryService` | Medium; needs scope filtering |
| Memory backend | Resonance OS becomes storage or retrieval backend | High; touches isolation and ABAC |
| Decomposer context source | Resonance OS provides upstream context before task decomposition | Medium/high; can affect agent behavior |
| Mode orchestrator | Resonance OS participates in Batman/Jarvis/Wakanda routing | High; changes core control plane |

## Non-Goals For This Gate

- No source code integration.
- No imports or module names referencing Resonance OS.
- No migrations.
- No changes to `MemoryService`, `AuditService`, ABAC, or supervisors.
- No moving memory out of `.claude/`.
- No external API calls or credentials.

## Recommended First Implementation Shape

Once the unknowns are answered, start with the lowest-risk adapter boundary:

- Define an append-only event contract for Mission Control to push selected events outward to Resonance OS.
- Keep it best-effort and non-blocking, like `AuditService` persistence.
- Keep Mission Control's current `MemoryIsolationService` as the enforcement boundary unless Nick explicitly decides Resonance OS replaces memory storage.
- Add tests before wiring any runtime call.

If a concrete first product surface is needed, prefer the Wakanda-only advisory profiling shape in `docs/RESONANCE_WAKANDA_PROFILING_SPEC.md` before any cross-mode integration.

### Current Working Direction

The current preferred shape is:

- Resonance OS is external to this repo and maintained as a separate GitHub-backed project.
- Mission Control pushes append-only Wakanda events outward.
- Mission Control uses an HTTP event ingestion contract for the first gate.
- Mission Control does not pull runtime decisions, profiles, or task-routing instructions back from Resonance in the first gate.
- Resonance failure must not block Batman, Jarvis, or Wakanda execution.

## HTTP Event Ingestion v1

The first transport contract should be a narrow asynchronous HTTP ingestion surface owned by Resonance OS.

### Contract Goals

- Keep Mission Control as the producer only.
- Keep Resonance OS as the consumer only.
- Allow append-only event delivery with no synchronous decision dependency.
- Make retries safe through idempotent event identifiers.
- Preserve Mission Control execution even when Resonance is slow or unavailable.

### Endpoint Shape

- Method: `POST`
- Path: `/api/v1/events/ingest`
- Content type: `application/json`
- Producer: Mission Control
- Consumer: Resonance OS

Mission Control should treat any future batch endpoint, pull endpoint, or profile lookup endpoint as out of scope for v1 unless separately approved.

### Payload Envelope

The first payload shape should be a single event envelope:

```json
{
  "eventId": "uuid-or-stable-unique-id",
  "eventVersion": "1",
  "eventType": "wakanda.release_reviewed",
  "eventTime": "2026-05-02T14:30:00Z",
  "sourceSystem": "mission-control",
  "sourceMode": "wakanda",
  "missionId": "mission_123",
  "taskId": "task_456",
  "subject": {
    "subjectType": "release",
    "subjectId": "release_789"
  },
  "payload": {
    "status": "approved",
    "operatorId": "ats_operator",
    "signals": ["metadata_ready", "campaign_active"]
  }
}
```

### Required Envelope Fields

| Field | Purpose |
|---|---|
| `eventId` | Idempotency key so retries do not create duplicate downstream facts |
| `eventVersion` | Contract version for future schema evolution |
| `eventType` | Stable event taxonomy name |
| `eventTime` | Event creation time in UTC |
| `sourceSystem` | Should be `mission-control` for v1 |
| `sourceMode` | `wakanda` for the first gate |
| `missionId` | Mission correlation identifier |
| `taskId` | Optional task correlation identifier when the event is task-scoped |
| `subject` | Business entity the event describes |
| `payload` | Event-specific data body |

### Delivery Policy

- Mission Control sends events asynchronously after local execution/audit success.
- Resonance ingestion success is indicated by an HTTP `2xx` response.
- Mission Control must not wait for derived profile computation.
- Mission Control may log or audit failed delivery attempts, but it must not fail the mission because Resonance is unavailable.
- Retries must reuse the same `eventId`.

### Timeout And Retry Defaults

- Short request timeout
- Bounded retry count
- Exponential backoff
- Safe drop-to-audit posture after retry exhaustion

Exact numeric thresholds remain an implementation-time config decision, but the behavioral rule is fixed: best-effort, non-blocking, idempotent retry.

### Authentication Boundary

The contract assumes authenticated service-to-service delivery.

The preferred first mechanism is:

- signed shared-secret header

Recommended header shape:

- `X-Resonance-Key-Id`: identifies which shared secret is in use
- `X-Resonance-Timestamp`: UTC request timestamp
- `X-Resonance-Signature`: signature over timestamp + body

Why this is preferred for v1:

- simpler than mTLS
- avoids coupling to OAuth/provider setup
- supports service-to-service verification
- keeps the first gate narrow and reversible

Deferred alternatives:

- bearer token
- mTLS

Mission Control should not embed a more complex provider-specific auth choice into source until the Resonance-side service definition requires it.

### Failure Policy v1

The first failure policy is:

- delivery is best-effort
- delivery is asynchronous relative to operator workflow
- Mission Control retries within bounded limits
- retries reuse the same `eventId`
- after retry exhaustion, Mission Control records local audit/log evidence of delivery failure
- Mission Control does not fail the mission, block approval flow, or roll back completed task execution because Resonance ingestion failed
- operator-facing workflow remains unchanged unless a future spec explicitly introduces observability UI for export failures

This means Resonance is additive in v1, not load-bearing.

### Explicit v1 Non-Goals

- No response-driven branching in Mission Control
- No pull-back profile fetch in the same request cycle
- No batch ingestion requirement
- No guarantee that every internal event type is exported
- No cross-mode export obligation beyond Wakanda in the first gate
- No replacement of `MemoryService` or `AuditService`
- No operator-blocking error state when export delivery fails

### First Export Surface

The approved first export surface is defined in:

`docs/RESONANCE_WAKANDA_EVENT_TAXONOMY_V1.md`

The practical first slice is:

- Wakanda task transition events
- Wakanda release state events
- Wakanda campaign state events
- Wakanda readiness/outreach events

This is intentionally narrower than full mode telemetry.

## Decision Gate

Implementation remains blocked until the following minimum decision is written down:

- Resonance OS location:
- Integration direction: push-only
- Push contract: HTTP event ingestion v1
- First surface: Wakanda event taxonomy v1
- Memory relationship:
- Auth mechanism: signed shared-secret header
- Failure mode if Resonance OS is unavailable: bounded retry, then local audit/log only, never mission-blocking

After those are answered, create a new narrow implementation gate. Do not combine it with Phase 5 polish or unrelated mode work.

Mission Control event emission remains blocked until the external service and verification specs are satisfied:

- `docs/RESONANCE_OS_INGESTION_SERVICE_SPEC.md`
- `docs/RESONANCE_OS_INGESTION_VERIFICATION_SPEC.md`
