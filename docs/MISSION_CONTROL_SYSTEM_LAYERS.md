# Mission Control System Layers

**Status:** Canonical architecture framing  
**Parent doc:** `docs/MISSION_CONTROL_CANONICAL_VISION.md`

## Purpose

This document establishes the system hierarchy explicitly so the current launch,
deployment, and orchestration work is not mistaken for the whole conceptual
system.

## Layer 1 — Mission Control Operator Surface

The topmost layer is the operator shell.

This includes:

- Batman / Jarvis / Wakanda execution modes
- cockpit UI
- operator-visible mission lifecycle
- approval surfaces
- run-state visibility

This is where humans experience the system.

## Layer 2 — Shared Services Backplane

The second layer is the execution substrate shared by all modes.

This includes:

- ToolService
- MemoryService and isolation wiring
- AuditService
- review gates
- ABAC and role enforcement
- cost and guardrail services
- supervisor and route infrastructure

This layer makes the operator surface safe, consistent, and mode-aware.

## Layer 3 — Fractal Memory

The third layer is the canonical memory architecture.

This includes, conceptually:

- long-term memory design
- scoped retrieval
- continuity across sessions and tasks
- durable carry-forward context
- memory governance and isolation

Some implementation pieces already exist in the backplane, but Fractal Memory
is the larger architectural doctrine that those pieces serve.

## Layer 4 — Oracle / Predictability

The fourth layer is the canonical reasoning and forecasting substrate.

This includes, conceptually:

- evidence routing
- probabilistic reasoning
- calibration
- scenario modeling
- trend and regime analysis
- future adaptive judgment behavior

Current Predictability specs and gates are implementation lanes within this
layer, not separate doctrine.

## Layer 5 — Integrations, Deployment, And Launch Surfaces

The fifth layer is where the system connects outward and becomes operational in
real environments.

This includes:

- deployment configuration
- monitoring and readiness
- probe and preflight tooling
- approved external integrations
- future integration bridges such as Resonance

This layer operationalizes the system, but it does not define the system by
itself.

## Relationship Summary

The system should be read from top to bottom like this:

- Mission Control OS is the operator shell
- the backplane makes execution safe and consistent
- Fractal Memory provides the memory substrate
- Oracle/Predictability provides the reasoning substrate
- launch and integrations expose the system to real environments

## Canonical Reminder

The current repo implements the orchestration backbone of Mission Control OS.
It should not be read as reducing the canonical system scope, which also
includes Fractal Memory as the memory architecture and
Oracle/Predictability as the reasoning layer.
