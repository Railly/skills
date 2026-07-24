# Signature catalog + worked examples

## Symptom → inspection

Match the symptom to the inspection that reveals its mechanism. This is a starting
set, not a limit. The move is always: name the mechanism, then find where it's
observable in the process/artifact/system.

| Symptom | Likely mechanism | Inspect with |
|---|---|---|
| Command hangs, never returns | held fd / unclosed pipe on a persistent child | `lsof -p <pid>` (orphan PIPE fds beyond 0/1/2) |
| Process exits early / dies with parent | child not detached; console/job inheritance | `ps -o command= -p <pid>` (a detach flag; note its ABSENCE) |
| Process exits with captured stdout | parent captured but did not drain the pipe; buffer fills, child blocks and dies | reproduce the reporter's capture pattern (subprocess PIPE without reading) |
| Crashes only when run elevated/admin | sandbox rejected under elevation | `ps` flags (`--no-sandbox` absence) |
| Black/blank rectangle, phantom window | software-drawn surface / HWND painted before first frame, not tracked as a window | capture + LOOK; `Get-Process | where MainWindowTitle` (the contradiction) |
| Install fails on a platform / version | missing binary or engines constraint in the published package | `curl` the registry manifest; `tar -tzf` the tarball, grep the platform binary |
| Release "behind" / missing on a channel | version desync across npm/crates/github | `curl` each registry's version endpoint and compare |
| Wrong cookie/auth on macOS | Safe Storage key derived from app bundle id | `PlistBuddy -c "Print CFBundleIdentifier"`; compare the two apps |
| DRM/Widevine won't play | `--disable-component-update` blocks the CDM download | `ps` flags; fix-verify by launching WITHOUT the flag and checking for the CDM dir |
| Uses TCP where a pipe was expected | wrong transport flag | `ps` flags (`--remote-debugging-port` vs `--remote-debugging-pipe`) |

## Worked examples (real, agent-browser 2026) — note the certainty label

**CONFIRMED — missing Windows-ARM64 binary → artifact inspection.**
`tar -tzf` the npm tarball: shipped `win32-x64.exe` but no `win32-arm64` binary.
The artifact IS the evidence; nothing to infer. Confirmed without booting Windows.

**CONFIRMED — wrong login on macOS → bundle-id-derived keychain key.**
`PlistBuddy` showed the launched app was `com.google.chrome.for.testing`, not
`com.google.Chrome`. macOS derives the Safe Storage key from the bundle id, so
cookies from real Chrome are undecryptable by Chrome-for-Testing. Deterministic by
construction, not inferred.

**CONFIRMED — hang → orphan pipe fd, observed.**
`agent-browser open` with PowerShell output capture hangs on Windows; filed as
needing `--headed`. `lsof` on the daemon (on a Mac) showed stdout at `/dev/null`
but an orphan PIPE on **fd 14** the daemon holds. PowerShell `Receive-Job` waits
for inherited handles; fd 14 never closes. `--headed` was a red herring.

**CONFIRMED by fix-verify — DRM/Widevine → `--disable-component-update`.**
`ps` showed the flag (a lead). Fix-verify: launched Chrome WITH vs WITHOUT it and
checked for the WidevineCdm dir. WITH → absent; WITHOUT → the CDM appeared
(mac+linux). Applying the fix restored the symptom's absence → confirmed. This is
what upgrades a signature to a root cause: the last-step decided.

**CAUTIONARY, two lessons — Chrome "exits immediately" → NOT what the signature first suggested.**
`ps` showed no detach flag; the first hypothesis was "missing DETACHED_PROCESS".
Reading the reporter's own analysis revealed the real mechanism: captured-but-
UNDRAINED stdout/stderr pipes (Chrome fills the buffer, blocks, dies) — the same
family as the fd-14 case, not a detach bug. Lesson one: a plausible signature can
point at the wrong mechanism; read the reporter's analysis and reproduce their
EXACT repro. Lesson two: an attempted fix-verify (detached vs non-detached) failed
to reproduce the differential on CI — a failed confirmation keeps it a hypothesis,
honestly.

**CAUTIONARY, visual — black rectangle → phantom surface, via capture+contradiction.**
First pass: a pixel-diff said NOT-REPRODUCED (0% change) — a FALSE negative from a
bad detector. Lesson: don't trust pixel-diff for visual bugs. Second pass: capture
the desktop and LOOK, plus enumerate windows. The capture showed a Chrome surface;
the enumeration listed zero titled windows → the contradiction confirmed a phantom,
untracked surface, exactly the reported mechanism. SEMI-CONFIRMED: the phantom-
surface mechanism is real and seen; the specific BLACK fill is environment-
dependent (reporter's Windows 11 multi-monitor), which the runner couldn't force.
capture+look+cross-enumerate reached the mechanism without the reporter's hardware;
the last mile is honestly labeled.

## When it genuinely doesn't apply (be honest)

The method finds mechanisms observable in a process, artifact, or system. It does
NOT cover bugs whose cause is only in the other environment's runtime with no local
signature: some interactive/GUI-only behavior, provider APIs needing credentials
you lack, or races that only manifest under the other OS's scheduler. When you've
named the mechanism and honestly cannot find its signature locally, say so and note
what environment WOULD reveal it. "Needs X to confirm, here's the suspected
mechanism" beats both a forced repro and a lazy "not reproducible."
