# review-gate: vercel-labs/emulate PR 210, Google Calendar discovery document

**Verdict: FINDINGS** (2 actionable, 2 informational)

| | |
|---|---|
| repo | vercel-labs/emulate |
| PR | [#210](https://github.com/vercel-labs/emulate/pull/210) |
| base | `d0219d05818adca4c12bb76ec79a7562c1766a3d` |
| exact head | `9800e0104de0922cf80205fc35f5e9e46ef2e459` (`9800e01`) |
| frozen checkout | `/Users/raillyhugo/Programming/vercel/emulate-210-review` (detached, disposable) |
| reviewer | Claude Opus 5, xhigh |
| author | ctate, single commit, no human reviews |
| date | 2026-08-26 |

Artifacts: [`2026-08-26-vercel-labs-emulate-9800e01.json`](2026-08-26-vercel-labs-emulate-9800e01.json), [`evidence/2026-08-26-emulate-210-9800e01-substrate.txt`](evidence/2026-08-26-emulate-210-9800e01-substrate.txt)

## What the PR does

Adds `packages/@emulators/google/src/calendar-discovery.ts`, a 337-line zero-import builder returning a Google API Discovery v1 document, plus an unauthenticated `GET /discovery/v1/apis/calendar/v3/rest` route. Nine files changed: the builder, the calendar route, the google test file, five user-facing surfaces, and the CLI registry string. The PR body promises the document advertises the running emulator's base URL "without advertising unsupported Calendar operations".

## Findings

### F1. `batchPath` is advertised and unrouted (actionable, confirmed at the wire)

The document ships `batchPath: "batch/calendar/v3"` at `calendar-discovery.ts:19`. Nothing serves it.

```
POST http://localhost:45102/batch/calendar/v3   Authorization: Bearer local-test-token
-> 404 {"message":"Not Found","documentation_url":"https://emulate.dev/google"}
```

That 404 is core's catch-all (`core/src/server.ts:94-102`). It reproduces under an adapter mount too: `POST /emulate/google/batch/calendar/v3` returns the same 404. The string occurs exactly once in the repository, with no consumer and no route; `git grep` finds no `/batch` registration anywhere in `packages`. The new test file asserts `batchPath` zero times.

This is the exact thing the PR body says it avoids, and the standard is the author's own: the same PR deliberately omits `showDeleted` because the emulator does not implement it. `batchPath` is the one field in the document that got the opposite treatment.

### F2. The empty root `parameters` block breaks the python workflow the new docs teach (actionable, confirmed from library source)

Upstream Calendar v3 carries seven standard query parameters in the root `parameters` block: `alt`, `fields`, `key`, `oauth_token`, `prettyPrint`, `quotaUser`, `userIp`. The emulated document ships `parameters: {}` (`calendar-discovery.ts:20`).

`google-api-python-client` derives each method's accepted keyword arguments from exactly that block plus `STACK_QUERY_PARAMETERS` (`discovery.py:130`, `813`, `837-845`), then raises at `discovery.py:1104-1106` for anything else, before issuing any request:

```python
service.events().list(calendarId="primary", fields="items(id)")
# TypeError: Got an unexpected keyword argument fields
```

Against Google that call works. Against the emulator it never reaches the network, so no emulator log shows it. Every one of the five changed surfaces instructs the reader to build precisely this client.

Aggravating factor: `google.test.ts:993` asserts `expect(document.parameters).toEqual({})`, which pins the omission as correct. A fix turns the new suite red.

**Verification gap:** `python3` was unavailable here, so the `TypeError` is confirmed from library source, not from an executed call. The document-level differential against the live upstream document is executed and confirmed.

### F3. `singleEvents` and the `orderBy` enum are advertised but inert (informational)

On a live listener, `singleEvents=true` and `singleEvents=false` returned byte-identical bodies. `orderBy=updated` returned 200 although the advertised enum is `["startTime"]`. `orderBy=startTime` without `singleEvents=true` returned 200 where upstream returns 400. The emulator has no recurrence model at all: zero hits for `recurrence`, `recurringEventId`, `RRULE`, or `originalStartTime` in the whole google package.

Weaker version of F1: the document overstates fidelity, but a client passing the parameter gets a plausible answer rather than a 404. Worth a decision, not necessarily a change.

### F4. The new suite cannot fail for the reasons this document can be wrong (informational)

18 tests, 201 assertions, all green at the frozen head, and self-referential. Expected values are the same literals the builder hardcodes, so no assertion has an oracle independent of the implementation. `batchPath`, the one field introduced at the document root, is asserted zero times. No assertion connects a document-advertised path to a reachable route. Line 993 pins the F2 defect as correct.

The genuine exception is line 1140, a closed-graph check that collects every `$ref` and subtracts the declared schema keys. That one carries a real invariant.

Both actionable findings required an external document to surface, which is the practical measure of the gap.

## What holds

- **The mount-path claim is true.** Booted at `http://localhost:45103/emulate/google/`, the document advertised `rootUrl http://localhost:45103/emulate/google/` and `basePath /emulate/google/calendar/v3/`, with no double slash. `calendar-discovery.ts:2` strips the trailing slash. The pre-existing OIDC consumer in the same plugin, fed the identical base URL, emits five double-slash endpoints (`routes/oauth.ts:98-103`); the new code is the one that gets this right. Logged as issue candidate IC1, outside this diff.
- **The `$ref` graph is closed** and the discovery endpoint is correctly unauthenticated while Calendar resources still 401 without a bearer token.
- **`new URL(baseUrl)` throwing on a non-absolute base URL is not a finding against this PR.** Pre-existing repo-wide precondition: `vercel/src/routes/blob.ts:169` and `deployments.ts:47` already assume it, the CLI documents `--base-url <url>`, and adapters always synthesize an absolute origin (`adapter-next/src/index.ts:191-197, 248`).
- **The docs example's port 4002** is consistent with the CLI default and the registered route.

## Receipts

```
$ git -C .../emulate-210-review rev-parse HEAD
9800e0104de0922cf80205fc35f5e9e46ef2e459

$ bun test .../packages/@emulators/google/src/__tests__/google.test.ts
 18 pass
 0 fail
 201 expect() calls
Ran 18 tests across 1 file. [84.00ms]

$ grep -c '  it(' .../google.test.ts   -> 18   (of 1414 lines: the whole file ran)
$ grep -c 'batchPath' .../google.test.ts -> 0

$ git -C .../emulate-210-review diff --check d0219d0 9800e01   (exit 0)
$ git -C .../emulate-210-review status --porcelain             (empty)
```

Two dogfood boots reproduced `packages/emulate/src/api.ts:44-84` verbatim over a real TCP listener, including the explicit `plugin.seed(store, baseUrl)` call that `createServer` does not perform (`core/src/server.ts:92`). Full transcripts in the evidence file.

## Exemptions

| Gate hit | Why exempt |
|---|---|
| `style`, em dash in the added `packages/@emulators/google/README.md` line | House style. The same file already carries 48 em dashes; sibling service READMEs carry 65 (github), 58 (slack), 48 (okta). The `' -- '` half of the check passed. |
| `surfaces`, `packages/emulate/src/index.ts` changed without `skills/emulate/SKILL.md` or `apps/web/app/docs/page.mdx` | Neither file mirrors the CLI help epilogue for any pre-existing block: zero hits for "GitHub API coverage", "Webhook signatures", or "Framework adapters". Per-service endpoint semantics live on the service surfaces, all five of which this PR updated. |

## Gaps

1. `pnpm` and `bash` were unavailable, so the repository CI commands (build, sync-versions, format, type-check, lint, full vitest) were not run, and `gate.sh` could not be executed. `gate.sh` was read in full (738 lines) and every triggered check was reproduced by hand with `git`.
2. The PR suite ran under `bun:test` through a `vitest` forwarding module that re-exports the four bindings the file imports. No assertion behavior was redefined; the file uses no `vi.*` API.
3. `python3` was unavailable, so F2's client-layer `TypeError` is source-confirmed, not executed.
4. No source-level mutation red/green pass was performed. Assertion absence was established statically (`grep -c 'batchPath'` returns 0) and its consequence observed at the wire, so no mutation of that field could turn the suite red.
5. Reachability of IC1's double-slash OIDC endpoints was not demonstrated; only their emission is confirmed. The 404s seen for those paths in the driver are a harness artifact.
6. No radius dogfood map was produced for this run.
7. `validate-run-report.mjs` certifies PASS reports only: it requires `run.verdict == "pass"` and an empty `run.gaps`. Run against a findings report it exits 1 by design. Structural field validation was exercised; the pass assertions were not satisfiable and were not meant to be.

## Harness gate miss

`cases/vercel-labs-emulate/conventions.md` carries surface rules for stripe, github, the emulate index and commands, adapter-next, and adapter-nuxt, but none for `packages/@emulators/google/src/**`. The `surfaces` gate is therefore blind to the package this PR changes. The author updated all five analogous surfaces anyway. Logged as IC2.

## No-mutation receipt

No source edited. Nothing committed, pushed, commented, reviewed, resolved, merged, or deployed. PR state untouched. `git status --porcelain` in the frozen worktree is empty. Three forwarding modules were placed under `emulate-210-review/node_modules/` (gitignored, not source) so the frozen checkout could run without a package install; the core shim points at the frozen checkout's own `core/src`, not the sibling checkout's `dist`, which is stale by one commit (`7aea54a`).
