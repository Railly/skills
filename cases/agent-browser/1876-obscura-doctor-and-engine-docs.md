# 1876: obscura missing from doctor and engine reference

- PR: vercel-labs/agent-browser#1876. Audited head a1eaf0ed, fix 11a2754.
- Doctor checked only lightpanda; engine value lists in commands/configuration docs omitted obscura.
- Fix: doctor uses `find_obscura` (same lookup as launch, including ~/.local/bin etc.). Dogfood: FAIL with fix hint without binary, PASS with a fake one in ~/.local/bin.
- Gaps: no real Obscura binary; case-sensitivity difference between main.rs:285 and actions.rs:374 not traced.
