# Temporal contracts

Use this pass whenever an option, field, environment value, credential, artifact, or process configuration can survive one command or process.

## Transition table

For each stateful input, fill every column before proposals exist:

| State | Scope and owner | Initial default | `unset → set` | `set → omitted` | `set → same` | `set → changed` | `set → explicit clear` | Reuse, restart, or migrate | Continuity observables |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

Each cell is a transition from prior effective state in one continuing workflow, not a fresh session with an independent input.

Omission is not removal unless the external product contract explicitly proves they are equivalent. An absent value in the current invocation says nothing by itself about previously effective state. Every clear needs an explicit representation.

## Observable proof

Name what must survive when reuse is expected: process identity, logical session, target, URL, page or application state, trust, open resources, or another user-visible observable.

For every rule that requires a restart, check its inverse:

- the intended change causes replacement;
- omission preserves the effective value;
- repetition of the same value preserves the session;
- explicit clear removes the value and follows its declared restart or migration behavior.

At least one probe must execute two or more commands or actions against the same live session. Record effective state and continuity observables before and after. Exit code alone is insufficient. A fingerprint or unit test may prove mechanics, but it cannot define the product contract by itself.

## Completion

Complete this pass only when every persistent input distinguishes omission from explicit clear, every table cell is a transition, restart and reuse have observable predicates, and ordinary workflow continuity appears in the must-not-change list.
