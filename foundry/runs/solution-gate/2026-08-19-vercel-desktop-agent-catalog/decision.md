# Vercel Desktop dynamic coding-agent catalog

Date: 2026-08-19
Mode: greenfield
Proposers: Claude Fable 5 Thinking High and Cursor Grok 4.6 High
Synthesizer: Codex GPT-5

## Contract

Property: Desktop owns a closed compile-time catalog of coding-agent identities even though the installed Vercel CLI is the authority that decides which coding agents its setup command can configure.

Observable: changing the installed CLI's advertised supported-agent set changes Desktop's setup-eligible rows and exact `--agent=` arguments without a Desktop release.

Must not change:

- Existing Claude Code, Codex, OpenCode, and Pi writes remain delegated to `vercel ai-gateway coding-agents setup`.
- The managed key and `--reconfigure` behavior remain.
- Existing local status, backup, removal, and review behavior remains available for known adapters.
- Old CLIs and capability-query failure leave Desktop usable and do not invent targets.
- Human help prose is never parsed as a compatibility contract.

Evidence read before proposal:

- `src/agents.zig:8-17` owns the current enum and labels.
- `src/app.zig:37-38` derives fixed array sizes from that enum.
- `src/app.zig:4064-4098` maps fixed identities to `--agent=` arguments.
- `src/app.zig:6163-6165` fixes four UI commands.

## Proposal A, Fable 5, verbatim

### Shape

The CLI owns the catalog and publishes it through the existing setup dry-run JSON envelope. Add a stable `agent_id` to every `changes` and `skipped` row and guarantee that their union enumerates every configurable agent. Desktop demotes `ConfigKind` to local inspection semantics and stores the live setup catalog in a bounded runtime array. Known ids retain full review and drift behavior; unknown ids can be configured through the CLI with generic status. A valid envelope without ids or a failed query falls back to the four known ids.

### Predictions

1. A fake dry-run envelope that adds Cursor and removes Pi makes Desktop render Cursor, omit Pi, and spawn `--agent=cursor` without a Desktop source change.
2. Real CLI 58.4.4, whose envelope lacks ids, takes the compatibility fallback and produces byte-identical setup argv.
3. Garbage output and nonzero exit preserve the four-agent fallback and never add a non-fallback target.

### Cost

One extra CLI spawn, runtime catalog state, broad replacement of enum-sized UI/setup arrays, and a CLI contract change. Unknown agents have less inspection depth.

### What it makes worse

Two-tier UX for known and unknown adapters; dry-run could later validate keys or use network; completeness of `changes ∪ skipped` must be guaranteed; catalog freshness adds invalidation state.

### Rejected alternatives

Help parsing, lockstep Desktop releases, a web API catalog, reading installed package internals, and a dedicated list command. Fable preferred extending an envelope Desktop already parses.

## Proposal B, Grok 4.6, verbatim

### Shape

The CLI owns setup eligibility and exposes a documented, versioned machine-readable command: `vercel ai-gateway coding-agents list --format json`. Its envelope contains `status: "ok"` and rows with required stable `id` and display `name`; unknown fields are ignored. Desktop queries once per CLI version, stores a bounded runtime catalog, renders setup-eligible rows from it, and builds `--agent=` only from those ids. Query failure uses a four-id compatibility snapshot. Successful empty output means zero capabilities. `ConfigKind` remains the closed catalog of local adapters for status, drift, review, backup, and removal. Shell remains outside the CLI coding-agent catalog.

### Predictions

1. A fake list response with Codex and Cursor renders exactly those setup targets and spawns only `--agent=codex` and `--agent=cursor`.
2. CLI 58.4.4 rejects the list command, so Desktop uses the compatibility snapshot; changing help prose cannot add a target.
3. Successful `agents: []` produces no setup targets, while malformed output produces the four-agent fallback.

### Cost

The CLI must add and document a command. Desktop adds one probe, a bounded runtime array, id-keyed selection, persistence migration, dynamic commands, and tests. Unknown agents await a local adapter for deep inspection.

### What it makes worse

Old CLI users remain on the compatibility snapshot; a buggy successful empty list hides agents; setup and inspection catalogs may disagree; extra startup work and a capacity bound are introduced.

### Rejected alternatives

Help parsing, deriving capabilities from dry-run or error prose, keeping `ConfigKind` live, version-to-id mapping, Desktop-owned writes, treating failure as empty, treating successful empty as fallback, and an unbounded command surface.

## Forward traces

### A, dry-run envelope

`setup --dry-run` reused as discovery [observed] -> output is coupled to concrete key, paths, detection and preview actions [observed, P1] -> catalog completeness requires adding semantics unrelated to preview [inferred] -> future setup behavior can change discovery results without changing capability [inferred] -> Desktop can hide or add rows because a preview primitive answered an adjacent question [guessed, S12].

Helpful branch: existing JSON parser and envelope reduce implementation surface [observed] -> fewer new CLI commands [inferred].

Harmful branch: passing a managed key and path overrides for discovery [observed] -> discovery carries unnecessary secret/path context [inferred] -> logging or future validation expands exposure and latency [guessed].

### B, dedicated capability command

`list --format json` added as a read-only contract [proposed] -> stable ids directly define accepted `--agent=` values [inferred] -> Desktop rows and argv share one source [inferred] -> new CLI agents appear without Desktop releases [predicted].

Helpful branch: successful empty and failed query are distinct [inferred] -> no targets are invented when the CLI explicitly reports none [inferred].

