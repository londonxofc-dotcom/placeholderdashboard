# Resonance OS Ingestion Verification Spec

**Status:** Spec only. No implementation in Mission Control authorized.  
**Scope:** Verification contract for the external Resonance ingestion service

---

## 1. Purpose

Define how the external Resonance-side ingestion service must be verified before Mission Control can emit live events to it.

This is not a Mission Control runtime test plan yet.

It is the acceptance boundary for the external service itself.

---

## 2. Verification Goals

Verification must prove that the service:

- is reachable
- exposes the required probe endpoints
- enforces the signed-header auth contract
- accepts valid Wakanda taxonomy events
- rejects invalid or unauthorized events
- handles duplicate `eventId` delivery safely
- returns stable response semantics that Mission Control can classify

---

## 3. Required Probe Verification

The service must document and pass verification for:

- `GET /health`
- `GET /ready`
- `GET /status`

Expected behavior:

- `/health` proves the HTTP process is alive
- `/ready` proves the service can accept ingestion work
- `/status` exposes a machine-readable service status payload

Minimum expectation:

- HTTP `200` on healthy/ready service
- JSON response body

Recommended `/status` fields:

- `status`
- `service`
- `version`
- `acceptedEventVersions`
- `acceptedSourceModes`

---

## 4. Required Ingestion Verification Cases

The external service must define and pass verification for at least these cases.

### V1. Valid signed request accepted

- valid headers
- valid timestamp
- valid signature
- valid Wakanda event envelope

Expected:

- `202` or `200`
- JSON response with `accepted: true`

### V2. Missing auth header rejected

Expected:

- `401`

### V3. Invalid signature rejected

Expected:

- `401`

### V4. Expired or skewed timestamp rejected

Expected:

- `401` or `403`, but fixed and documented

### V5. Unknown key id rejected

Expected:

- `401` or `403`, but fixed and documented

### V6. Invalid envelope rejected

Examples:

- missing `eventId`
- missing `subject.subjectId`
- unsupported `eventVersion`
- non-object `payload`

Expected:

- `400` or `422`, but fixed and documented by error class

### V7. Unsupported event type rejected

Expected:

- `422`

### V8. Duplicate event handled safely

- same `eventId`
- same signed body

Expected:

- success-class response with stable duplicate-safe semantics
- no duplicate downstream write semantics

### V9. Service unavailable classified as retryable

Expected:

- `5xx`, timeout, or connection failure is classed as retryable by policy

---

## 5. Verification Fixture Shape

The service should publish at least one canonical fixture for:

- valid headers
- valid event body
- computed signature example
- expected success response

Recommended fixture contents:

- sample secret id
- sample timestamp
- sample raw JSON body
- sample canonical string
- sample signature
- sample response body

This prevents Mission Control from reverse-engineering auth details from prose alone.

---

## 6. Manual Verification Procedure

At minimum, the Resonance repo/service should be verifiable through a repeatable manual flow:

1. confirm `/health`, `/ready`, and `/status`
2. submit a valid signed taxonomy event
3. confirm success response
4. re-submit the same event to verify duplicate safety
5. submit a bad signature request
6. submit an invalid envelope
7. confirm documented status-code behavior matches reality

---

## 7. Automation Recommendation

The Resonance repo should also include an automated verification suite that covers:

- probe checks
- auth checks
- envelope validation
- duplicate handling
- response contract stability

Recommended shapes:

- API integration tests
- fixture-based signature verification tests
- contract tests around event taxonomy acceptance

---

## 8. Mission Control Readiness Rule

Mission Control may open an event-emission implementation gate only when:

- the Resonance ingestion verification document exists
- the Resonance service has a passing verification story for the required cases
- the exact response contract is stable enough to encode retry rules without guesswork

---

## 9. Non-Goals

- no requirement for live profile generation
- no requirement for pull APIs
- no requirement for cross-mode event support beyond Wakanda
- no requirement for public internet exposure if local/dev verification is still the current stage

---

## 10. Decision Gate

The external verification boundary is considered complete only when:

- the service definition exists
- the verification cases above are documented
- example fixtures exist
- probe semantics are fixed
- auth semantics are fixed
- retry classification is fixed
