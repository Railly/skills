# portless review conventions

Project overlay for the [review-gate](../../skills/.experimental/review-gate/SKILL.md) candidate skill. Harvested from the recorded cases in this directory and from `AGENTS.md` in the portless repo root (primary source of house norms). Surface map added 2026-07-17 from the first maintainer-confirmed external-review miss (PR #363), on a machine with the repository present.

## Surface map

Derived from the "Docs Updates" rule in AGENTS.md: any change that affects how humans or agents use portless (commands, flags, behavior, config) must touch all three documentation surfaces. The `surfaces` gate requires them in the diff or an explicit exemption with a reason.

```surfaces
packages/portless/src/proxy.ts :: README.md, skills/portless/SKILL.md, packages/portless/src/cli.ts
packages/portless/src/cli.ts :: README.md, skills/portless/SKILL.md
packages/portless/src/routes.ts :: README.md, skills/portless/SKILL.md
```

Judgment surface (not blocking, review by hand): `apps/docs/src/app/**/*.mdx`. The web docs mirror README sections (`https/page.mdx` ↔ the "HTTP/2 + HTTPS" README section). AGENTS.md does not list them as mandatory, but when the README gains a behavior sentence, its mirror page probably should too. `gate.sh siblings <keyword>` regenerates this list mechanically.

## House norms

- **Dash style inverts the universal gate.** portless BANS ` -- ` as a dash in prose and PREFERS the em dash (—). The em-dash half of `gate.sh style` does not apply here; the ` -- ` half does.
- **No emojis** anywhere (code, comments, output, docs).
- **`cli.ts --help` is a contract-carrying surface, not a terse listing.** The help text has bolded feature sections ("HTTP/2 + HTTPS (default):", "LAN mode:") with behavior prose. The docs-behavior-parity lens exemption for terse command listings does NOT apply to those sections: silence there about a behavior delta is a finding.
- Package manager: pnpm (npm only in end-user install instructions).
- Boolean env vars documented only as `0`/`1` (code accepts more; the alternatives stay undocumented).

## Subsystem invariants

- **Dual-loopback dialing.** Anything that dials a local service probes the exact host and address family the consumer binds; `127.0.0.1` and `::1` are different answers. An old branch that adds a new dial path copies the assumptions of its era; check which invariants landed on main after the branch was cut (`git merge-base` + `git log <base>..main -- <subsystem>`). Provenance: [288](288-downstream-address.md); PR-staleness mechanism from the #363 competing-PRs case (pending sync).
- **Additive mode composition.** A mode that adds a discovery namespace appends to explicit user configuration, never replaces it. Provenance: [346](346-lan-tlds.md).
- **Config provenance.** A value normalized from multiple loaders carries its origin beside it until presentation; reconstructing origin later produces plausible but false diagnostics. Provenance: [274](274-config-provenance.md).
- **Runtime precedence.** PATH augmentation adds only required tool directories and preserves the caller's runtime precedence. Provenance: [241](241-runtime-precedence.md).
- **Argument boundaries.** Flags injected into a command hidden behind a package script are verified across every runner boundary; correct flags at the outer command can be silently dropped. Provenance: [285](285-package-script-flags.md).

## Verification norms

- A relaxed validator or widened trigger regenerates the verification matrix from the new input domain: enumerate the input classes now reachable and exercise one of each; the bug report's matrix verifies the old fix, not the new code. Provenance: #365 and #366 (cases pending sync).
- Helper tests prove the helper; when behavior changes in orchestration, drive and mutate the changed caller. Provenance: [0355](0355-changed-caller-coverage.md).

## Gate-miss ledger

- **2026-07-17 — PR #363, maintainer doc nit: the cli.ts help does not mention WebSocket over HTTP/2.** Two gates should have caught it: (1) `surfaces` — never ran, because this file had no surface map yet (the absence was recorded in the report, which changed nothing); (2) docs-behavior-parity — ran, but the terse-listing exemption was misapplied to the help's "HTTP/2 + HTTPS" section, which carries behavior prose and whose sibling README section did gain the new sentence. Both causes closed: the surface map above makes the check deterministic, and the cli.ts-as-contract norm corrects the lens application. Follow-on: the `siblings` gate (`gate.sh siblings "HTTP/2"`) was added and force-red'd against this exact diff; it flags cli.ts and the apps/docs pages.
