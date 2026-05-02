# Gate E Evidence Router Bridge Handoff

## Canon State

| Field | Value |
|---|---|
| Branch | `night-build/2026-04-25` |
| Implementation commit | `8cdca70` |
| Previous HEAD | `eb3e40d` |
| Gate | E — Evidence Router Consumption Bridge |
| Classification | pure functions only, fixture-first |
| Status | implemented and committed locally |
| Push | not pushed |
| Tag | not tagged |

## Files Implemented

- `ui/lib/oracle/predictability/evidence-router-bridge-types.ts`
- `ui/lib/oracle/predictability/evidence-router-bridge.ts`
- `ui/lib/oracle/predictability/__tests__/evidence-router-bridge.test.ts`

## What Gate E Implements

- **`EvidenceRouterOutput`** — standalone type contract defining the expected shape of Evidence Router output at the adapter boundary. No import from the live Evidence Router.
- **`validateRouterOutput(input: unknown)`** — validates an unknown input against the `EvidenceRouterOutput` contract. Returns typed errors without throwing. Accepts null, undefined, and non-object inputs gracefully.
- **`mapRouterOutputToAdapterPacket(routerOutput: EvidenceRouterOutput)`** — pure morphism from router-shaped fixture data into `AdapterPromptContextPacket`. Maps source tiers (canonical→T1, verified→T2, scaffold→T3, unverified→T4, untrusted→T5), confidence labels (high→0.85, medium→0.6, low→0.35, uncertain→0.15), and status routing (active/warning→allowedEvidence, blocked/quarantined→blockedEvidence).
- **`validateAndMapRouterOutput(input: unknown)`** — composes validation then mapping. Returns discriminated union: `{ success: true, packet }` or `{ success: false, errors }`.

### Semantic Details

- Non-bypass boundary: blocked/quarantined evidence is routed to `blockedEvidence`, never to `allowedEvidence`
- Warning preservation: router warnings mapped to `AdapterWarning[]` with severity `'warn'`
- Provenance preservation: first provenance ref mapped to primary `AdapterProvenanceRef`; additional refs noted in `notes` field
- Canon boundary preservation: `canonBoundaries` array passed through to adapter packet
- Output contract safety defaults: all five flags hardcoded `true` — `requireProvenanceTrail`, `requireFailureModes`, `requireAssumptions`, `forbidCertaintyLanguage`, `forbidAutonomousAction`
- Domain default: unknown domain strings default to `ADAPTER_DOMAINS.GLOBAL`
- Risk flags: surfaced in evidence item `notes` field when present

## What Gate E Explicitly Does Not Implement

- No live Evidence Router import
- No live Evidence Router wiring
- No Predictability Kernel runtime call
- No M-A through M-I orchestration
- No calibration ledger writes
- No persistence / database / schema / storage
- No UI / API / auth
- No live prediction claims
- No autonomous forecasting or action
- No Gate F

## Verification

| Check | Result |
|---|---|
| Targeted Gate E tests | 47/47 passed |
| Full suite | 862/862 passed across 36 files |
| Build | clean |
| `ui/next-env.d.ts` | restored |
| Protected files | untouched |
| Drift verdict | NO DRIFT |

## Safety Boundaries Confirmed

- `current.md` — untouched
- `~/.claude/oracle-memory/sources/` — untouched
- `shell-promoter` — remains `KEEP_DEFERRED`
- `evidence-router-adapter-types.ts` — untouched
- `adapter-validation.ts` — untouched
- `adapter-integration.ts` — untouched
- `predictability-kernel.ts` — untouched
- M-A through M-I sealed files — untouched
- No forbidden imports in any Gate E file
- No I/O
- No mutation
- No side effects

## Next Safe Actions

1. Optional post-handoff drift audit
2. Tag implementation commit `8cdca70` only: `oracle-predictability-gate-e-evidence-router-bridge-locked`
3. Push branch and tag only after explicit authorization
4. Gate F remains locked — requires separate spec/design authorization
