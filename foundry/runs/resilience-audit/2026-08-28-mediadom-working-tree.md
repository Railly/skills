# MediaDOM resilience audit

Date: 2026-08-28
State: uncommitted working tree over `e425141`
Verdict: findings

The edited single-video workflow now fails safely across the tested process and artifact boundaries. Source transcription, acoustic classification, FFmpeg, ffprobe, final transcription, and QA are bounded or terminal, clean their owned resources, and do not leave an uncertified MP4 or receipt.

## Pressure results

- Missing, hanging, and malformed trx: graceful dependency failure, exit 5, no transcription temp leak.
- Hanging or malformed acoustic classifier: child terminated; malformed output becomes an explicit incomplete verdict.
- SIGINT: active transcription process and temp directory removed.
- FFmpeg nonzero after writing output: partial master and receipt removed.
- Failure after render during certification: uncertified master and receipt removed; immediate retry succeeds.
- Final transcription failure: master and receipt removed; immediate retry succeeds.
- QA fail without an exception: master and receipt removed; immediate retry succeeds.
- Store concurrency: four writers and six dead-holder rescuers preserve all transitions and leave no lock or write-temp residue in repeated runs and 100 additional exact-case stress rounds.

## Verification

- `bun run check`: 749/749.
- `bun run demo`: pass with one audio-video MP4, valid receipt, and unchanged source.
- `bun test test/cli-doom.test.ts --rerun-each 3`: 39/39.
- `bun test test/cli-w2.test.ts --rerun-each 3`: 78/78.
- Exact six-rescuer stress: 100/100.
- `bun audit`: no vulnerabilities.
- `git diff --check`: pass.
- Final process and temp scan: clean.

## Remaining findings

- Real ElevenLabs and local PANNs executions were not available in this run. The executable, process, JSON, artifact, and cleanup boundaries are exercised with fakes, but provider-specific behavior remains unverified.
- One earlier full-suite run timed out in the six-rescuer case and killed a dangling process. It did not reproduce alone, in three complete file repetitions, in the final full suite, or in 100 additional stress rounds. It remains historical evidence, not an open lock defect.
- PCM buffering is bounded at 1 GiB but not streamed. Very long sources can fail at this explicit scale ceiling.

The durable matrix is in the adjacent JSON report.
