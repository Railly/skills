# Selection postconditions and retry invariants

PR 1770, head `323449d9618693c85d2191f7dd10010ad22f640b`, reviewed September 9, 2026. Verdict incomplete with five reproduced findings. Canonical evidence: `foundry/runs/review-gate/2026-09-09-agent-browser-1770-323449d/run-report.json`.

- Every retry back-edge, including active-descendant Enter activation, must enforce the action deadline. A named deadline and green timing-constant sweep do not prove that every loop branch checks it. Existing Vercel finding reproduced as 2421 Enter events beyond a 500 ms budget.
- A combobox popup may use aria-selected for highlighted navigation before input commitment. Verify against the live W3C APG editable combobox: selected Alabama can coexist with input C until Enter.
- Verification after input/change must inspect the currently resolved control, not an original DOM object that a change handler detached.
- Preserve the selected option's value/label identity across popup removal; committed display text can differ from the raw request.
- A CDP editing chord must be observed to replace the previous input; macOS Meta+A through this helper left Re when replacing Red with Blue.

Counterexample exemption: popup disappearance and unchanged filter text alone cannot prove commitment; when no independent standard selection signal remains, the documented unverifiable-control error is defensible. Do not confuse a fixture's private commit log with an observable standard widget contract.
