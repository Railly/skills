Review the frozen exact-head state of external PR #209 in /Users/raillyhugo/Programming/vercel/emulate-209-review read-only.

Identity:
- repository: vercel-labs/emulate
- base: 5b1fbf042466229d8b5d8de25d7ec737ef706637
- head: dc3548304b0e07c43d08bdbfc8b903551f2bd55a

Review only the base-to-head diff and the current checkout. Do not edit files, commit, push, comment, merge, or mutate GitHub. Focus on:
- whether acceptsRawContent() correctly handles commas and escaped quotes inside quoted Accept parameters;
- whether raw-looking parameter text can still select raw bytes;
- regressions across supported aliases, q=0, wildcards, case, directories, ordinary files, valid and broken symlinks, submodules, missing paths, exact bytes, Content-Length, Content-Type, and Vary;
- any other concrete P0, P1, or P2 blocker.

The compiled CLI has been exercised over TCP on localhost:43127. Read the successful evidence at:
/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-08-31-emulate-209-dc35483/built-http-matrix.json

Return concise findings only, with file and line evidence where applicable. Distinguish confirmed findings from gaps and state when no blocker is found.
