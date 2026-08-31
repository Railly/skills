import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateIssueContracts } from "./issue-contracts.mjs";
import { createWorkItemManifest } from "./work-item-manifest.mjs";

const contract = (
	manifest = "1.manifest.json",
) => `# Issue Contract: owner/repo#1

Status: selected
Source: owner/repo#1
Target repository: owner/repo
Base: main
Branch: pending
Manifest: ${manifest}

## Outcome

Outcome.

## Observed

Observed.

## Expected

Expected.

## Acceptance

- A1: Claim.

## Non-goals

- N1: Excluded.

## Invariants

- I1: Preserved.

## Change surface

Surface.

## Verification

- [ ] \`bun test\` -> A1, I1

## Risk

Risk.

## Promotion

Pending.

## Handoff

Pending.

## Contract changes

None.
`;

describe("Issue Contract manifest sidecars", () => {
	test("validates an active mission and its manifest together", () => {
		const root = mkdtempSync(join(tmpdir(), "issue-contract-"));
		const missions = join(root, "foundry", "missions", "owner-repo");
		mkdirSync(missions, { recursive: true });
		writeFileSync(join(missions, "1.md"), contract());
		writeFileSync(
			join(missions, "1.manifest.json"),
			`${JSON.stringify(
				createWorkItemManifest({
					source: "owner/repo#1",
					repository: "owner/repo",
					cwd: "/tmp/repo",
				}),
				null,
				2,
			)}\n`,
		);
		expect(validateIssueContracts(root).errors).toEqual([]);
	});

	test("rejects a missing or mismatched active sidecar", () => {
		const root = mkdtempSync(join(tmpdir(), "issue-contract-"));
		const missions = join(root, "foundry", "missions", "owner-repo");
		mkdirSync(missions, { recursive: true });
		writeFileSync(join(missions, "1.md"), contract("missing.json"));
		expect(validateIssueContracts(root).errors).toContain(
			`${join(missions, "1.md")}: missing Manifest sidecar "missing.json"`,
		);
	});
});
