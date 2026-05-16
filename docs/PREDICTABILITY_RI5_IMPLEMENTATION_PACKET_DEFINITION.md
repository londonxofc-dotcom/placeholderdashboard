# Predictability RI-5 Implementation Packet Definition

## 1. Purpose

Define the exact future RI-5 implementation packet before any RI-5 source or test edits begin.

This document converts the committed RI-5 runtime pipeline wiring scope into a bounded implementation definition. It answers the required open questions for RI-5, names the allowed owner file, defines missing-input behavior, lists tests and verification commands, and preserves the RI-4 lock.

This document does not authorize implementation, source edits, test edits, commits, pushes, tags, UI/API work, database/storage work, live Evidence Router wiring, or audit persistence.

## 2. Current Baseline

- Repo: `/Users/Malachi/Missipn Control Builder Agent`
- Branch: `night-build/2026-04-25`
- Local HEAD: `b6dda7972e4d3c965ab6195bb7c53593be323b03`
- Local/upstream status: aligned
- Tracked diff before this document: clean
- Staged files before this document: none
- RI-4 status: complete and locked
- RI-4 lock tag: `oracle-predictability-ri4-runtime-pipeline-fixtures-locked`
- RI-5 scope proposal: committed and pushed
- RI-5 implementation: not started

## 3. Recent HEAD/Recent Commit Check

Recent commits inspected before writing this definition:

- `b6dda79` - `docs(predictability): tighten ri5 wiring scope guardrails`
- `0d07212` - `docs(predictability): define ri5 runtime pipeline wiring scope`
- `130420c` - `docs(predictability): capture ri4 runtime pipeline fixtures handoff`
- `eccb8e1` - `test(predictability): add ri4 runtime pipeline fixtures`
- `fdf3028` - `docs(predictability): capture ri3 runtime pipeline handoff`
- `c48496b` - `feat(predictability): add ri3 runtime pipeline function`
- `caa765c` - `docs(predictability): define ri3 runtime pipeline function spec`
- `42617a2` - `docs(predictability): capture ri2 runtime pipeline types handoff`

Observed repo status before writing:

- tracked diff: clean
- staged files: none
- known local-only untracked files remained present

## 4. RI-5 Open Questions

RI-5 had six blocking questions. This packet definition answers them as follows:

1. Exact invocation-boundary owner file:
   - `ui/lib/oracle/predictability/runtime-pipeline-invocation.ts`
2. Exact allowed files/touchpoints:
   - create `ui/lib/oracle/predictability/runtime-pipeline-invocation.ts`
   - create `ui/lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts`
   - read/import from the locked runtime pipeline and type contracts only as needed
3. Exact forbidden files:
   - listed in section 7
4. Missing-input behavior:
   - stop before calling `runPredictabilityRuntimePipeline`
   - return a typed `bridge_failed` result with `forecast: null` and `auditEntry: null`
5. Tests to add/run:
   - add a new RI-5 invocation-boundary test file
   - rerun RI-3/RI-4 runtime pipeline tests
6. Verification commands:
   - listed in sections 10 and 11

## 5. Exact Invocation-Boundary Owner File

The RI-5 invocation boundary owner file is:

```text
ui/lib/oracle/predictability/runtime-pipeline-invocation.ts
```

This file is the only approved implementation owner for RI-5 runtime pipeline wiring.

Its job is narrow:

```text
caller-provided candidate input
  -> validate that all RuntimePipelineInput fields are present and non-empty
  -> if invalid, return bridge_failed before runtime pipeline invocation
  -> if valid, call runPredictabilityRuntimePipeline(input)
  -> return RuntimePipelineResult unchanged
```

The file must not create defaults, infer fields, fetch live data, persist audit entries, expose UI/API routes, or call the Predictability kernel directly.

## 6. Exact Allowed Files/Touchpoints

Future RI-5 implementation may modify or create only these files:

