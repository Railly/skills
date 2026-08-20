# Pocket Software Factory review gate

Result: INCOMPLETE on unborn branch `railly/mvp`.

The implemented local vertical slice is green:

- Biome passed and 36 Bun tests passed, including cancellation propagation, APNs routing, source and packaged LaunchAgent lifecycle, dry-run, audit, and CLI output contracts.
- The final SwiftUI app and test bundle built successfully for arm64 iOS Simulator. All five XCTest cases passed, including the exact Case deep-link contract.
- Real Vercel Sandbox validation passed on an immutable Petdex SHA and stopped cleanly.
- A registered Mac connected outward, invoked Kai skills, retained exact result refs locally, and delivered replay-safe receipts.
- Simulator approval was bound to the exact SHA and proof digest.
- Missing Vercel Connect failed closed without a branch, push, or pull request.
- Review feedback was reproduced, classified, and dispatched as one minimum successor.
- Real drill `WI-20260814-bf8112` stopped an active Mac runtime, preserved exact SHA `f2ea48aac6f89fbaeedd6a639faf4e208864ae5d`, removed the worktree, returned the worker online, drained outbox to zero, and recorded a terminal cancelled envelope.
- An isolated Gateway drill accepted only the authenticated session device, returned no raw token, replayed one unresolved Ledger attention event into a durable pending delivery, rejected deletion of another device, and removed the session-owned registration. Push payload tests prove notification authority stops at opening the exact Case.
- A real LaunchAgent drill loaded worker PID `31536`, reached authenticated Gateway state `online`, then uninstalled with `loaded=false`, no plist, and paired pending/succeeded audit receipts. The globally linked `pocket-worker` emitted clean schema and dry-run JSON without secrets.
- A Developer ID signed `PocketWorker.app` with a native Swift launcher and bundled Bun runtime produced a valid ZIP, generated a source-independent LaunchAgent, reconnected the Petdex worker as `online`, and uninstalled cleanly. A forced `ENOSPC` package failure left no staging directory, ZIP, or unsigned final output.
- `PocketFactory.app` built with its development APNs entitlement, installed on an iPhone 15 Plus, launched successfully, and remained visible as a running physical-device process.

The adversarial pass found and fixed durable-write races, worker authority bypass, open LAN auth, mutable dependency sharing, token exposure in git arguments, duplicate decision and promotion paths, send-back without execution, Sandbox terminal-state drift, arbitrary feedback URLs, contract drift, non-idempotent PR retry, standalone LaunchAgent source-path leakage, and partial package publication.

## Incomplete reasons

- The repository has no commit, so there is no exact HEAD to review.
- A different-family reviewer was unavailable. This same-family review shares the author's priors and blind spots.
- The physical app launch is proven, but authenticated Gateway use, background reconnect, Secure Enclave identity, and server-side App Attest verification were not driven.
- Physical APNs delivery remains unverified because notification authorization and production APNs credentials are unavailable.
- The Mac bundle is Developer ID signed but not notarized because no Pocket Factory `notarytool` keychain profile is configured.
- No Vercel Connect connector exists, so the real draft PR path remains unverified.

## Exemptions

- Direct DevBox execution is deferred until a public owner boundary is confirmed. The provider abstraction and proven Sandbox path preserve the seam.
- The terminal is V8 and optional. It has no path to evidence, decision, or promotion authority.

## Issue candidate

- `gate.sh covered` exits 0 and prints PASS on an unborn branch even after `git rev-parse HEAD` fails. The gate must fail closed when HEAD is absent.
