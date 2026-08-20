# Vercel Desktop CLI discovery candidate audit

Date: 2026-08-18

Target: `vercel-labs/vercel-desktop` at base `7e2aa8081714bd3853bdd054ec2b45ccefcb4241`

Candidate: PR #11, head `0e4a3c83e37fffcd25d4063574eb6d6df2747491`, author Ty Zhang

Runtimes:

- proposer A: Cursor Agent `claude-fable-5-thinking-xhigh`
- proposer B: Cursor Agent `cursor-grok-4.6-xhigh`
- synthesis: Codex GPT-5

Mode: candidate audit. The candidate was snapshotted before review and absent from both blind reviewer workspaces until reveal.

## Candidate seal

- Metadata SHA-256: `d7df106ef7f1cf88f3c794e3ced8773127855abe49a190ced836f924a774158e`
- Patch SHA-256: `cc2d48ff10c83dbc72d80c9f38ad36b8ecb66eb98bed66c6aa8c2125d4e5153e`
- State at seal: open, mergeable, not draft, no reviews, two Socket checks green.

## Shared contract

### Property

A packaged macOS GUI app must safely discover and execute an already-installed Vercel CLI across supported global and per-user installation layouts, preserve every CLI operand byte-for-byte, avoid granting arbitrary shell startup files control of app execution, and terminate promptly into the existing missing/failed states when discovery or execution cannot succeed.

### Observable

From `PATH=/usr/bin:/bin` and no controlling terminal:

- find global and Homebrew installs;
- find common Bun and nvm installs;
- account for `ZDOTDIR` without assuming `$HOME/.zshrc` is authoritative;
- never execute side-effecting or blocking interactive rc code during discovery;
- preserve executable paths containing spaces and argument metacharacters as argv;
- validate that the resolved CLI can run under the environment the app will provide;
- finish promptly and preserve existing `.missing` and `.failed` onboarding semantics when absent or unusable.

### Must not change

- Existing CLI verbs, operands, trailing `--no-color`, effect keys, output collection and parsing.
- `/tmp` child cwd.
- Existing probe/session/onboarding state transitions.
- No CLI bundling, install, update, or shell-file mutation.
- No interactive shell in a GUI-owned subprocess.

### Authority reconciliation

Both blind reviewers initially framed the user's interactive shell as the authority for the exact CLI choice. That is incompatible with the trust boundary: startup files are arbitrary executable code. The reconciled authority is narrower. The app owns a documented deterministic search over safe inherited and common installation locations. Exact parity with functions, aliases, or custom rc-only PATH mutations is outside the automatic contract and must degrade honestly.

## Discriminator matrix

| Cell | Required observation |
|---|---|
| GUI minimal PATH | Installed CLI is not mistaken for absent only because Finder omitted terminal PATH |
| Homebrew | `/opt/homebrew/bin` and `/usr/local/bin` are supported without running `brew` |
| Bun | `~/.bun/bin/vercel` is found and its `#!/usr/bin/env node` runtime resolves |
| nvm | active/default/current aliases are handled deterministically without sourcing `nvm.sh` |
| Cross-manager runtime | Bun-provided `vercel` may require nvm-provided `node`; validate the composed environment |
| `ZDOTDIR` | no hardcoded `$HOME/.zshrc`; relocated rc code is neither required nor executed |
| Hostile rc | print/fail/block/job-control content cannot affect discovery or CLI output |
| Missing CLI | prompt termination and existing missing state |
| Path with spaces | executable remains one argv item |
| Argument metacharacters | operands remain byte-identical argv items |
| Multiple installs | stable published precedence |
| Broken candidate | broken symlink/non-executable is skipped |
| Upgrade/path change | retry/re-resolution heals without stale persistent state |

## Blind proposals

### Fable 5

