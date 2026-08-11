# Solution gate: emulate per-service webhook envelope

- Target: `vercel-labs/emulate` at `1e4b71a` (0.9.0), working tree clean.
- Origin: Anthropic's adoption asks, item 4. Backed by open issues #97 and #98, and by closed PR #100 (@EfeDurmaz16).
- Proposers: Claude Sonnet (A) and `openai/gpt-5.6-sol` (B), blind to each other, neither implementing.
- Proposals verbatim: `2026-08-11-emulate-webhook-envelope-1e4b71a-proposals.md`.
- Drawing: `2026-08-11-emulate-webhook-envelope-1e4b71a.html`.

## 0. Trigger

Fires. The change alters a contract between core and the 17 packages implementing `ServicePlugin`, and the shapes differ in who owns the wire format. Not mechanical: the defect does not determine its own fix.

## 1. Contract

**Property violated.** A shared component in `@emulators/core` encodes one service's wire format as the universal one, so a delivery emitted on behalf of any other service is unverifiable by that service's real consumer.

**Observable that must change.** A delivery dispatched while emulating Stripe, Slack or Resend arrives carrying that service's own signature and event headers, such that the service's real verification routine accepts it.

**Must not change.** GitHub's three headers and their formats; `dispatch()` matching semantics including the `repo` undefined-vs-defined asymmetry, `ping` bypass and `*` wildcard; the delivery log shape, its 1000 cap and its failure-path recording; source compatibility of `register`, `unregister`, `getSubscription`, `getSubscriptions`, `updateSubscription`, `dispatch`; the `ServicePlugin` shape; Linear's current `Linear-Signature` bytes.

The brief named no solution and was handed identically to both proposers.

## 2. Current subsystem facts

All recoverable by grep at `1e4b71a`.

- `core/src/webhooks.ts:106-120` builds one header block: `X-Hub-Signature-256` when a secret is set, `X-GitHub-Event` and `X-GitHub-Delivery` unconditionally.
- 92 `dispatch()` call sites: github 58, slack 14, stripe 11, resend 8.
- `ServicePlugin` is `{ name, register(app, store, webhooks, baseUrl, tokenMap), seed? }` at `core/src/plugin.ts:14`.
- `stripe/src/index.ts:106` registers subscriptions with `owner: "stripe"`, so `owner` already carries a service namespace as well as a repository owner.
- `linear/src/webhooks.ts:59` signs `Linear-Signature` on its own path, bypassing the shared dispatcher.

## 3. Forward chains

### Proposal A (format enum on the subscription, SIGNERS table in core)

- change → core imports four vendors' HMAC conventions into one table (`observed`: the proposal states it)
- → core is the single edit point for every future service's wire compatibility (`inferred`)
- → a fifth service still edits core, so the ownership property is half restored (`inferred`)
- branch: → `format` must be set at a registration site → services without a registration site cannot carry a format (`guessed`, probed as P6, confirmed)

### Proposal B (header factory on the dispatcher instance, installed by the plugin)

- change → the dispatcher carries per-instance state installed during `register()` (`observed`)
- → order sensitivity: a delivery before installation falls back to the GitHub default (`inferred`)
- → if one dispatcher were shared by unlike plugins, the last installer would win (`guessed`, probed as P4, refuted)
- branch: → github replaces `webhooks.dispatch` at `github/src/index.ts:461`, so the wrapper and the instance field must coexist (`inferred`, carried to implementation)

## 4. Probe log

**P1. Does the github plugin mutate the dispatcher?** `grep -n "dispatch = " github/src/index.ts` → line 461: `const originalDispatch = webhooks.dispatch.bind(webhooks); webhooks.dispatch = async (...) => {...}`. Confirmed. Both shapes must survive a monkey-patched `dispatch`.

**P2. Does Linear share the delivery log?** `linear/src/webhooks.ts:63-83` writes to `ls.webhookDeliveries` with an `error` field. Distinct store and shape. Confirmed; supports both proposals' decision to leave it alone.

**P3. Is the Stripe SDK available for the proposed verification?** `ls node_modules/stripe/package.json` → absent. **Refutes the measurement in A's prediction 2 and B's first prediction as written.** Verification must recompute the HMAC with `node:crypto`, or Stripe becomes a devDependency, which the brief excluded.

**P4. Is one dispatcher shared across services?** `grep -rn "new WebhookDispatcher"` → exactly one production site, `core/src/server.ts:30`, inside `createServer(plugin: ServicePlugin, ...)` at line 24. One plugin per server, one dispatcher per server. **Refutes B's own stated downside**: cross-service sharing cannot occur by construction.