- `ui/lib/oracle/predictability/runtime-pipeline-invocation.ts`
- `ui/lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts`

Future RI-5 implementation may import or read from these locked touchpoints, but must not edit them:

- `ui/lib/oracle/predictability/runtime-pipeline.ts`
- `ui/lib/oracle/predictability/runtime-pipeline-types.ts`
- `ui/lib/oracle/predictability/__tests__/runtime-pipeline.test.ts`
- `ui/lib/oracle/predictability/__tests__/runtime-pipeline-fixtures.test.ts`

Allowed implementation actions:

- create a thin invocation wrapper around `runPredictabilityRuntimePipeline`
- accept caller-provided candidate input
- validate required RI-2 `RuntimePipelineInput` fields before pipeline invocation
- return a `RuntimePipelineResult`
- add RI-5-specific unit tests for the invocation boundary
- prove that valid input calls the locked RI-3 function
- prove that missing or empty required input does not call the locked RI-3 function

No allowed touchpoint authorizes edits to the locked RI-2, RI-3, or RI-4 files.

## 7. Exact Forbidden Files

Future RI-5 implementation must not edit:

- `current.md`
- `oracle-memory/sources`
- `AGENTS.md`
- `CLAUDE.md`
- `ui/lib/oracle/predictability/runtime-pipeline.ts`
- `ui/lib/oracle/predictability/runtime-pipeline-types.ts`
- `ui/lib/oracle/predictability/__tests__/runtime-pipeline.test.ts`
- `ui/lib/oracle/predictability/__tests__/runtime-pipeline-fixtures.test.ts`
- `ui/lib/oracle/predictability/model-stage-orchestration-bridge.ts`
- `ui/lib/oracle/predictability/predictability-kernel.ts`
- `ui/lib/oracle/predictability/forecast-audit.ts`
- `ui/lib/oracle/predictability/forecast-audit-types.ts`
- any UI component
- any page or route file
- any public API route
- any backend API file
- any auth file
- any database or storage file
- any cron, scheduler, queue, or background-job file
- any Resonance OS file
- any Obsidian vault file
- any private memory file

Future RI-5 implementation must not commit:

- `.mission_architect_daily.err.log`
- `.mission_architect_daily.log`
- `.mission_architect_daily.out.log`
- `.oracle-ui-typecheck-backlog.log`
- `docs/CHATGPT_CODEX_HANDOFF_LOOP.md`

## 8. Missing-Input Behavior

RI-5 selects this missing-input policy:

```text
Stop before calling runPredictabilityRuntimePipeline.
Return RuntimePipelineResult with status: bridge_failed.
Return forecast: null.
Return auditEntry: null.
Include a bridgeError naming the missing or invalid required fields.
```

The invocation boundary must not rely on the RI-3 function to discover missing input when the boundary can detect it first.

Required fields:

- `objective`
- `targetDate`
- `domain`
- `horizon`
- `trendWindows`
- `behavioralPatterns`
- `cycleWindows`

Invalid input includes:

- missing required scalar field
- empty required scalar field
- missing required array field
- empty required array field
- non-array value for required array field

The boundary must not default `targetDate`, `domain`, `horizon`, or any array field.

## 9. Required Tests To Add

Future RI-5 implementation must add:

```text
ui/lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts
```

Required test coverage:

- valid complete candidate input calls the invocation boundary and returns `success`
- valid complete candidate input calls `runPredictabilityRuntimePipeline`
- missing `objective` returns `bridge_failed`
- missing `targetDate` returns `bridge_failed`
- missing `domain` returns `bridge_failed`
- missing `horizon` returns `bridge_failed`
- missing `trendWindows` returns `bridge_failed`
- missing `behavioralPatterns` returns `bridge_failed`
- missing `cycleWindows` returns `bridge_failed`
- empty `objective` returns `bridge_failed`
- empty `targetDate` returns `bridge_failed`
- empty `domain` returns `bridge_failed`
- empty `trendWindows` returns `bridge_failed`
- empty `behavioralPatterns` returns `bridge_failed`
- empty `cycleWindows` returns `bridge_failed`
- missing-input failures do not call `runPredictabilityRuntimePipeline`
- missing-input failures return `forecast: null`
- missing-input failures return `auditEntry: null`
- the invocation boundary does not introduce queued, deferred, partial, background, or persistence statuses
- the invocation boundary does not call the Predictability kernel directly

