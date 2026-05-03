# Wakanda Resonance Event Taxonomy v1

**Status:** Spec only. No implementation authorized.  
**Scope:** First event export set for Mission Control -> Resonance OS over HTTP event ingestion v1  
**Mode scope:** Wakanda only

---

## 1. Purpose

Define the first approved Wakanda event types that Mission Control may push to Resonance OS.

This document answers the practical question left open by the transport contract:

"What events do we actually send first?"

The goal is to start with a small set of label-meaningful events that are:

- high signal
- low ambiguity
- already legible in Wakanda workflows
- safe to emit without changing runtime behavior

---

## 2. v1 Taxonomy Principles

The first event set should be:

- append-only
- advisory-facing
- Wakanda-only
- business-readable
- sparse rather than exhaustive

v1 should prefer events that mark meaningful state transitions over noisy internal chatter.

That means:

- emit operator decisions
- emit task completion milestones
- emit release/campaign state changes
- avoid every intermediate UI interaction
- avoid internal-only review noise unless it materially changes label posture

---

## 3. Shared Envelope Expectations

All events in this taxonomy use the shared HTTP event ingestion v1 envelope defined in:

`docs/RESONANCE_OS_INTEGRATION_SCOPE.md`

Required common fields:

- `eventId`
- `eventVersion`
- `eventType`
- `eventTime`
- `sourceSystem`
- `sourceMode`
- `missionId`
- `subject`
- `payload`

Optional when applicable:

- `taskId`
- `operatorId`
- `correlationId`

---

## 4. First Approved Event Types

The first v1 export set should be limited to these event types:

1. `wakanda.task_review_requested`
2. `wakanda.task_approved`
3. `wakanda.task_rejected`
4. `wakanda.task_executed`
5. `wakanda.release_state_changed`
6. `wakanda.campaign_state_changed`
7. `wakanda.asset_readiness_changed`
8. `wakanda.contact_outreach_recorded`

These eight are enough to begin resonance profiling without implying a full analytics platform.

---

## 5. Event Definitions

### `wakanda.task_review_requested`

Use when a Wakanda task is classified as gated and queued for operator review.

**Subject**
- `task`

**Payload fields**
- `taskType`
- `reviewReason`
- `approvalPolicy`
- `priority`
- `labels`

**Why it matters**
- marks operator attention demand
- helps Resonance observe where label friction or caution clusters appear

### `wakanda.task_approved`

Use when an operator approves a previously gated Wakanda task.

**Subject**
- `task`

**Payload fields**
- `taskType`
- `operatorId`
- `approvalReason` (optional)
- `approvalPolicy`
- `subjectType`
- `subjectId`

**Why it matters**
- captures positive operator commitment
- helps profile which task classes convert from review to action

### `wakanda.task_rejected`

Use when an operator rejects a previously gated Wakanda task.

**Subject**
- `task`

**Payload fields**
- `taskType`
- `operatorId`
- `rejectionReason` (optional)
- `approvalPolicy`
- `subjectType`
- `subjectId`

**Why it matters**
- captures friction, veto, and policy conflict
- helps profile what repeatedly stalls or misaligns

### `wakanda.task_executed`

Use when a Wakanda task completes execution successfully.

**Subject**
- `task`

**Payload fields**
- `taskType`
- `executionDisposition`
- `toolName` (optional)
- `subjectType`
- `subjectId`
- `outcomeSummary`

**Why it matters**
- creates a reliable action-completion anchor
- allows Resonance to correlate approved intent with actual operational follow-through

### `wakanda.release_state_changed`

Use when a release moves between meaningful rollout states.

**Subject**
- `release`

**Payload fields**
- `releaseId`
- `fromState`
- `toState`
- `changeReason`
- `effectiveDate` (optional)
- `campaignId` (optional)

**Example states**
- `draft`
- `ready_for_review`
- `approved`
- `scheduled`
- `released`
- `paused`