**P5. Does Slack's seed register subscriptions?** `slack/src/index.ts:335` inserts into `ss.incomingWebhooks` (inbound URLs), not into the dispatcher. Not a subscription path.

**P6. Exhaustive sweep of `webhooks.register()` call sites.** Production: `github/src/routes/webhooks.ts:171,390` and `stripe/src/index.ts:106`. Tests: `core/src/__tests__/webhooks.test.ts` (29), `github/src/__tests__/webhook-installation.test.ts` (6), and `slack/src/__tests__/helpers.ts:144` (`registerSlackEventSubscription`, `owner: "slack"`). Resend: none anywhere.

**P7. Can a consumer reach the dispatcher?** `packages/emulate/src/api.ts:19` — `interface Emulator { url; reset(); close() }`. The dispatcher is not exposed. The only consumer-facing subscription surfaces are GitHub's REST hooks route and Stripe's `config.webhooks` seed field.

## 5. Failure-shape scoring

### Proposal A

- **S2 under-reach: hit.** Puts the format on the subscription, but P6 and P7 show Slack and Resend have no consumer-facing registration site, so two of the four services cannot carry one.
- **S9 test pins the wrong thing: hit.** Prediction 1 ("existing GitHub tests still pass unmodified") passes without the fix. It is a regression guard, not evidence.
- **S10 claim from prose: hit.** Prediction 2 assumes an installed Stripe SDK. P3 refutes.
- S1, S4, S5, S6, S7, S8: miss.

### Proposal B

- **S2 under-reach: hit, and self-aware.** Same Slack and Resend limit, but it named the cause in a rejected alternative before any probe ran.
- **S10 claim from prose: hit, declared.** Same Stripe SDK assumption, listed as a cost rather than asserted as available.
- **S9: miss.** Its second prediction (GitHub headers absent from non-GitHub deliveries) fails if the fix is absent, so it discriminates.
- S1, S4, S5, S6, S7, S8: miss.

## 6. Synthesis

**Kind: proposal B whole, with a reduced scope, plus one argument grafted from A.**

Chosen shape: an instance-scoped header factory on `WebhookDispatcher`, installed by the plugin during `register()`, GitHub's current format as the default for a bare dispatcher. Core keeps matching, serialization, transport, timeout and delivery logging; it learns no vendor's crypto.

Why B over A:

1. B predicted the Slack and Resend registration gap from the source before any probe. A's shape depends on a field that two services have nowhere to set.
2. P4 refuted B's only serious self-declared downside. A's downside (core learns four vendors' formats) is real and unrefuted, and it is the exact property Anthropic asked to fix.
3. B's discriminating prediction survives S9; A's headline prediction does not.

Grafted from A: its rejection of a signer function stored on the subscription, because those objects flow through `getSubscriptions()` and into structural assertions. That argument supports putting the factory on the dispatcher rather than on the subscription, so it strengthens B rather than competing with it.

**Scope reduced by the probes.** Ship the factory plus the GitHub default plus Stripe, the only non-GitHub service with a consumer-facing subscription surface. Slack is testable through the existing helper but its correct headers would reach a subscription no consumer can create, so include it only with that limit written down. Resend is excluded: no helper, no seed field, no route, therefore no observation possible.

**Finding for the upstream conversation.** Anthropic's item 4 infers from 14 and 8 `dispatch()` call sites that Slack and Resend deliveries go out wearing GitHub's headers. The call sites are real; the deliveries are not reachable, because neither service exposes a way to subscribe. That is a separate gap, and an issue candidate of our own.

## 7. Carried assumptions, to verify during implementation

1. The factory on the instance survives github's `dispatch` replacement at `github/src/index.ts:461`, since `originalDispatch` is bound to the same instance. Reasoned, not run.
2. Verification recomputes HMACs with `node:crypto`. Adding Stripe as a devDependency is an open question for the repo owner.
3. Slack's factory, if included, is provable only through `registerSlackEventSubscription` in the test helper.
4. Order sensitivity: installation happens in `register()`, before any route can dispatch. Reasoned from the call order in `core/src/server.ts:92`, not driven.

## 8. Handoff

- Must-not-change list in section 1 becomes the Review Gate step 5 checklist, driven rather than reasoned.
- Issue candidate, ours not Anthropic's: no subscription surface for Slack and Resend.
- Credit: the design direction originates in closed PR #100 by @EfeDurmaz16. The implementing commit carries `Co-Authored-By`.
- Session handoff with the surrounding triage: `~/kai/05_Areas/vercel/emulate-anthropic-triage-handoff-2026-08-11.md`.