## 10. Existing Tests To Rerun

Future RI-5 implementation must rerun:

```bash
npm --prefix ui test -- lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts
npm --prefix ui test -- lib/oracle/predictability/__tests__/runtime-pipeline.test.ts lib/oracle/predictability/__tests__/runtime-pipeline-fixtures.test.ts lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts
```

The existing RI-3 and RI-4 tests are part of the regression boundary. They must not be skipped after RI-5 wiring.

## 11. Typecheck/Build Requirements

Future RI-5 implementation must run:

```bash
npm --prefix ui run typecheck -- --pretty false
npm --prefix ui run build
```

If build regenerates `ui/next-env.d.ts`, that generated churn must be reported and restored before any commit unless a separate packet explicitly authorizes committing it.

Before commit, verify:

```bash
git status --short
git diff --stat
git diff -- ui/next-env.d.ts
```

## 12. Runtime Wiring Boundary

RI-5 runtime wiring is limited to a local invocation boundary around the locked RI-3 pure function.

Approved wiring shape:

```text
runtime-pipeline-invocation.ts
  -> validates candidate input
  -> calls runPredictabilityRuntimePipeline only when input is complete
  -> returns RuntimePipelineResult unchanged
```

RI-5 must not expose the runtime pipeline to app users, public routes, UI buttons, background processes, queued jobs, or autonomous forecasts.

## 13. Evidence Router Boundary

RI-5 must not wire live Evidence Router output.

The invocation boundary may accept caller-provided candidate input shaped like `RuntimePipelineInput`, but it must not fetch, transform, subscribe to, or consume live Evidence Router output unless a separate future packet explicitly authorizes that boundary.

No live Evidence Router route, adapter, stream, watcher, or runtime feed is part of RI-5.

## 14. Audit Boundary

RI-5 must preserve the existing audit boundary:

- `runPredictabilityRuntimePipeline` may return an audit entry on success.
- The returned audit entry must preserve `persistenceState: persisted_by_future_gate`.
- RI-5 must not persist the audit entry.
- RI-5 must not write audit records to database or storage.
- RI-5 must not rewrite audit lineage.
- RI-5 must not convert deferred persistence into real persistence.

Audit persistence remains owned by a future gate.

## 15. Protected Boundary Review

Future RI-5 implementation must preserve:

- no `current.md` edits or reads
- no `oracle-memory/sources` edits or reads
- no Resonance OS access
- no Obsidian vault access
- no private memory access
- no UI/API/auth/database/storage changes
- no cron/background job wiring
- no live Evidence Router wiring
- no autonomous forecasts
- no commits, pushes, or tags without separate authorization

## 16. Failure Modes

RI-5 must fail closed for:

- candidate input is not an object
- required scalar field is missing
- required scalar field is empty
- required array field is missing
- required array field is not an array
- required array field is empty
- runtime pipeline returns `bridge_failed`
- runtime pipeline returns `audit_creation_failed`
- runtime pipeline returns `audit_validation_failed`
- runtime pipeline returns `safety_flag_failed`

Every failure mode must return or preserve:

- `forecast: null`
- `auditEntry: null`

No failure mode may surface partial forecast output.

## 17. Acceptance Criteria

RI-5 implementation is acceptable only when:

