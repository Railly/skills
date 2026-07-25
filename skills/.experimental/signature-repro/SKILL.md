---
name: signature-repro
description: "Candidate: Root-cause a bug you cannot reproduce because it needs another OS or hardware you don't have, by detecting its structural OR visual signature on the machine you DO have. Use whenever you're about to write cannot-reproduce-needs-Windows/Linux/a-device/a-monitor, when a bug is platform-specific but you're on a different platform, when a visual bug (black rectangle, phantom window, broken layout) supposedly needs a real display, or any moment the honest-but-lazy move is not-reproducible-on-my-machine. For process/install bugs the cause is usually a file descriptor, spawn flag, missing binary, or keychain item observable via lsof/ps/tar/security; for visual bugs, capture the screen and LOOK with your own vision (never a pixel-diff) and cross-check with a window enumeration. Experimental, awaiting baseline evaluation."
---

# Signature over symptom

When a bug is platform-specific and you're on a different platform, the tempting
move is "cannot reproduce, needs <that OS/hardware>." That's often a framing
error. The **symptom** may need the hardware; the **cause** usually doesn't.

A platform-specific symptom is almost always produced by a platform-independent
mechanism: a leaked file descriptor, a wrong/missing spawn flag, a window surface
that paints wrong, a binary missing from an artifact, a keychain item from a
bundle id. Each leaves a **structural signature** observable on the machine you
already have. The bug crashes on Windows, but *why* it crashes is visible on your
Mac. Done well this beats reproducing the symptom: you hand a maintainer the exact
fd or missing flag, more actionable than "repros for me too."

## Certainty levels — label every finding as one (read first)

A signature is a HYPOTHESIS, not proof. Never say "root cause confirmed" unless
you closed the loop.

- **CONFIRMED** — signature observed AND confirmed (the fix removes the symptom,
  or a cross-platform run shows the symptom exactly where the mechanism predicts
  and nowhere else). Only this earns "root cause".
- **STRONG HYPOTHESIS** — signature observed (a real fd, a missing flag), the
  mechanism plausibly explains the platform-specificity, but you did NOT confirm
  the fix works. Most findings land here. Say "suspected cause, by signature".
- **INFERENCE** — reasoned about the mechanism, no observable local signature.

The failure mode to avoid: seeing a missing flag and declaring victory. A missing
flag is a lead, not a proof. If you can't confirm, say STRONG HYPOTHESIS honestly.

## Before you invest: is it already fixed?

Before repro'ing or writing a fix, check whether a fix already exists — search the
tracker for PRs that reference the issue (`gh issue view N --json` timeline, or
`gh pr list --search "N in:body"`), and read the closed ones too. A generic
"related PRs" graph tool can miss these; the issue's own timeline cross-references
are authoritative. If an open PR already fixes it, your value is NOT a duplicate
fix — it's whatever that PR lacks: an independent repro, a cross-platform
confirmation (most community fixes are confirmed on one OS only), or a missing test
case. Building a parallel fix you can't merge, or opening a competing PR, is wasted
work. (This session: a from-memory "no competing PR" was wrong — two PRs already
fixed it identically; the real contribution was confirming the open one on the two
OSes nobody had tested.)

## The method

1. **State the mechanism hypothesis.** What class of thing produces this symptom?
   Hang → held fd / unclosed pipe. Early exit → not detached, rejected sandbox, or
   an undrained captured pipe. Visual artifact → a window surface. Install fail →
   missing binary or engines constraint. Wrong auth → keychain / bundle id.
2. **Find its signature on your machine.** Inspect the process/artifact, not the
   screen (for visual bugs, see below). `references/catalog.md` maps symptom → the
   exact inspection command.
3. **Explain why it's platform-specific but the cause isn't.** The mechanism must
   predict why it only breaks on the reported OS. If it doesn't, the hypothesis is
   wrong — go back to step 1.
4. **Confirm — this turns a hypothesis into a root cause.** Do at least one:
   (a) cross-platform contrast on real machines (a GitHub Actions matrix gives real
   Windows/Linux/macOS boxes for minutes, free; the controls where the symptom
   should NOT appear matter as much as the target); or (b) fix-and-verify (apply
   the implied fix, show the symptom disappears). If you can do neither, it's a
   STRONG HYPOTHESIS — label it. Confirmation can DISCONFIRM, and that's the point.
   **Force the defective path; don't wait for its natural trigger.** If your repro
   depends on the bug's real-world precondition firing (e.g. "the launch fails only
   on Windows"), that precondition may not fire on CI and you'll burn runs on a
   disconfirm that proves nothing. Instead inject the fault so the exact defective
   branch runs on EVERY platform, controls included. Then the mechanism — not the
   platform's mood — decides the outcome. (Worked example: to hit a launch error
   path, point the launcher at a fake browser that spawns a child tree and never
   opens its port, forcing the timeout branch identically on all three OSes.)
   **Confirm the fix with an ISOLATED probe, not a live-system count.** Counting
   surviving processes after driving the real daemon is often confounded: a daemon
   that retries the failing operation keeps one attempt in-flight at all times, so
   the count reads a constant (e.g. "3 orphans") on BOTH the buggy and the fixed
   build — it can't discriminate. The decisive verification is the fix's own unit
   test built and run on each OS (deterministic, no daemon), or a single-shot call
   to the faulty function. When the end-to-end count won't discriminate, say so —
   don't report a confounded number as a contradiction.
5. **Write cause + fix direction + certainty label**, citing the exact signature.

## Visual bugs: capture and LOOK

Some bugs ARE the screen (black rectangle, phantom window, broken layout). The
structural signature alone isn't enough — you have to see it:

1. **Capture with whatever the OS gives** (agnostic): `screencapture` (macOS),
   `import`/`scrot` under X (Linux), GDI `CopyFromScreen` via PowerShell (Windows),
   or any computer-use CLI. On CI, capture the runner's desktop and upload it.
2. **LOOK at it yourself — you have vision.** Do NOT trust a pixel-diff heuristic;
   in real use one gave a false NOT-REPRODUCED on a phantom-window bug, and looking
   at the actual capture settled it.
3. **Capture before/during/after** — the bug usually appears while the session is
   alive and vanishes when you kill the tree.

**The contradiction pattern**: the strongest visual confirmations come from a
disagreement between two observations of the same moment — e.g. a Chrome surface
clearly drawn in the screenshot, yet `Get-Process | where MainWindowTitle` lists
ZERO titled windows. A visible surface the window manager doesn't track IS the bug
(a phantom, software-drawn surface). Cross two cheap observations and let their
disagreement be the signature.

## References

`references/catalog.md` — the symptom → inspection table, plus five real worked
examples, each labeled with its honest certainty level (including two cautionary
cases where a convincing signature was wrong or got disconfirmed). Read it for the
specific inspection for a symptom class, an example to pattern-match against, or
the cross-platform CI confirmation checklist.
