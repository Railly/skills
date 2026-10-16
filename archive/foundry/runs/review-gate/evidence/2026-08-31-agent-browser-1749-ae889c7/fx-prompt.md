Review external PR vercel-labs/agent-browser#1749 read-only at exact detached HEAD ae889c7d8d6a069971bb134ce7be790c91838313 against base 118af8eef1eebe21b949c3cf677d468330da7a46.

Profile: external-pr with high-risk daemon process lifecycle, concurrency, cancellation, ownership validation, cleanup, and durable session state.

Inspect the exact diff and nearby callers. Focus on confirmed correctness defects, especially:

1. Whether a completed close always causes the daemon listener loop to exit if the requesting client disconnects before reading the response.
2. Whether every PID-based SIGTERM/SIGKILL path validates that the recorded PID is still the daemon owner, given the new claim that PID files are diagnostic metadata and reusable PIDs are not liveness authority.
3. Cancellation safety, concurrent close behavior, terminal response publication, advisory-lock inode ownership, sidecar cleanup, transactional restore preservation, provider cleanup registration, recording shutdown, and no replay after dispatch.
4. User-facing docs parity with actual built behavior.

Do not modify files. Return findings ordered by severity with exact file:line evidence, mechanism, and a concrete verification idea. Distinguish confirmed defects from gaps or speculative concerns.
