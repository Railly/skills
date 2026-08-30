# Usage Receipts Frame

## Source

> la idea es que se autodocumenten sus usages de cada uno porque ahrita solo habian de review gate

> usa tailscale para golpear la Mac remota y asi correr skillkit ahi o leerte las mismas coding sessions

## Problem

Skillkit observes skill invocations across agents, while Railly Foundry holds reviewed cases and compiled knowledge. The missing layer is a durable, private receipt for every use that can preserve honest unknowns and nominate high-signal work for case review.

## Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | Automatically create one idempotent private receipt per skill, agent, and session | Core goal |
| R1 | Preserve session, project, time, invocation identity, and procedure digest when observable | Must-have |
| R2 | Represent unknown outcome and unknown historical procedure exactly as unknown | Must-have |
| R3 | Cover Claude, Codex, Cursor, OpenCode, and every agent already supported by Skillkit scanners | Must-have |
| R4 | Keep raw transcripts and local paths outside the public Railly repository | Must-have |
| R5 | Aggregate routine usage without turning counts into application evidence or maturity support | Must-have |
| R6 | Surface failed, corrected, interrupted, novel-transfer, and maintainer-nominated receipts as private case candidates | Must-have |
| R7 | Require human review and redaction before canonical case or knowledge materialization | Must-have |
| R8 | Fail open for task execution and fail closed for public compilation | Must-have |
| R9 | Backfill existing invocations idempotently without claiming exact historical provenance | Must-have |
| R10 | Avoid telemetry boilerplate inside every installed `SKILL.md` | Must-have |
| R11 | Include coding sessions that live on another Mac without copying raw transcripts off that machine | Must-have |
| R12 | Authenticate remote collection through Tailscale MagicDNS and SSH with an exact Skillkit version match | Must-have |
| R13 | Keep the last remote database intact and return an actionable error when the remote Mac is offline | Must-have |
| R14 | Run remote receipt sync automatically after Claude sessions without relying on an interactive shell PATH | Must-have |

## Selected shape

Use Skillkit on every machine that owns coding sessions and Railly Foundry as the strict compiler. Each Skillkit instance owns its private invocation linkage and annotations. Remote collection executes Skillkit on the source Mac through SSH over Tailscale and transfers only the private receipt export. Railly accepts a closed export schema, emits safe aggregates and opaque case candidates, and never mutates cases, knowledge, maturity, or procedures automatically.
