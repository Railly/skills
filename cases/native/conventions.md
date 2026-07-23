# vercel-labs/native review conventions

Bootstrapped 2026-07-17 from AGENTS.md, CONTRIBUTING.md, changelog.d/README.md.

## Deterministic layer

The repo ships its own gate — run it first, before any generic checks:

```sh
scripts/gate.sh fast <base-ref>   # affected-only: maps the diff to the suites that cover it
scripts/gate.sh full              # everything CI-shaped that runs locally
```

Known machine-dependence: `bench-check` (render budget ratchet in `tools/bench-render-budgets.txt`) fails on hardware other than the machine that recorded the budgets. Verify against the clean base commit before attributing it to a diff.

Automation protocol pins CLI to runtime: after pulling main, rebuild the CLI (`zig build cli`) or `native automate` rejects the running app with a protocol mismatch.

## Surfaces

```surfaces
* => changelog.d/<slug>.md (user-visible changes only; feature:/improvement:/fix: tag, CHANGELOG voice, never edit CHANGELOG.md directly)
src/primitives/canvas/** => skill-data/native-ui/SKILL.md (the authoring guide mirrors engine behavior)
src/runtime/ts_* => skill-data/ts-core/SKILL.md (the TS-tier guide mirrors adapter channels)
src/runtime/ui_app.zig#Options => the Options field doc comments (behavior prose lives in-code)
docs/src/app/** => pnpm --dir docs check (gate runs it when docs/ changed)
keyboard/editor behavior => docs/src/app/keyboard-shortcuts/page.mdx + docs/src/app/components/<control>/page.mdx
examples/<name> => root build.zig test-example-<name> step + examples/ index
```

## Norms

- Zig 0.16.0 idioms only; `skill-data/zig/SKILL.md` maps pre-0.16 compile errors to current forms.
- Pinned goldens (pixel signatures, schema fingerprints, command counts) change deliberately, with the pin's comment updated to describe the new value.
- Behavior defaults are load-bearing: the runtime's editor/keyboard defaults carry tests that assert them (see the 2026-07-17 case). Changing one is API design, not a fix.
- TS examples are zero-config: app.zon + src + package.json + tsconfig (copy soundboard-ts's), no build.zig.
- Commits and PR text: no em dashes (Hunter's rule, not the repo's).

## Gate-miss ledger

| Date | Finding | Gate that missed | Why | Closed by |
|---|---|---|---|---|
| 2026-07-17 | Arrow-forwarding patch reverted a same-day tested feature | (none missed — repo gate caught it pre-push) | n/a — recorded as gate WIN with two new lens candidates | [case](2026-07-17-arrow-default-was-todays-feature.md) |
