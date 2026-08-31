# vercel-labs/emulate PR 214 evidence

Base: `d0219d05818adca4c12bb76ec79a7562c1766a3d`

Head: `3705e2b7a0c726c85c4a529697d5c067afda73c3`

Frozen checkout: `/Users/raillyhugo/Programming/vercel/emulate-214-review`

## Independent contract oracle

Resend's public idempotency documentation says:

- `POST /emails` and `POST /emails/batch` support one `Idempotency-Key`.
- Equivalent requests in the 24-hour retention window return the same response without sending the email again.
- Changed payloads return `409 invalid_idempotent_request`.
- Overlapping requests return `409 concurrent_idempotent_requests`.
- Keys contain 1 to 256 characters.

Sources:

- `https://resend.com/docs/dashboard/emails/idempotency-keys`
- `https://github.com/resend/resend-openapi/blob/main/resend.yaml`

The oracle was chosen before grading the implementation's branches. The user-visible property is "the request is processed only once", including email capture and webhook delivery, not only local row count or cached response equality.

## Subsystem topology

### Resend sends

`createServer()` owns one in-memory `Store` and one `WebhookDispatcher`. `emailRoutes()` validates the request, reserves an idempotency record, inserts email rows, dispatches `email.sent` and `email.delivered`, serializes the response, then completes the idempotency record. On an exception it deletes inserted email rows and releases the reservation. Delivered webhook HTTP requests are external effects and cannot be deleted by the local rollback.

### Generated-secret startup

The CLI preflights the destination, prepares services, then calls `publishGeneratedSecretsFile()`. Publication links the complete temporary file to the destination at `generated-secrets-file.ts:247`. The publisher still performs path verification and directory synchronization before it returns a rollback handle. `startCommand()` installs the startup signal handlers only after that call returns at `start.ts:399-404`. Portless setup, alias registration, stores, seeding, listeners, and banner output happen later.

## Built artifact HTTP drive

The workspace was built with `pnpm build`. The built CLI was started on port 15140 with the Resend service.

An initial keyed `POST /emails` returned 200:

```json
{"id":"bd892811-e0d8-4fd8-97b4-9865f298d2fb"}
```

An equivalent request using reordered JSON, explicit defaults, array address form, and `Authorization: token` returned the byte-identical body. Reusing the key with a changed subject returned:

```json
{"statusCode":409,"name":"invalid_idempotent_request","message":"This idempotency key has been used with this HTTP method and endpoint within the last 24 hours, but the request body was modified and doesn’t match the original request."}
```

`GET /emails` contained exactly one captured email. JSON and form-urlencoded equivalent requests also replayed successfully. Bearer/token scheme casing normalized to the same credential namespace.

## F1 reproduction: failed batch retry duplicates webhooks

A real HTTP webhook receiver listened on port 15143. A real Resend emulator listener ran on port 15144. The store's second email insertion was forced to throw after the first email had already delivered both webhooks.

First keyed batch result:

```json
{
  "status": 500,
  "body": "{\"message\":\"forced second insert failure\",\"documentation_url\":\"https://emulate.dev/resend\"}"
}
```

State after failure:

```json
{
  "emailRows": 0,
  "idempotencyRows": 0,
  "deliveries": [
    {"type":"email.sent","to":["first@example.com"]},
    {"type":"email.delivered","to":["first@example.com"]}
  ]
}
```

The identical keyed retry returned 200. State after retry:

```json
{
  "emailRows": 2,
  "idempotencyRows": 1,
  "deliveries": [
    {"type":"email.sent","to":["first@example.com"]},
    {"type":"email.delivered","to":["first@example.com"]},
    {"type":"email.sent","to":["first@example.com"]},
    {"type":"email.delivered","to":["first@example.com"]},
    {"type":"email.sent","to":["second@example.com"]},
    {"type":"email.delivered","to":["second@example.com"]}
  ]
}
```

The first recipient received each event twice. Local row rollback and reservation release were true while the end-to-end idempotency property was false.

## F2 reproduction: SIGTERM during publication leaves the file

A review-only delay was temporarily inserted immediately after `published = true` and before the existing awaited post-link verification inside `publishGeneratedSecretsFile()`. This widened an actual asynchronous post-link stage without changing ownership or handler order. The built CLI was started with the delay, the harness waited until the destination existed, then sent a real `SIGTERM`.

Observed:

```text
found_before_signal=1
exit_code=143
artifact_after_exit=present
artifact={  "schemaVersion": 1,  "generatedSecrets": []}
log=
retry_exit_code=1
retry_log=Generated secrets path already exists: /private/tmp/emulate-f2-review.eJBIB4/secrets.json
```

