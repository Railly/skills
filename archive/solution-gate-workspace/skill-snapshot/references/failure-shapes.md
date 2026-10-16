# Fix-failure shapes

The objective half of [solution-gate](../SKILL.md). Every shape here is distilled from a recorded case where a fix was written, reviewed, merged or pushed, and was then found defective: not from imagination about how fixes could go wrong.

A proposal is scored by asking, for each shape: **does this proposal repeat it?** The answer is citable, so two reviewers disagreeing about a proposal are disagreeing about a fact.

Shapes are added the same way gates are: from a recorded case, with provenance. Never from a plausible-sounding failure mode nobody has hit.

---

## S1. Over-reach: the fix generalizes past the finding

The reported defect is a special case; the fix rewrites the general rule. The finding closes and something that already worked breaks.

- **Ask:** what worked before that this proposal now treats differently? Name it, then check it.
- **Provenance:** portless #365 (2026-07-17): the gate correctly flagged that `RISKY_TLDS` never warned for multi-segment TLDs; the fix suffix-matched every risky entry, so the flagship documented workflow (`--tld dev.example.com`) warned about DNS leaks on every proxy start. portless #367 round 5: deriving the wait ceiling correctly made the no-producer path hang for 4.1s, worse than the 1.62s it replaced.

## S2. Under-reach: the fix closes the instance, not the class

The reported input stops reproducing. One variant deeper still does.

- **Ask:** what is the smallest change to the reported input that should still be caught? Does this proposal catch it?
- **Provenance:** portless #366 round 7: the guard excluded exactly one subcommand name, `build`, which cannot cover `optimize`, `vp test`, or `astro check`. The next fix inverted to an allowlist and `vite --mode dev build` still injected, because the classifier read the first bare positional without knowing which flags consume a value.

## S3. Direction inheritance: the fix treats one direction of a two-way cause

A reviewer reports the direction that bit them. The root cause runs both ways.

- **Ask:** state the cause in one sentence containing no symptom. What does the opposite direction look like, and is it reachable?
- **Provenance:** portless #367 round 6: a CLI reading its own environment to describe a daemon was reported as *waiting 4.1s for a publication that never comes*. The same cause also *discarded a real failure the daemon did publish*, which is worse and was reachable. Found by a blind reviewer driving the binary, not by the harvest.

## S4. Proxy property: the guard proves something adjacent to what it needs

The check is correct and answers a different question than the one that matters.

- **Ask:** write the property the code actually depends on, then the property the guard tests. If they are different sentences, enumerate the gap.
- **Provenance:** portless #367 round 6: `hasLiveHostsSyncPublisher` proved a PID was alive. What the wait depended on was whether that process would *publish*. A daemon from an older build, and one started with syncing disabled, satisfy the first and fail the second.

## S5. Unregistered peer: new state nothing else knows about

The change starts producing something persistent and does not tell the components that manage its lifecycle: cleanup, migration, backup, export, quota.

- **Ask:** who else in this system knows the full set this thing now belongs to? Is that set hardcoded somewhere with no coupling to the producer?
- **Provenance:** portless #367 round 6: `proxy.hosts-sync-status` was added to the daemon-to-CLI handoff and never to the `clean` allowlist, so `portless clean` left it behind with the registered hostnames inside. Nothing could fail: the writer worked and the remover was unaware.

## S6. Peer-version blindness: a new cross-process contract assumes the peer implements it

Two processes that can be different builds get a new protocol, and only the new build is imagined.

- **Ask:** at the moment this ships, which side is old? What does the new side do when the peer never speaks?
- **Provenance:** portless #367 round 6: the daemon already running when a CLI upgrade lands is by construction the previous build. It never wrote the status file, so every alias registration paid the full ceiling. The upgrade path is the first path users take and the only one the branch cannot test against itself.

## S7. Wrong layer: the mechanism is right and its delivery is broken

Detection, computation, or decision is correct; the result reaches nobody, or the wrong body.

