# Case: Test the changed caller, not only its helper

Status: candidate
Validation: contributor-validated
Human review: contributor-complete
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Source: https://github.com/vercel-labs/portless/pull/355

## Observed failure

Single-app mode applied a git-worktree prefix to route names while the multi-app caller did not. A shared helper was covered by unit tests, but those tests could not prove the multi-app caller used it.

## Red signal

The public PR records an end-to-end test through the built CLI in multi-app mode. Reverting worktree detection in the caller turned that test red while helper unit tests stayed green.

## Method

1. Extract one prefixing helper shared by single-app and multi-app paths.
2. Drive the changed multi-app caller through the built CLI.
3. Use multiple applications inside a fake worktree.
4. Assert every registered hostname carries the branch prefix.
5. Remove caller wiring while retaining the test and require a behavior-specific failure.

## Outcome

- Fix: commit `e1b7b34`.
- Caller-level test: commit `fcc130b`.
- Delivery: PR open as of 2026-07-12.
- Maintainer acceptance: pending.

## Transferable lesson

> A helper test proves the helper. When behavior changes in orchestration, drive and mutate the changed caller.

## Foundry result

This case informed the first `prove-the-test` benchmark. The proposed exemplar did not improve behavior over the current skill, so it was rejected. The case remains useful evidence without entering agent context.
