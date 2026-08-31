# Review Gate: MediaDOM working tree

Date: 2026-08-28
Base and HEAD: `e425141b82b3585e2b1a30f3823eca8a3eb26ab9`
State: uncommitted working tree
Tracked diff SHA-256: `7a6f174431e449049246638dc83fd69e4bc007f92af8337627eb87d00bc9a97a`
Untracked manifest SHA-256: `2cf17f74c566442cb8287afaf0e759d915703cc2cfe0d32c91807e93bf0d22e7`
Composite working-tree SHA-256: `499028ce30bf34aaea7fe896c6fce6ded2f7e362c7e7df2a932b4d46149b8568`

## Verdict

Pass for the reviewed single-video editor contract.

The exact working tree now proves complete doom readiness, bounded and cancellable external processes, source immutability, one render and one final transcription, rollback after every tested post-render failure, safe retry, and durable concurrent store transitions.

The reviewer and author are from the same model family. The independent challenge therefore comes from the substrate: real Bun processes, macOS signals, FFmpeg and ffprobe, actual MP4 and receipt files, direct process and filesystem inspection, fault-injected executable boundaries, and concurrent writers.

## Deterministic evidence

- TypeScript, Biome, and 749/749 tests pass.
- The real demo produces one verified MP4 with audio and video and leaves the source unchanged.
- Doom lifecycle matrix: 39/39 across three repetitions.
- Store lock matrix: 78/78 across three repetitions.
- Exact six-rescuer recovery stress: 100/100.
- `bun audit`: no vulnerabilities.
- `git diff --check`: pass.
- Process and transcription-temp scan: clean.
- Style, surface, caller, and timing gates: pass.
- Four fix-absent mutations failed at the intended assertions before restoration.

## Failure-path result

- Missing trx exits 5 and leaves no temp directory.
- Hanging trx and acoustic processes are terminated.
- Malformed dependency output is rejected explicitly.
- SIGINT removes the active child process and owned temp state.
- FFmpeg partial output is rolled back.
- Failure after FFmpeg success during probe or receipt work is rolled back.
- Final transcription failure is rolled back and retries cleanly.
- A terminal QA fail without an exception is rolled back and retries cleanly.
- Concurrent writers preserve exact entry and revision counts.

## Product scope

The public and executable behavior agree:

- one input video;
- temporal cuts for silence and semantic redundancy;
- no camera zoom, reframing, overlays, multi-input composition, or recorder-specific integration;
- semantic judgment stays with the calling agent;
- MediaDOM compiles safe cuts and certifies the final master.

## Named issue candidates

- Dogfood one real ElevenLabs and local PANNs run. Fixtures prove lifecycle behavior, not provider semantics.
- Enable secret scanning only after explicit organization and licensing authorization.
- Benchmark long recordings before deciding whether the bounded 1 GiB PCM buffer needs streaming.

## Tool limits

The standard `covered` gate cannot identify an uncommitted tree by HEAD alone. This report freezes the base commit plus tracked, untracked, and composite hashes.

Radius indexed 105 files, 881 symbols, and 2,508 edges, but reported 6,015 unresolved calls. It was used for orientation, not closure.