- only the two allowed RI-5 files are created or modified
- `runtime-pipeline.ts` remains unchanged
- `runtime-pipeline-types.ts` remains unchanged
- RI-3 and RI-4 tests remain unchanged
- missing-input behavior stops before calling the runtime pipeline
- missing-input behavior returns `bridge_failed`
- valid complete input calls `runPredictabilityRuntimePipeline`
- no kernel direct call is introduced
- no live Evidence Router wiring is introduced
- no UI/API/auth/database/storage files are touched
- targeted RI-5 tests pass
- combined RI-3/RI-4/RI-5 runtime tests pass
- typecheck passes
- build passes or reports only restorable generated Next.js metadata churn
- tracked diff contains only the authorized RI-5 files before commit

## 18. Freeze Line

RI-5 implementation is not authorized by this document.

The next implementation packet may use this document as a definition, but it must still be explicitly authorized with `AUTHORIZE ORACLE IMPLEMENTATION TASK`.

No source files, tests, UI/API surfaces, database/storage surfaces, live Evidence Router wiring, audit persistence, commits, pushes, or tags are authorized by this document.

## 19. Future Implementation Packet Draft

```text
AUTHORIZE ORACLE IMPLEMENTATION TASK

Repo:
/Users/Malachi/Missipn Control Builder Agent

Objective:
Implement RI-5 runtime pipeline invocation boundary only.

Scope:
Create a thin local invocation boundary around the locked RI-3 runtime pipeline function. No live Evidence Router wiring. No UI/API/database/storage/auth/background job work.

Allowed files to create/edit:
- ui/lib/oracle/predictability/runtime-pipeline-invocation.ts
- ui/lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts

Allowed imports/touchpoints, read/import only unless listed above:
- ui/lib/oracle/predictability/runtime-pipeline.ts
- ui/lib/oracle/predictability/runtime-pipeline-types.ts

Forbidden files:
- current.md
- oracle-memory/sources
- AGENTS.md
- CLAUDE.md
- ui/lib/oracle/predictability/runtime-pipeline.ts
- ui/lib/oracle/predictability/runtime-pipeline-types.ts
- ui/lib/oracle/predictability/__tests__/runtime-pipeline.test.ts
- ui/lib/oracle/predictability/__tests__/runtime-pipeline-fixtures.test.ts
- UI/API/auth/database/storage files
- cron/background job files
- Resonance OS
- Obsidian vault
- private memory files

Missing-input behavior:
- Stop before calling runPredictabilityRuntimePipeline.
- Return status: bridge_failed.
- Return forecast: null.
- Return auditEntry: null.
- Include bridgeError naming missing or invalid required fields.
- Do not default, infer, or generate missing input.

Tests to add:
- ui/lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts

Tests to run:
1. npm --prefix ui test -- lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts
2. npm --prefix ui test -- lib/oracle/predictability/__tests__/runtime-pipeline.test.ts lib/oracle/predictability/__tests__/runtime-pipeline-fixtures.test.ts lib/oracle/predictability/__tests__/runtime-pipeline-invocation.test.ts
3. npm --prefix ui run typecheck -- --pretty false
4. npm --prefix ui run build

After implementation:
1. git status --short
2. git diff --stat
3. git diff -- ui/next-env.d.ts
4. report files changed, tests run, build result, and whether tracked diff is limited to the two allowed RI-5 files

Hard constraints:
- Do not edit source files other than the allowed invocation-boundary file.
- Do not edit existing tests.
- Do not wire live Evidence Router.
- Do not add UI/API/auth/database/storage.
- Do not add cron/background jobs.
- Do not persist audit entries.
- Do not touch current.md.
- Do not touch oracle-memory/sources.
- Do not touch Resonance OS.
- Do not touch Obsidian vault.
- Do not commit.
- Do not push.
- Do not tag.

Stop after reporting. Do not commit.
```

## 20. Next Safe Action

Review this packet definition.

If accepted, commit and push this document with a separate docs-only authorization.

Only after this document is accepted should a separate `AUTHORIZE ORACLE IMPLEMENTATION TASK` packet be sent for RI-5 implementation.
