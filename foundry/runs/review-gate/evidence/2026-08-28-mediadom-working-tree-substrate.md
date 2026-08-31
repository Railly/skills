# MediaDOM independent substrate challenge

Date: 2026-08-28
Base: `e425141b82b3585e2b1a30f3823eca8a3eb26ab9`
Tracked diff SHA-256: `7a6f174431e449049246638dc83fd69e4bc007f92af8337627eb87d00bc9a97a`
Untracked manifest SHA-256: `2cf17f74c566442cb8287afaf0e759d915703cc2cfe0d32c91807e93bf0d22e7`
Composite working-tree SHA-256: `499028ce30bf34aaea7fe896c6fce6ded2f7e362c7e7df2a932b4d46149b8568`

## Substrate

- Bun 1.3.14 processes on macOS
- FFmpeg and ffprobe 8.1.2
- real MP4 files and filesystem-backed receipts
- real SIGINT and SIGKILL delivery
- fault-injected trx and acoustic executables
- forced malformed output, hangs, nonzero exits, partial MP4 output, post-render probe failure, final-transcription failure, and terminal QA failure

## Direct observations

- `bun run demo` produced one MP4 with video and audio, verified it, and preserved the source hash.
- `bun test test/cli-doom.test.ts --rerun-each 3` passed 39/39.
- Timeout and cancellation cases left no matching child process or transcription temp directory.
- FFmpeg failure, post-render probe failure, final transcription failure, and QA rejection left no master or receipt.
- Immediate retry after post-render failures succeeded.
- Four-writer and six-rescuer lock cases passed 78/78 over three complete repetitions of `test/cli-w2.test.ts`.
- The exact six-rescuer case then passed 100/100 additional stress repetitions.

## Proxy challenges

- Process exit was not accepted as cleanup. The process table and temp directory were inspected.
- CLI success text was not accepted as render correctness. The produced MP4 streams, duration, receipt, hash, and source bytes were inspected.
- Exception handling was not accepted as rollback. Output and receipt absence were observed after each forced post-render failure.
- Green tests alone were not accepted as strength. Four fix-absent mutations made the intended assertions fail before restoration.

## Limits

- Real ElevenLabs execution and a real local PANNs model were not run in this audit.
- One earlier full-suite run timed out in the six-rescuer lock test after killing a dangling process. The same test then passed alone, passed 78/78 across three full file repetitions, passed in the final 749-test suite, and passed 100/100 additional stress rounds. The observed event is retained as history but was not reproduced as a lock defect.
- Radius indexed 105 files, 881 symbols, and 2,508 edges, but reported 6,015 unresolved calls. Its impact map is orientation evidence only.