Harmful branch: old CLIs lack the command [observed, P2] -> compatibility snapshot remains [inferred] -> full parity begins only after CLI rollout [observed constraint].

## Probe log

### P1: setup dry-run semantics

Command:

```sh
vercel ai-gateway coding-agents setup --all --key vck_probe_not_real --dry-run --yes --no-color \
  --agent-config claude-code=/tmp/.../claude.json \
  --agent-config codex=/tmp/.../codex.toml \
  --agent-config opencode=/tmp/.../opencode.json \
  --agent-config pi=/tmp/.../pi.json \
  --shell-rc /tmp/.../shellrc
```

Observed: CLI 58.4.4 returned JSON `status=ok`, `reason=dry_run`, five `changes` rows named Claude Code, Codex, OpenCode, Pi, and Environment, with file and action fields. It wrote no files. Rows had no stable ids. This survived the no-write prediction but refuted the claim that the current envelope directly expresses capability.

### P2: dedicated list availability

Command:

```sh
vercel ai-gateway coding-agents list --format json
```

Observed: CLI 58.4.4 exited 2 and reported that `setup` is the only valid subcommand. This confirms the fallback requirement and the necessary CLI-side addition.

### P3: current internal coupling

Command:

```sh
rg -n "configure_claude|configure_codex|configure_opencode|configure_pi|config_count|coding_agent_count|ConfigKind|agent_commands" src/app.zig src/tests.zig
```

Observed: selection booleans, persistence, arrays, setup operations, tests, and UI commands all depend on the fixed enum. A label-only change cannot satisfy the observable.

### Prediction disposition

- A1: unprobeable without a changed CLI envelope and Desktop implementation.
- A2: survived structurally; 58.4.4 has no ids and current fixed argv is verified in source.
- A3: unprobeable until fallback handling exists.
- B1: unprobeable until the fake-CLI harness and runtime catalog exist.
- B2: survived P2; CLI 58.4.4 lacks the command.
- B3: unprobeable until parser handling exists.

## Failure-shape scoring

| Shape | Proposal A | Proposal B |
| --- | --- | --- |
| S1 over-reach | Hit: changes setup preview semantics into a complete capability contract | Clear: adds a narrow read contract |
| S2 under-reach | Risk: unknown adapters still lack deep management; accepted and surfaced | Same risk; accepted and surfaced |
| S3 direction inheritance | Clear | Clear |
| S4 proxy property | Hit: preview changes are adjacent to capability | Clear if list ids are exactly accepted setup ids |
| S5 unregistered peer | Risk: runtime ids must be covered by persistence and command capacity | Same risk; implementation target |
| S6 peer-version blindness | Designed out by fallback | Designed out by fallback |
| S7 wrong layer | Clear | Clear |
| S8 guard-derived cells | Test matrix must include add, remove, empty, malformed and oversize | Same requirement |
| S9 wrong test | Require mutation tests deleting runtime-id wiring and fallback distinction | Same requirement |
| S10 prose claim | Clear if no display string becomes an id | Clear |
| S11 asymmetric validation | Validate ids once before UI and argv | Validate ids once before UI and argv |
| S12 primitive mismatch | Hit: dry-run answers preview, not capability | Clear: primitive contract matches feature contract |

## Synthesis

Kind: one proposal whole, Grok 4.6, with Fable's useful observation retained.

Choose the dedicated CLI capability command. Fable's strongest contribution was proving that setup already has structured JSON and that Desktop can reuse its tolerant envelope-parsing patterns. It was not selected because the observed dry-run primitive reports concrete preview changes, not the complete set of accepted agent ids. Extending it into a capability catalog would overload a command with different inputs and failure semantics and repeats S4 and S12.

Requested CLI contract:

```text
vercel ai-gateway coding-agents list --format json
=> { "status": "ok", "agents": [{ "id": "cursor", "name": "Cursor" }] }
```

Implementation seam:

- CLI catalog owns setup-eligible rows and exact `--agent=` ids.
- Desktop adapter catalog owns local inspection, review, backup, and removal depth.
- Old/failed query uses the existing four-agent compatibility snapshot.
- Successful empty response means no setup targets.
- Unknown fields are ignored; invalid, duplicate, oversized, or truncated rows are rejected or bounded deterministically.

Carried assumptions:

- CLI team will provide a stable machine-readable capability command or an equivalent explicit capability envelope.
- Each returned id is accepted verbatim by the same CLI build's setup `--agent` option.
- Display names are not identity.
- Generic unknown-agent rows are acceptable before Desktop gains deep local adapters.

## Visuals

Format: compact text trees are sufficient because the dispute is ownership and contract, not timing.

Observed behavior:

```text
Desktop ConfigKind [P3]
├── picker rows [P3]
├── persisted selection [P3]
├── local inspection [P3]
└── setup --agent ids [P3]

CLI setup --dry-run [P1]
└── concrete preview rows: label + file + action, no stable id [P1]
```

Chosen proposal:

```text
CLI list JSON [proposed]
└── setup capability ids [inferred]
    ├── Desktop runtime picker [inferred]
    └── setup --agent argv [inferred]

Desktop adapter catalog [observed]
└── known-agent inspection/review/removal [inferred, preserved]
```

## Handoff targets

Implementation verification:

- fake CLI adds an id and removes one;
- successful empty differs from failed query;
- malformed, duplicate, oversized, and truncated responses;
- old CLI fallback;
- exact setup argv for known and unknown ids;
- known-agent review/removal remains available when setup eligibility changes;
- no help text or display label is used as identity.

Review Gate must drive every item in the original must-not-change list.
