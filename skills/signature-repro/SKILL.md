---
name: signature-repro
description: Root-cause a bug you cannot reproduce because it "needs another OS or hardware you don't have", by detecting the bug's structural OR visual signature on the machine you DO have. Use this whenever you are about to write "cannot reproduce, needs Windows/Linux/a device/a real monitor", when a bug report is platform-specific but you're on a different platform, when a visual bug (black rectangle, phantom window, broken layout, misrender) supposedly needs a real display, or when reproducing the symptom is blocked by environment. Strongly prefer this over giving up: for process/install bugs the CAUSE is usually a file descriptor, spawn flag, missing binary, or keychain item observable anywhere via lsof/ps/tar/security; for visual bugs, capture the screen and LOOK with your own vision (never trust a pixel-diff heuristic) and cross-check with a window enumeration. Triggers include "I can't reproduce this Windows bug on my Mac", "this needs a real device", "no repro without a display", "there's a black rectangle / ghost window only on their machine", triaging cross-platform issues, or any moment the honest-but-lazy move would be "not reproducible on my machine".
---

# Signature over symptom

When a bug report is platform-specific and you're on a different platform, the
tempting move is: "cannot reproduce, needs <that OS/hardware>." That is often a
framing error, not a real limit. The **symptom** may need the hardware. The
**cause** usually does not.

A platform-specific symptom is almost always produced by a platform-independent
mechanism: a leaked file descriptor, a wrong or missing process-spawn flag, a
window surface that paints wrong, a binary missing from a published artifact, a
keychain item derived from a bundle id. Each of those leaves a **structural
signature** you can observe on the machine you already have. The bug crashes on
Windows, but *why* it crashes is visible on your Mac.

Done well, this beats reproducing the symptom: you hand a maintainer the exact
file descriptor or the exact missing flag, which is more actionable than "it
repros for me too." You can out-diagnose the reporter who has the hardware,
without it.

## Be honest about certainty (read this first)

Finding a signature gives you a HYPOTHESIS of the cause, not proof. There are
three distinct certainty levels, and you must label your finding as one of them.
Do NOT call a signature finding "root cause confirmed" unless you actually closed
the loop.

- **CONFIRMED**: you observed the signature AND confirmed the mechanism — either
  the fix removes the symptom, or a cross-platform run shows the symptom appears
  exactly where the mechanism predicts and nowhere else. This is the only level
  that earns the words "root cause".
- **STRONG HYPOTHESIS**: you observed the signature (a real fd, a missing flag)
  and the mechanism plausibly explains the platform-specificity, but you did NOT
  confirm that fixing it removes the symptom. Most signature findings land here.
  Say "suspected cause, by signature" — not "root cause".
- **INFERENCE ONLY**: you reasoned about the mechanism but could not observe its
  signature locally. Weakest. Say what environment would confirm it.

The failure mode to avoid: seeing a missing flag and declaring victory. A missing
flag is a strong lead, not a proof. The proof is the confirmation step. If you
cannot confirm, say STRONG HYPOTHESIS honestly — that is still valuable and still
honest.

## The method

1. **State the mechanism hypothesis.** Read the report. Ask: what class of thing
   produces this symptom? A hang -> often a held fd or an unclosed pipe. An
   early exit -> often a process not detached, or a rejected sandbox. A visual
   artifact -> often a window surface / compositor. An install failure -> often a
   missing binary or an engines constraint. A wrong auth/cookie -> often a
   keychain item or bundle id.

2. **Find that mechanism's signature on your machine.** Run the target on the OS
   you have and inspect it. The signature is in the process, not the screen. See
   the signature catalog below.

