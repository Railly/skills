# JSON Render PR #325 Software Factory stage contract

Date: 2026-08-28

Input state: `dc035735521d2b0eefd3dcc3913002fec8d6eaa7` plus the untracked red
acceptance probe `packages/react/src/json325-contract-probe.test.tsx`.

Accepted shape:
`foundry/runs/solution-gate/2026-08-28-json-render-325-dc03573/decision.md`

## Fixed gates before production edits

| Stage | Command or evidence | Threshold |
|---|---|---|
| Implement | `pnpm exec vitest run packages/react/src/json325-contract-probe.test.tsx packages/react/src/streaming-render.test.tsx packages/react/src/renderer.test.tsx --reporter=verbose` and `pnpm --filter @json-render/react typecheck` | All pass. |
| Reduce | `git diff --numstat dc035735521d2b0eefd3dcc3913002fec8d6eaa7 -- packages/react/src` plus focused tests | Amendment adds at most 100 net production lines, no new public export, no dependency, and no helper with more than two nested recursive branches. |
| Harden | Independent resilience classification and focused termination/domain tests | No process, network, storage, queue, filesystem, durable-state, retry, or concurrency boundary is introduced. Existing deep and cyclic element-graph tests pass; cyclic raw props remain explicitly unsupported. |
| Strengthen | Reversible force-red mutations against the final code | Removing signature value comparison, own-key distinction, leaf `Object.is`, or recursive subtree reuse independently turns the intended focused assertion red for the intended reason, then restored code is green. |
| Prove | Focused React boundary tests and captured reference observations | Effect count is 1; both `undefined` transitions, function, symbol, and `BigInt` changes render fresh output; initial `BigInt` does not throw; unchanged nested sibling retains identity. |

Repository-wide commands owed before handoff:

```bash
pnpm type-check
pnpm lint
pnpm test
```

Mutation tooling is not installed, so Test Strength uses isolated reversible
source mutations with snapshots and exact focused commands. Numeric runtime or
memory improvements are not claimed.

No stage may commit, push, update PR #325, resolve review threads, or comment
externally.
