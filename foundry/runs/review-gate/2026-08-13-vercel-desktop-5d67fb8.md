# Review gate: vercel-desktop v0.0.9

Status: pass with same-family reviewer warning.

The release commit changes only `CHANGELOG.md`, `app.zon`, and `package.json`. Version `0.0.9` is synchronized across source metadata and the generated app bundle. The marked notes match the product changes merged after `v0.0.8`.

`pnpm release:check` passed with 147 tests, a ReleaseFast arm64 build, verified ad-hoc signing, and a valid DMG. The release workflow's artifact checks also passed locally.

## Exemptions claimed

- Historical `0.0.8` release text is preserved; only its release markers moved to `0.0.9`.

## Issue candidates

None.
