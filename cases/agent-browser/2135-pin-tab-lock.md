# Case: pinned tabs locked across sessions, first run of the new core

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-10-16
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/issues/1790, https://github.com/vercel-labs/agent-browser/pull/2135, https://github.com/vercel-labs/agent-browser/issues/2134, https://github.com/Railly/skills/pull/40
Enforcer: check: bash skills/gate/scripts/test-correct-gates.sh (with skills/.experimental/verify-setup/scripts/test-scaffold-check.sh and test-fresh.sh)

## Observed condition or claim

A second session could `tab <targetId>` onto a tab another session pinned with `--pin-tab`. First issue run end to end with contract, loop, verify-setup, gate and correct.

## Red signal

The `pin-tab-ownership` driver failed on main `dac13bb8`: session B took A's pinned tab with exit 0.

## Method used

Contract classified it heavy and stopped for the owner, who chose enforcement. Shape S1 reads other sessions' `.target` bindings and checks the owner daemon's pid. A subagent implemented; the orchestrator re-ran every driver independently.

## Outcome

PR 2135 adds `tab_locked`, releases the pin on explicit `close`, and updates README, skill reference and docs. Five driver runs, `gate.sh verify` (fmt, clippy, full tests), and the docs route suite pass. Signed commit, `gate.sh drift` passed on the reviewed patch-id.

## Evidence

- Source: PR 2135 head `fdeede73`, base `dac13bb8`.
- Runtime: macOS arm64, headless Chrome, debug build.
- Tests: `pin-tab-ownership` 4 cases x5, `cargo test` via check.sh, docs `test:routes` 439/439.
- Review: orchestrator review found five issues the subagent reported green.
- Artifact: before/after terminal captures in the PR body.

## Transferable lesson

A subagent PASS is not evidence. Independent re-runs caught a close race (one green run hid it), close failing on a corrupt binding, docs contradicting the change, a frozen docs line overwritten, and an untested re-pin path. Every mistake that depended on memory (PR body format, `git add -A`, a stale kit copy, `fresh.sh` trusting an older pass) escaped until a check existed.

## Exceptions

The close race itself is pre-existing on main (1/20) and filed as 2134, not fixed here.

## Candidate changes

- Deterministic check: `gate.sh prbody`, `gate.sh scope`, `scaffold.mjs --check`, `fresh.sh` latest-observation rule.
- Skill method: loop reruns subagent work itself and repeats timing-sensitive drivers; gate high-risk uses a different model family by default.

## Confidentiality review

Public issue and PRs only; no local paths or private material.
