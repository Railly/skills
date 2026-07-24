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

## CI confirmation gotchas (get the matrix green on the first run)

A cross-platform matrix is the best confirmation, but three things make the first
run fail for reasons unrelated to the bug. Handle them up front:

- **Fault-inject with a NATIVE binary, not a script.** The launcher execs your fake
  via `Command::new(path)`, which won't run a `.sh`/`.bat` on Windows and won't run
  `bun x.ts` anywhere. Compile once, cross-OS: `bun build fake.ts --compile
  --outfile fake` yields a real `.exe`/ELF/Mach-O the launcher runs directly. Tag
  the fake's child processes with a unique marker in **argv** (not env — argv is
  what `ps`/`Win32_Process.CommandLine` shows) so you can count them.
- **Bound every external call by PID; assume no self-timeout on Windows.** A CLI
  that returns in 90s on Unix can retry a connect (`os error 10060`) and hang past
  the job timeout on Windows, cancelling the job before it counts anything. Run it
  backgrounded and kill by PID after a fixed wait (portable across git-bash/unix);
  leave the daemon and orphan tree behind on purpose — that leftover IS the finding.
- **Your PowerShell counter self-matches its own marker.** `Get-CimInstance
  Win32_Process | ? CommandLine -match $MARK` catches the querying process too
  (its command line contains `$MARK`). Exclude it (`-notmatch 'CimInstance'`), or a
  constant +1 skews the count.
- **Free independent evidence: the runner's own reaper.** GitHub Actions prints
  `Terminate orphan process: pid (N) (name)` for anything alive at job end that it
  had to clean up. `grep -i "Terminate orphan process"` in the raw log — those
  lines are a second, tool-independent witness that your process tree leaked.

## References

`references/catalog.md` — the symptom → inspection table, plus five real worked
examples, each labeled with its honest certainty level (including two cautionary
cases where a convincing signature was wrong or got disconfirmed). Read it for the
specific inspection for a symptom class, or an example to pattern-match against.
