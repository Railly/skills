# emulate PR 209 media-type corpus

Target: `017803c9c1486ad616d6dba958a0c7132efd23eb`

Independent oracle: GitHub REST API at base commit `d0219d05818adca4c12bb76ec79a7562c1766a3d`, plus GitHub's OpenAPI description for `GET /repos/{owner}/{repo}/contents/{path}`.

## Confirmed defect

Request header:

```text
Accept: application/json; profile="foo,application/vnd.github.raw+json,bar"
```

This is one JSON media range. The raw-looking text is inside a quoted parameter value.

- GitHub: `200`, `Content-Type: application/json; charset=utf-8`, 2059-byte JSON envelope.
- Built emulator over TCP: `200`, `Content-Type: application/vnd.github.raw`, body `# quoted-accept\n`.

Cause: `acceptsRawContent()` uses `accept.split(",")`, so quoted commas create a false media range equal to `application/vnd.github.raw+json`.

Exact successor: replace comma splitting with quote-aware media-range parsing. Add two HTTP regressions: raw-looking text inside a quoted JSON parameter remains JSON; a genuine raw range carrying a quoted-comma parameter still returns exact bytes. Keep existing vendor aliases, wildcard behavior, GitHub-compatible quality behavior, submodule JSON behavior, symlink resolution, `Vary: Accept`, and default JSON.

## External TCP matrix

The built `emulate` CLI served GitHub on `localhost:43127`. Repository state, binary content, directories, symlinks, and a submodule were created through public GitHub HTTP endpoints.

- Exact bytes `[0,1,2,127,128,255,10]` returned for `application/vnd.github.raw`, `raw+json`, `v3.raw`, `v3.raw+json`, comma lists, parameters, `q=0`, competing qualities, and case variation.
- Base64 JSON returned for absent Accept, `*/*`, `application/*`, `application/json`, `application/vnd.github+json`, and `application/vnd.github.rawfoo`.
- Valid symlink returned target bytes. Broken symlink returned its stored link text.
- Submodule, directory, repository root, README, and missing-path responses stayed JSON.
- File representations carried `Vary: Accept`; raw bytes carried the exact `Content-Length`.

## Mutation evidence

All mutations were made in a detached temporary worktree and removed afterward.

1. `acceptsRawContent()` forced to `false`: focused test failed because `application/vnd.github.raw+json` returned `application/json; charset=UTF-8` instead of raw.
2. Blob-only guard removed: submodule request with raw Accept failed `404` instead of `200` JSON.
3. Symlink resolution removed from `resolveRawBlob()`: raw symlink returned `target.txt` instead of target bytes `target\n`.
4. Exact-head restoration: both changed tests passed together, 2 passed and 61 skipped.

## Determinism

The focused contents test file passed five consecutive runs. The complete repository test command also passed.
