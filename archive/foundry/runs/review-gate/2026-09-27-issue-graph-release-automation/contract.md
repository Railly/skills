# Automatic issue-graph releases

User requests fully automatic publication after a version merge. Source scope: release.yml, release.ts, release tests and contributor release guide. Docs PR26 and provider branches stay separate.

A1: Canonical main pushes resolve their exact commit and stable package version. Unpublished versions newer than npm latest proceed; published versions skip. Manual verify-only and explicit publish dispatch remain.
A2: One archive is built, tested on Node20/22/24, then published through the existing Release-bound OIDC identity with hooks disabled. Checksums and source identity are preserved.
A3: Rerunning failed jobs after npm acceptance validates the retained artifact against registry bytes before skipping npm publication and finishing GitHub Release. Conflicting bytes or tags fail. Fresh workflows do not recover a prior published version; use the original run and artifact within30days.
A4: Registry propagation retries are bounded; npm processing beyond15seconds can succeed. Tokenless OIDC, canonical main, and scoped permissions remain. Remove only the manual reviewer gate from Release, preserve the main branch policy.
A5: Verify actual0.4.0 npm and GitHub publication after merge. This deployment acceptance is tracked separately from the source review until the main push executes.
