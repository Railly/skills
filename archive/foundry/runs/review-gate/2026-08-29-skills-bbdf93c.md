# Review Gate: case-to-pattern loop

Date: 2026-08-29
Repository: Railly/skills
Base: `4b3203c15758632d82c5c371259ecff8a61fec99`
Head: `bbdf93c825b2cf4b3ba12bef17674fdb6af87912`
Verdict: pass

## Outcome

The exact reviewed V3 tree passes. Six confirmed findings were fixed before the final run: schema 2 bypass through partial fields, negative backlinks treated as supportive evidence, stale Foundry status and counts, a local branch described as remotely delivered, missing root documentation, and a canonical template that omitted the validator-required Source field.

## Proof

- Forty-six tests with one hundred twenty-seven expectations passed.
- Nineteen skills and six issue contracts validated.
- One pattern and nineteen provenance pages validated.
- Generated projections and all 279 reviewed textual match pairs were current.
- Five evaluation fixtures passed.
- Website checks and production build passed.
- The real dogfood case reinforces an existing pattern through an active application backlink.
- The dogfood commit changed no installable procedure file.
- Fix-absent schema and backlink mutations failed at their intended assertions and restored green.
- Independent review of the frozen exact head returned pass with no findings.

## Comparative eval

Three paired cases scored 15/15 with the new procedure and 7/15 with the previous procedure, a 53 percentage-point gain. The prompts named their intended disposition, so this proves schema and validator compliance more strongly than autonomous disposition selection. Timing and token data were unavailable from the agent surface.

## Risk and limits

This is high-risk repository tooling because incorrect case compilation can corrupt durable evidence and future procedure decisions. The independent challenge used the real corpus, exact-head mutations, active and inactive relationships, generated projections, and Git changed paths.

Radius under-covered the JavaScript diff and reported 42 unresolved calls, so it supplied no safety claim. Three known maturity warnings remain outside this slice. A separate Spec review was not provided.

## Provenance warning

Author and reviewer are from the same model family. The report records `same_family: true`; shared priors and blind spots remain possible. Direct repository oracles and the substrate corpus provide the independent challenge.
