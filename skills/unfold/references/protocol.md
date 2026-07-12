# Shared protocol

Every mode operates on one mission and one evidence chain.

## Mission state

Record:

- concrete question or intended behavior
- repository and commit
- current mode and collaboration policy
- observable entry and outcome
- decisive source, runtime, test, or history anchors
- remaining load-bearing unknowns

## Claim labels

- `E` Evidence: source, test, runtime output, or history directly supports the claim.
- `I` Inference: evidence suggests the claim but has not proven it.
- `?` Unknown: the claim is load-bearing and unresolved.

Attach `file:line`, command output, diff, test result, artifact path, issue, or PR to decisive evidence. Definitions explain what code can do; call sites and runtime output establish when it happens.

An agent-authored summary is not raw evidence. A passing test is not proof that the test covers the change. A merged PR is not proof that the released artifact behaves correctly.

## Mode transitions

Transitions carry artifacts forward:

- Learn produces a mental model and source anchors.
- Triage produces a minimized red signal, surviving root-cause hypothesis, and Change Surface.
- Change produces a patch, updated Change Surface, and verification candidates.
- Review produces a proof record and remaining boundaries.

Enter directly when an upstream artifact already exists. Reverify stale evidence instead of regenerating the entire map.

## Scope discipline

The mission bounds exploration. Read broadly only when a load-bearing edge is missing. Separate proven current behavior from proposed behavior. Preserve unknowns rather than filling them with plausible architecture.