- **Ask:** trace the result from where it is produced to where a human or caller consumes it. Name every process, stream, and buffer it crosses.
- **Provenance:** portless #367 round 3: the hosts-sync warning was computed correctly inside the detached daemon, whose stdio is redirected to `proxy.log`. The user is attached to a different process and saw nothing.

## S8. Guard-derived cells: the verification inherits the guard's blind spot

The matrix used to test a new guard is enumerated from the positions that guard inspects, so it cannot contain the case the guard cannot see.

- **Ask:** derive the cells from the input domain the *composed helpers* accept, not from what the new code looks at.
- **Provenance:** portless #366: `isCompoundShellScript` was hardened three times against separators and quoting and never learned `#`, because every round's cells came from the class the previous reviewer named.

## S9. Test pins the wrong thing: the fix ships green for the wrong reason

The test added with the fix passes without the fix, passes for an unrelated reason, or asserts the defect as expected behavior.

- **Ask:** delete each mechanism this proposal introduces, separately. Does a distinct test fail for each? Does any assertion run at a scale the shipped code never uses?
- **Provenance:** portless #366 round 7: `vite --mode production build` declines passed because the value was simply not in the allowlist, not because the fix worked. portless #367 round 6: the suite asserted "gives up at the ceiling" at an injected 100ms while the shipped constant was 4100ms, so a hang read as correct bounded behavior through two review rounds.

## S10. Claim from prose: a load-bearing fact taken from documentation, not execution

A list, a grammar, or an API shape written from what the docs say rather than from what the installed thing does.

- **Ask:** which claims in this proposal are load-bearing if wrong? For each, what command proves it against the real artifact?
- **Provenance:** portless #366 round 7: an astro sub-subcommand exclusion named commands the installed astro (5.17.3) does not have, guarding a dispatcher that validates no unknown flags anyway.

## S11. Asymmetric validation across consumers of one input

Two consumers read the same user-supplied input, and the one holding more authority validates it less. Each side looks defensible alone; the gap is only visible when you ask which of them can do more damage with a bad value.

- **Ask:** list every consumer of this input, rank them by what a wrong value buys an attacker or a mistake, and check that validation strength runs in the same order. Where it does not, the weaker check is the real contract.
- **Provenance:** agent-browser #1669 (2026-08-08): `--ca-cert` fed both a rustls root store, which validated the certificate, and Chromium's `--ignore-certificate-errors-spki-list`, which suppresses every certificate error for a chain carrying the key and reached the file through a positional ASN.1 walk with no OID, signature, or structure check. A 37-byte file that openssl refuses to load produced a hash and Chromium received it. The stronger grant had the weaker validator. Closed by one shared loader whose discriminator is a certificate parser's verdict.

## S12. Primitive-contract mismatch: the mechanism succeeds by violating the promise

The feature promises one contract, but the chosen primitive has different acceptance semantics. The reported happy path passes, so implementation and tests look correct while negative cases reveal that the product built a bypass, approximation, or adjacent capability.

- **Ask:** write the feature contract and primitive semantics as separate accept/reject rules. Which input must the contract accept while the primitive rejects, and which must the contract reject while the primitive accepts?
- **Provenance:** [agent-browser #1669](../../../cases/agent-browser/1669-spki-bypass-is-not-ca-trust.md) (2026-08-13): `--ca-cert` promised to trust a supplied interception CA while retaining certificate and hostname verification. The implementation used Chromium's SPKI error bypass. It accepted a wrong-hostname leaf when a presented key matched, and rejected a valid separately keyed leaf when the supplied CA was omitted from the presented chain. The process knew the flag was stronger than adding a root but gated only certificate parsing, not trust semantics.

---

## Using the list

Not every shape applies to every proposal, and a proposal that repeats a shape is not thereby rejected: sometimes the shape is the right trade. What is not allowed is repeating one silently. Each hit is either designed out or carried into the record as an accepted cost with its reason.

Two shapes deserve extra weight when the change under design is itself a fix for a previous review round, because that commit is empirically the most defect-dense artifact in the pipeline: **S1** and **S2**, the two halves of missing the finding's actual size.
