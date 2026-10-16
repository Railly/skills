# Review Gate: vercel-labs/emulate PR #214

Verdict: findings

Exact head: `3705e2b7a0c726c85c4a529697d5c067afda73c3`

Base: `d0219d05818adca4c12bb76ec79a7562c1766a3d`

## Findings

### P1: A failed keyed batch can duplicate webhooks on retry

[`emails.ts`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/@emulators/resend/src/routes/emails.ts:58) dispatches each email's webhooks before processing the next batch item. If a later insertion or dispatch throws, [`executeSend()`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/@emulators/resend/src/routes/emails.ts:202) deletes local rows and releases the reservation, but it cannot retract webhook HTTP requests already delivered.

I forced the second insertion to fail behind a real webhook receiver. The first attempt returned 500 with zero email rows and zero idempotency rows, but the receiver had already received `email.sent` and `email.delivered` for the first item. Retrying the identical keyed batch returned 200 and sent both events for the first item again.

The rollback must not make the same key reusable after an external effect has escaped. Stage the batch before dispatch, retain enough terminal state to replay safely, or otherwise make the external effects part of the idempotency commit.

### P1: The startup signal guard is installed after publication becomes visible

[`startCommand()`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/emulate/src/commands/start.ts:399) awaits `publishGeneratedSecretsFile()` and installs `installStartupShutdown()` only after it returns. The publisher links the destination earlier at [`generated-secrets-file.ts`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/emulate/src/generated-secrets-file.ts:247), then performs more async verification and directory synchronization.

I widened that existing post-link window, waited until the destination existed, and sent a real `SIGTERM`. The process exited 143, left the complete file, and the immediate retry failed with `Generated secrets path already exists`.

Install the signal ownership before the destination can be linked, while preserving identity-safe rollback.

### P1: Adapter persistence can strand an `in_progress` key for 24 hours

[`reserveIdempotencyRecord()`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/@emulators/resend/src/idempotency.ts:68) treats any restored `in_progress` record as a live concurrent request until expiry. The Next adapter saves after every POST at [`adapter-next/src/index.ts`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/@emulators/adapter-next/src/index.ts:288), including a concurrent 409.

I held the original request inside webhook delivery, issued an overlapping request so the adapter persisted `state: "in_progress"`, killed the owner process with `SIGKILL`, restarted from the snapshot, and retried. The new process still returned `409 concurrent_idempotent_requests`, although no original request existed.

Do not persist transient reservations, or recover them as abandoned on restore.

### P2: The signal regression test does not protect the final handoff fix

The exact-head commit changes the startup handlers from `process.once` to `process.on`, but the new test invokes one captured listener only at [`start-generated-secrets-signal.test.ts`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/emulate/src/__tests__/start-generated-secrets-signal.test.ts:64).

I reverted the production handlers to `process.once`; the test still passed. Add a second real signal while rollback is pending and assert that the default signal action never interrupts cleanup.

### P2: Two generated-secret docs still carry the old termination contract

[`apps/web/app/docs/page.mdx`](/Users/raillyhugo/Programming/vercel/emulate-214-review/apps/web/app/docs/page.mdx:89) and [`packages/@emulators/github/README.md`](/Users/raillyhugo/Programming/vercel/emulate-214-review/packages/@emulators/github/README.md:205) still say only that a hard termination can leave the artifact. The other contract surfaces were updated to promise cleanup for `SIGINT` and `SIGTERM`.

Update these required sibling surfaces so the behavior is stated consistently.

## Verification

- Full `pnpm build`, `pnpm test`, `pnpm type-check`, `pnpm lint`, and `pnpm format:check` passed.
- Resend suite: 59/59.
- Emulate suite: 42/42.
- Exact-head coverage gate passed for `3705e2b`.
- The pass-only report validator correctly returned findings for the five open defects and their failed proof obligations.
- Built CLI replay, conflict, canonicalization, form encoding, credential scoping, and one-capture behavior passed.
- Radius: 46 changed symbols, 19 impacted, 4,980 edges, 21,101 unresolved calls. The map under-covers.
- Full evidence: [substrate report](evidence/2026-08-27-emulate-214-3705e2b-substrate.md)

## Exemptions claimed

- The package README's two added em dashes match repository endpoint-list style.
- Generated-secret code and test files returned by the sibling grep contain identifiers or tests, not stale contract prose.

## Issue candidates

None.
