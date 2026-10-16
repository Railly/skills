# Case: seven rounds on how a warning is delivered, none on what it is about

Status: observed
Validation: contributor-validated
Human review: contributor-complete
Maintainer acceptance: pending
Delivery: PR open
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/374 (issue #364), superseding closed PR #367
Upstream status checked: 2026-07-29

> Agent-authored record. Maintainer findings are ctate's; the arc analysis and the line counts are this session's.

## Observed failure

Issue #364 asks for one printed line: warn at registration time when the automatic `/etc/hosts` sync cannot write. The sync runs inside a detached daemon whose stdio goes to `proxy.log`, so delivering that line crosses a process boundary.

Seven review rounds followed, four of them maintainer-raised, each fixing a defect the previous fix introduced: a warning emitted in the wrong process, a warn-once latch consumed by an empty warm-up sync, a poll ceiling shorter than the producer's fallback interval, a successful registration paying its full timeout, a correctly-derived ceiling that made the no-producer path hang, a live-but-mute daemon hanging the same way, a state artifact left behind by `clean` with user hostnames in it, and a startup declaration that overwrote the outcome it was supposed to deliver.

Every one of those lived in the delivery mechanism. Not one was in the detection or in the sentence.

The question nobody asked, for seven rounds and two solution-gate runs, was what the warning is about. Answering it moved the problem on the first question of a grilling pass, and it retired most of the machinery rather than fixing it.

## Red signal

- Setup: no portless block in `/etc/hosts`, on macOS 26.5.2 and on Debian glibc and Alpine musl containers.
- Check: does `app.localhost` resolve, and does `app.test`?
- Expected, per the project's premise: neither resolves without a hosts entry, which is why the sync exists and why a failed write is worth a warning.
- Actual: `app.localhost` resolves to loopback on all three, with no entry. `app.test` resolves on none of them. RFC 6761 section 6.3 makes this a SHOULD for resolvers, not a MUST, so it is a platform and version property rather than a guarantee.
- And the instruments disagree on one machine: `host app.localhost` returns NXDOMAIN while `getaddrinfo` returns `127.0.0.1`, because `host` and `dig` speak DNS and bypass the resolver's special-casing. Every application uses `getaddrinfo`.
- Why trustworthy: three platforms, two instruments each, and the spec text. Issue #23, which motivates the whole hosts sync, presents `host app.localhost` returning NXDOMAIN as its headline evidence.

The consequence: a failed write means opposite things depending on the TLD. On `.localhost` it changes nothing observable. On a custom TLD it breaks the app. A warning about the write cannot tell those apart, and the pipeline had been making that warning reliable.

## Method used

1. Four review-gate rounds on the delivery design, three of them finding real defects the author's own pass had missed.
2. Two solution-gate runs with two proposers on different model families. Both produced better designs than the implementer's, and the implementer mis-implemented the synthesis both times.
3. A grill-with-docs pass that started from the issue and RFC 6761 instead of from the diff. It established the facts above before asking anything, and the framing changed on question one.
4. Reimplementation from `origin/main` under the reframed property, then two further review-gate rounds on the result.

## Outcome

The warning now reports whether the hostname resolves, using `checkHostResolution`, which already existed and was already called by `portless doctor`. Issue #364's own words are "Registration time is where the signal belongs"; doctor already computed the right signal and nothing had wired it into registration.

Line counts against `origin/main`, measured the same way at each stage:

| stage | production | tests | comments |
|---|---|---|---|
| delivery channel, at its largest | 405 | 480 | 293 |
| reframed, request as trigger | 242 | 310 | 178 |
| reframed, no endpoint at all | 179 | 214 | 108 |

The endpoint, its two guards, an acknowledgement bit and a version-skew branch existed only to make the failure path fast. Removing them left `proxy.ts` and `types.ts` byte-identical to main.

Open at record time: the endpoint-free shape waits 3.5 seconds on every path where the hostname does not resolve, including with no daemon running, because reading the hosts file cannot distinguish "not yet" from "never". That is a worse trade than it appeared when it was chosen, and the decision between 9ms with an endpoint and 3.5s without one is back open.

## Evidence

- Source: `packages/portless/src/cli-utils.ts`, `hosts.ts`, `cli.ts`. `checkHostResolution` at `hosts.ts:125`, previously called only from `portless doctor`.
- Runtime: resolution measured on darwin 25.5 and 26.5.2, Debian glibc 2.36, Alpine musl 1.2.5. Success path driven as root in a `node:24` container, which is the only way to exercise a real hosts write. Version skew driven against a built `origin/main` daemon.
- Spec: RFC 6761 section 6.3, SHOULD for resolvers, MUST only for registrars.
- Tests: seven instances this session of a test that passed with its defect present. Two asserted a timeout at an injected constant an order of magnitude below the shipped one; one anchored on the wrong occurrence of a symbol; one matched a documentation passage other than the defective one; one asserted `.toBe(true === false)`.
- Review: four maintainer rounds by ctate; four blind review-gate rounds on a different model family than the author.

## Transferable lesson

> When a pipeline keeps finding defects in how a signal is delivered, ask what the signal is about before making the delivery more reliable. A mechanism that answers the wrong question absorbs unlimited review effort, because every round is genuinely correct about the round in front of it.

Two corollaries, both with their own evidence here:

**The author's review is structurally biased toward the author's intent.** On the same commit, the author's own gate pass produced two findings and no Highs; an independent pass on a different model family produced seven findings and four Highs. The author had run the deterministic layer, traced consumers, and driven the binary in a container. The gap was not effort. Each missed defect sat where the author's assumption was the premise: that `loadRoutes` throws on invalid JSON, that a product header identifies an instance, that a test covered what its name claimed.

**A harvested invariant does not fire when the harvester is also the implementer.** The invariant "a wait on a producer first establishes that the producer exists" was written into this repo's conventions file from round 5 of this same PR, by the same agent that violated it in round 8 two hours later. It did not fail as knowledge. It failed as retrieval: the next situation presented itself as "avoid a false warning against an old daemon", not as "a wait on a producer", so a rule indexed under the previous defect's shape never matched.

- Why it transfers: any cross-process diagnostic invites this, and any project that harvests its own lessons into a document separate from the code will find that the document does not load at edit time.
- Where it does not apply: a defect whose observable and whose mechanism are the same thing, where there is no wrong question available.

## Exceptions

- The reframe is a product reinterpretation, not a strictly better implementation. #364 literally asked for a warning about the write; this warns about resolution, so a failed write on `.localhost` is now silent. The issue's author is the same person who filed it here, which is why it was taken; on someone else's issue it would need asking first.
- `checkHostResolution` accepts only IPv4 `127.0.0.1`, so a hostname resolving solely to `::1` gets a false warning even though portless listens there. Found by the last gate, unfixed at record time.

## Candidate changes

- Skill method: selected. Run grill-with-docs **before** solution-gate, not after review rounds accumulate. It cost ten minutes and moved the problem; it ran here in hour eighteen.
- Reference rule: selected. Review Gate's "prefer a reviewer model different from the one that wrote the diff" should be a requirement rather than a preference, on the strength of two findings against seven on identical code.
- Deterministic check: candidate. A test that asserts behavior at an injected constant must print the production constant beside it, or be run once at it. Seven instances in one session, none caught by force-red because force-red asks whether the test goes red, not whether it goes red at the scale users get.
- Reference rule: selected. Invariants that govern a specific symbol belong in a comment on that symbol, phrased as what a future editor must not do. A conventions file in another repository does not load while editing.
- Coverage gap: the macOS negative-DNS-cache question. A name that fails to resolve gets a 40x faster answer on the second query, so something caches it; whether writing `/etc/hosts` invalidates that is unverified, because verifying it requires writing a real machine's hosts file.

## Confidentiality review

Public repository, public PRs and issues, public commit SHAs. The maintainer is named by his public GitHub handle on public review comments. No employer-internal context, no private review text, no local machine paths beyond throwaway state directories.
