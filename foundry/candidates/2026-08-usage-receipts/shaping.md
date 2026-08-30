# Usage Receipts Shaping

## Shapes considered

### A. Add usage logs to every skill

Each `SKILL.md` would define its own logging step and case format. This duplicates infrastructure, burdens execution context, misses interrupted sessions, and makes cross-agent behavior inconsistent.

### B. Treat every invocation as a Foundry case

Skillkit would publish one case per invocation. This confuses telemetry with evidence, leaks private context, creates review noise, and can inflate maturity from counts alone.

### C. Private receipts with a strict Foundry compiler

Skillkit creates one private receipt per skill, agent, and session. Outcomes begin as unknown unless reviewed evidence supports a stronger value. Routine receipts aggregate. High-signal receipts become sanitized candidates with opaque private handles. A human decides whether a canonical case, pattern, or procedure change follows.

### C4: Sessions on another Mac

| Alternative | Mechanism |
|---|---|
| C4-A | Copy remote transcript folders to the maintainer Mac and scan them locally |
| C4-B | Run Skillkit beside the sessions and export receipts through SSH over Tailscale |
| C4-C | Copy or mount the remote Skillkit SQLite database |

C4-B is selected. It keeps transcript parsing and the mutable database on their source machine. The transport carries only version output, scan status, and private receipt JSON. C4-A expands the privacy boundary to raw trajectories. C4-C introduces snapshot and concurrent-writer semantics without improving evidence quality.

## Recommendation

Shape C.

## Breadboard

| Place | Affordance | Store or output |
|---|---|---|
| Agent session | Invoke any installed skill | Existing agent transcript |
| Skillkit scan | Detect invocation and sync receipt | Local `usage_receipts` table |
| Remote Skillkit | Scan sessions on the remote session Mac | Remote `~/.skillkit/analytics.db` |
| Tailscale SSH | Check exact version, trigger scan, stream private receipts | Encrypted private JSON transport |
| Private review | Annotate outcome, confidence, signal, summary, and evidence handles | Updated local receipt |
| Foundry compiler | Validate closed export and registered skill | Safe aggregate and candidate packet |
| Maintainer review | Inspect opaque evidence, redact, classify disposition | Human decision |
| Canonical Foundry | Record approved case or knowledge change | Existing cases and compiled knowledge |

## Boundaries

- Receipt creation cannot block the user task.
- Raw prompt, response, transcript, local path, and private summary do not enter compiler output.
- `observed-after-session` is not exact procedure provenance.
- `unknown` outcome cannot support a case, maturity, or procedure proposal.
- Candidate compilation never creates a canonical case.
- Only existing human-gated Foundry paths can change compiled knowledge or active procedure.
- Raw remote session files and the remote SQLite database never leave their source Mac.
- Remote collection requires a `*.ts.net` MagicDNS target, non-interactive SSH, and an exact Skillkit version match.
- Session-end hooks use the absolute compiled binary path so they do not depend on shell startup files.
- Network or host failure cannot delete, replace, or partially import the last remote receipt state.

## Receipt lifecycle

```text
invocation
→ private receipt
→ unknown or reviewed outcome
→ routine aggregate or high-signal candidate
→ human review and redaction
→ canonical case, knowledge disposition, or no change
```
