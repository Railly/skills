---
name: contract
description: "Write the done criteria for one piece of engineering work before any code changes: what it really is, its size class, acceptance criteria each mapped to an executable observation, must-not-change behavior, and non-goals. Writes .agents/verify/contract.md so fresh.sh and the verify-before-done hook require every named feature to be observed. Use at the start of a bug fix, feature, refactor, or PR review, when someone says start work on this, take this issue, what does done mean, or before loop. Do not use to shortlist a backlog (issue-intake) or to pick between solution shapes (solution-gate)."
compatibility: "Requires read access to the source item and repository. Observation mapping requires a .agents/verify kit (verify-setup)."
---

# Contract

Done is decided before the work starts, and it is decided as commands, not adjectives. This skill turns one request into a contract the harness can check.

## 1. Read the source and classify it

Read the issue, PR, or request, its comments and linked items, and only enough code to test its claims. Pin the source: digest and `updatedAt`, plus head SHA for a PR. Choose one intent:

| Intent | Ends at |
|---|---|
| question or investigation | an answer or finding with evidence; no code |
| unverified bug | a reproduction on the user-visible surface, then a change contract if confirmed |
| feature or behavioral change | a contract and accepted shape |
| mechanical change | a contract; behavior must not change |
| PR review | a verdict on the exact head |

Ambiguity defaults to investigation, never to implementation. Unknowns stay written down.

## 2. Pick the size class

| Class | Signal | Ceremony in loop |
|---|---|---|
| `trivial` | one obvious mechanism, one check proves it | implement, observe, review-gate mechanical |
| `normal` | bounded behavior change in one area | add reduction and test strength when triggered, review-gate standard |
| `heavy` | several valid shapes, shared state, contract or persistence change, security, shared infrastructure | solution-gate first, every triggered lens, review-gate high-risk, before-after |

Changes that add reads or writes against shared infrastructure (a database, analytics store, third-party API, queue) are at least `normal` and need a load budget: requests per hour at expected scale, cost per request, and what bounds them, including cold starts.

## 3. Write the contract

Write `.agents/verify/contract.md` in the target repo. It is excluded from git when the kit was scaffolded with `--local`.

```markdown
# Contract: <source locator>
source: <locator> @ <digest or head>
intent: <intent>   class: <trivial|normal|heavy>

## Acceptance
- A1: <observable outcome>
  - observe: <feature>
## Must not change
- M1: <behavior that must stay>
  - observe: <feature>
## Non-goals
- N1: <explicitly out of scope>
## Unknowns
- <open question, or none>
```

Every acceptance and must-not-change item names a driver with `observe: <feature>`. If no driver can observe it, write a new driver with verify-setup first, or mark the item `observe: none (reason)` and keep it visible as a gap. `fresh.sh` then refuses done until every named feature has a passing observation for the current tree.

## 4. Stop or continue

- `trivial` and `normal` with no unknowns that change the shape: continue to loop.
- `heavy`, or any unknown that changes what gets built: show the contract and stop for the human.
- A source that changed while you read it, or cannot be read: stop with the recovery action.

## Rules

- No acceptance item without an observation or a named gap.
- Never fold a non-goal into the work because it is nearby.
- A contract change during the work returns here and resets downstream evidence.
