# Change mode

Start from a known intended behavior or evidence-backed Change Surface. If a bug has no deterministic signal, return to Triage first.

## 1. Select the collaboration policy

- `guided`: the user reconstructs, predicts, and writes; the agent scaffolds and verifies.
- `execute`: the agent implements within the authorized scope and reports evidence.
- `execute-with-approval`: the agent explains the cause and approach, implements, then stops before commit or push for user review.

Use `guided` only when the user wants to learn while shipping. Do not turn ordinary implementation into an unsolicited quiz.

## 2. Confirm the seam

Reuse the mission map and Change Surface. If the user lacks a load-bearing concept, enter Learn for that concept and return. Do not repeat a repository overview they already own.

## 3. Implement the complete change

Change the contract, then enumerate every consumer. The compiler finds invalid sites, not semantic completeness. Explicitly sweep:

- symmetric paths
- fan-out adapters
- lifecycle variants
- loosely checked templates or dynamic modules
- tests and docs that encode the old contract

Treat the change as a matrix and account for every cell. A green compiler cannot prove a behavioral migration is complete.

## 4. Attack the change's own new failure modes

Proving the reported symptom is gone does not prove the change is safe. Enumerate what the change introduces (new branches or selection logic, new waits or timeouts, new acquisitions, changed contracts) and give each its own red signal or explicit reasoning. A bounded probe can reintroduce the leak it was meant to avoid; a new concurrent path can re-run a single-path bug at fan-out; a recovery action can be destructive on a false positive, so prefer one that is harmless when the detector misfires. State any introduced failure mode you cannot cheaply test rather than hiding it.

## 5. Prepare proof candidates

Run proportional checks and identify the highest behavioral seam affected by the patch. Preserve the original red signal for acceptance. Transition to Review with the patch, commands run, and unverified boundaries.

## Complete when

Every justified Change Surface cell is addressed, the selected collaboration policy was respected, and Review has enough evidence to challenge the patch.
