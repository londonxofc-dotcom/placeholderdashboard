# Resonance Profiling Spec

**Status:** Spec only. No implementation authorized.  
**For:** Wakanda / ATS / All the Smoke label workflows  
**Relationship to Resonance OS:** Candidate first product surface, still blocked behind the Resonance OS integration decision gate

---

## 1. Canon Boundary

- Spec only.
- No source code integration.
- No runtime imports or services.
- No new API routes.
- No database schema changes.
- No changes to `MemoryService`, `AuditService`, supervisors, or ABAC.
- No current.md edits.
- No external audio ingestion, DSP pipeline, or third-party integrations.
- No autonomous label action.

---

## 2. Purpose

Define the first meaningful label-facing system that "Resonance OS" could power inside Mission Control without forcing premature architectural choices.

Working assumption: Resonance OS is maintained outside Mission Control as a separate GitHub-backed project. Mission Control should therefore treat resonance profiling as an integration surface, not as a local subsystem embedded directly into this repository.

This spec translates the loose idea of:

- cymatics
- frequency profiling
- resonance scoring
- label intelligence

into an operational Wakanda concept that can later be implemented safely.

The goal is **not** literal mystical language or vague aesthetic scoring. The goal is a structured internal model that helps ATS answer:

1. What is the current signal profile of an artist, track, or campaign?
2. Which signals are strengthening, fading, or conflicting?
3. Which roster items share a compatible release, audience, or campaign pattern?
4. Which moves are high-resonance, low-resonance, or unstable before the label takes action?

---

## 3. Proposed Product Shape

The first Resonance-facing feature should be:

**Wakanda Resonance Profiling**

An advisory profiling layer that computes a structured "resonance profile" for:

- artist
- track
- release
- campaign
- audience segment

This is **not** a publishing engine and **not** a public-facing score. It is an internal decision-support surface for label operators.

---

## 4. What "Frequency Profiling" Means Here

In this repo, "frequency" should be interpreted as **pattern frequency and signal recurrence**, not as an audio FFT or raw acoustics feature set.

The system should reason over repeated label-relevant signals such as:

- release cadence
- listener response tempo
- demo conversion rate
- outreach reply rate
- repost / share / save velocity
- campaign fatigue
- cross-artist overlap
- metadata consistency
- audience-region recurrence
- event-to-response lag

The system may eventually ingest literal audio features, but that is **not required for the first gate** and must not be assumed.

So the operational translation is:

**Frequency profiling = time-based signal recurrence + alignment + stability scoring for label workflows.**

---

## 5. Core Object

The conceptual object is a:

`ResonanceProfile`

It should describe the current signal field around an entity.

Conceptual fields:

| Field | Meaning |
|---|---|
| `subjectType` | `artist`, `track`, `release`, `campaign`, or `audience_segment` |
| `subjectId` | Stable identifier for the subject |
| `profileWindow` | Time window used for the profile |
| `signalFamilies` | Categories of signals used in the profile |
| `alignmentScore` | How strongly the current signals reinforce each other |
| `stabilityScore` | How stable vs. noisy the signal field is |
| `noveltyScore` | How new/unusual the current pattern is relative to baseline |
| `fatigueScore` | Whether audience/campaign signals show diminishing response |
| `conflictScore` | Whether important signals point in opposing directions |
| `resonanceTier` | `strong`, `developing`, `mixed`, `weak`, `unstable` |
| `advisoryFlags` | Warnings such as `low_sample`, `cross-artist_conflict`, `campaign_fatigue` |
| `evidenceRefs` | What observations produced the profile |

---

## 6. Signal Families

The first safe version should group signals into families rather than pretending to have a single magic score.

Recommended families:

1. **Audience Response**
   - saves
   - reposts
   - listens
   - clickthrough
   - email opens / replies

2. **Release Rhythm**
   - time since last drop
   - cadence consistency
   - pre/post-release response curve

