# Review Gate: vercel-labs/emulate#209

Date: 2026-08-31
Repository: vercel-labs/emulate#209
Base: `5b1fbf042466229d8b5d8de25d7ec737ef706637`
Head: `dc3548304b0e07c43d08bdbfc8b903551f2bd55a`
Profile: external-pr
Skill revision: `git:a006c7a52acfdb112e7a4882063d0a3dbbe757d7`
Verdict: incomplete

## Execution

- Mode: unavailable
- Runtime receipt: fx-review.json
- Degraded from: fx_worker
- Schema failures: 0
- Independence gap: The single packaged FX reviewer attempt timed out; no native or visible independent reviewer capability was available, so the remaining judgment is deterministic and sequential.

## Contract

- Path: User request dated 2026-08-31 for vercel-labs/emulate#209 plus PR #209 body
- Spec status: not_provided
- Acceptance reviewed: Supported GitHub raw media types return exact file bytes through Contents, Quoted commas in Accept parameters do not create false raw ranges, Genuine raw ranges after quoted parameters remain recognized, Ordinary files, directories, missing paths, symlinks, and submodules retain their intended representations, Raw response metadata includes Content-Type, Content-Length, and Vary: Accept, Existing advertised raw URL and symlink resolution behavior remains consistent

## Stage receipts

- Test Strength: unavailable. The diff changes a protocol parser and compatibility adapter, but no exact-head Test Strength receipt with an independent oracle, real producer, and fix-absent falsification was supplied. The built corpus and authored tests do not substitute for that required receipt.
- Resilience Audit: not_triggered. The changed GET representation path adds no durable or remote side effect and no new lifecycle, timeout, cancellation, or cleanup behavior.
- Security Review: missing

## Verified properties

- P1: Raw-looking text inside a quoted Accept parameter does not select raw Contents bytes, while a genuine supported raw media range remains recognized. The exact prior blocker no longer reproduced at the compiled HTTP boundary. The new scanner at packages/@emulators/github/src/routes/contents.ts:63-97 tracks quoted and escaped characters before treating commas as range separators.
- P2: Raw Contents output preserves exact bytes and metadata, while ordinary JSON, directories, symlinks, submodules, and missing paths retain their intended behavior. The compiled route returned exact binary bytes with Content-Length and Vary: Accept, valid symlink target bytes, stored broken-link bytes, JSON submodule and directory representations, and 404 for a missing path.
- P3: Existing raw download URL behavior remains symlink-aware and exact. The shared resolveRawBlob() path at packages/@emulators/github/src/routes/contents.ts:136-139 preserved the existing raw URL behavior.

## Deterministic checks

- `exact checkout identity and cleanliness`: pass. Target checkout is clean and detached at dc3548304b0e07c43d08bdbfc8b903551f2bd55a.
- `base identity`: pass. The requested base 5b1fbf042466229d8b5d8de25d7ec737ef706637 resolves in the target repository.
- `GitHub head before and after`: pass. GitHub reported base 5b1fbf042466229d8b5d8de25d7ec737ef706637 and head dc3548304b0e07c43d08bdbfc8b903551f2bd55a at both identity checks.
- `covered`: pass. The exact-head run report path contains dc35483 and the pre-report coverage check was recorded.
- `style`: acknowledged. The generic gate flags an added em dash in packages/@emulators/github/README.md; repository AGENTS.md explicitly requires em dashes for prose punctuation.
- `surface sweep`: acknowledged. GitHub-specific required surfaces are updated. The generic rule also reports skills/emulate/SKILL.md and apps/web/app/docs/page.mdx because the CLI help file changed; those surfaces contain generic startup/configuration material and no GitHub Contents contract.
- `doc sibling sweep`: pass. Every repository file mentioning raw media is in the diff, with no stale matching line in a diffed file.
- `timing sweep`: pass. No wait ceiling was added.
- `shellmeta`: acknowledged. The gate falsely classifies HTTP parser code as a shell-metacharacter detector; no shell behavior changed.
- `execdeps`: pass. No external executable dependency map applies.
- `callers`: acknowledged. The unchanged packages/@emulators/github/src/index.ts:648 call only registers contentsRoutes(ctx); no pre-call state or changed outcome assumption exists.
- `rawinput`: acknowledged. The gate reports unrelated OAuth Accept comparisons at packages/@emulators/github/src/routes/oauth.ts:197 and :199; they do not implement Contents raw-media negotiation.
- `git diff --check`: pass. No whitespace errors.
- `pnpm build`: pass. The target head built successfully.
- `pnpm test`: pass. The repository test suite passed.
- `pnpm type-check`: pass. Type checking passed.
- `pnpm lint`: pass. Lint completed without errors; warnings were non-blocking.
- `pnpm format:check`: pass. Formatting check passed.
- `focused Contents and Commits suite`: pass. The focused suite passed, including the added quoted-parameter and special-entry tests.
- `focused repetition`: pass. The focused Contents suite passed repeatedly during the prior exact-head review run.
- `built HTTP boundary matrix`: pass. built-http-matrix.json records 26 cells and zero failures.
- `live GitHub Accept differential`: pass. live-github-accept-corpus.json records seven cases and zero failures.
- `packaged FX independent review`: acknowledged. The single packaged FX attempt timed out at 180 seconds and produced a failed receipt; it is not counted as a pass.
- `Test Strength`: acknowledged. Required exact-head receipt unavailable; built boundary evidence is retained but does not close the specialist receipt.
- `Resilience Audit`: acknowledged. Not triggered for this read-only representation change.

