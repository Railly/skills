---
name: review-gate
description: "Gate a diff before pushing or requesting review: verify exact-state identity, run deterministic checks, consume Test Strength and Resilience receipts, then run only the judgment lenses triggered by the change. Use before opening or updating a PR, for pre-review, or after an external review round. Scale the path from mechanical through high-risk and external-PR profiles."
compatibility: Requires git and bash for the deterministic layer.
allowed-tools: [Skill(herdr-workstreams), Agent]
---

# Review gate

Review Gate decides whether one exact diff is ready for human promotion. It owns deterministic checks, claim review, triggered judgment lenses, empirical verification, and the final verdict. Test Strength owns behavioral falsification. Resilience Audit owns failure-path pressure. Security Review owns attacker modeling and vulnerability classification. Consume their receipts instead of repeating their procedures.

## Canonical state and execution identity

Run the packaged `scripts/resolve-source-root.mjs`, which honors `RAILLY_SKILLS_REPO`, to resolve the canonical `Railly/skills` checkout. Never write cases, conventions, run reports, Impact Maps, or ledgers into the target repo, `.agents/skills`, `.claude/skills`, or another installed copy.

Read the work-item manifest first. Verify only drift-prone fields: target HEAD, dirty digest, authorization, profile, stage fingerprints, and executing skill revision. A stable pass requires an exact `skill_revision` and an executing package whose digest is tied to that revision. Run `bun scripts/skills-doctor.mjs --installed <skills-root> --skill review-gate` from the canonical checkout when identity is uncertain.

Use the manifest's runtime record. Prefer the packaged `scripts/run-fx-review.mjs` for an isolated reviewer. It reads the `Vercel AI Gateway` / `vercel-ai-gateway` credential from macOS Keychain, disables FX's stored-session lookup for that process, verifies that FX reports `auth=AI_GATEWAY_API_KEY`, and writes a sanitized JSON artifact. Never put the key in a prompt, artifact, manifest, or log. Cursor and `cursor-agent` are not supported Review Gate runtimes.

On the first runtime schema or capability failure, inspect the available capability once, never repeat the identical invalid call, and fall back in order: FX worker, native subagent, visible Herdr worker, sequential isolated pass, then unavailable. Record `execution_mode`, `degraded_from`, and `independence_gap`. More than one schema failure per operation or three in the whole turn is a protocol failure, not a reason to retry.

## 1. Select the profile

Honor the manifest profile:

| Profile | Review path |
|---|---|
| `mechanical` | exact-state identity, applicable deterministic checks, narrow proof, one focused review pass |
| `standard` | deterministic checks, claim inventory, triggered receipts and lenses, real-boundary proof |
| `high-risk` | full proof ledger, required Test Strength or Resilience receipts when triggered, independent challenge |
| `external-pr` | standard or high-risk obligations plus built-artifact dogfood before trusting authored tests |

Escalate the profile or wall-time budget only when new evidence exposes a new risk. Record the trigger in the manifest.

## 2. Load conventions and run deterministic checks

Load `cases/<repo>/conventions.md` from the canonical source root. If absent, compile it from target-repo instructions before review. Run every applicable check in [scripts/gate.sh](scripts/gate.sh), starting with `covered` when an exact-head report is expected. A finding is fixed or acknowledged with evidence, never skipped silently.

When `radius` supports the target language, save its Impact Map under the canonical Review Gate run directory. Treat it as attention guidance, not proof.

## 3. Inventory claims and consume stage receipts

Build the contract, design, user-facing, and implementation claim inventory. Read [the proof obligations](references/proof-obligations.md) for standard and high-risk work because those profiles must distinguish properties from proxies, carry assumptions, and map durable commit points.

Consume stage receipts from the work-item manifest:

- A Test Strength trigger requires a passing receipt tied to the current head, command, environment, contract digest, relevant paths, and Test Strength revision.
- A resilience trigger requires a passing receipt with forced failure partitions, cleanup ownership, retry evidence, and the same identity fields.
- A security trigger requires a passing Security Review receipt tied to the exact base, head, dirty digest, changed-path digest, and Security Review revision. An unresolved security blocker or verification gap makes the review incomplete.
- A missing, stale, unavailable, or failed required receipt makes the review incomplete. Review Gate does not recreate the missing method.
- A reusable receipt must show that the later diff cannot intersect its relevant paths or contract dependency cone. Final exact-head checks still run.

## 4. Run only triggered lenses

Read [the lens catalog](references/gates.md) after the diff, conventions, profile, and receipts identify trigger families. Run each triggered lens as a focused pass over the frozen tree. Record every catalog lens as run or skipped with a reason.

Load [the getByRole contract](references/getrole-contract.md) only when reviewing browser role lookup, accessibility-tree normalization, or `getByRole` behavior.

Prefer an independent reviewer for high-risk work. If the runtime degrades to a sequential isolated pass, preserve separate input and output artifacts but record the independence gap. Never present sequential self-review as cross-family independence.

## 5. Verify at the layer of the claim

For external PRs, drive the built artifact before trusting the contributor's tests. For other profiles, drive every changed user-visible boundary that carries a material claim. Force error paths. A missing environment is an explicit gap, not a pass.

Refute findings at their own layer. Verify exemptions with the same rigor as findings. Freeze the reviewed tree while any pass runs.

Run `security-review` when the diff or stated claim touches authentication, authorization, confidentiality, integrity, credentials, secrets, origin validation, tenant isolation, sandboxing, privilege, injection, or unsafe deserialization. Hardening and non-security observations remain visible but do not become blockers.

## 6. Emit one report and one receipt

Read [the run-report schema](references/run-report.md) when materializing the exact-head verdict. Treat schema-v1 JSON as the only authored report. Generate the human view with `scripts/gate.sh render <run-report.json> <run-report.md>`. Never maintain an independently authored prose twin.

Run `scripts/gate.sh report <run-report.json>`. A pass requires the exact current head, resolved required receipts, no open finding or gap, and required independence. Update the manifest's `review` stage atomically.

After an external review, harvest each escaped finding into the smallest durable destination: deterministic gate, triggered lens, project norm, or subsystem invariant. Record outcome fields including external findings, review rounds, human corrections, and escaped finding class.

## Complete when

The exact state has a validated run report and manifest receipt, every required upstream receipt is current, all triggered checks and lenses have dispositions, empirical claims were exercised or named as gaps, and the verdict is `pass`, `findings`, or `incomplete` without ambiguity.
