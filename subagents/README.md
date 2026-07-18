# Subagents

Runtime agent definitions distilled from the same method the foundry validates in skills. Where a skill teaches the session a method, a subagent is a delegated surface that runs it with its own model tier and authority boundary.

The trio maps to the unfold evidence pipeline and to a model routing tier:

| Agent | Role | Model | Boundary |
|---|---|---|---|
| [brahe](brahe.md) | Recon: evidence packets, claims classified, anchors over prose | sonnet | read-only |
| [kepler](kepler.md) | Implementation: evidence chain, source-before-memory, observed proof before "done" | sonnet | writes code, never pushes/publishes |
| [occam](occam.md) | Review: deterministic gates first, lenses, adversarial verification per claim | opus | read-only, runs checks |

Named after Tycho Brahe (collected the data), Johannes Kepler (turned it into working laws), and William of Ockham (cut what the evidence does not support). Kepler writes on sonnet and occam reviews on opus, so the review-gate rule "prefer a reviewer model different from the writer" holds structurally.

## Install

Copy or symlink into an agent runtime directory, from the repo root:

```bash
ln -s "$(git rev-parse --show-toplevel)/subagents/kepler.md" ~/.claude/agents/kepler.md
```

## Maturity

All three are `experimental` under the foundry lifecycle, not yet registered in [maturity.json](../foundry/maturity.json) (the registry tracks skills today; the trio enters it at their first promotion round). They are not grandfathered: corrections harvested from real runs become lines in these files, and promotion requires the same baseline evidence as any skill candidate.
