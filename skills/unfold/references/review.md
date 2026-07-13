# Review mode

Start from a diff, patch, test, or PR. Review the behavior and boundaries rather than paraphrasing files.

## 1. Reconstruct the claim

Name the intended behavior, contracts and state changed, affected callers and consumers, lifecycle effects, and untested Change Surface. Include the failure modes the change itself introduces (new branches, waits, acquisitions, recovery actions), not only the ones it fixes. Separate behavioral changes from mechanical refactors.

## 2. Review the guard

Choose the highest practical seam where the changed behavior is observable. A helper test does not cover changed caller wiring. A single-caller test does not cover behavior that depends on two callers.

Expected values must come from an independent source, not the same computation used by production code.

## 3. Perform the revert proof

For a behavioral change with a committed guard:

1. Preserve the test.
2. Revert or mutate the decisive production behavior.
3. Run the committed suite and observe a behavior-specific red result.
4. Restore the production change.
5. Run the same suite and observe green.

A compile or setup failure is not behavioral proof. If the suite stays green, the change is uncovered. Improve the guard or report the architectural boundary preventing one.

Skip the ritual for a genuinely non-behavioral change and explain why ordinary checks are proportional.

## 4. Verify the artifact

When the change has a runtime surface, exercise the built binary, server, CLI, UI, or package through the original scenario. Do not substitute a unit test for artifact behavior or claim an environment that was not exercised.

## Complete when

The review leaves retrievable commands and outcomes, a red-capable guard when applicable, restored green state, artifact evidence when applicable, and explicit remaining boundaries.
