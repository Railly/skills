# Proposals, verbatim — emulate webhook envelope (2026-08-11)

Both produced blind to each other from the identical brief. Neither proposer is the implementing runtime.
Target: `vercel-labs/emulate` at `1e4b71a` (0.9.0). Repo checkout did not contain the candidate shape:
it lives only in closed PR #100, which is not in the working tree.

- Proposer A: Claude Sonnet, via a read-only recon subagent.
- Proposer B: `openai/gpt-5.6-sol`, via `codex exec --sandbox read-only`.

The brief (`property violated`, `observable that must change`, `what must not change`, grounding facts)
is reproduced in the record file, section 1. It named no solution.

---

## Proposal A — Claude Sonnet

### Shape

State: `WebhookSubscription` gains one new optional field, `format?: WebhookFormat`, where `WebhookFormat = "github" | "stripe" | "slack" | "resend"`. Default is `"github"` when a caller omits it, applied inside `register()` at construction time (`format: sub.format ?? "github"`), so every existing `register()` call site (92 dispatch sites are unaffected — they don't touch `register`; the ~9 register sites in github, stripe, and the two test helpers) keeps producing exactly today's GitHub-shaped subscription without editing a single call site.

`WebhookDispatcher.dispatch()` stops hardcoding the GitHub header block. In its place, a small pure lookup table lives in `core/src/webhooks.ts`, one entry per format, each a function `(body: string, secret: string | undefined, ctx: { deliveryId: number; event: string }) => Record<string, string>`:

```ts
type SignerFn = (body: string, secret: string | undefined, ctx: { deliveryId: number; event: string }) => Record<string, string>;
const SIGNERS: Record<WebhookFormat, SignerFn> = { github: ..., stripe: ..., slack: ..., resend: ... };
```

`dispatch()` calls `SIGNERS[sub.format](body, sub.secret, { deliveryId: delivery.id, event })` once, in place of the current `if (sub.secret) { ...X-Hub-Signature-256... }` block plus the hardcoded header literals in the `fetch` call. The `github` entry reproduces today's three headers plus the `Content-Type`; today's unconditional `Content-Type: application/json` moves inside the github signer's return value (Resend/Svix and Slack also need `Content-Type: application/json`, so this is not a divergence, just relocated).

Decision ownership: the registering plugin decides its own format (`stripe/src/index.ts:106` adds `format: "stripe"`, a future slack/resend registration route adds `format: "slack"`/`"resend"`). `core/src/webhooks.ts` owns only the mechanical HMAC/timestamp construction per format — it does not decide which format applies to which owner string, so `owner: "stripe"` remains just a namespace, not a format switch.

Linear is untouched: `dispatchLinearWebhook` keeps its separate code path.

`ServicePlugin`, `register`, `unregister`, `getSubscription`, `getSubscriptions`, `updateSubscription`, and `dispatch()`'s parameter list are all untouched.

### Predictions

1. `bun test packages/@emulators/core/src/__tests__/webhooks.test.ts packages/@emulators/github/src/__tests__/webhook-installation.test.ts` still passes unmodified, byte-for-byte, because every subscription in those tests omits `format` and defaults to `"github"`. False if either suite fails or needs edits.
2. A new test that registers a subscription with `format: "stripe"`, a `secret`, dispatches a Stripe event, and feeds the received body plus `Stripe-Signature` header to `stripe.webhooks.constructEvent(body, header, secret)` returns an `Event` rather than throwing. False if `constructEvent` throws.
3. The same test for `format: "slack"` asserts `X-Slack-Signature` matches `v0=<hex hmac sha256("v0:" + X-Slack-Request-Timestamp + ":" + rawBody)>` recomputed independently with `node:crypto`. False if the recomputed value differs.
4. `grep -rn "format:" packages/@emulators/*/src/index.ts packages/@emulators/*/src/routes/webhooks.ts` shows exactly one call site touched per newly supported service and zero of the 92 `dispatch()` call sites gain an argument. False if any `dispatch()` call site needed editing.
5. `bun tsc --noEmit` across all 17 packages passes without touching any package other than `core` and the service whose `register()` gains `format`.

### Cost

- One new field on `WebhookSubscription` that every future service must remember to set, or it silently inherits GitHub's wire format.
- One new module-level constant (`SIGNERS`) in core that every future format addition edits, growing core's embedded knowledge of four unrelated companies' crypto conventions.
- Resend's Svix secret parsing (strip `whsec_`, base64 decode) now lives in core.
- Anything introspecting `WebhookSubscription` gains one more optional key.

### What it makes worse

Core's `webhooks.ts` now hand-maintains four services' cryptographic wire formats in one file, which is strictly more coupling surface than today's single hardcoded GitHub block. The violated property is only half fixed: core now knows all services' formats as a closed table instead of one service's format as the format. A fifth service still requires a core change, and four formats side by side make it easier to transpose an HMAC input string and pass the GitHub-path tests while breaking a real SDK.

### Rejected alternatives

- Per-owner format inference from the `owner` string: `owner` is already an overloaded namespace field, and a GitHub org literally named `stripe` would pick the wrong signer.
- A signer function stored on the subscription: subscription objects flow through `getSubscriptions()` and the delivery log; a function value is unserializable and breaks structural equality in existing shape tests.
- One dispatcher subclass or wrapper per service: each service would re-implement the matching, delivery-log and 1000-cap loop just to change four header lines.
- Folding Linear in: its path carries organization/team lookups and a different delivery-log shape (`ls.webhookDeliveries`, with `error`, no `duration`/`success` cap).
- Making `format` required: would touch all existing `register()` call sites for a compile-time gain a lint rule delivers more cheaply.

---

## Proposal B — openai/gpt-5.6-sol

### Shape

`WebhookDispatcher` gains one instance-scoped header factory. Matching, serialization, transport, timeout, and delivery logging remain core responsibilities. The active service owns header construction, secret interpretation, timestamps, identifiers, and signatures.

```ts
type WebhookHeaderFactory = (input: {
  body: string;
  event: string;
  action?: string;
  deliveryId: number;
  timestamp: number;
  subscription: Readonly<WebhookSubscription>;
}) => Record<string, string>;
```

- Core serializes the payload exactly once and passes those raw bytes to the factory.
- `WebhookSubscription` and `WebhookDelivery` retain their current fields.
- `dispatch(event, action, payload, owner, repo?)` remains unchanged.
- Stripe, Slack, and Resend install their factories during `plugin.register`. Stripe's configuration seeding must install the same factory before registering subscriptions when called independently.
- The current GitHub format remains the compatibility default for a bare `WebhookDispatcher`.
- Stripe emits `Stripe-Signature`. Slack emits `X-Slack-Request-Timestamp` and `X-Slack-Signature`. Resend emits `svix-id`, `svix-timestamp`, `svix-signature`, with Svix-compatible secret decoding.
- Non-GitHub factories emit no GitHub-specific headers.
- `ServicePlugin` does not change. No dispatch call sites change. Linear remains on its existing independent path.

### Predictions

- With a fixed clock, service tests capture exact Stripe, Slack and Resend headers and independently recompute each signature from the captured body. Stripe's captured body and `Stripe-Signature` make `stripe.webhooks.constructEvent` return an event. Measured with `pnpm --filter @emulators/stripe test`, `... slack test`, `... resend test`.
- Those tests also assert that `X-GitHub-Event`, `X-GitHub-Delivery` and `X-Hub-Signature-256` are absent from all three services. A factory selected through `owner`, or a retained universal GitHub format, would fail this measurement.
- Existing GitHub signature, matching, failure-logging and delivery-cap tests remain unchanged and pass: `pnpm --filter @emulators/core test`, `... github test`.
- All 17 plugins and the existing dispatch sites compile without modification to their contracts: `pnpm type-check`.

### Cost

- One factory field and configuration operation on `WebhookDispatcher`.
- Three service-owned signing modules or equivalent functions.
- Configuration calls in the Stripe, Slack and Resend registration paths.
- Service-level wire-format tests and deterministic clock handling.
- A direct Stripe SDK test dependency if the Stripe package does not already declare it. Dev only, no new runtime dependency.
- Documentation updates across README, skills, docs site, CLI help.
- A rule future webhook-capable services must remember: install the factory before registering or dispatching.

### What it makes worse

Configuration becomes order sensitive. A plugin must configure the dispatcher before any delivery, and sharing one dispatcher between unlike service plugins becomes invalid. The GitHub-compatible default remains a footgun for code that creates a dispatcher but never registers its service plugin. There is additional indirection when debugging headers: the transport loop no longer contains the complete request construction.

### Rejected alternatives

- Branch on `owner` inside `dispatch`: GitHub uses `owner` for repository ownership while the others use it as a service namespace. It conflates matching identity with wire format.
- Add a service argument to `dispatch`: requires migrating 92 call sites and breaks the source-compatible signature.
- Add a format field to every subscription: Slack and Resend do not own registration sites, callers would need service-specific knowledge, and subscription state would acquire transport policy.
- Add webhook formatting to `ServicePlugin`: changes the shared contract implemented by 17 packages.
- A switch over every service name in core: every future wire-format change modifies core, recreating the ownership problem at registry scale.
- Fold Linear in now: separate filtering, payload construction, headers, identifiers and delivery persistence. Unnecessary to fix the other three and expands the regression surface.
