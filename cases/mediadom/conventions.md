# MediaDOM review conventions

Compiled from `README.md`, `INTERNAL.md`, `package.json`, CLI help, and repository behavior.

## Surface map

```surfaces
src/cli.ts :: src/schema.ts, src/skills.ts, README.md, test/cli-doom.test.ts
src/one-shot.ts :: src/cli.ts, src/schema.ts, src/skills.ts, README.md, test/cli-doom.test.ts
src/external-process.ts :: src/ffmpeg.ts, src/instrument.ts, test/cli-doom.test.ts
src/renderer.ts :: README.md, test/cli-doom.test.ts
src/adapters/trx.ts :: src/skills.ts, README.md, test/cli-doom.test.ts
```

## House norms

- Runtime and package manager: Bun.
- Lint and format: Biome.
- Supported operating system: macOS.
- JSON stdout stays parseable. Diagnostics go to stderr.
- The input is one video. The product edits cuts, silence, and semantic redundancy. It does not compose or reframe video.

## Subsystem invariants

- Source media is immutable.
- A successful doom run leaves one certified MP4 and its receipt.
- A failed render, probe, final transcription, or terminal QA leaves no uncertified master or receipt.
- External processes are bounded, cancellable, and cleaned up with their temporary directories.
- The store lock owns read-modify-write transitions and survives concurrent writers without lost updates.
- The calling agent owns semantic editorial judgment. MediaDOM owns physical cut safety and final verification.

## Verification norms

- CLI contract changes drive the real Bun CLI across filesystem-backed stores.
- Render changes use real FFmpeg and inspect the produced MP4.
- Dependency refusal, malformed output, timeout, cancellation, partial output, post-render failure, QA failure, and immediate retry are forced.
- `bun run check`, `bun run demo`, `bun audit`, `git diff --check`, and repeated doom lifecycle tests are required.
