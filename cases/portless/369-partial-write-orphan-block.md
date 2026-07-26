# Case: A partial write to a marker-delimited block in a foreign file leaves damage the remover cannot see

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-26
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/369; fix branch `railly/hosts-atomic-write` head `6504b97`, cut from main `15ef064`; defect reproduced against published `portless@0.15.4`

> Agent-authored record. The defect and both reproductions are this session's; no human has reviewed the issue (0 comments at the dated check).

## Observed condition or claim

portless manages a region of `/etc/hosts` delimited by `# portless-start` and `# portless-end`. Three properties combine into permanent, invisible corruption:

1. `fs.writeFileSync` writes in place (`hosts.ts:82-85`), so a write that cannot finish truncates the file mid-block and leaves no terminator.
2. `removeBlock` returns the content untouched when either marker is missing (`hosts.ts:45-52`), so `cleanHostsFile` finds nothing to remove and still returns `true`.
3. `getManagedHostnames` reads through `extractManagedBlock`, which needs both markers, so portless reports managing zero hostnames while its own half-written entries sit in the file.

A separate path reaches the same file from the other side: `readHostsFile` returns `""` on any read error (`hosts.ts:17-23`) and both write paths rebuild the whole file from what it returns, so a hosts file that exists but cannot be read is replaced by the portless block alone while `syncHostsFile` returns `true`.

The initial report was written around the read-failure path. Measuring reachability inverted the ranking: the read failure needs a permission asymmetry nobody configures on purpose, while a full disk is ordinary.

## Red signal

- Setup: a small filesystem, nearly full, holding the hosts file; register more hostnames than the free space can hold.
- Check: after the failed sync, can portless still see and remove its own block?
- Expected: either the write completes, or the file is left as it was.
- Actual: the file ends mid-hostname, `getManagedHostnames` returns 0, and `cleanHostsFile` returns `true` while leaving 155 stale entries. Freeing the disk does not help.
- Why trustworthy: driven against the published artifact, not a local build, with the real `/etc/hosts` inside a container.

## Method used

1. Ran the quality-baseline pass over the repository; `hosts.ts` ranked lowest on branch coverage among instrumented modules (54.16% lines) and its three write functions had no tests at all.
2. Read the module and framed the read-error swallow as a candidate; proved it with a red test before writing any fix.
3. Fixed both properties on a branch: rethrow anything that is not `ENOENT`, and stage the new content in a temp file in the same directory then rename it into place, preserving mode, ownership, and the resolved symlink target.
4. Filed the issue without the fix attached, so triage stays with the maintainer.
5. Only while estimating real-world reachability for the issue did the orphan-block mechanism surface. Two container runs were needed: a full filesystem with a small payload did **not** break, because `O_TRUNC` frees the old blocks before writing. Enlarging the payload past the free space produced the partial write.

## Outcome

Issue open, no maintainer response yet. Fix branch local with 9 added tests, 2 of which went red against the unfixed code; `hosts.ts` coverage moved from 54.16% to 92.75% lines and 64.28% to 100% functions.

Two honest limits on that branch:

- **The orphan-block mechanism has no regression test.** Temp-file-plus-rename prevents a partial write from ever being visible, so the branch fixes the defect by construction, but nothing on the branch drives the ENOSPC path or asserts the outcome. The two existing tests that mention an end marker predate this work and cover `extractManagedBlock` argument shapes.
- **The fix prevents new damage and does not repair existing damage.** `removeBlock` is unchanged, so a block already orphaned by an older version stays unremovable, and `portless clean` keeps reporting success on it.

A third finding is recorded in the conventions ledger rather than here: the branch widens what `syncHostsFile` returning `false` means, which falsifies the `Could not write ...` diagnosis that the in-flight PR #367 writes onto five surfaces. Disjoint files, clean merge, both suites green, so no automated check can see it.

## Evidence

- Source: `packages/portless/src/hosts.ts:17-23` (read swallow), `:45-52` (remover bails without a terminator), `:82-85` (in-place write), at main `15ef064`.
- Runtime: reproduced twice in a container against `portless@0.15.4` and a real `/etc/hosts`. Read-failure path with mode `0222` and a non-root caller: returned `true`, file left holding only the portless block. Partial-write path on a 64K tmpfs filled to capacity with a 2000-hostname payload: `syncHostsFile: false`, `end marker: false`, `getManagedHostnames: 0`, `cleanHostsFile: true`, block still present, last line `127.0.0.1 app15`.
- Tests: 9 added on the fix branch; the fail-closed pair went red first (`expected true to be false`). No test drives the partial-write path. 752 of 757 in the suite pass; the 5 failures are a pre-existing coupling to the git branch name, reproduced on an untouched sibling branch.
- Review: none. Issue #369 open with 0 comments as of 2026-07-26. Branch has no PR.
- Artifact: defect confirmed on the published npm artifact `portless@0.15.4`, so it is shipped behavior rather than a property of a working tree.

## Transferable lesson

> A tool that manages a marker-delimited region inside a file it does not own needs two guarantees, not one: the write is atomic, and the remover tolerates a block whose terminator is missing. Requiring both markers turns any partial write into damage the tool cannot see, cannot remove, and reports as clean.

- Why it transfers: the managed-block pattern is everywhere (`/etc/hosts`, `~/.ssh/config`, shell rc files, `nginx.conf` includes), and the remover is almost always written against the well-formed case that the writer is assumed to produce.
- Where it does not apply: files the tool creates and owns outright, which can be regenerated, and formats with a self-describing length or a checksum that makes a truncated region detectable.

## Exceptions

Atomic replacement is not a durability guarantee. Temp-file-plus-rename removes the window where a partial write is visible, but without `fsync` on the file and its directory a power loss can still lose the rename. The claim here is bounded to interrupted and space-exhausted writes, not to crash consistency.

`rename` also replaces the inode, so mode, ownership, and symlink resolution must be carried over deliberately. Skipping that trades one silent corruption for another.

## Candidate changes

- Reference rule: add a managed-block-integrity lens, triggered when a diff writes a marker-delimited region into a file the tool does not own, requiring both an atomic write and a remover that handles a missing terminator (this case as provenance).

## Confidentiality review

Public repository, public issue, and the author's own branch. No secrets, customer data, private review text, or local paths. Reproductions run in throwaway containers with synthetic hosts entries.
