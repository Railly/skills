# Review gate: vercel-desktop v0.0.11

Status: pass with same-family reviewer warning.

The release commit changes only `CHANGELOG.md`, `app.zon`, and `package.json`, matching the v0.0.9 and v0.0.10 preparation pattern. Version `0.0.11` is synchronized across source metadata and the generated app bundle. The marked notes describe PR #9, the only merged product change since `v0.0.10`.

`pnpm release:check` passed with 158 tests, a ReleaseFast arm64 build, verified ad-hoc signing, and a valid DMG. The generated disk image has SHA-256 `df5c0596aa29528052efef5c192ec4d2875687847e4a4bd09982c35aeb519135`.

## Exemptions claimed

- Historical `0.0.10` release text is preserved; only its release markers moved to `0.0.11`.

## Issue candidates

None.