The OS terminated the process with the default signal action because `installStartupShutdown()` had not run yet. The complete invocation-owned file remained. The temporary instrumentation was removed and the checkout restored clean.

## F3 reproduction: adapter persistence strands in-progress keys

The Next adapter saves a full Store snapshot after every mutating request, regardless of response status. A real adapter handler was driven with persistence and a webhook receiver that held the first request in progress.

While the first keyed request waited on its webhook, an overlapping request returned the expected 409. That POST caused the adapter to persist the Store with the reservation still in `in_progress` state. A new handler instance loaded that snapshot to model a process restart after the original request owner disappeared.

Observed:

```json
{
  "concurrent": {
    "status": 409,
    "body": "{\"statusCode\":409,\"name\":\"concurrent_idempotent_requests\",\"message\":\"There is another request in progress with the same idempotency key.\"}"
  },
  "persistedHasInProgress": true,
  "afterRestart": {
    "status": 409,
    "body": "{\"statusCode\":409,\"name\":\"concurrent_idempotent_requests\",\"message\":\"There is another request in progress with the same idempotency key.\"}"
  }
}
```

No request remains in progress after the restart, but the key continues returning `concurrent_idempotent_requests`. `reserveIdempotencyRecord()` only clears the record at its 24-hour expiry, so the retry is trapped until then.

## F4 mutation: exact-head signal handoff fix is not protected

The exact-head commit changes startup handlers from `process.once` to `process.on` so a second signal during async cleanup remains intercepted. In isolated mutation, both startup handlers were changed back to `process.once`.

The new test remained green:

```text
Test Files  1 passed (1)
Tests       1 passed (1)
```

The test emits only one synthetic listener call. It cannot reject the implementation from the parent commit and does not drive a second real OS signal during pending rollback. The mutation was restored and the test was rerun green.

## Killed mutation

`reserveIdempotencyRecord()` was mutated so an in-progress record replayed a 200/null response instead of returning the concurrent conflict.

The focused suite failed at the intended assertion:

```text
FAIL Resend plugin - Idempotency-Key > returns a concurrency conflict while the original request is awaiting webhook dispatch
AssertionError: expected 200 to be 409
```

After restoration, all 59 Resend tests passed.

## Deterministic and CI receipts

- `pnpm build`: 26 successful tasks.
- `pnpm test`: 33 successful tasks. Resend 59/59, emulate 42/42.
- `pnpm type-check`: 34 successful tasks.
- `pnpm lint`: 42 successful tasks, existing warnings only.
- `pnpm format:check`: pass.
- `git diff --check d0219d0...3705e2b`: pass.
- Focused `@emulators/resend` and `emulate` type-check and lint: pass.
- `gate.sh style`: two em-dash findings in package README list entries, exempt under repository house style.
- `gate.sh surfaces`: flagged `apps/web/app/docs/page.mdx`, which describes generated-secret cleanup but was not updated.
- `gate.sh siblings Idempotency-Key`: pass.
- `gate.sh siblings generated-secrets-file`: flagged the unchanged docs overview and GitHub package README plus non-contract code/test hits.
- `gate.sh timings`: pass, no new wait ceiling.
- `gate.sh shellmeta`: pass, no detector.
- `gate.sh execdeps`: pass, no map and no new executable.
- Initial `gate.sh covered`: expected finding because no exact-head report existed.
- Final `gate.sh covered`: pass for exact head `3705e2b`.
- `gate.sh report`: expected findings because the validator is pass-only and this completed run has five open findings, refuted assumptions, unverified properties, and unsafe retry outcomes.

The two unchanged contract passages are:

- `apps/web/app/docs/page.mdx:89`
- `packages/@emulators/github/README.md:205`

Both still describe all catchable termination as a generic hard termination that can leave the file, while the changed surfaces newly promise cleanup for `SIGINT` and `SIGTERM`.

## Radius summary

The map found 46 changed symbols and 19 impacted symbols over 4,980 resolved edges. It reported 21,101 unresolved calls, so it materially under-covers.

Top convergence items inspected:

- `resendPlugin`, reached by 26 changed symbols.
- `resendPlugin` default export, reached by 26 changed symbols.
- existing `start-generated-secrets.test.ts`, reached by 4 changed symbols.
- all other `getResendStore()` consumers, each reached by 3 changed symbols.

F1 was found beyond the map by tracing the external webhook commit point. F2 was found by tracing the startup publication and OS signal boundary. F3 was found by following the `resendPlugin` convergence item into the adapter persistence consumer, then driving the restart. F4 came from mutation testing outside the map. None was directly ranked as a mapped propagation path.
