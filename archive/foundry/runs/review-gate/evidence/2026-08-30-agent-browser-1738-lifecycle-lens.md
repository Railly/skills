# Lifecycle lens packet

## Input

- Frozen diff: `fbd046c23a2c1156891bda294aaaee715c23b3f1...f0ef9771426c068e335c5fdb4a0d03362e104fd4`
- Claims: invalid startup fails without starting the server, repeated starts reflect the running configuration, sidecars describe a live dashboard
- Commit points: detached child spawn, config publication, PID publication, listener bind

## Output

- Finding F1: spawn, config publication, PID publication, and success output happen before the child listener bind.
- Forced partition: requested port already occupied.
- Residual state: successful command result, dead recorded PID, stale `dashboard.pid`, stale token-bearing `dashboard.config`.
- Immediate retry: the next invocation removes the stale sidecars after observing the dead PID, but the original operation still falsely reported success and temporarily published invalid state.
- Missing receipt: no Resilience Audit ties all post-spawn failure regions and retry behavior to the exact head.
