# 241: portless's node shadowed the version manager's

- PR: vercel-labs/portless#448 (recreates #442 by @Knat-Dev, supersedes #247 by @octo-patch; both credited). Head 9a886b9.
- Gate run: `foundry/runs/review-gate/2026-10-01-portless-442/` (pass, cross-family FX review, Windows CI 36955436832).

## Defect
`augmentedPath` built `[node_modules/.bin, portless node dir, caller PATH]`, so child commands ran portless's node instead of the one asdf/nvm/fnm/mise put first.

## Fix
`[node_modules/.bin, caller PATH, portless node dir]`, empty segments dropped. #247's Windows-only injection was rejected: it keeps the bug on Windows and removes the fallback on Unix. This also replaces the July local branch `railly/issue-241-preserve-user-node` that followed #247.

## Evidence
- Built CLI with a stand-in version-manager `node` first on PATH: main runs portless's node on macOS and Windows; fix runs the stand-in. With no node on PATH, `.cmd` wrappers on Windows still resolve portless's node.

## Lesson
Appending a fallback satisfies both the precedence and the "node not recognized" constraints; dropping it satisfies only one. Issue candidate: multi-app spawn on Windows (cli.ts:3653, 3719) keeps a stale `Path` beside the augmented `PATH`.