3. **Explain why the symptom is platform-specific but the cause isn't.** The
   mechanism you found should predict why it only breaks on the reported OS
   (e.g. "Unix detaches children by default, Windows doesn't, so a missing
   detach flag only kills the child on Windows"). If it doesn't, your hypothesis
   is wrong -- go back to step 1.

4. **Confirm — this is what turns a hypothesis into a root cause.** The signature
   found the lead; confirmation earns the certainty. Do at least one:
   - **Cross-platform contrast (the workhorse).** Run the target on real
     machines of each OS and check the symptom appears where the mechanism
     predicts and NOT elsewhere. A GitHub Actions matrix is the cheap way to get
     real Windows/Linux/macOS boxes for a few minutes, free — see below. If the
     symptom shows up exactly where your mechanism says it should, you have
     confirmation. If it doesn't (it showed up somewhere your mechanism didn't
     predict, or didn't show up where it should), your hypothesis is wrong.
   - **Fix-and-verify.** Apply the implied fix (add the flag, close the fd) and
     show the symptom disappears. Strongest form.
   - **If you can do neither**, your finding is a STRONG HYPOTHESIS, not a
     confirmed root cause. Label it so. Do not upgrade the language.

   Note the trap: cross-platform contrast can DISCONFIRM. In real use, a black-
   rectangle bug whose signature (a software-GL window flag) looked convincing did
   NOT reproduce on a real Windows runner (0% visual change). That means the
   signature was a lead but the mechanism was unconfirmed -- honestly a STRONG
   HYPOTHESIS at best, not a root cause. The confirmation step is what caught the
   overconfidence.

5. **Write the finding as cause + fix direction + certainty label**, citing the
   exact signature (the fd number, the missing flag, the absent binary) AND
   whether it is CONFIRMED or a STRONG HYPOTHESIS. That honesty is the deliverable.

### The cross-platform confirmation harness

To get real Windows/Linux/macOS machines on demand (this is how you confirm, and
it's the only part that needs "the hardware"): a GitHub Actions workflow with a
matrix, in a repo you control. It is NOT the method -- the method (steps 1-3)
runs on your one machine. This is only the confirmation step.

```yaml
strategy:
  matrix:
    os: [windows-latest, ubuntu-latest, macos-latest]
runs-on: ${{ matrix.os }}
steps:
  - run: <install the target, run the reproduction script, upload logs>
```

Trigger with `gh workflow run`. GitHub lends you real physical machines of each
OS for minutes, free (public repos). The controls (the OSes where the symptom
should NOT appear) are as important as the target -- they are what confirm
platform-specificity. This harness is repo-specific plumbing, not part of the
agnostic method; keep the two separate in your head.

## Signature catalog

Match the symptom to the inspection that reveals its mechanism:

| Symptom | Likely mechanism | Inspect with |
|---|---|---|
| Command hangs, never returns | held fd / unclosed pipe on a persistent child | `lsof -p <pid>` (look for orphan PIPE fds beyond 0/1/2) |
| Process exits early / dies with parent | child not detached; console/job inheritance | `ps -o command= -p <pid>` (look for a detach flag; note its ABSENCE) |
| Crashes only when run elevated/as admin | sandbox rejected under elevation | `ps` flags (look for `--no-sandbox` absence) |
| Black/blank rectangle, wrong visual | window surface / software-GL HWND painted before first frame | `ps` flags (`--headless=new`, `--enable-unsafe-swiftshader`) |
| Install fails on a platform / version | missing binary or engines constraint in the published package | `curl` the registry manifest; `tar -tzf` the tarball, grep for the platform binary |
| Release "behind" / missing on a channel | version desync across npm/crates/github | `curl` each registry's version endpoint and compare |
| Wrong cookie/auth on macOS | Safe Storage key derived from app bundle id | `PlistBuddy -c "Print CFBundleIdentifier"`; compare the two apps; `security find-generic-password` |
| Uses TCP where a pipe was expected | wrong transport flag | `ps` flags (`--remote-debugging-port` vs `--remote-debugging-pipe`) |

The catalog is a starting set, not a limit. The move is always the same: name the
mechanism, then find where it's observable in the process/artifact/system, not on
the screen.

## Visual bugs: capture and LOOK (the second half of the method)

Some bugs ARE the screen: a black rectangle, a phantom window, a broken layout, a
misrendered element. For these, the structural signature alone is not enough — you
have to see it. The move:

1. **Capture the screen with whatever the OS gives you** (agnostic): `screencapture`
   on macOS, `import`/`scrot` on Linux (under an X display), GDI `CopyFromScreen`
   via PowerShell on Windows, or any computer-use CLI that wraps these. On a CI
   runner you can capture the runner's desktop and upload the image as an artifact.
2. **Then LOOK at the image yourself.** You have vision — use it. Do NOT rely on a
   pixel-diff heuristic to decide whether the bug is present; a naive "% pixels
   changed" both misses subtle artifacts and fires on irrelevant changes. In real
   use a pixel-diff gave a false NOT-REPRODUCED on a phantom-window bug; looking at
   the actual capture is what settled it. The agent's eyes are the detector.
3. **Capture before / during / after.** The bug usually appears while the session
   is alive and vanishes when you kill the tree. Three captures isolate it in time.

### The contradiction pattern (a visual signature)

The strongest visual confirmations come from a CONTRADICTION between two
observations of the same moment: something is visible in the screenshot but does
NOT appear where a normal version of it should register. Example (real, #1498): a
Chrome surface was clearly drawn on the desktop in the capture, yet Windows
`Get-Process | where MainWindowTitle -ne ''` listed ZERO titled windows. A visible
surface that the window manager does not track as a window IS the bug — a phantom,
software-drawn surface, exactly as the reporter described ("no title bar, hit-test
passes to the desktop underneath"). Cross two cheap observations (a capture and an
enumeration) and let their disagreement be the signature. This works for any
"there's something on screen that shouldn't be a normal window/element" bug.

## Worked examples (real, agent-browser 2026) — note the certainty label on each

**CONFIRMED — missing Windows-ARM64 binary -> artifact inspection.**
`tar -tzf` the npm tarball: it shipped `win32-x64.exe` but no `win32-arm64`
binary at all. The artifact IS the evidence; nothing to infer. Confirmed without
booting Windows.

**CONFIRMED — wrong login on macOS -> bundle-id-derived keychain key.**
`PlistBuddy` showed the launched app was `com.google.chrome.for.testing`, not
`com.google.Chrome`. macOS derives the Safe Storage key from the bundle id, so
cookies encrypted by real Chrome are undecryptable by Chrome-for-Testing. The
architecture is deterministic (distinct bundle id -> distinct key), so this is
confirmed by construction, not inferred.

**CONFIRMED — hang -> orphan pipe fd, backed by observation.**
`agent-browser open` with PowerShell output capture hangs on Windows; filed as
needing `--headed` on a real desktop. `lsof` on the daemon (run on a Mac) showed
stdout at `/dev/null` but an **orphan PIPE on fd 14** the daemon holds. The fd was
directly observed. PowerShell `Receive-Job` waits for inherited handles; fd 14
never closes. `--headed` was a red herring.

**STRONG HYPOTHESIS (not confirmed) — Chrome "exits immediately" -> missing detach flag.**
`ps` on the spawned Chrome (Mac) showed NO process-detach flag (observed). The
reasoning: Unix keeps children alive by default (so no repro on Mac/Linux),
Windows kills a non-detached child. A cross-platform run showed the contrast
(Chrome survived on Mac/Linux, failed on Windows) which SUPPORTS it. But the fix
(adding DETACHED_PROCESS) was never applied and verified, so: strong hypothesis,
not proof. Honest label matters.

**Two lessons in one — black rectangle (visual bug).**
First pass: a pixel-diff heuristic said NOT-REPRODUCED (0% change). That was a
FALSE negative from a bad detector — lesson one, don't trust pixel-diff for
visual bugs. Second pass, done right: capture the desktop and LOOK, plus enumerate
windows. The capture showed a Chrome surface drawn on the desktop, but the window
enumeration listed zero titled windows -> the contradiction confirmed a phantom,
untracked surface, exactly the reported mechanism. SEMI-CONFIRMED: the phantom-
surface mechanism is real and seen; the specific BLACK fill is environment-
dependent (the reporter's Windows 11 multi-monitor), which the runner couldn't
force. Lesson two: capture+look+cross-enumerate gets you to the mechanism of a
visual bug without the reporter's exact hardware, and you honestly label the last
mile that still needs it.

## When it genuinely doesn't apply (be honest)

The method finds mechanisms observable in a process, artifact, or system. It does
NOT cover bugs whose cause is only in the other environment's runtime and leaves
no local signature: some interactive/GUI-only behavior, provider APIs needing
credentials you lack, or races that only manifest under the other OS's scheduler.
When you've named the mechanism and honestly cannot find its signature locally,
say so plainly and note what environment WOULD reveal it. A truthful
"needs X to confirm, here's the suspected mechanism" beats both a forced repro
and a lazy "not reproducible."
