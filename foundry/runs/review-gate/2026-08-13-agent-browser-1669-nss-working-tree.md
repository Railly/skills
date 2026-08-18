# Review gate: agent-browser #1669 NSS replacement

Status: pass for the uncommitted replacement diff based on `upstream/main` at `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`.

Warning: the implementation and final review use the GPT-5 model family. Two Claude CLI review attempts produced no output and were terminated, so the cross-family audit was unavailable. Deterministic checks, the Linux Chromium matrix, and the mutation test are the load-bearing evidence.

## Outcome

The SPKI certificate-error bypass was replaced with real Linux Chromium NSS CA trust. The review found five defects or missing surfaces, all fixed before this report:

1. A `certutil` setup failure leaked the temporary Chrome profile.
2. Local state commands loaded and validated browser-only CA configuration.
3. The commands and proxy web-doc surfaces omitted the new flag.
4. The core skill option list and Eve proxy configuration did not propagate `caCert`.
5. Chrome startup failures before DevTools publication killed only the main child before deleting the private NSS HOME.

## Subsystem model

The CLI resolves configuration and validates the certificate before starting or reusing a daemon. The daemon receives the canonical CA path, includes its path and bytes in configuration identity, and passes it only to a locally launched Linux Chromium process. `ChromeProcess` owns the temporary profile and NSS HOME and must terminate and reap the Chrome process group before deleting either directory.

The affected consumers are CLI flags and config, MCP argument translation, daemon environment and launch commands, launch hashing, daemon fingerprinting, the Eve extension, help text, schemas, README, web docs, and skill docs.

The central assumption was that setting `HOME` and `XDG_DATA_HOME` on the Chromium child makes the private NSS database authoritative. The adjacent layers checked were legacy `.pki` selection, concurrent daemons, startup failure before CDP publication, normal close, Chrome crash, daemon termination, and daemon SIGKILL.

## Deterministic evidence

- `style`: pass.
- `surfaces`: pass.
- stale `ignore-certificate-errors-spki-list`: zero hits.
- `callers validate_launch_options`: pass.
- `callers load`: acknowledged as an unusably broad symbol sweep; the relevant `ca_bundle::load` consumers were read directly.
- `flagsweep --ca-cert --proxy`: true omissions in commands docs, proxy docs, the core skill, and Eve were fixed.
- `siblings ca-cert`: `.decisions.tsv` and the matrix script are review artifacts; WebGPU hits are the Debian package name `ca-certificates`, not this flag.
- `git diff --check`: pass.
- stable Rust `fmt` and `clippy -D warnings`: pass.
- all-targets/all-features clippy: pass.
- Rust serial suite: 1,127 passed, 101 ignored, 0 failed; doctor integration: 2 passed.
- Eve: typecheck pass, 40 tests passed.

## Linux Chromium TLS matrix

The rebuilt ARM64 Linux release binary passed:

- correct hostname with supplied CA
- rejection with omitted CA
- rejection for wrong hostname
- rejection for unrelated CA
- rejection for expired certificate
- rejection for not-yet-valid certificate
- concurrent daemons with distinct NSS homes
- missing `certutil`, with no profile leak
- failing `certutil`, with no profile leak
- normal close cleanup
- Chrome crash cleanup
- daemon SIGTERM cleanup
- expected NSS orphan after daemon SIGKILL

The mutation test changed NSS trust from `C,,` to `,,`; the positive and concurrency cases failed. Restoring `C,,` returned the full matrix to green.

## Radius

Radius indexed 282 files, 4,449 symbols, and 7,920 edges, but reported 2,446 unresolved calls, 83 SCIP-unmapped entries, and duplicate-symbol errors from rust-analyzer. Its changed and impacted sets were empty despite the diff. The map is strongly under-covering and was used only to confirm that absence of impact was not evidence.

## Exemptions claimed

- `CHANGELOG.md` and `docs/src/app/changelog/page.mdx` are historical release notes.
- `docs/src/app/cdp-mode/page.mdx` documents CDP attach, where `--ca-cert` is intentionally rejected.
- `cli/src/native/cdp/chrome.rs` contains Chromium's internal `--proxy-bypass-list` argument, not a public flag-doc surface.
- WebGPU documentation mentions the Debian package `ca-certificates`, not `--ca-cert`.
- The decision trail and Linux matrix script are review artifacts and are not part of the product diff.

## Issue candidates

- Rust test environment interference: the parallel full suite produced one failure in `test_explicit_state_load_without_restore_keeps_restore_unconfigured`; the test passed isolated and the complete serial suite passed. This is outside the CA diff and suggests a pre-existing environment-mutating test race.
- SIGKILL cleanup: killing the daemon with SIGKILL leaves its private NSS HOME because no destructor can run. PID-based sweeping was rejected because it can delete a live concurrent session after PID reuse.
