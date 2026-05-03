# Resonance OS Ingestion Service Spec

**Status:** Spec only. No implementation in Mission Control authorized.  
**Scope:** External Resonance-side service definition for Mission Control event ingestion  
**Owner boundary:** Resonance OS repository/service, not Mission Control

---

## 1. Purpose

Define the minimum external service that must exist on the Resonance side before Mission Control can open a narrow event-emission implementation gate.

This document answers:

- what service Resonance must expose
- what the service must verify
- what success/failure behavior it must guarantee
- what Mission Control may safely assume about it

This is the external counterpart to:

- `docs/RESONANCE_OS_INTEGRATION_SCOPE.md`
- `docs/RESONANCE_WAKANDA_EVENT_TAXONOMY_V1.md`

---

## 2. Service Role

The first Resonance-side runtime surface is:

**Resonance Event Ingestion Service v1**

Responsibilities:

- receive Mission Control Wakanda events over HTTP
- authenticate the producer request
- validate the event envelope
- enforce idempotent ingestion on `eventId`
- persist or queue accepted events for downstream Resonance processing
- return stable HTTP status codes that Mission Control can rely on

Non-responsibilities:

- no synchronous profile computation requirement
- no task-routing response
- no operator-facing workflow decisions
- no requirement to push data back into Mission Control in the same cycle

---

## 3. Repository / Deployment Assumption

Working assumption:

- the ingestion service lives in the separate GitHub-backed Resonance OS project
- it may be deployed as a standalone HTTP service or as part of a larger Resonance API surface
- Mission Control treats it as an external dependency

Mission Control must not import its code directly in the first gate.

---

## 4. Required HTTP Surface

### Primary Endpoint

- Method: `POST`
- Path: `/api/v1/events/ingest`
- Content-Type: `application/json`

### Required Service Probes

- `GET /health`
- `GET /ready`
- `GET /status`

These probe paths should exist so the external service has a verification shape parallel to Mission Control’s own deployment and probe conventions.

---

## 5. Request Contract

The request body must accept the shared envelope defined by Mission Control:

```json
{
  "eventId": "uuid-or-stable-unique-id",
  "eventVersion": "1",
  "eventType": "wakanda.release_state_changed",
  "eventTime": "2026-05-03T14:30:00Z",
  "sourceSystem": "mission-control",
  "sourceMode": "wakanda",
  "missionId": "mission_123",
  "taskId": "task_456",
  "subject": {
    "subjectType": "release",
    "subjectId": "release_789"
  },
  "payload": {
    "fromState": "approved",
    "toState": "scheduled",
    "changeReason": "operator_approved_rollout"
  }
}
```

The first accepted `eventType` set should match:

- `docs/RESONANCE_WAKANDA_EVENT_TAXONOMY_V1.md`

---

## 6. Authentication Verification

The service must verify a signed shared-secret header scheme.

### Required Headers

- `X-Resonance-Key-Id`
- `X-Resonance-Timestamp`
- `X-Resonance-Signature`

### Verification Requirements

The service must:

- look up the shared secret associated with `X-Resonance-Key-Id`
- verify that the timestamp is within the allowed skew window
- compute the expected signature over:
  - request timestamp
  - raw request body
- compare the expected and received signatures using a constant-time comparison
- reject requests with missing, malformed, expired, or unverifiable auth data

### Signature Algorithm

Recommended first algorithm:

- `HMAC-SHA256`

The exact canonical string format must be documented in the Resonance repo before Mission Control code is written.

Recommended first canonical payload:

```text
<X-Resonance-Timestamp>\n<raw-request-body>
```

---

## 7. Envelope Validation Rules

The service must reject requests when:

- required envelope fields are missing
- `eventVersion` is unsupported
- `sourceSystem` is not `mission-control`
- `sourceMode` is not supported for the current gate
- `eventType` is outside the approved taxonomy
- `eventTime` is malformed
- `subject.subjectType` or `subject.subjectId` is missing
- `payload` is not an object

The service may additionally validate per-event payload shape if the Resonance repo formalizes schemas for each event type.

---

## 8. Idempotency Rules

The service must treat `eventId` as the idempotency key.

Minimum behavior:

- first accepted receipt of an `eventId` is stored or queued
- repeated delivery of the same valid `eventId` does not create duplicate downstream facts
- repeated delivery returns a stable success-class response

The service may record duplicate delivery attempts for observability, but duplicates must remain semantically safe.

---

## 9. Response Contract

### Success Responses

Preferred first success response:

- `202 Accepted`

Alternative acceptable response:

- `200 OK`

Success response body should include:

```json
{
  "accepted": true,
  "eventId": "uuid-or-stable-unique-id",
  "receiptStatus": "accepted"
}
```

If a duplicate event is safely recognized, the service may return:

```json
{
  "accepted": true,
  "eventId": "uuid-or-stable-unique-id",
  "receiptStatus": "duplicate"
}
```

### Failure Responses

- `400 Bad Request` for malformed envelopes
- `401 Unauthorized` for missing or invalid auth
- `403 Forbidden` if a valid key is not permitted for this ingestion scope
- `409 Conflict` only if the service chooses to expose a non-idempotent duplicate policy, though duplicate-safe success is preferred
- `422 Unprocessable Entity` for schema-valid envelopes that violate accepted taxonomy or version rules
- `429 Too Many Requests` if rate limiting is enforced
- `500` or `503` for service-side failure

Mission Control should treat `5xx` and network failures as retryable, and `4xx` as non-retryable unless future policy says otherwise.

---

## 10. Persistence / Queue Boundary

The service must provide at least one of:

- durable append-only event persistence
- durable queue enqueue with downstream consumer handoff

The key requirement is that a success response means the event has crossed a meaningful durability boundary, not merely reached process memory.

It is acceptable for downstream Resonance profiling to happen later.

---

## 11. Service Verification Details

Before Mission Control implements emission, the Resonance repo/service must document:

1. deployed base URL or local development URL shape
2. probe response contract for `/health`, `/ready`, `/status`
3. exact signature algorithm and canonical string format
4. accepted timestamp skew window
5. exact success response status/body
6. duplicate-event behavior
7. retryability classification for 4xx vs 5xx responses
8. any rate-limit policy

Without these, Mission Control would be forced to guess across a trust boundary.

---

## 12. Minimum Acceptance Criteria

The Resonance-side service definition is complete only when:

- the endpoint path is fixed
- the auth header scheme is fixed
- signature construction is fixed
- envelope acceptance rules are fixed
- duplicate handling is fixed
- success and failure status codes are fixed
- probe contracts are fixed
- verification examples exist

---

## 13. Decision Gate

Mission Control event-emission implementation remains blocked until:

- the Resonance-side service definition in this document is accepted
- the verification spec in `docs/RESONANCE_OS_INGESTION_VERIFICATION_SPEC.md` is accepted
- the external Resonance repo/service implements or credibly stages this surface
- a narrow Mission Control implementation gate is opened for event emission only