Shape: a pure filesystem locator returns an absolute CLI path and provenance. Search inherited PATH, Homebrew, Bun, then nvm aliases/versions. Cache in memory, revalidate before launches, and launch via argv without shell interpretation. Prepend the resolved executable's parent directory to child PATH.

Predictions:

1. Finder-launched nvm install runs and child argv points into the selected nvm version.
2. Hostile rc files cause no fork/exec, output, or delay.
3. Missing CLI resolves in under roughly 100 ms without spawning.
4. Paths with spaces and metacharacter operands remain byte-identical.
5. Multiple installs resolve deterministically.
6. A moved binary heals on the next launch.

Cost: a locator module, fake-filesystem tests, candidate-table maintenance, nvm alias resolution, and in-memory revalidation.

Makes worse: deliberately loses exact terminal parity for custom prefixes, functions, aliases, and rc-only manager configuration. Fixed precedence can select an older global CLI over a terminal-preferred nvm CLI.

Rejected: interactive/login shells, parsing rc files, path_helper/launchctl as a complete answer, bundling/installing, shell command strings, and path selection as the primary UX.

### Grok 4.6

Shape: a pure resolver evaluates inherited PATH, pnpm, Homebrew, Bun, and nvm active/default/current locations in a published order. Resolve on each launch. Keep a non-rc zsh trampoline only to preserve `/tmp` cwd because Native SDK spawn lacks cwd. Pass the resolved path and all operands as argv. No persistent path setting.

Predictions:

1. Homebrew and Bun candidates appear as an absolute argv slot under GUI PATH.
2. nvm default wins only according to declared alias rules.
3. Hostile rc files do not affect wall time or collected output.
4. Missing CLI produces no probe spawn and preserves onboarding.
5. Paths and operands remain distinct argv slots.
6. Broken candidates are skipped.
7. A path change is observed on the next retry/launch.

Cost: resolver module, environment/filesystem injection, nvm alias grammar, candidate-table maintenance, and longer argv payloads.

Makes worse: no support for function/alias/custom rc-only installs; global-first precedence may differ from Terminal; absolute paths consume more of Native SDK's 2048-byte argv budget.

Rejected: `zsh -lic`, `zsh -lc`, sourcing/parsing rc, sourcing manager scripts, exact Terminal parity, bundling/installing, direct exec without a cwd primitive, sticky user paths, and watchers.

The complete raw reviewer outputs were preserved during the run in the coordinator's audit workspace. The decision-relevant content above retains every required proposal section and every prediction.

## Forward chains

### Fable

Filesystem locator **[inferred]** → known candidates avoid rc execution **[inferred]** → resolved Bun script is launched with only its parent prepended **[proposed]** → `/usr/bin/env node` searches Bun dir plus GUI PATH **[observed]** → node remains absent when supplied by nvm **[observed, harmful]** → valid installed CLI exits 127 **[observed]**.

Helpful branch: filesystem locator **[inferred]** → no startup-file execution **[inferred]** → hostile rc cannot print/block/suspend discovery **[survived probe]**.

### Grok

Filesystem resolver **[inferred]** → Bun absolute script selected **[proposed]** → unchanged GUI child PATH retained **[proposed]** → shebang uses `/usr/bin/env node` **[observed]** → node absent **[observed, harmful]** → CLI fails despite correct path **[observed]**.

Helpful branch: `zsh -fc` trampoline with resolved path in argv **[proposed]** → no rc files loaded **[specified by zsh `-f`]** → `/tmp` cwd retained and arguments stay inert **[survived probe]**.

### Candidate PR #11

Source `$HOME/.zshrc` **[observed in diff]** → default nvm/Bun PATH becomes visible **[observed]** → common Ty reproduction succeeds **[observed, helpful]**.

Harmful branches:

- fixed `$HOME/.zshrc` **[observed]** → `ZDOTDIR` ignored **[inferred]** → CLI remains missing **[observed]**;
- execute arbitrary rc **[observed]** → print/fail/block/job-control behavior shares the CLI process lifetime and output channel **[inferred]** → prior suspension class can recur **[reported, unrefuted]**;
- source-string test **[observed]** → behavior is not discriminated **[inferred]** → green tests coexist with the `ZDOTDIR` failure **[observed]**.

