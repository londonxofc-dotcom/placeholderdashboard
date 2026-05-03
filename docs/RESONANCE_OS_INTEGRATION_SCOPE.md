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

## Known

- Resonance OS is important enough to be tracked as a future integration.
- Working assumption: Resonance OS lives outside this repository as a separate GitHub-backed project.
- Working decision: the first Mission Control integration direction is push-only.
- Its shape is not defined in this repo.
- It may affect the central data plane: memory, audit, orchestration signals, or decomposer context.
- Incorrect assumptions here have high drift risk because this touches cross-mode memory and Mission Control's source of truth.

## Unknown

Before implementation, answer:

1. What is Resonance OS: hosted service, local service, library, or conceptual layer exposed from a separate GitHub project?
2. Where does it live operationally: another repo only, a deployed service from that repo, a local process from that repo, or some combination?
3. What surface does it expose: API, events, files, memory store, queue, database, or UI?
4. What exact push contract is used first: HTTP API, queue/event bus, append-only file export, or another async event transport?
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
- Mission Control does not pull runtime decisions, profiles, or task-routing instructions back from Resonance in the first gate.
- Resonance failure must not block Batman, Jarvis, or Wakanda execution.

## Decision Gate

Implementation remains blocked until the following minimum decision is written down:

- Resonance OS location:
- Integration direction: push-only
- First surface:
- Memory relationship:
- Failure mode if Resonance OS is unavailable:

After those are answered, create a new narrow implementation gate. Do not combine it with Phase 5 polish or unrelated mode work.
