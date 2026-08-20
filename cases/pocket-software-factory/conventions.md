# Pocket Software Factory review conventions

Project overlay for the `review-gate` skill. Bootstrapped from the Shape F source documents and the implemented repository on 2026-08-14. The target repository has no local instruction file yet.

## Surface map

```surfaces
gateway/src/contracts.ts :: contracts/ledger-event.schema.json, contracts/worker-envelope.schema.json, PocketFactory/Models/LedgerModels.swift
gateway/src/workers.ts :: contracts/worker-envelope.schema.json, worker/src/cli.ts, PocketFactory/Models/LedgerModels.swift
gateway/src/formula.ts :: PocketFactory/Models/LedgerModels.swift, PocketFactory/Views/CaseView.swift
gateway/src/server.ts :: PocketFactory/Services/FactoryAPI.swift, README.md
worker/src/cli.ts :: worker/src/service.ts, worker/scripts/package.ts, worker/macos/main.swift, README.md
worker/src/service.ts :: worker/test/kai-runner.test.ts, worker/scripts/package.ts, README.md
worker/scripts/package.ts :: worker/macos/main.swift, worker/macos/Info.plist, README.md
gateway/src/github.ts :: README.md
gateway/src/vercel-sandbox.ts :: README.md
```

## House norms

- Runtime and package manager: Bun.
- TypeScript formatting and linting: Biome.
- The iPhone never stores provider or GitHub credentials.
- No worker may create a branch, push, or create a pull request before an authenticated exact-SHA decision authorizes promotion.
- Long-lived execution belongs to the Gateway and workers, never the SwiftUI process.

## Subsystem invariants

- The Factory Ledger is append-only and strictly monotonic. Reconnect resumes from a cursor and duplicate provider envelopes do not create duplicate factory events.
- Provider-native state remains authoritative. Gateway events record provider references, evidence, decisions, and promotion transitions without inventing provider completion.
- A human decision binds principal, channel, gate version, evidence digest, exact result SHA, session, nonce, and expiry.
- Failed or incomplete evidence cannot request an approvable gate.
- Registered Macs connect outward with revocable Ed25519 device identities and advertise explicit repository capabilities before receiving work.
- Mac work runs in an isolated worktree. A successful local result is retained under an attempt-specific ref and cannot reach a remote until exact-SHA promotion.
- Worker result delivery has a durable outbox and idempotent receipt so reconnect cannot lose or duplicate a terminal result.
- A packaged worker LaunchAgent invokes the native launcher inside the signed app bundle and never depends on `/$bunfs`, TypeScript source, a globally installed Bun, or enrollment secrets in the plist.
- Vercel Sandbox uses an explicit egress allowlist and stops in `finally`.
- Vercel Connect tokens are requested only after approval and are scoped to the application subject.
- GitHub promotion verifies that the draft pull request head equals the approved result SHA.
- Feedback is bound to the current proof SHA, reproduced read-only, and classified before it can create one minimum successor.
- Terminal bytes, raw agent output, and provider events have no path to human decision or promotion authority.

## Verification norms

- Run `bun run check` and the iOS XCTest suite on the exact tree.
- Drive the built iPhone surface in Simulator and keep screenshots for attention, proof, promotion failure, feedback disposition, and successor proof.
- Force negative boundaries: stale cursor, duplicate envelope, revoked worker, replayed decision, stale proof, failed evidence, wrong GitHub head, and absent Vercel Connect.
- Physical-device signing, App Attest, APNs, and real network recovery remain unverified until driven on an iPhone.

## Gate-miss ledger

- Empty at bootstrap.
