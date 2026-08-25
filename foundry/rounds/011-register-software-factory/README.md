# Round 011: register software-factory

## Candidate

`software-factory`, a staged execution protocol occupying the span between Solution Gate and Review Gate.

## Origin

A recorded conversation between Robert C. Martin and Matt Pocock on software fundamentals in the age of coding agents, published 2026-08-19, transcribed and analyzed 2026-08-22. The transferable claim is not any single tool. It is that quality rules written as prose lose their force as context grows, while a deterministic check keeps its force because it runs outside the context and returns a verdict.

Martin reports a five-role pipeline where each role is born, does one task, and dies. Pocock states a preference for a smaller implementer and reviewer split and names the disagreement explicitly. This catalog is closer to Pocock's position, so the candidate registers the staged idea without adopting a fixed role count.

## What it claims to add

The current catalog verifies at the boundaries. `solution-gate` decides what deserves implementation, `review-gate` decides whether a finished diff is correct, and `test-strength`, `simplify`, `resilience-audit`, and `performance-proof` each own one method. Nothing today requires evidence to appear *during* implementation, and nothing refuses to advance when an agent reports its own success.

The candidate claims that span. It orchestrates existing skills rather than restating their methods.

## Known overlap risk

This is the reason the candidate enters as experimental rather than candidate channel.

- Stage 3 delegates to `test-strength`. If the delegation carries no orchestration value, stage 3 is a rename.
- Stage 2 delegates to `simplify`, whose bounded reduction contract already exists.
- `work-intake` already routes seven intents to versioned templates, several of which name an implementation and verification sequence. If those templates carry the staging, this skill duplicates the routing rather than the methods.

The registration does not resolve this. It records it as the question a first real run must answer.

## Evidence status

None. No run has been recorded. The method is derived from an external discussion and from prior local observation that a passing numeric test suite did not reject a defect visible on screen.

Two measurements support the shape of the problem without validating the skill:

- A routing table implementing seven intents was covered by three tests exercising two of them, so five rows had no test that would reject their removal.
- A security check returned a vacuous pass for months because its error path was discarded, and it only failed once a fixture that had to fail was planted.

Both are cases of evidence assumed rather than observed. Neither proves this skill fixes that.

## Decision

Register as experimental in the experimental distribution channel. Human override by Hunter, 2026-08-24, with the overlap question left open by design.

## What the first run must answer

1. Does staging catch a defect that `review-gate` alone would have missed?
2. Does stage 2 or stage 3 produce anything the delegated skill would not have produced when invoked directly?
3. Do `work-intake` templates already carry this sequence, making the skill redundant at the routing layer?
4. Does the thrashing rule fire on real work, or is two reversals an invented limit?

A run that cannot answer 1 or 2 is grounds for deprecation, not revision.
