# Security classification

## Primary classes

| Class | Required evidence |
|---|---|
| `confirmed_vulnerability` | A supported exploitability chain shows an attacker gaining a new confidentiality, integrity, authorization, or availability capability across a trust boundary. |
| `likely_vulnerability` | The boundary crossing and impact are supported, but one material reachability or environment link cannot be directly verified. |
| `hardening` | The change reduces exposure or defense-in-depth risk without giving the modeled attacker a new capability. |
| `non_security_defect` | Behavior is wrong, but no security property or attacker-controlled boundary crossing is demonstrated. |
| `informational` | Relevant context or design observation with no defect claim. |
| `verification_gap` | Evidence is insufficient to decide because a prerequisite, deployment assumption, environment, or boundary observation is missing. |

## Decision tests

Ask these in order:

1. Which principal controls the input or action?
2. What authority did that principal have before the behavior?
3. What new authority, data, state change, or denial capability becomes available?
4. Which trust boundary is crossed?
5. Can the path reach a security-sensitive sink under supported deployment assumptions?
6. What concrete confidentiality, integrity, authorization, or availability impact follows?

If questions 2 through 6 cannot be answered with evidence, do not call the observation a confirmed vulnerability.

## Secret exposure

Treat a credential as exposed only when it reaches a principal with less authority than the credential grants. Check whether the receiver already:

- executes arbitrary code as the same operating-system user;
- can read the credential source through existing permissions;
- controls the process environment or configuration;
- holds an equivalent credential or privilege.

Equivalent existing authority usually makes the observation hardening, not a new vulnerability. Cross-tenant, cross-user, sandbox escape, or remote unauthenticated disclosure normally establishes a real boundary crossing.

## Availability

A crash, stale PID, false success response, or failed startup is a reliability or lifecycle defect unless an attacker can intentionally cause it across a supported service boundary. Name the attacker-controlled resource or request and the denied security-relevant service before classifying availability impact.

## Scope and blocking

Classify merge relevance independently:

| Scope | Merge meaning |
|---|---|
| `in_scope_security_regression` | The change fails the security claim it is meant to satisfy. Blocking. |
| `adjacent_security_blocker` | The change introduces or exposes another material exploitable boundary. Blocking with evidence. |
| `out_of_scope_hardening` | Useful defense-in-depth work without new attacker capability. Follow-up, not a security blocker. |
| `unrelated_bug` | Correctness, lifecycle, documentation, or test issue outside the security boundary. Route to the owning review method. |

Severity is assessed only after exploitability and impact are established. Do not use a high-risk issue label to upgrade unrelated observations.
