# Review gate: vercel-labs/emulate Stripe webhook signatures

- Base: `origin/main@1e4b71a1da6e8c937318958bebf03bcb87d61dd5`
- Head: `5315037572e5aa45c451c660c4ffe9f968bf4367`
- Status: complete
- Contract source: `foundry/runs/solution-gate/2026-08-11-emulate-webhook-envelope-1e4b71a.md`
- Author and reviewer are from the same model family. The gate compensated with force-red tests, full monorepo checks, a built CLI check, and the official Stripe protocol reference.

## Outcome

Pass after three findings were fixed:

1. Header factory execution originally sat outside the delivery failure path. A throwing factory would skip delivery logging. It now runs inside the protected block, with a regression test proving the failed delivery is recorded.
2. `seedFromConfig()` originally depended on `stripePlugin.register()` having installed the factory. The public standalone seed path now installs the same factory itself. Its regression test was force-red and restored green.
3. The repository's required behavior surfaces were initially absent. README, Stripe skill, docs site, package README, and CLI help now describe `Stripe-Signature`.

## Verification

- `pnpm type-check`: 34 tasks passed.
- `pnpm test`: 33 tasks passed.
- Core: 70 tests passed.
- Stripe: 23 tests passed.
- GitHub: 17 tests passed.
- Affected lint commands passed with only pre-existing warnings.
- Prettier, `git diff --check`, style gate, and surface gate passed.
- Built CLI `--help` contains the Stripe signature behavior.
- Force-red without Stripe factory installation failed because `Stripe-Signature` was absent, then passed after restoration.
- Official Stripe documentation confirms the header uses `t` and `v1`, with HMAC SHA-256 over `<timestamp>.<raw body>`.

## Subsystem model

- One `WebhookDispatcher` belongs to one plugin server.
- Core owns matching, serialization, transport, timeout, delivery logging, and the GitHub-compatible default.
- Stripe owns its header format and installs it before subscription registration or dispatch.
- GitHub's wrapper binds the original dispatch method to the same instance, so the instance factory remains visible.
- Linear retains its independent dispatcher and delivery store.

## Lenses

- Inverse regression surface: skipped, no data source replacement.
- New-domain matrix: skipped, no validator widening.
- Resolution-rule consistency: skipped, no input resolution rule changed.
- Shell re-parse append domain: skipped, no shell parsing.
- Emission channel and one-shot latch: skipped, no user-facing process channel or latch.
- Shim hermeticity: skipped, no shim.
- Deliberate-default check: run, GitHub remains the compatibility default and is covered through the GitHub wrapper.
- Fresh-seam scan: run, found and fixed failure logging and standalone seed ordering.
- Substrate differential corpus: skipped, no substrate-dependent parser.
- Reference-implementation oracle: run against Stripe's official manual verification contract.
- New-failure-outcome propagation: run, factory exceptions remain recorded as failed deliveries.
- Flag-propagation dispatch sweep: skipped, no flag.
- Error-path forcing: run, a throwing factory is forced.
- Non-destructive recovery: skipped, no recovery mutation.
- Cancellation and timeout hygiene: run, the existing 10-second transport timeout remains unchanged.
- Boundary pipeline trace: run through standalone seed, subscription, dispatch, headers, fetch, and delivery log.
- Substrate verification: run through built packages and full monorepo tests.
- Dogfood the built artifact: run against built CLI help.
- Docs-behavior parity: run across all required surfaces.
- Demonstrative example: skipped, the existing webhook handler example remains valid and the new text states the wire contract directly.
- Choice audit: run, narrowed the factory context to a read-only subscription and delivery ID.
- Complexity budget: skipped, no new per-element nested work.

## Exemptions claimed

- No Stripe SDK dev dependency is required. The test independently recomputes the documented HMAC with `node:crypto`.
- Slack and Resend are outside this PR because neither exposes a consumer-reachable subscription surface.
- Linear is outside this PR because it has a separate dispatcher and delivery-log shape.

## Issue candidates

- Add consumer-facing webhook subscription surfaces for Slack and Resend. Their dispatch calls exist, but users cannot create subscriptions through production APIs.
