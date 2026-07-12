# Case: Verify exporter payloads through the exported artifact

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1204](https://github.com/vercel-labs/agent-browser/issues/1204) · [commit](https://github.com/Railly/agent-browser/commit/9d31209914409a38a123875985d6a3319a5e108d) · [branch](https://github.com/Railly/agent-browser/tree/fix/har-response-bodies)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

HAR exports included response metadata but omitted `response.content.text`, preventing consumers from replaying the captured responses.

## Red signal

A local page fetched a known JSON payload while HAR recording was active. Parsing the exported HAR showed every entry missing `content.text`. After the patch, document and JSON bodies appeared verbatim.

## Method used

1. Compare the produced artifact with the ecosystem reference behavior.
2. Reuse the retained request ID to fetch bodies at export time.
3. Resolve the CDP session that originally emitted each request.
4. Make individual body fetches best-effort because Chrome may evict payloads.
5. Parse the HAR in the end-to-end test rather than accepting command success.

## Outcome

The branch exports available response bodies, preserves explicit absence for evicted bodies, and handles base64 payloads. Unit and end-to-end tests passed and were falsified. No upstream PR was opened.

## Evidence

- Source: export-time body retrieval in the linked commit.
- Runtime: parsed HAR changed from missing bodies to known HTML and JSON payloads.
- Tests: `e2e_har_includes_response_bodies` plus unit coverage for present and absent bodies.
- Artifact: the `.har` file itself was parsed and inspected.

## Transferable lesson

For an exporter backed by a source with limited retention, fetch payloads while they remain available, tolerate per-item absence, and verify the serialized artifact rather than the export command.

## Exceptions

Do not increase export completeness when policy requires payload omission. Sensitive payload capture needs an explicit contract.

## Candidate changes

- No runtime skill change. The method was routine and remains case evidence.
- Coverage gap: long sessions, eviction, and large-body memory behavior remain unmeasured.

## Confidentiality review

The issue, source, branch, commit, fixture, and tests are public. No captured user traffic is included.