## Probe log

| ID | Probe | Result |
|---|---|---|
| P1 | Base `zsh -lc` under GUI PATH with `vercel` only in `.zshrc` | exit 127, command not found |
| P2 | PR #11 with default `$HOME/.zshrc` | success |
| P3 | PR #11 with only `$ZDOTDIR/.zshrc` | exit 127 |
| P4 | `pnpm check && pnpm test` on main | passed; 158/158 |
| P5 | same checks on PR #11 | passed; 158/158 |
| P6 | package main | ReleaseFast app and DMG built; signature and DMG verified |
| P7 | inspect `~/.bun/bin/vercel` | symlink to `#!/usr/bin/env node` script |
| P8 | run Bun CLI with GUI PATH | `env: node: No such file or directory`, exit 127 |
| P9 | prepend only `~/.bun/bin` | still exit 127; Fable runtime assumption refuted |
| P10 | compose Bun bin + nvm node bin in PATH | Vercel CLI 58.4.4 succeeds |
| P11 | `zsh -fc`, spaced/metacharacter operand, composite PATH | operand printed byte-identically; no expansion |
| P12 | inspect Native SDK SpawnOptions | no cwd or environment override; argv max 16, bytes max 2048 |
| P13 | inspect `path_helper` | covers `/etc/paths(.d)` such as Homebrew; cannot reconstruct arbitrary clean-GUI nvm/Bun PATH |

## Failure-shape scoring

| Shape | Fable | Grok | PR #11 |
|---|---|---|---|
| S1 over-reach | Clear: bounded known locations | Clear | **Hit:** executes whole `.zshrc` to obtain PATH |
| S2 under-reach | **Hit:** runtime assumed beside CLI | **Hit:** runtime environment omitted | **Hit:** `$HOME` only; `ZDOTDIR` fails |
| S3 direction inheritance | Clear | Clear | Hit: fixes missing CLI but reopens suspended-child direction |
| S4 proxy property | **Hit:** executable bit does not prove runnable under child PATH | **Hit:** same | Hit: sourcing file does not prove safe runnable CLI |
| S5 unregistered peer | Clear, runtime-only | Clear, runtime-only | Clear |
| S6 peer-version blindness | N/A | N/A | N/A |
| S7 wrong layer | Clear | Clear | Hit: rc noise can enter collected-output layer |
| S8 guard-derived cells | Avoided by shared matrix | Avoided | Hit: only source-string assertion |
| S9 test pins wrong thing | Needs mutation tests | Needs mutation tests | **Hit:** test pins `source "$HOME/.zshrc"` |
| S10 claim from prose | **Hit refuted by P7-P10** | **Hit refuted by P7-P10** | Hit: assumes conventional HOME zshrc |
| S11 asymmetric validation | Must validate CLI plus runtime | Must validate CLI plus runtime | Hit: no validation of sourced execution surface |
| S12 primitive mismatch | Clear after runtime graft | Clear after runtime graft | **Hit:** arbitrary rc execution violates safe discovery contract |

S1 and S2 carry extra weight because this is a fix candidate. PR #11 hits both.

## Candidate comparison

| Dimension | Selected blind result | PR #11 | Delta |
|---|---|---|---|
| Contract observable | known-location discovery, runnable environment, prompt absence | default HOME zshrc makes PATH visible | material |
| Primitive | filesystem probes + validated composite PATH + no-rc argv trampoline | source arbitrary rc | material |
| Trust boundary | rc never executed | rc owns child behavior | violation |
| Negative cells | explicit matrix | only default HOME happy path | material |
| Lifecycle | resolve/revalidate in memory | source every command | material |
| Compatibility | bounded documented/common layouts | arbitrary HOME rc but not ZDOTDIR | different and unsafe |
| Reusable work | requirement, contributor reproduction, one happy-path test intent | mechanism itself | limited |

