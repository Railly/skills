# survey-cli review conventions

Project overlay for the review-gate skill, compiled from `README.md`, `package.json`, and the CLI source in `crafter-station/survey-cli`.

## Surface map

The README command block is the public command inventory. User-facing command changes update that block and receive CLI-level coverage in addition to helper tests.

```surfaces
src/cli.ts :: README.md, test/cli.test.ts
src/scaffold.ts :: README.md, test/scaffold.test.ts
src/storage.ts :: test/storage.test.ts
src/export.ts :: test/export.test.ts
```

## House norms

- Runtime and package manager: Bun.
- Lint and format: Biome.
- The documented syntax and the shipped Commander parser must agree exactly.
- CSV data stays on stdout. Warnings and diagnostics go to stderr.
- `SURVEY_CLI_HOME` is the isolation boundary for response storage.

## Subsystem invariants

- A generated survey is usable from the working directory where the user created it, including when the CLI was installed globally or invoked ad hoc as documented.
- Destructive response operations act on the matched storage filename. JSON payload fields are untrusted data and never become unlink paths.
- Parent commands with positional arguments are driven through the real Commander parser because helper tests cannot prove nested command reachability.

## Verification norms

- New commands are exercised through the built binary with the exact README syntax.
- Destructive commands are tested for missing targets, ambiguous prefixes, corrupt JSON metadata, and path containment.
- Export behavior is verified with stdout and stderr captured separately.

## Gate-miss ledger

None recorded.
