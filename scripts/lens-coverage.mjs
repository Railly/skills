#!/usr/bin/env bun
// Report lens coverage across the recorded run reports, using canonical
// identifiers so one lens written three ways counts once.
//
// Usage:
//   bun scripts/lens-coverage.mjs [runs-directory] [--json] [--min N]
//
// Provenance: the 2026-08-20 mining pass could not answer "which lens earns its
// place" from this corpus. Two problems blocked it, both fixed here for reading:
// lens names were free text (135 raw strings for 83 lenses), and the runs tree
// mixes review-gate run reports with Radius impact maps that share the filename
// convention but no fields.
//
// One question stays unanswerable and this tool does not pretend otherwise: a
// finding does not record which lens produced it (findings[].source is the bare
// string "lens" in 334 of 501 cases), so per-lens yield cannot be computed. The
// report prints trigger rates, never finding attribution.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
	artifactType,
	normalizeRepo,
	tallyLenses,
} from "./lib/run-report-identity.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const minIndex = args.indexOf("--min");
const minimum = minIndex === -1 ? 5 : Number(args[minIndex + 1] ?? 5);
const positional = args.filter(
	(arg, index) =>
		!arg.startsWith("--") && !(minIndex !== -1 && index === minIndex + 1),
);
const runsDir = resolve(
	positional[0] ?? join(import.meta.dir, "..", "foundry", "runs", "review-gate"),
);

function walk(dir) {
	const found = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) found.push(...walk(full));
		else if (entry.endsWith(".json")) found.push(full);
	}
	return found;
}

const totals = new Map();
const repos = new Map();
const shapes = { "run-report": 0, "impact-map": 0, unknown: 0 };
let unreadable = 0;

for (const file of walk(runsDir)) {
	let parsed;
	try {
		parsed = JSON.parse(readFileSync(file, "utf8"));
	} catch {
		unreadable += 1;
		continue;
	}
	const type = artifactType(parsed);
	shapes[type] += 1;
	if (type !== "run-report") continue;

	const repo = normalizeRepo(parsed.run?.repo ?? "");
	if (repo) repos.set(repo, (repos.get(repo) ?? 0) + 1);

	for (const [name, bucket] of tallyLenses(parsed)) {
		const carried = totals.get(name) ?? {
			total: 0,
			run: 0,
			skipped: 0,
			variants: new Set(),
		};
		carried.total += bucket.total;
		carried.run += bucket.run;
		carried.skipped += bucket.skipped;
		for (const variant of bucket.variants) carried.variants.add(variant);
		totals.set(name, carried);
	}
}

const rows = [...totals.entries()]
	.map(([name, bucket]) => ({
		name,
		total: bucket.total,
		run: bucket.run,
		skipped: bucket.skipped,
		skipRate: bucket.total ? bucket.skipped / bucket.total : 0,
		variants: [...bucket.variants].sort(),
	}))
	.sort((a, b) => b.skipRate - a.skipRate || b.total - a.total);

const reported = rows.filter((row) => row.total >= minimum);
const rare = rows.filter((row) => row.total < minimum);

if (asJson) {
	console.log(
		JSON.stringify(
			{
				runsDir,
				artifacts: shapes,
				unreadable,
				runReports: shapes["run-report"],
				repositories: Object.fromEntries([...repos].sort()),
				minimum,
				lenses: reported,
				belowMinimum: rare.length,
			},
			null,
			2,
		),
	);
} else {
	console.log(`runs directory: ${runsDir}`);
	console.log(
		`artifacts: ${shapes["run-report"]} run reports, ${shapes["impact-map"]} impact maps, ${shapes.unknown} unknown, ${unreadable} unreadable`,
	);
	console.log(
		`repositories: ${repos.size} after normalization, ${rows.length} distinct lenses after normalization\n`,
	);
	console.log(`lenses appearing at least ${minimum} times, highest skip first:`);
	for (const row of reported) {
		const pct = `${Math.round(row.skipRate * 100)}%`.padStart(4);
		const alias = row.variants.length > 1 ? `  (${row.variants.length} spellings)` : "";
		console.log(
			`  ${pct} skipped  ${String(row.run).padStart(4)} run / ${String(row.total).padStart(4)} total  ${row.name}${alias}`,
		);
	}
	console.log(
		`\n${rare.length} lenses appear fewer than ${minimum} times (diff-specific, not catalog).`,
	);
	console.log(
		"per-lens finding yield is not reported: findings do not record which lens produced them.",
	);
}
