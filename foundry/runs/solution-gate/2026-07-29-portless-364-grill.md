# Grilling record: what portless issue #364 is actually about

Date: 2026-07-29
Repository: vercel-labs/portless, issue #364, PR 374
Method: grill-with-docs (grilling + domain-modeling), facts established before questions

Written because four review rounds and two solution-gate runs were spent on the mechanism that
delivers a warning, and none on what the warning is about. The grilling started from the issue and
the spec instead of from the diff, and the framing changed on the first question.

## Facts established, not assumed

**RFC 6761 section 6.3 says SHOULD, not MUST.** Name resolution APIs and libraries "SHOULD recognize
localhost names as special and SHOULD always return the IP loopback address". The only MUST in that
section is aimed at registrars, forbidding registration. So a conforming system may decline to
resolve `app.localhost`, and nothing in the spec is violated.

**Two resolution paths answer differently on the same machine.** Measured on darwin 25.5 with no
portless block in `/etc/hosts`:

| instrument | `app.localhost` |
|---|---|
| `host` | NXDOMAIN |
| `dig +short` | empty |
| `ping` | 127.0.0.1 |
| `getaddrinfo` | 127.0.0.1 |

`host` and `dig` speak DNS and bypass the system resolver's special-casing. Every application uses
`getaddrinfo`, which honours it. The same held in a clean Debian glibc container, including
`a.b.localhost`.

**Issue #23, which motivates the hosts sync, measured the DNS path.** Its evidence is
`host app.localhost` returning NXDOMAIN. No application resolves names that way. The report is not
worthless (its `ping app.test.localhost` failure is a real getaddrinfo failure on that machine, and
platform and version variance is real), but the headline evidence does not support the headline
claim.

**Custom TLDs never resolve natively.** `app.test` fails getaddrinfo on both platforms tested. This,
not `.localhost`, is what the hosts sync is load-bearing for.

**`checkHostResolution` already exists** (`hosts.ts`), uses `dns.lookup`, and returns whether a
hostname resolves to exactly `127.0.0.1`. It is called in exactly one place: `portless doctor`.
Issue #364's own words are "Registration time is where the signal belongs." Doctor already computes
the right signal; nothing wired it into registration.

**No DNS cache flush after writing hosts.** Verified on glibc that an entry added to `/etc/hosts` is
visible to the next `dns.lookup` with no flush and no negative caching. Unverified on macOS, because
testing it requires writing this machine's `/etc/hosts`.

**The README's browser claim is accurate.** Chrome, Firefox and Edge carry built-in `.localhost`
handling; Safari relies on the system resolver. An earlier criticism of that wording in this session
was wrong and is retracted here.

## Glossary

- **Resolution path** — `getaddrinfo` and everything built on it. What applications and browsers use.
  RFC 6761's SHOULD applies here.
- **DNS path** — the DNS protocol, reached by `host`, `dig`, `nslookup`. Bypasses the resolver's
  special cases. Not what applications use, and not a valid instrument for this question.
- **Native resolution** — a hostname resolving to loopback with no hosts entry. True for
  `.localhost` on current macOS and glibc, false for custom TLDs.
- **Synthesized resolution** — resolution that exists only because portless wrote a hosts entry.
- **Load-bearing sync** — a hosts write whose absence changes whether the user's app works. Only
  where resolution is not native.
- **Trigger** versus **reporter** — the internal request makes the daemon act now. It is not the
  source of truth for what happened.

## Decisions

**D1. The warning is about whether the hostname resolves, not whether the file was written.**
A failed write means opposite things depending on the TLD: nothing at all for `.localhost` on a
current machine, a broken app for `.test`. Four review rounds were spent making a file-write report
reliable, when the report was answering the wrong question. The observable that matters is local,
authoritative and needs no privilege.

**D2. Register, trigger the daemon with the bounded request, then check resolution once.**
The request stays, because it collapses the watcher latency that three rounds died on. Its response
body stops being load-bearing: the CLI does not trust it, it observes the outcome itself. This
dissolves three separate defects at once. A wrong peer syncing its own routes no longer matters,
because the caller checks its own hostname. A daemon that deleted the block after failing to read
`routes.json` no longer matters, because the hostname will not resolve and the warning is correct. A
daemon too old to answer no longer matters, because the resolver answers regardless of what version
is on the other side.

**D3. No special case for the daemon's opt-out. Report what the resolver says.**
Under D1 the question is whether the app will work. A user who set `PORTLESS_SYNC_HOSTS=0` and whose
hostname resolves anyway hears nothing. One whose hostname does not resolve hears something they
need. This **retires a must-not-change item written earlier in this session** ("a daemon started with
`PORTLESS_SYNC_HOSTS=0` produces silence"), which was measuring the write rather than the outcome.
`portless hosts sync` is the remedy in both cases and ignores the opt-out, so the advice stays true.

**D4. Two commands, two questions. `syncHostsFile` always reports exactness.**
The registration warning asks "will the hostname I just registered resolve", answered by the reader
with `checkHostResolution`, unprivileged and local. `portless hosts sync` asks "did I make the file
match my routes", answered by the writer with exactness, and keeps its sudo escalation. Giving the
writer the weaker semantics broke that escalation: with a stale entry it could not remove, it
returned success and never asked for sudo. Neither proposer saw this cleanly. One proposed coverage
in the return because it was looking at the automatic path; the implementer then applied it to all
three consumers. The resolution is that the weak question belongs to whoever is asking it, not to
the writer.

**D5. Await the trigger before spawning a child. No exit barrier.**
Measured on this machine: the trigger request has a median of 8.6ms and a maximum of 35.7ms
including `curl` startup, against a 2000ms timeout, which is 57 times the observed worst case. With
the timeout lowered to 500ms, a healthy daemon costs single-digit milliseconds before a dev server
starts, and P3 dissolves by construction: nothing is voided, so nothing can be lost. The rejected
alternative was retaining the promise and awaiting it in the process-exit handler, which adds an
async step to the exit path, distinguishes normal from signal exits, and exists only to avoid paying
9ms. Accepted cost: a daemon that accepts the connection and never answers delays a child start by
up to 500ms, and a loaded machine could produce a false "could not confirm". Carried assumption: the
500ms figure comes from one machine with a local, healthy daemon.

## What implementing it then found

Two defects the grilling did not predict, both found by driving:

**The trigger discarded the one bit worth keeping.** A daemon too old to have the internal route
answers 404, and reading the resolver on receipt reported an absence that daemon was one debounce
away from fixing. Driven against a build of main with a custom TLD: the warning printed, and the
hostname resolved two seconds later. Fixed by having the trigger report acknowledgement, so a
daemon that acted gets one read and a daemon that did not gets a bounded poll. Fourth time in this
session that a fix reintroduced the previous round's defect class.

**Docker Desktop on this machine only shares paths under /Users.** A mount from /tmp arrives
silently empty, so every container measurement taken against a build under /tmp was invalid,
including one earlier in this session where main appeared not to sync at all. Both solution-gate
proposers had reported the same thing and it was read as their problem rather than the harness's.

## Consequence for the open PR

PR 374 currently reports on file writes through a channel with a protocol field, an identity check
and a version-skew branch. Under D1 through D3 most of that becomes unnecessary rather than fixed.
The four findings from the last review gate, and the receipt-and-identity shapes both proposers
designed for them, largely dissolve instead of needing implementation.
