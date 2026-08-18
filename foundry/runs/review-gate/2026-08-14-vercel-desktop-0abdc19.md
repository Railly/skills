# Review gate: vercel-desktop v0.0.10

Status: pass with same-family reviewer warning.

The release commit changes only `CHANGELOG.md`, `app.zon`, and `package.json`, matching the v0.0.9 preparation pattern. Version `0.0.10` is synchronized across source metadata and the generated app bundle. The marked notes describe PR #7, the only merged product change since `v0.0.9`.

`pnpm release:check` passed with 157 tests, a ReleaseFast arm64 build, verified ad-hoc signing, and a valid DMG. The release workflow's artifact checks also passed locally.

## Exemptions claimed

- Historical `0.0.9` release text is preserved; only its release markers moved to `0.0.10`.

## Issue candidates

None.
