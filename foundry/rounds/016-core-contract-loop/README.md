# Round 016: core contract and loop

## Change

Two experimental skills replace three:

- `contract` replaces `work-intake` classification and the factory loop's contract freeze.
- `loop` replaces `factory-loop` and `software-factory`.

`review-gate` keeps its name and evaluated status and gains two deterministic checks: `gate.sh verify` (repo kit doctor, check, and fresh observation) and `gate.sh drift` (the promoted patch-id must equal the reviewed one). The verify kit's `fresh.sh` now requires a passing observation of every feature the contract names.

## Why

The old path ran up to seven ceremonies for one change: intake, solution gate, shaping, factory loop, software factory, review gate, test strength. Most of it was prose that a stage could claim without running anything, and the loop and factory overlapped on order, invalidation, and stage receipts.

The new path keeps one rule from the old factory, that a step ends on command output and never on a claim, and makes it checkable: acceptance items map to drivers, `fresh.sh` ties evidence to the exact tree, and the vault Stop hook calls it. Size class (`trivial`, `normal`, `heavy`) decides ceremony, so a typo fix no longer pays for a migration's process.

Kept from the old skills: the intent table, the shared-infrastructure load budget, thrashing as a return to shaping, author and reviewer in separate contexts, and explicit human promotion.

## Deprecated

`factory-loop`, `software-factory`, and `work-intake` are marked `deprecated` in the maturity registry and stay in place until the archive round, so existing references keep resolving.

## Evaluation

Not evaluated. Admission requires replaying past cases with the old and new paths and comparing false done claims, defects caught before push, tokens, and wall-clock time.
