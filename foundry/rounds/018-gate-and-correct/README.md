# Round 018: gate and correct

## Change

- `review-gate` is renamed `gate`. Its method, scripts, lenses, and evaluated status are unchanged. Historical run reports, cases, missions, and trails keep the old name because they record what ran.
- `record-a-case` merges into `correct`. The ledger method moves to `skills/correct/references/case-ledger.md`; the skill then turns each escaped mistake into an enforcer. `correct` moves to the stable channel and inherits the ledger's dogfooded maturity; its enforcer half has no baseline yet.

## Why

The core was meant to be five skills: contract, loop, verify-setup, gate, correct. Recording a case and correcting from it always ran back to back, and Record a Case already ended by sending each escaped mistake to Correct, so two skills held one step.