## Judgment lenses

- Inverse regression surface: run. Tested both false-positive quoted-token inputs and genuine raw ranges after quoted parameters.
- New-domain matrix: run. Regenerated the Accept and resource matrix for the new quote-aware parser and drove it through the built artifact.
- Resolution-rule consistency across consumers: run. Checked the Contents route and the existing advertised raw URL route after shared symlink-aware resolution.
- Deliberate-default check: run. Absent Accept, ordinary JSON, wildcards, vendor JSON, prefix lookalikes, q=0, directories, submodules, and missing paths were exercised.
- Fresh-seam scan: run. Inspected Accept scanning, route branching, symlink resolution, and Hono response construction.
- Substrate differential corpus: run. Compared the built emulator with live GitHub across the critical Accept grammar.
- Reference-implementation oracle: run. Used the live GitHub Contents API as the external behavior oracle.
- New-failure-outcome propagation: run. Forced submodule, broken symlink, and missing-path branches through the public route.
- Error-path forcing: run. Exercised missing paths and unresolved symlink behavior through the built server.
- Boundary pipeline trace: run. Traced Accept input through parsing, blob gating, symlink resolution, and HTTP serialization.
- Substrate verification: run. Observed real TCP response bodies and headers.
- Dogfood the built artifact: run. The compiled CLI was driven through public Contents endpoints.
- Newly-asserted invariant ownership: run. Checked the blob-only raw branch and shared raw resolver against all special entry classes.
- Docs-behavior parity: run. Changed documentation was compared with observed raw-file and JSON fallback behavior.
- Demonstrative example: run. The added raw Contents curl example requires the new route behavior.
- Choice audit: skipped. No decision trail was provided.
- Complexity budget: run. The scanner is a single linear pass over the Accept header; no nested scale-sensitive work was added.
- Shell re-parse append domain: skipped. The shellmeta output is an inapplicable false positive; this diff changes HTTP header parsing, not shell parsing.
- Security: skipped. The diff does not change authentication, authorization, secrets, origin validation, tenant isolation, sandboxing, or privilege.

## Findings

None.

## Gaps

- No exact-head Test Strength receipt was available for the changed HTTP Accept parser and content-negotiation adapter.
- The packaged FX independent review was attempted once and timed out after 180 seconds; no independent reviewer pass completed.
- No work-item manifest or separate Issue Contract was found.
- The generic surface gate reported skills/emulate/SKILL.md and apps/web/app/docs/page.mdx as absent for the CLI help surface; both were inspected and are not GitHub Contents semantic surfaces.
- The canonical skills-doctor identity check failed with a tooling TypeError, so the skill revision is recorded but its installed-package digest tie is unavailable.
- No canonical work-item manifest or separate Issue Contract was available.

## Limits and provenance

- Author model: human external author
- Reviewer model: GPT-5 Codex deterministic Review Gate; packaged FX reviewer timed out
- Same family: no
- Independent challenge: satisfied. GitHub's live Contents API independently defined the quoted-parameter, genuine-range, q=0, prefix-lookalike, and escaped-quote outcomes; the built emulator was driven over a real TCP listener against the same classes.
