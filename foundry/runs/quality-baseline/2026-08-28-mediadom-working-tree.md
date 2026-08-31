# MediaDOM quality baseline

Date: 2026-08-28
Repository: `vercel-labs/mediadom`
State: intentionally uncommitted working tree over `e425141`
Verdict: strong baseline with named verification gaps

MediaDOM is clean for its current product contract: one input video, cuts for silence and semantic redundancy, no camera composition, zooming, overlays, multi-input assembly, or recorder integration.

## Evidence

- 749/749 repository tests pass.
- The real demo produces and verifies one MP4 with audio and video while preserving the source.
- Doom lifecycle tests pass 39/39 across three repetitions.
- Lock lifecycle tests pass 78/78 across three repetitions.
- The exact six-rescuer recovery race passes 100/100 additional stress rounds.
- TypeScript, Biome, `git diff --check`, and `bun audit` pass.
- No matching child processes or transcription temp directories remain.
- No TODO, FIXME, HACK, or XXX markers were found.
- Strict CI checks are required on `main`; Actions permissions are read-only; Dependabot alerts and security updates are enabled.

## Ranked findings

1. Real ElevenLabs and local PANNs provider runs remain unverified.
2. Secret scanning is disabled because Advanced Security is unavailable. Enabling an organization-licensed feature needs explicit authorization.
3. PCM buffering is bounded at 1 GiB but not streamed, so very long videos have an explicit memory ceiling.
4. Knip reports 57 exports and 27 exported types as unused. Most are test or public seams, so this is an inventory to classify, not a deletion list.

## Rejected noise

- There is no remaining ssrec integration or video-composition path.
- References to “zoom” and “composition” belong to observation/model terminology, not camera editing.
- The size of `src/cli.ts` is not treated as a defect without a failure or change-safety measurement.
- Knip output is not treated as proof of dead code.
- The earlier six-rescuer timeout is not treated as a lock defect after 100/100 additional exact-case stress rounds.

## Next pilot

Run one disposable video through real trx ElevenLabs and the real local PANNs model. The local process, cleanup, rollback, retry, and artifact boundaries are already proven; this closes the remaining provider-specific gap.

Exact hashes and the machine-readable matrix are in the adjacent JSON report.
