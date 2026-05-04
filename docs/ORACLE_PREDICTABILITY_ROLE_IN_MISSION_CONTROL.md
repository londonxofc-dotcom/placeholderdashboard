# Oracle Predictability Role In Mission Control

**Status:** Canonical pillar doc  
**Parent doc:** `docs/MISSION_CONTROL_CANONICAL_VISION.md`

## Purpose

This document restores Oracle / Predictability as the canonical reasoning and
forecasting layer of Mission Control OS.

It exists because current repo work can be misread as mostly orchestration and
operational hardening unless the deeper reasoning layer is named explicitly.

## Canonical Role

Oracle / Predictability is the reasoning substrate of Mission Control OS.

Its intended role includes:

- evidence routing
- probabilistic reasoning
- calibration and forecast audit
- scenario and regime analysis
- trend and cycle interpretation
- deeper judgment support for future operator decisions

## Relationship To Mission Control Decisions

Mission Control runs workflows. Oracle/Predictability strengthens how those
workflows are interpreted, evaluated, and forecast.

That means the reasoning layer is meant to inform:

- what confidence to assign to claims or plans
- how uncertainty should be surfaced
- which scenarios are more or less plausible
- how evidence should be weighted and reconciled

It is not just an isolated modeling exercise.

## Relationship To Fractal Memory

Fractal Memory and Oracle/Predictability are complementary canonical pillars.

- Fractal Memory provides durable context and scoped retrieval
- Oracle/Predictability provides deeper reasoning over evidence, state, and
  uncertainty

Memory without reasoning becomes inert storage.
Reasoning without memory becomes shallow and discontinuous.

Mission Control OS is meant to hold both.

## Current Implementation Lanes

The repo already contains substantial Predictability work:

- specs
- stage contracts
- adapter and validation work
- calibration and forecast-oriented artifacts

These should be read as opened implementation lanes of the larger Oracle
doctrine, not as separate side projects.

## Canonical Role vs Current Scope

The canonical role of Oracle/Predictability is larger than any single gate or
stage currently open in the repo.

So two things can be true at once:

- current implementation scope is bounded and staged
- the larger reasoning layer is still canonical system doctrine

## Canonical Reminder

The current repo implements the orchestration backbone of Mission Control OS.
It should not be read as reducing the canonical system scope, which also
includes Fractal Memory as the memory architecture and
Oracle/Predictability as the reasoning layer.
