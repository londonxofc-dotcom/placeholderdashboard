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

## Known

- Resonance OS is important enough to be tracked as a future integration.
- Its shape is not defined in this repo.
- It may affect the central data plane: memory, audit, orchestration signals, or decomposer context.
- Incorrect assumptions here have high drift risk because this touches cross-mode memory and Mission Control's source of truth.

## Unknown

Before implementation, answer:

1. What is Resonance OS: separate repo, hosted service, local service, library, or conceptual layer?
2. Where does it live: local machine, another Nick project, cloud endpoint, package, or documents?
3. What surface does it expose: API, events, files, memory store, queue, database, or UI?
4. Integration direction: Mission Control pushes to Resonance OS, pulls from it, or both?
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

- Define an append-only event contract if Resonance OS consumes Mission Control events.
- Keep it best-effort and non-blocking, like `AuditService` persistence.
- Keep Mission Control's current `MemoryIsolationService` as the enforcement boundary unless Nick explicitly decides Resonance OS replaces memory storage.
- Add tests before wiring any runtime call.

## Decision Gate

Implementation remains blocked until the following minimum decision is written down:

- Resonance OS location:
- Integration direction:
- First surface:
- Memory relationship:
- Failure mode if Resonance OS is unavailable:

After those are answered, create a new narrow implementation gate. Do not combine it with Phase 5 polish or unrelated mode work.