3. **Campaign Performance**
   - creative reuse fatigue
   - ad or post response decay
   - platform-specific traction

4. **Roster / Network Overlap**
   - featured-artist adjacency
   - audience overlap
   - collaborator recurrence
   - cross-artist cannibalization risk

5. **Operational Readiness**
   - metadata completeness
   - asset readiness
   - contact readiness
   - approval state

6. **Narrative / Context Alignment**
   - whether release timing aligns with current audience and campaign momentum
   - whether narrative signals conflict with current rollout state

---

## 7. Advisory Outputs

The first implementation should emit advisory outputs, not commands.

Examples:

- "Strong resonance for release follow-up within 7 days."
- "Audience response is high but campaign fatigue is rising."
- "Track-level signal is strong, but roster overlap risk is elevated."
- "Demo interest is recurring but unstable; do not over-scale confidence."
- "Artist profile is mixed: strong saves, weak conversion, delayed outreach response."

The system should support operator judgment, not replace it.

---

## 8. Relationship to Existing Predictability Work

This spec should reuse the conceptual machinery already being designed elsewhere in the repo.

Closest existing components:

- behavioral repetition
- trend baseline comparison
- cycle phase modeling
- regime transitions
- calibration ledger

That means the likely long-term shape is:

- Predictability modules compute pattern and uncertainty primitives
- Wakanda Resonance Profiling composes those primitives into label-facing advisory profiles
- Resonance OS may eventually become the persistence/orchestration layer for those profiles

This avoids inventing a second unrelated forecasting system.

---

## 9. Safest First Integration Shape

If/when the Resonance OS gate is opened, the safest first product shape is:

**append-only resonance event observer**

Meaning:

- Mission Control emits selected Wakanda events
- Mission Control pushes those events outward only; the first gate does not depend on pull-back profile retrieval
- Mission Control uses the `HTTP event ingestion v1` push contract defined in `docs/RESONANCE_OS_INTEGRATION_SCOPE.md`
- a profiling layer derives advisory resonance profiles from those events
- no supervisor behavior changes
- no approval bypass
- no memory replacement

This is lower risk than making Resonance OS a hard dependency of:

- mission execution
- memory retrieval
- approval routing
- decomposer context

---

## 10. Explicit Non-Goals

This spec does **not** assume:

- literal cymatics visualizations
- waveform analysis
- stem separation
- BPM/key extraction
- sentiment-as-truth
- algorithmic artist ranking
- auto-release decisions
- public scoring of artists

Those may become separate future specs, but they are not implied here.

---

## 11. Minimum Decisions Needed Before Implementation

Before any code is written, answer:

1. Is Resonance Profiling a Mission Control feature, a Resonance OS feature, or both?
2. Does the first version operate on label workflow events only, or also on audio-derived features?
3. Is the first surface:
   - operator dashboard panel
   - advisory report
   - mission-side recommendation object
   - background memory/audit observer
4. Does it observe Wakanda only at first, or all modes?
5. If Resonance OS is unavailable, does Wakanda continue with no resonance profile, or must profiling degrade locally?

---

## 12. Recommended Default Decisions

If we want the narrowest low-risk starting point, the defaults should be:

- **First product surface:** Wakanda-only advisory profile
- **Input type:** label workflow events and campaign signals, not audio DSP
- **Integration direction:** Mission Control pushes append-only events outward over HTTP event ingestion v1, with no first-gate pull dependency
- **Failure mode:** best-effort; Wakanda continues if Resonance is unavailable
- **Memory relationship:** observe, do not replace `MemoryService` or `AuditService`

These defaults align with the existing Resonance integration scope doc and keep the first implementation reversible.

---

## 13. Decision Gate

Implementation remains blocked until:

- the Resonance OS integration gate is answered
- the five minimum decisions above are written down
- a narrow implementation gate is created for Wakanda Resonance Profiling specifically

Do not combine this with general Phase 5 deployment work or unrelated Predictability gates.
