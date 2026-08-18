# Review Gate: wterm Kitty plain-text release fix

- Date: 2026-08-18
- Repo: `vercel-labs/wterm`
- Branch: `feat/kitty-keyboard-protocol`
- Base: `cdff1c07890ab2c5ba2efbcc1091f790dfb8f931`
- Head: `f5f9c925e4a5e39585a8822c6b6ba1057e2ae909`
- External finding: Vercel Agent Review on PR #120

## Verdict

Pass for push. The external finding was reproduced, fixed, and protected at both encoder and DOM boundaries.

With Kitty flags set to `2`, the old code emitted `"a"` on keydown and `CSI 97;1:3u` on keyup. The fixed code emits only `"a"`. The counterexample remains covered: `Ctrl+a` with event reporting still emits `CSI 97;5:3u`.

## Verification

- Force-red: the new encoder and DOM regressions failed on the exact spurious release before production code changed.
- Restored green: 169 DOM tests passed after the fix.
- Prettier check passed.
- Full type-check passed, 22/22 tasks.
- Full lint passed with one pre-existing docs warning.
- Full test matrix passed.
- Full build passed, 15/15 tasks.
- Browser E2E passed, 17/17 tests.
- `git diff --check` passed.

## Gate miss harvest

The prior matrix tested individual press-oriented flags and all flags together, but not `report event types` without `report all keys`. The wterm conventions now require independent Kitty flag states, including the opposite direction where modified text remains reportable.

## Exemptions claimed

- No documentation update is required because the existing public text describes negotiated flags without promising plain-text releases when report-all is disabled.

## Issue candidates

None.
