# portless review conventions

Project overlay for the [review-gate](../../skills/.experimental/review-gate/SKILL.md) candidate skill. Harvested from the recorded cases in this directory. No surface map yet: the repository is not available on the machine that authored this file, and paths are never written unverified.

## Subsystem invariants

- **Dual-loopback dialing.** Anything that dials a local service probes the exact host and address family the consumer binds; `127.0.0.1` and `::1` are different answers. An old branch that adds a new dial path copies the assumptions of its era; check which invariants landed on main after the branch was cut (`git merge-base` + `git log <base>..main -- <subsystem>`). Provenance: [288](288-downstream-address.md); PR-staleness mechanism from the #363 competing-PRs case (pending sync).
- **Additive mode composition.** A mode that adds a discovery namespace appends to explicit user configuration, never replaces it. Provenance: [346](346-lan-tlds.md).
- **Config provenance.** A value normalized from multiple loaders carries its origin beside it until presentation; reconstructing origin later produces plausible but false diagnostics. Provenance: [274](274-config-provenance.md).
- **Runtime precedence.** PATH augmentation adds only required tool directories and preserves the caller's runtime precedence. Provenance: [241](241-runtime-precedence.md).
- **Argument boundaries.** Flags injected into a command hidden behind a package script are verified across every runner boundary; correct flags at the outer command can be silently dropped. Provenance: [285](285-package-script-flags.md).

## Verification norms

- A relaxed validator or widened trigger regenerates the verification matrix from the new input domain: enumerate the input classes now reachable and exercise one of each; the bug report's matrix verifies the old fix, not the new code. Provenance: #365 and #366 (cases pending sync).
- Helper tests prove the helper; when behavior changes in orchestration, drive and mutate the changed caller. Provenance: [0355](0355-changed-caller-coverage.md).
