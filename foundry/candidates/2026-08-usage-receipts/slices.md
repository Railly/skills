# Usage Receipts Slices

## Slice 1: Private receipt substrate

- Add the Skillkit receipt table and deterministic receipt identity.
- Group existing invocations by skill, agent, and session.
- Capture observed procedure digest or explicit unknown.
- Add JSON export and reviewed annotation commands.
- Sync receipts automatically whenever Skillkit scans.

## Slice 2: Strict Foundry compiler

- Validate Skillkit schema and registered skill membership.
- Exclude raw transcript, path, project, session, and private summaries from output.
- Aggregate routine telemetry separately from evidence.
- Emit high-signal candidates with opaque private pointers.
- Require human review for every candidate.

## Slice 3: Session outcome enrichment

- Add bounded Claude and Codex session adapters.
- Infer only observable lifecycle facts and retain confidence.
- Preserve `unknown` when the task result cannot be established.
- Nominate correction, failure, interruption, and novel transfer without publishing content.

## Slice 4: Operational rollout

- Release Skillkit with scan-time receipt sync.
- Run idempotent historical backfill.
- Dogfood one Claude and one Codex receipt.
- Wire the private compiler into the session-end maintenance loop.
- Review candidate volume and tune signals without changing canonical evidence rules.
- Install the exact arm64 Skillkit binary on the remote session Mac.
- Scan remote sessions in place and export receipts through SSH over Tailscale MagicDNS.
- Reject offline hosts, unsafe targets, authentication failures, and version mismatches before emitting JSON.
- Install an absolute-path Claude SessionEnd hook on the remote Mac.
- Prove the physical remote export through the strict Railly compiler without copying transcripts.
