# Review Gate: vercel-labs/emulate PR #209

Date: 2026-08-25

Base: `d0219d05818adca4c12bb76ec79a7562c1766a3d`

HEAD: `017803c9c1486ad616d6dba958a0c7132efd23eb`

Verdict: FINDINGS, one confirmed defect.

## Finding

`acceptsRawContent()` splits `Accept` on every comma, including commas inside quoted parameter values. This valid header is one JSON media range:

```text
Accept: application/json; profile="foo,application/vnd.github.raw+json,bar"
```

GitHub returns its normal JSON envelope. The built emulator returns raw README bytes because the middle quoted fragment is misclassified as a standalone raw range. This was reproduced against a real TCP listener, not a route helper.

Exact successor: replace comma splitting with quote-aware media-range parsing. Add HTTP regressions proving that raw-looking text inside a quoted JSON parameter stays JSON and that a genuine raw range with a quoted-comma parameter still returns exact bytes. Preserve existing q-value behavior, vendor aliases, wildcards, symlink resolution, submodule JSON, and `Vary: Accept`.

## Test results

- `pnpm --dir <worktree> install --frozen-lockfile`: pass.
- `pnpm --dir <worktree> build`: 26/26 tasks passed.
- `node scripts/sync-versions.mjs --check`: pass.
- `pnpm --dir <worktree> format:check`: pass.
- `pnpm --dir <worktree> type-check`: 34/34 tasks passed.
- `pnpm --dir <worktree> lint`: 42/42 tasks passed, only pre-existing warnings.
- `pnpm --dir <worktree> test`: 33/33 tasks passed; GitHub 87/87.
- Focused GitHub suite: 4 files, 87 tests passed.
- Focused contents repetition: 5/5 passed.
- `git diff --check`: pass.
- Built-server behavioral matrix: all intended raw, JSON, wildcard, q-parameter, submodule, directory, symlink, missing, and default cells passed except the quoted-parameter false positive above.
- Test Strength: three call-path mutants killed for intended reasons; restored exact head passed both changed tests.
- Six live checks revalidated at exact head: all successful.

Radius identified `contentsRoutes -> githubPlugin -> default` as the convergence path. It under-covered heavily, with 20,845 unresolved calls versus 4,932 edges. The finding came from free exploration outside the map.

## Exemptions claimed

- Generic emulate skill and landing docs do not carry per-GitHub-endpoint semantics; the five GitHub service surfaces were updated.
- The package README's em dash follows the repository's explicit punctuation rule.
- Echoing the exact requested vendor raw type in `Content-Type` is not required by the stated contract; exact bytes are the normative property.

## Issue candidates

None.
