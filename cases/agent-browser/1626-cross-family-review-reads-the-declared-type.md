# Case: agent-browser #1626: the adversarial value came from the protocol's type, not from the reviewer's sense of "big"

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-30
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: PR #1626, branch `feat/configurable-screencast-quality`; recreates community PR #633 by @WebCloud, closes #632

> Contributor-validated. The PR is open and unreviewed by the maintainer. The reviewer referenced below is an independent model on a different family, not a human.

## Observed condition or claim

A change made the screencast encoder configurable through three environment variables, so a bandwidth-constrained consumer could trade quality for bytes instead of dropping frames. Values are parsed as `u32`, and a value that cannot be used falls back to the default, on the stated principle that a stream which silently stops is worse than one that ignores a typo.

The author drove the parse end to end against real Chrome with what looked like an adversarial set: `0`, `-100`, `abc`, and `99999`. All four behaved correctly, falling back to the viewport, and the pass was read as coverage of the input domain.

## Red signal

An independent reviewer on a different model family picked `4294967295` and the stream delivered zero frames.

CDP declares `maxWidth` and `maxHeight` as signed integers. A `u32` above `i32::MAX` makes Chrome reject the whole `Page.startScreencast` call, the caller discards that error with `let _ =`, and the daemon continues to report a healthy screencast while no frame ever arrives. Confirmed on the built binary: `4294967295` delivered zero frames, `2147483647` and `99999` delivered normally.

Every value the author chose was under `i32::MAX`. They were picked by magnitude intuition, which produces round decimal numbers and never lands on a type boundary that exists only because the code parses into a wider type than the protocol accepts.

The same reviewer raised a second finding the author's tooling could not reach: the diff asserted "stream frames are always jpeg" in a code comment and on three doc surfaces, while a second entry point, `screencast_start`, reconfigures the same shared screencast. The reviewer marked it speculative because its sandbox could not launch a browser. Driving it locally confirmed it: a connected client's frames switched from JPEG to PNG magic bytes mid-stream while the dashboard decodes with a hardcoded `image/jpeg`.

## Method used

The reviewer was given a mission with the subsystem model, not just the diff: how many screencasts exist, who shares them, why encoding must be daemon-global, and which three design decisions deliberately diverged from the community PR being recreated. It was asked to find what was wrong, and told explicitly that a correct decision deserved one line rather than padding.

Both findings were re-verified locally before being acted on, which mattered: the author had edited the worktree while the reviewer was running, so its line citations pointed at an intermediate tree.

The fix for the first bounds the parse at `i32::MAX`, so an oversized value falls back like any other unusable input. The guard goes red without the bound. The fix for the second rewrites the claim on all four surfaces to describe the reconfiguration, since the invariant is not one this code can keep.

## Outcome

Both fixed and verified: `4294967295` now falls back and frames resume, and the four surfaces no longer promise an invariant a second entry point can break. The shared-screencast hijack itself is recorded as an issue candidate, adjacent to #1358, since deciding who owns the screencast is a design change rather than a bandwidth fix.

The measured payoff of the feature is unchanged: quality 20 at 640x360 gives 9 KB frames against 54 KB at the default, with frame rate unchanged.

## Evidence

- Source: PR #1626, four commits, open at the dated check.
- Runtime: release binary against local Chrome. `MAX_WIDTH=4294967295` delivered zero frames before the bound and 1280x577 frames after. Format switch observed as base64 magic bytes changing from `ffd8ffe0` to `89504e47` on a live connection after an explicit `screencast_start`.
- Tests: 1058 unit tests pass. Eight mutations forced red one at a time, including removing the `i32` bound.
- Review: one independent pass, `openai/gpt-5.6-sol` at high reasoning effort, different model family from the author. Two findings, both confirmed. Two earlier attempts on other branches died before reading the diff, so this was the first cross-family review in this repository that completed.
- Artifact: `check-version-sync.js` and the project's own surface gate pass; the env vars are documented on five surfaces.

## Transferable lesson

**Where a value crosses into a typed external protocol, derive the adversarial cases from the declared type, not from magnitude.** For an integer field the cells are zero, negative, the declared type's maximum, and the maximum of the wider type the code parses into. Only the last one is invisible to intuition, and it is the one that exists because of an impedance mismatch the code itself introduced. Reading the protocol's own declaration takes a minute and replaces guessing about what counts as a large number.

**An invariant a diff newly asserts is a claim, at the same bar as a finding.** Stale-value and sibling sweeps cannot reach it, because a newly written claim contradicts nothing older. Driving the happy path cannot reach it either, since the path the author had in mind is the one that satisfies the claim. The question that reaches it is who else writes the state the sentence names.

On cross-family review specifically: the value here was not that the reviewer was smarter. It read the substrate's own declaration where the author reasoned from a mental model of the substrate. That is a different failure surface, which is the argument for a different family rather than a second pass from the same one.

## Exceptions

The reviewer could not launch a browser, so every empirical claim it made was speculative and had to be confirmed locally. A cross-family review without substrate access finds reasoning errors and misses behavior.

Editing the tree under a running reviewer invalidated part of its output. The findings survived because they were re-verified, which is not a substitute for freezing the tree.

The `i32` boundary conclusion is specific to CDP's declaration. Another protocol may accept unsigned values, and the rule is to read the declaration rather than to assume this bound.

## Candidate changes

- Reference rule: substrate differential corpus gains a clause about deriving cells from the substrate's declared types. Recorded in the lens catalog.
- Reference rule: a new lens for invariants a diff newly asserts. Recorded in the lens catalog.
- Reference rule: freeze the tree while a reviewer runs. Recorded in the method.

## Confidentiality review

Public repository, public pull requests, author's own contribution recreating a public community PR with credit. Excluded: private discussion, quoted review text beyond the author's own tooling output, participant names beyond public GitHub handles already on the PRs, schedule commitments, filesystem paths, and any neighboring project.