## Synthesis

Kind: **graft, with both original proposals corrected by substrate evidence**.

Selected shape:

1. A pure filesystem resolver, injectable for tests, owns deterministic selection from inherited PATH plus common pnpm/Homebrew/Bun/nvm locations.
2. Selection returns a launch plan, not only a `vercel` path: executable candidate plus an ordered safe PATH composed from the candidate directory, discovered Node runtime directories, inherited PATH, and system defaults.
3. Every launch plan is validated by executing the candidate's `--version` through the exact environment and no-rc trampoline that later commands will use. A candidate that exists but cannot run is skipped.
4. Preserve `/tmp` and argv safety through `/bin/zsh -fc 'cd /tmp || exit 1; exec "$@"'`; `-f` prevents rc loading. Because SpawnOptions lacks environment overrides, pass `/usr/bin/env`, a single `PATH=...` argv item, then the no-rc trampoline and resolved executable.
5. Cache only in memory after a successful version probe. Revalidate or rediscover on probe retry and spawn failure/path disappearance. Do not persist a user path in this change.
6. Unsupported custom rc-only layouts degrade to the existing missing UI. A future explicit path escape hatch is a separate product decision.

The seam is the launch plan. Filesystem discovery without runtime composition fails P7-P10; runtime composition without deterministic candidate discovery cannot solve GUI PATH. The implementation must test them together.

### Candidate verdict

**Absorb and recreate from main.** Do not merge PR #11's mechanism. Preserve Ty Zhang's credit in the replacement PR because the reported packaged-nvm defect and the need to cover version-manager installs are valid and materially shaped the replacement.

### Carried assumptions

- A bounded common-layout table is acceptable product behavior for automatic discovery.
- `/usr/bin/env PATH=... /bin/zsh -fc ...` fits the 16-entry and 2048-byte effect bounds for all current commands, including `--key`.
- A discovered Node runtime directory can safely support a different manager's `#!/usr/bin/env node` Vercel script after an exact `--version` validation.
- No currently supported Vercel CLI distribution requires additional runtime executables beyond what validation exposes.
- Missing-state copy is sufficient recovery for unsupported custom locations in this iteration.

These are implementation verification targets, not facts.

## Auditable visual

### Observed behavior

```text
v0.0.11: GUI PATH → zsh -lc → "vercel"                    → exit 127 [P1]
PR #11:   GUI PATH → source $HOME/.zshrc → "vercel"       → success [P2]
PR #11:   GUI PATH + ZDOTDIR-only rc → source HOME rc      → exit 127 [P3]
Bun:      absolute ~/.bun/bin/vercel + GUI/Bun-only PATH   → node missing [P7-P9]
Bun+nvm:  Bun vercel + nvm node in composed PATH           → success [P10]
```

### Proposed shape

```text
safe filesystem facts [observed]
  → deterministic candidate list [inferred]
  → launch plan: vercel path + composed PATH [inferred]
  → exact-plan `--version` validation [inferred]
  → `/usr/bin/env PATH=… /bin/zsh -fc …` [observed primitives]
  → existing argv, output, and state contracts [inferred]

No edge enters `.zshrc`, `.zprofile`, `nvm.sh`, or shell aliases.
```

Format choice: text trees are sufficient because the disputed relationship is discovery/runtime ownership, not UI or multi-process timing.

## Handoff to implementation and Review Gate

Implementation must drive every discriminator cell, especially cross-manager Bun+nvm, hostile rc, `ZDOTDIR`, missing CLI, broken candidates, spaced paths, argv bytes, and effect bounds. Review Gate must use the shared must-not-change list and mutation-check that removing candidate validation, runtime PATH composition, `-f`, or argv separation makes a distinct test fail.
