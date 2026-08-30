# Test Strength: compiled knowledge

Date: 2026-08-29
Repository: Railly/skills
Head: `a7e38d32bb42392261a26c307438c0a1aa24363b`
Status: contributor-validated

## Behavioral model

Invariant: authored knowledge accepts only valid typed relationships and safe retrieval handles, then produces deterministic projections that preserve their semantics. The audit accepts only reviewed exact-token matches for the current corpus.

| Dimension | Accepted class | Rejected classes | Evidence |
|---|---|---|---|
| Metadata | JSON under the required heading | missing block, malformed JSON, wrong kind or schema | parser and validator tests |
| Public evidence | existing tracked repository file whose real path stays inside the checkout | missing, absolute, traversal, outside real path, Git internals, untracked local file | validator tests and real Git index |
| Private evidence | `private:<system>:<id>` opaque token | paths, URLs, variables, expansion syntax, free-form text | validator corpus and independent review probes |
| Decision | existing tracked file under `foundry/` | Git internals, cases, missing files, outside real path | validator tests and independent review probes |
| Graph relationship | known endpoints, type, and status | unknown endpoints, unknown type, missing reverse link | validator and generated-edge test |
| Textual match | exact lowercase skill token grouped by file | substring collision, new match, removed match, changed matching line, draft rationale | audit tests and committed 276-pair audit |
| Projection | stable sorted index, coverage, graph, and audit summary | stale or missing generated output | repeated compile and check commands |
| Maturity | advisory mismatch by default | unsupported non-experimental maturity under strict mode | validator test and four visible catalog warnings |

Excluded: semantic interpretation of whether a reviewed source truly proves application remains a maintainer judgment recorded in the audit rationale. Automatic procedure mutation and strict maturity enforcement are outside this slice.

## Independent oracle

- `NORTH.md` and `foundry/knowledge/README.md` define the product and confidentiality contracts independently of the implementation branches.
- `git ls-files` is the repository-membership oracle for public evidence and decisions.
- Filesystem real paths are the containment oracle for symlink and traversal boundaries.
- Authored Markdown pages are the source oracle for generated projections. The compiler output is compared byte-for-byte across repeated runs and against committed files.

## Falsification

All mutations ran in an isolated detached worktree at the reviewed head and were restored from explicit inverse patches.

| Mutation | Intended red signal |
|---|---|
| Replace the opaque private-pointer grammar with `private:.+` | local-path corpus test failed because invalid pointers were accepted |
| Remove tracked-file enforcement for public evidence | `.git/config` and untracked-file test failed |
| Remove Foundry and tracked-file restrictions from decisions | non-Foundry decision test failed |
| Replace exact-token matching with substring matching | `alphabet` became an extra `alpha` match and the audit test failed |
| Drop relationship status from generated edges | graph projection assertion failed |
| Point evidence at a missing case | knowledge validation failed on the exact missing path |
| Change authored pattern content without recompiling | projection check reported stale index and graph |
| Change an audited matching line | audit check reported the exact stale fingerprint key |

After restoration, 17 focused tests passed with 40 expectations. Knowledge validation, projection checking, and the 276-pair audit all passed.

## Real boundary and producer

The real producer boundary was the repository's authored Markdown, maturity registry, existing case corpus, and actual Git index. The public commands read those sources and verified committed Markdown and JSON projections. No synthetic object replaced the final repository drive.

## Determinism and cost

The focused suite passed five consecutive runs after restoration. Each run completed in roughly half a second. The same tests and all three knowledge commands are now in pull-request CI.

## Failure partition and retry

The compiler's generated-file write boundary was forced to fail in an isolated exact-head worktree by removing write permission from the third projection. A changed authored pattern caused the index to commit before the graph write failed with `EACCES`; the graph and later audit projection remained unchanged. After restoring the injected permission, retrying the same compile operation succeeded and the check mode passed. Reverting the source mutation and recompiling restored every projection to its baseline hash and left the worktree clean.

## Remaining gaps

- Radius indexed no changed `.mjs` symbols and reported 42 unresolved calls, so it was recorded as under-covering and supplied no safety claim.
- Strict maturity enforcement remains intentionally red for four documented evidence gaps.
