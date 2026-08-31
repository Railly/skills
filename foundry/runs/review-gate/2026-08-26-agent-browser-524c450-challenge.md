# Independent challenge: agent-browser PR 1725 @ 524c450

Method: `substrate_corpus` with a reference-oracle cross-check.

Base: `8934fdb7ff5c016b46d473454ec51c0df814bead`.
Head: `524c450ec2bb56109e52bd4f2c875301176ed558`.

The challenge was authored outside the PR and ran in `crafter-agents/winarm-oracle` on a
GitHub `windows-11-arm64` runner. It did not push to, comment on, or otherwise mutate
`vercel-labs/agent-browser`.

## Substrate identity

Run `33002500967`, job `98287683375`:

```text
PROCESSOR_ARCHITECTURE = ARM64
OS caption             = Microsoft Windows 11 Enterprise
OS architecture        = ARM 64-bit Processor
node                    = v22.23.2, win32/arm64
```

The published `agent-browser-win32-x64.exe` was 13,642,752 bytes with COFF machine
`0x8664` (AMD64). It executed on that ARM64 host, returned `agent-browser 0.35.0`, and
exited 0. This verifies the PR's emulation premise directly.

## Base versus head resolution

Run `33002500967`, jobs `98287683496` and `98287683210`:

| Files present | Base | Head |
| --- | --- | --- |
| x64 only | exit 1, expected arm64 | x64, exit 0 |
| both | arm64, exit 0 | arm64, exit 0 |
| arm64 only | arm64, exit 0 | arm64, exit 0 |
| neither | exit 1, expected arm64 | exit 1, expected x64 |

This establishes three things.

1. The fallback is the load-bearing fix. The standard postinstall layout has x64 only;
   base fails and head works.
2. Native preference survives. Both and arm64-only select arm64.
3. The no-binary message regresses. The head keeps `No binary found for win32-arm64` but
   changes the expected path to x64.

## Real producer and installed package

Run `33002500967`, job `98287683603`:

- The first-party producer copied `agent-browser-win32-arm64.exe`.
- Size: 12,548,608 bytes.
- COFF machine: `0xAA64` (ARM64).
- `--version`: `agent-browser 0.35.0`, exit 0.
- `npm pack` plus two `npm install -g` runs completed far enough to inspect the installed
  package and generated shim.
- Installed `.cmd` target:

```text
"%~dp0node_modules\agent-browser\bin\agent-browser-win32-x64.exe" %*
```

- Installed `bin/` contained both the arm64 and x64 executables.

The launcher and shim therefore do diverge in the both-present state: launcher selects
arm64; global shim selects x64. The base and head matrix gives the required attribution,
however: both versions of the launcher already select arm64 in that state. The divergence
predates this PR.

The earlier challenge incorrectly said base's launcher path was a hard error and therefore
the divergence was new. Base is a hard error only when arm64 is absent. The divergence
requires arm64 to be present. Using behavior derived under one precondition to argue novelty
under its opposite was the review error. That sentence has been removed, and A6 is refuted.

## Native install issue discovered by the drive

The source-built ARM64 binary ran `--version` but failed `install`:

```text
arm64 install :: exit=101
thread 'main' panicked at src\install.rs:181:9:
Unsupported platform for Chrome for Testing download
```

`cli/src/install.rs` has `platform_key()` cases for macOS arm64/x64, Linux x64, and Windows
x64. Its fallback panics. `run_install()` guards Linux aarch64 only, so Windows aarch64
reaches the panic despite the nearby comment saying the install path guards unsupported
platforms.

The published x64 binary under emulation did not hit that path. It proceeded with:

```text
Downloading Chrome 152.0.7977.64 for win64
```

This is a pre-existing issue candidate, not a finding against the launcher diff.

## Behavioral-strength result

The corpus supplies:

- explicit dimensions and all four Windows ARM64 present-file states;
- independent architecture oracles from COFF fields;
- fix-absent red at merge base and restored green at exact head;
- real first-party producer execution;
- real published and source-built PE execution;
- real npm package and generated-shim inspection;
- forced failure-path output.

The PR's own tests still omit the neither-present cell and global-shim entry point, and use
hand-written stubs. That remains a committed-test finding, but it is no longer a review-gate
verification gap.

## Harness provenance

Run `33002161430` was the first dispatch. Its emulation and native jobs are green. Its
resolution jobs failed because the harness did not clear PowerShell's `LASTEXITCODE` after
an expected nonzero base cell, so the step aborted before completing the matrix.

Run `33002500967` corrected that harness control-flow bug. All four jobs passed and all
base/head cells were captured. The failed first run is never used as matrix evidence; its
green emulation and native jobs only corroborate the successful rerun.

The runner supplied Node `22.23.2` while the package requires `>=24.0.0`, producing npm
`EBADENGINE` warnings. All architecture-sensitive operations completed. The launcher uses
stable Node builtins, so the deviation is recorded rather than treated as a refutation.
