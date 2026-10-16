# Round 019: new core only

## Change

The repository now holds only the five-skill core and what it needs to run:

- `skills/`: gate, correct; `skills/.experimental/`: contract, loop, verify-setup.
- `cases/`: new evidence ledgers, plus the per-repo `conventions.md` files Gate reads.
- `foundry/`: the maturity registry and the rounds that decided it (015, 016, 018, 019).

Everything else moved to `archive/`: earlier cases, missions, runs, trails, candidates, the compiled knowledge layer and its audit, the Issue Contract validator, and their scripts.

## Why

The compiled knowledge layer and its textual-match audit were keyed to skill names, so every rename or archive broke CI, and the audit's hand-reviewed classifications could not be regenerated without losing review. The new core records lessons as enforcers (`Enforcer:` in each case, rows in each repo's `ENFORCERS.md`), which is what that layer was trying to approximate in prose. Cases now need only their ledger fields and an `Enforcer`.

## Gate decision

Gate's evaluated status rests on the blind replication in `archive/foundry/rounds/002-review-gate-blind-replication/`; this round is its current decision record.
