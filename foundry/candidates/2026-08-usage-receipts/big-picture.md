# Usage Receipts Big Picture

## System boundary

Skillkit is the observability substrate local to each session-owning machine. Railly Foundry is the public evidence and procedure governance substrate. Remote machines run Skillkit in place and return private receipts through SSH over Tailscale. The integration passes sanitized metadata and opaque private handles, never raw trajectories.

## Information flow

| Layer | Knows | Must not claim |
|---|---|---|
| Invocation | Skill name, agent, session, event time | Outcome or application quality |
| Private receipt | Grouped invocation identity, observed procedure, reviewed annotation | Public safety or canonical evidence |
| Candidate compiler | Registered skill, signal class, safe aggregate, opaque handle | Case acceptance or maturity support |
| Canonical Foundry | Reviewed evidence, disposition, relationships, decisions | Hidden reasoning or unsupported provenance |
| Active skill | Promoted procedure only | Access to private receipt corpus |

## Remote collection

| Place | Responsibility | Boundary |
|---|---|---|
| Remote session Mac | Scan its Claude, Codex, and Cursor sessions into its own `~/.skillkit/analytics.db` | Raw sessions stay on the Mac |
| Tailscale SSH | Execute the exact matching Skillkit binary and carry its JSON stdout | No transcript sync or shared database mount |
| Maintainer Mac | Pipe the private export directly into the strict Railly compiler | No durable raw export required |

## Failure model

- Missing telemetry leaves no receipt but does not block work.
- Missing procedure provenance remains `unknown`.
- Invalid export fails before a candidate packet is written.
- Unregistered skills remain in private telemetry and are excluded from Railly candidates.
- Counts remain operational analytics only.
- Publication and procedure mutation remain explicit human actions.
- An offline remote Mac leaves its database untouched and produces no partial candidate packet.
- A remote Skillkit version mismatch fails before scanning or exporting.