**Why it matters**
- central event for cadence and rollout rhythm
- ideal anchor for release-level resonance profiling

### `wakanda.campaign_state_changed`

Use when a campaign changes posture in a way that affects audience motion or operator strategy.

**Subject**
- `campaign`

**Payload fields**
- `campaignId`
- `fromState`
- `toState`
- `channel`
- `changeReason`

**Example states**
- `draft`
- `active`
- `boosted`
- `fatigued`
- `paused`
- `completed`

**Why it matters**
- captures campaign momentum shifts
- gives Resonance a clean input for fatigue and stability scoring

### `wakanda.asset_readiness_changed`

Use when a key label asset changes readiness state.

**Subject**
- `asset`

**Payload fields**
- `assetType`
- `assetId`
- `subjectType`
- `subjectId`
- `fromState`
- `toState`
- `blockingIssues` (optional array)

**Example asset types**
- `cover_art`
- `metadata`
- `press_copy`
- `social_creative`
- `delivery_package`

**Why it matters**
- contributes to operational readiness scoring
- helps distinguish market weakness from simple execution unreadiness

### `wakanda.contact_outreach_recorded`

Use when a materially relevant label outreach action is recorded.

**Subject**
- `contact`

**Payload fields**
- `contactId`
- `contactType`
- `outreachChannel`
- `direction`
- `subjectType`
- `subjectId`
- `responseDisposition` (optional)

**Why it matters**
- contributes to response-lag and conversion pattern modeling
- gives Resonance a first-pass signal for network responsiveness

---

## 6. Events Explicitly Out Of Scope For v1

Do not export these in the first gate:

- every UI click
- draft text edits
- temporary panel state
- polling refreshes
- internal reviewer normalization details
- low-level tool-call debug traces
- full memory writes
- Batman or Jarvis events

The point of v1 is to emit meaningful label transitions, not recreate the entire internal event bus.

---

## 7. Subject-Type Defaults

Recommended `subject.subjectType` values for v1:

- `task`
- `release`
- `campaign`
- `asset`
- `contact`
- `artist`

Use `artist` only when the event truly applies at artist scope and not more specifically to a release, campaign, or task.

---

## 8. Taxonomy Naming Rules

Use the following naming rules for any later additions:

- prefix with `wakanda.`
- use past-tense or state-change semantics
- prefer business language over implementation language
- avoid generic names like `updated` unless the state transition is otherwise described

Good examples:

- `wakanda.release_state_changed`
- `wakanda.task_approved`
- `wakanda.asset_readiness_changed`

Avoid:

- `wakanda.row_saved`
- `wakanda.panel_clicked`
- `wakanda.tool_wrapper_finished`

---

## 9. Recommended First Surface

The first export surface should be:

**Wakanda task + release + campaign transition events**

That is narrower than "all Wakanda events" and is sufficient to support:

- release rhythm profiling
- campaign fatigue profiling
- operator approval/resistance patterns
- operational readiness scoring

without overcommitting to a broad telemetry program.

---

## 10. Failure Posture

If Resonance OS is unavailable:

- Mission Control still records the local mission/audit truth
- Wakanda continues execution
- event delivery may retry within bounded limits
- failed delivery may be logged for later inspection
- no operator workflow is blocked waiting on Resonance

This keeps Resonance additive rather than load-bearing in the first gate.

## 10.5 Authentication Posture

For v1, taxonomy events should be delivered using the signed shared-secret header scheme defined in:

`docs/RESONANCE_OS_INTEGRATION_SCOPE.md`

The taxonomy itself does not add per-event auth variance. All event types in this document share the same transport auth boundary.

---

## 11. Decision Gate

Implementation remains blocked until:

- the HTTP transport contract is accepted
- this v1 taxonomy is accepted
- the exact auth mechanism is chosen
- the Resonance-side ingestion service exists
- a narrow implementation gate is opened for event emission only
