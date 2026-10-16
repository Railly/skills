# Review Gate receipt gaps

- No exact-head Test Strength receipt was available. The diff changes an HTTP `Accept` parser and content-negotiation adapter, so Review Gate cannot treat authored tests or its own probes as a substitute for the required independent behavioral-strength receipt.
- Resilience Audit was not triggered. The changed GET path has no new durable or remote commit point, lifecycle, timeout, cancellation, or cleanup behavior.
- The packaged FX independent review was attempted once and timed out after 180 seconds. Its failed receipt is `fx-review.json`; it does not count as an independent review pass.
- No work-item manifest or separate Issue Contract was found. The explicit user request and PR body were used as the review contract.
- `gate.sh surfaces` reported the generic CLI surface map entries for `skills/emulate/SKILL.md` and `apps/web/app/docs/page.mdx` as absent. Those surfaces describe generic startup/configuration and do not carry GitHub Contents semantics; the exception is recorded in the report.
- `gate.sh shellmeta` falsely matched this HTTP parser as a shell-metacharacter detector. Shell parsing is not part of the changed behavior; the result is acknowledged as inapplicable.
- `gate.sh callers` reported the unchanged `contentsRoutes` registration in `packages/@emulators/github/src/index.ts:648`; it was inspected and only registers the route, with no changed contract assumption.
- `gate.sh rawinput` reported unrelated OAuth Accept comparisons at `packages/@emulators/github/src/routes/oauth.ts:197` and `:199`; those compare OAuth response negotiation and do not re-derive GitHub Contents raw-media semantics.
