# MediaDom review conventions

Bootstrapped 2026-08-28 for the internal V1 extraction from `railly/mediadom-lab`.

## Surface map

```surfaces
packages/mediadom/src/cli.ts :: packages/mediadom/src/schema.ts, packages/mediadom/README.md, packages/mediadom/skills/mediadom/SKILL.md, packages/mediadom/test/camera-cli-contract.test.ts
packages/mediadom/src/schema.ts :: packages/mediadom/src/cli.ts, packages/mediadom/README.md, packages/mediadom/skills/mediadom/SKILL.md, packages/mediadom/test/camera-cli-contract.test.ts
packages/mediadom/src/ffmpeg.ts :: packages/mediadom/src/renderer.ts, packages/mediadom/test/ffmpeg-compat.test.ts, packages/mediadom/scripts/internal-demo.ts
packages/mediadom/src/renderer.ts :: packages/mediadom/src/ffmpeg.ts, packages/mediadom/scripts/internal-demo.ts
packages/mediadom/src/pointer.ts :: packages/mediadom/src/pointer-track-file.ts, packages/mediadom/README.md, packages/mediadom/test/pointer-track-file.test.ts
packages/mediadom/src/pointer-track-file.ts :: packages/mediadom/src/pointer.ts, packages/mediadom/README.md, packages/mediadom/test/pointer-track-file.test.ts
packages/mediadom/scripts/internal-demo.ts :: packages/mediadom/README.md, packages/mediadom/INTERNAL.md, packages/mediadom/.github/workflows/ci.yml
packages/mediadom/package.json :: packages/mediadom/src/name.ts, packages/mediadom/README.md, packages/mediadom/INTERNAL.md, packages/mediadom/.github/workflows/ci.yml
```

## House norms

- Runtime and package manager: Bun.
- Lint and format: Biome.
- The package remains private until an explicit publication decision.
- Base internal evaluation requires no API keys and uses only synthetic or redistributable fixtures.
- MediaDom consumes producer-neutral pointer tracks. SSRec is not a package dependency or part of the release.

## Subsystem invariants

- The source media is immutable. Renders always target a different path.
- JSON stdout remains parseable independently from stderr diagnostics.
- The schema, parser, scoped help, and dispatcher publish the same verbs and flags.
- Pointer-track version changes preserve the temporary unversioned migration path and refuse unknown versions.
- FFmpeg script-file compatibility is selected from the executable's observed capability, not inferred from a version string.
- A successful demo proves the audio edit, receipt, FFmpeg option, camera plan, camera render, and measured output durations.

## Verification norms

- Run `bun run check` and `bun run demo` from the package root.
- Falsify compatibility and protocol tests at the production definition and real call site, then restore green.
- Inspect the clean exported tree separately from the private monorepo.
- Scan tracked release files for local paths, private fixtures, credentials, and generated media before pushing.

## Gate-miss ledger

- 2026-08-28: ordinary text scans skipped TypeScript files containing literal NUL separators. Release scans must classify tracked files first and search remaining content byte-aware.
