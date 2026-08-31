# Round 014: register security-review

## Candidate

`security-review`, a focused method for deciding whether an observation is an exploitable vulnerability, hardening, a non-security defect, informational, or an unresolved verification gap.

## Origin

Reviewing agent-browser PR #1738 exposed an ownership problem. The change addressed a real hostile-origin and DNS-rebinding boundary, while two adjacent observations looked security-shaped:

- a dashboard token reached configured stdio plugins that already executed arbitrary commands as the same operating-system user;
- dashboard startup could report success before the child bound its requested port.

Treating every secret-shaped flow or availability bug as a vulnerability would have blocked a sound security fix for unrelated work. Treating everything as ordinary Review Gate judgment would leave the attacker and authority model implicit.

## Ownership

Security Review owns:

- assets, actors, principals, privileges, entry points, and trust boundaries;
- attacker prerequisites and existing authority;
- the exploitability chain from capability through impact;
- safe verification at the real security boundary;
- primary security classification and merge relevance;
- an exact-state security receipt.

Review Gate consumes that receipt and owns the final promotion verdict. Resilience Audit continues to own lifecycle, cleanup, retries, partial state, and failure recovery. Test Strength continues to own behavioral falsification.

## Classification boundary

A vulnerability requires evidence that an attacker gains a new confidentiality, integrity, authorization, or availability capability across a trust boundary.

A credential reaching a receiver is not automatically exposure. First determine whether the receiver already has equivalent authority, can execute arbitrary code as the same user, or can read the credential source through existing permissions.

A crash, stale PID, false success response, or failed startup is a lifecycle defect unless an attacker controls the triggering resource or request across a supported service boundary.

Missing deployment assumptions remain verification gaps. They are not completed with invented proxy, network, or identity behavior.

## Evaluation

The first controlled comparison used five cases and one `gpt-5.6-sol` run per configuration:

| Variant | Assertions passed | Pass rate |
|---|---:|---:|
| With `security-review` | 18/18 | 100% |
| No skill | 16/18 | 89.3% |

The skill improved explicit classification of equivalent-authority token inheritance as hardening and unknown reverse-proxy behavior as a verification gap. Cross-tenant leakage, local lifecycle behavior, and keyword near misses passed in both configurations and remain safety regression controls.

Evidence: [benchmark](../../runs/security-review-eval/2026-08-30-iteration-1/benchmark.md).

## Decision

Register `security-review` in the experimental distribution channel with `evaluated` maturity. The baseline comparison exists and showed a positive delta, but one run per configuration and no transfer holdout are insufficient for validated maturity.

## Promotion questions

1. Does the skill improve classification on a held-out repository and stack?
2. Does it reduce false blockers during real security reviews without missing exploitable boundary crossings?
3. Can Review Gate consume the receipt without duplicating the threat model?
4. Do repeated trials preserve the hardening and verification-gap gains?
