# MediaDOM direct Scribe reference oracle

- The direct Scribe boundary is a local HTTP server returning captured ElevenLabs-shaped words, events, language, and text.
- The compatibility boundary is an independent fake `trx` executable returning SRT plus words and events files.
- `test/transcriber-parity.test.ts` compares normalized cues, lexical words, and audio events across both boundaries.
- Mutation 1 removed direct-adapter events. The adapter and parity tests failed, then passed after restoration.
- Mutation 2 changed the default transcriber to `trx`. `doom does not invoke trx` failed with exit 5 against a missing binary, then passed after restoration.
- Real FFmpeg produced and probed the MP4 used by the complete doom and demo tests.
- Forced failures covered timeout, malformed provider output, SIGINT, FFmpeg partial output, post-render probe failure, final transcription 503, and terminal QA rejection.
- Final transcription and QA failures were retried immediately and produced one complete master plus receipt.
- Lifecycle tests ran three consecutive times with no surviving `mediadom-source-scribe-*`, `mediadom-final-scribe-*`, or `mediadom-seam-*` directories.
