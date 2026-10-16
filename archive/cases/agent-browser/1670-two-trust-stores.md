# 1669/1670 — two trust stores, and the flag that read three ways

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PRs open
Upstream status checked: 2026-08-13
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1669 and https://github.com/vercel-labs/agent-browser/pull/1670

**Date:** 2026-08-08
**Repo:** vercel-labs/agent-browser
**PRs:** [#1669](https://github.com/vercel-labs/agent-browser/pull/1669) (browser-side CA), [#1670](https://github.com/vercel-labs/agent-browser/pull/1670) (CLI-side CA), stacked
**Origin:** A public-safe report described agent-browser failing behind an HTTPS interception proxy and included a suggested fix.

## What happened

A report arrived with a diagnosis already in it: "PR #1026 might be the right solution." Reading the code first said otherwise. #1026 makes Chromium trust a CA at page-navigation time. The reported failure was the Rust CLI rejecting its own outbound peer, in a different process, before the browser exists. Merging the suggested PR would not have unblocked anyone.

Both problems were real, so both got a PR. What followed was five rounds of findings on the fix, four of them corrections to work I had already called done.

## Lessons

**1. A relayed diagnosis is a hypothesis, and the cheapest thing to check.** The report named a symptom class (certificate rejected behind a proxy) that two independent subsystems produce. Distinguishing them took one grep for the WebSocket connect call and one look at `Cargo.toml`. Everything downstream depended on getting that right, and the version in the ticket was wrong.

**2. "It works" is not the question the review answers.** Every defective version of this fix worked. The prefix-sniff shipped a green CI, a written PR description, and a verified end-to-end run in a real sandbox, and it still regressed a file that loaded before it. What found that was not more testing of the happy path; it was an A/B against a build of the pre-fix commit, asking what used to work.

**3. Rank consumers by authority, not by proximity.** `--ca-cert` fed a rustls root store, which validated, and Chromium's `--ignore-certificate-errors-spki-list`, which suppresses every certificate error for a chain carrying the key and reached the file through a positional ASN.1 walk with no validation at all. The stronger grant had the weaker check. Neither an external bot nor a full review-gate pass found it; it took a proposer asked to be adversarial about the security reasoning. Recorded as failure shape **S11**.

**4. One input, one reader.** The same flag was parsed three ways: the SPKI hasher, the root store, and a reqwest builder. Each was individually correct. A DER certificate was valid for one and invalid for another; a PEM behind a text preamble was the reverse. Any fix that teaches one reader a new format and leaves the others alone recreates the drift, which is why both proposers rejected that shape without seeing each other.

**5. The gate map keys on code, so a doc page no code points at is invisible.** `surfaces` passed and `siblings` passed while two new flags were missing from the Global options list and from the entire proxy page, which is where someone with a certificate error looks first. Closed with a new deterministic check, `gate.sh flagsweep`, that derives its search space from a sibling flag instead of from the diff.

**6. A diagnostic emitted by the wrong process is not a diagnostic.** The root store is built lazily wherever it is first needed, which for a remote CDP connection is the daemon, whose stderr is piped and dropped unread. The one line naming the cause of the failure reached nobody. Same shape as portless #367, in a repo that had never recorded it.

**7. The brief is an ungated input.** The solution-gate brief carried a wrong `Stdio::null()` citation. One proposer caught it. The failure mode it invites is worse than a wrong answer: a shared error entering both runtimes at once reads as independent convergence.

## Evidence

Non-certificate bytes reaching Chromium's trust-bypass flag:

```
$ openssl x509 -in garbage.der -inform der -noout -subject
unable to load certificate
$ agent-browser --ca-cert garbage.der open https://example.com
--ignore-certificate-errors-spki-list=jJGq7in4FA+Hn6gwfMAE1CH34fX0HZTyFqg1l+Pq8MI=
```

The prefix sniff regressing a working file, A/B against a build of the pre-fix commit:

```
                 pre-fix (1c251b4)        prefix-sniff fix
preamble.pem     plus 1 certificate(s)    unusable, ignored
plain PEM        plus 1 certificate(s)    plus 1 certificate(s)
```

`doctor` disagreeing with `install` on the same URL, both opt-ins set:

```
doctor  → pass  Chrome for Testing CDN reachable (100ms, HTTP 200)
install → ✗ invalid peer certificate: UnknownIssuer
```

The two consumers agreeing after the graft, one certificate in two encodings giving one hash:

```
                browser SPKI      CLI trust store
preamble.pem    G4UpiJ+PHRO7k     plus 1 certificate
ca.der          G4UpiJ+PHRO7k     plus 1 certificate
junk.bin        refused           refused
```

`--use-system-ca` reaching a CA that exists only in the macOS Keychain, with the removal proving reversibility:

```
CA absent,  --use-system-ca  → UnknownIssuer
CA present, --use-system-ca  → # Example Domain
CA present, no flag          → UnknownIssuer
CA removed, --use-system-ca  → UnknownIssuer
```

## Harvested

- New deterministic gate: **New-flag doc sweep** (`gate.sh flagsweep`), review-gate catalog.
- New failure shape: **S11, asymmetric validation across consumers of one input**, solution-gate catalog.
- New solution-gate step-1 rule: every factual claim in a brief carries a file:line, read before sending.
- Project conventions: **Trust and TLS norms** section, `cli/src/tls.rs` and `cli/src/ca_bundle.rs` surface lines, six gate-miss ledger entries.

## Records

- Solution gate run: `foundry/runs/solution-gate/2026-08-08-agent-browser-1670-ba519cf.md`, both proposals verbatim beside it.

## Confidentiality review

Public repository, public PRs, public tool behavior, and generated certificate fixtures only. No private discussion, identity, secret, local path, or internal environment detail is included.
