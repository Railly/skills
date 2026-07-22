# native: the arrow-forwarding patch reverted a feature shipped that same day

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: not applicable (patch withdrawn before push)
Delivery: withdrawn before push
Visibility: public
Repository: vercel-labs/native
Role: contributor
Source: https://github.com/vercel-labs/native
Upstream status checked: 2026-07-22

**Repo:** vercel-labs/native · **Change:** `feat/single-line-arrow-forwarding` (5 files, +58/-3) · **Outcome:** patch withdrawn before push; replaced by a pure-userland approach the same day's release had just enabled.

## Context

Building a command palette (cmdk pattern) for markup+TS apps on the Native SDK. Plain ArrowUp/Down while the query field is focused could not reach the app: three runtime layers consumed vertical arrows on single-line text fields (the retained editor mapped them to caret start/end jumps, the spatial focus pass moved focus off the field, and the ui-app fallback gate ate every key on an editable kind). A 3-site patch made single-line fields forward unmodified vertical arrows to `Options.on_key`. It worked, was validated live through the automation harness, and was queued for an upstream PR.

## What the gate caught

Running the target repo's own deterministic gate (`scripts/gate.sh fast <base>`) before the push:

- **2 test failures**, both from the feature the SDK team had shipped THAT DAY (v0.5.2 "Escape reaches your core" / edit-derivation seam). One test's comment literally names "the single-line ArrowUp/Down caret jumps" as behavior that must reach the model. The behavior my patch removed was not an oversight to fix; it was a deliberate, tested, hours-old feature.
- **bench-check failed** — but re-running it on the clean base commit failed identically: machine-dependent render budgets, not the diff. Exemption with evidence, and an upstream issue candidate.
- Missing surfaces: no `changelog.d/` fragment, and four documentation sites (skill-data mirrors, the in-code `Options.on_key` doc comment) still described the rule the patch changed.

## The reversal

The same release that made the patch wrong made it unnecessary. v0.5.2's edit-derivation seam stamps every keyboard-driven editor mutation onto the dispatched event, so `on-input` now hears the single-line arrow jumps as `move_caret{start|end}` edits. A palette core can reinterpret those edits as list navigation — no runtime change, no key fallback, pure userland. Implemented as `examples/command-palette` on stock v0.5.3 and verified through the automation harness (including the critical assumption: a repeated ArrowDown with the caret already at the end still stamps an edit).

## Lessons

1. **Deliberate-default check (lens).** A diff that changes existing default behavior must prove the current behavior is accidental: search the tests that assert it and the recent changelog/release notes that shipped it. Behavior with same-day tests asserting it is a feature; the change must become opt-in or a design conversation, never a silent default flip. My patch survived my own reasoning, live validation in a real app, and a written design rationale — only the repo's test suite knew the behavior was intentional.
2. **Fresh-seam scan (lens).** Before patching a runtime to expose a signal to app code, scan the latest release notes for a seam that already carries it. The capability often just shipped through another door: the edit-derivation seam was hours old and carried exactly the signal the patch existed to expose.
3. **The target repo's own gate outranks your review.** `scripts/gate.sh fast` (the repo's affected-only suite mapping) found in 5 minutes what three layers of my own verification missed. When the target repo ships a gate, running it is step zero of the deterministic layer, before any generic checks.
4. **Same-day releases are high-risk bases.** The patch was written against a release that was 2 hours old; its release notes described the exact subsystem being patched. Reading the current release's notes for the touched subsystem would have surfaced both the conflict and the solution before any code was written.
