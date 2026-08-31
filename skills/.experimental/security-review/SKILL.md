---
name: security-review
description: "Review a code change or security claim by modeling attackers, assets, trust boundaries, exploitability, and impact. Use for authentication, authorization, origin or request validation, secret handling, tenant isolation, sandboxing, privilege changes, injection, unsafe deserialization, or when deciding whether a finding is a vulnerability, hardening, or a non-security bug."
---

# Security review

Determine whether an attacker gains a capability across a trust boundary. Security vocabulary, secret-shaped data, or a broken lifecycle alone do not establish a vulnerability.

Read-only review needs source access. Active verification requires explicit authorization, a safe isolated target, and bounded test inputs.

Read the work-item manifest when one exists. Freeze the exact base, head, dirty state, stated security claim, deployment assumptions, and authorized verification scope. Never broaden active testing beyond the target and authority the user supplied.

## 1. Define the security claim

State what the issue or change claims to prevent, the protected property, and the expected attacker. Separate the original issue from observations discovered during review.

**Complete when:** the claim has an exact state, property, attacker, and scope.

## 2. Map the trust model

Create a compact map of assets, actors, principals, trust boundaries, entry points, privileges, and security-sensitive sinks. Include browsers, proxies, subprocesses, plugins, tenants, local users, remote users, and operators only when they exist in the system.

For every principal, record authority it already has. A secret reaching a process is not automatically exposure if that process already executes with equivalent authority or can read the source through existing permissions.

**Complete when:** every suspected crossing names the lower-trust source, higher-trust destination, and existing authority on both sides.

## 3. Build the exploitability chain

Trace evidence through:

`attacker capability → reachability → attacker control → boundary crossed → security impact`

Anchor each link in code, configuration, protocol behavior, or direct observation. State prerequisites such as network position, authentication, user interaction, deployment mode, plugin installation, or tenant control. Missing links remain gaps. Do not invent a deployment assumption to finish the chain.

**Complete when:** every candidate has a supported chain or an explicit missing link.

## 4. Verify safely at the boundary

Prefer static tracing and existing tests first. When authorized, use a disposable environment and the least invasive proof that distinguishes exploitation from rejection. Test the real boundary, not only a helper. Do not access third-party data, persist unauthorized state, evade controls, or increase impact beyond the minimum proof.

Record commands, inputs, observations, cleanup, and limitations. An unavailable environment is a verification gap, not a pass or a confirmed exploit.

**Complete when:** direct evidence is preserved, or the exact verification gap is named.

## 5. Classify each observation

Read [the classification rules](references/classification.md). Use one primary class:

- `confirmed_vulnerability`
- `likely_vulnerability`
- `hardening`
- `non_security_defect`
- `informational`
- `verification_gap`

Then assign scope separately:

- `in_scope_security_regression`
- `adjacent_security_blocker`
- `out_of_scope_hardening`
- `unrelated_bug`

Do not turn severity into merge policy. A confirmed in-scope regression blocks. Adjacent findings block only when they expose a material security boundary in the shipped change. Hardening and unrelated bugs are reported without laundering them into vulnerability blockers.

**Complete when:** classification, scope, prerequisites, impact, confidence, and evidence agree.

## 6. Emit the security receipt

Use [the receipt contract](references/receipt.md). Emit one exact-state receipt containing the trust map, exploitability chains, classifications, verification evidence, gaps, and merge relevance. Keep vulnerability details in an appropriately private artifact when disclosure would increase risk.

Review Gate owns the promotion verdict. Security Review supplies the security evidence and does not fail a review for missing Test Strength, resilience, documentation, or general correctness evidence outside its boundary.

**Complete when:** Review Gate can consume the receipt without reconstructing the threat model or confusing hardening with an exploitable boundary crossing.
