// Canonical identifiers for run-report fields that are written as free text.
//
// Provenance: the 2026-08-20 mining pass over foundry/runs/review-gate found that
// telemetry over the corpus could not be trusted. 135 raw lens names collapsed to
// 83 once case and separators were normalized, so per-lens coverage counts were
// fragmented across spelling variants of one lens. `run.repo` split the same
// repository into several strings, and the runs directory mixed two artifact
// shapes. None of this is semantic disagreement: every collapsed group was one
// lens written three ways.
//
// These helpers normalize for reading and aggregation. They do not restrict what
// a run may record: lens calibration stays open, so an ad-hoc lens keeps its
// name and simply normalizes alongside the recurring ones.

const REPO_OWNER_PREFIX = /^[a-z0-9][a-z0-9-]*\//i;

/**
 * Normalize a lens name for aggregation.
 * Lowercases, drops parenthetical qualifiers, and collapses every run of
 * non-alphanumeric characters to a single hyphen.
 */
export function normalizeLensName(name) {
	if (typeof name !== "string") return "";
	return name
		.toLowerCase()
		.replace(/\(.*?\)/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Read a lens entry's name regardless of the shape the run recorded.
 * Most entries are objects with `name`; a few use `lens`, and 18 entries in the
 * corpus are bare strings.
 */
export function lensName(entry) {
	if (typeof entry === "string") return entry.trim();
	if (entry && typeof entry === "object") {
		const value = entry.name ?? entry.lens ?? "";
		return typeof value === "string" ? value.trim() : "";
	}
	return "";
}

/**
 * Normalize a repository identifier to `owner/name`.
 * Strips an issue or pull-request suffix (`owner/name#1669`) and applies the
 * supplied owner when a run recorded a bare repository name.
 */
export function normalizeRepo(repo, { defaultOwner = "" } = {}) {
	if (typeof repo !== "string") return "";
	let value = repo.trim().replace(/#.*$/, "").replace(/\.git$/, "");
	if (!value) return "";
	value = value.replace(/^https?:\/\/github\.com\//i, "");
	if (!REPO_OWNER_PREFIX.test(value) && defaultOwner) {
		value = `${defaultOwner}/${value}`;
	}
	return value.toLowerCase();
}

/**
 * Extract the issue or pull-request reference a repo string carried inline,
 * so normalizeRepo can drop it without losing the information.
 */
export function repoReference(repo) {
	if (typeof repo !== "string") return null;
	const match = repo.match(/#(\d+)\s*$/);
	return match ? Number(match[1]) : null;
}

/**
 * Classify a parsed JSON artifact found under a runs directory.
 * The runs tree holds review-gate run reports alongside Radius impact maps,
 * which share the date-repo-sha filename convention but no fields.
 */
export function artifactType(parsed) {
	if (!parsed || typeof parsed !== "object") return "unknown";
	if ("run" in parsed) return "run-report";
	if ("impacted" in parsed && "changed" in parsed) return "impact-map";
	return "unknown";
}

/**
 * Collect every lens entry of a run report under its normalized name.
 * Returns a Map of normalized name to { total, run, skipped, variants }.
 */
export function tallyLenses(report) {
	const tally = new Map();
	const entries = Array.isArray(report?.lenses) ? report.lenses : [];
	for (const entry of entries) {
		const raw = lensName(entry);
		if (!raw) continue;
		const key = normalizeLensName(raw);
		if (!key) continue;
		const bucket = tally.get(key) ?? {
			total: 0,
			run: 0,
			skipped: 0,
			variants: new Set(),
		};
		bucket.total += 1;
		bucket.variants.add(raw);
		const status = typeof entry === "object" ? entry?.status : "";
		if (status === "run") bucket.run += 1;
		if (status === "skipped") bucket.skipped += 1;
		tally.set(key, bucket);
	}
	return tally;
}
