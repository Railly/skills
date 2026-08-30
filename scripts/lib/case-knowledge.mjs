const DISPOSITIONS = new Set([
	"link-existing",
	"create-candidate",
	"gap",
	"no-change",
]);
const PATTERN_ID = /^pattern\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GAP_ID = /^gap\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const SUPPORTIVE_RELATIONSHIPS = new Set([
	"origin",
	"application",
	"evaluation",
	"transfer",
]);

function fieldValues(text, field) {
	return [...text.matchAll(new RegExp(`^${field}:\\s*(.+)$`, "gm"))].map(
		(match) => match[1].trim(),
	);
}

export function validateCaseKnowledge({
	path,
	text,
	patterns = [],
	gaps = [],
}) {
	const errors = [];
	const schemas = fieldValues(text, "Case schema");
	const dispositions = fieldValues(text, "Knowledge disposition");
	const targets = fieldValues(text, "Knowledge target");
	if (schemas.length === 0) {
		if (dispositions.length > 0 || targets.length > 0) {
			errors.push(`${path}: knowledge fields require Case schema 2`);
			return { errors, legacy: false };
		}
		return { errors, legacy: true };
	}
	if (schemas.length !== 1) {
		errors.push(`${path}: Case schema must appear exactly once`);
		return { errors, legacy: false };
	}
	if (schemas[0] !== "2") {
		errors.push(`${path}: unsupported Case schema "${schemas[0]}"`);
		return { errors, legacy: false };
	}

	if (dispositions.length !== 1) {
		errors.push(`${path}: Knowledge disposition must appear exactly once`);
	}
	if (targets.length !== 1) {
		errors.push(`${path}: Knowledge target must appear exactly once`);
	}
	if (dispositions.length !== 1 || targets.length !== 1) {
		return { errors, legacy: false };
	}

	const disposition = dispositions[0];
	const target = targets[0];
	if (!DISPOSITIONS.has(disposition)) {
		errors.push(`${path}: invalid Knowledge disposition "${disposition}"`);
		return { errors, legacy: false };
	}

	const pattern = patterns.find((entry) => entry.id === target);
	if (["link-existing", "create-candidate"].includes(disposition)) {
		if (!PATTERN_ID.test(target) || !pattern) {
			errors.push(`${path}: ${disposition} requires an existing pattern ID`);
		} else if (
			!(pattern.evidence ?? []).some(
				(entry) =>
					entry.path === path &&
					entry.status === "active" &&
					(disposition === "create-candidate"
						? entry.relationship === "origin"
						: SUPPORTIVE_RELATIONSHIPS.has(entry.relationship)),
			)
		) {
			errors.push(
				`${path}: target pattern must link back with active supportive evidence`,
			);
		}
	}
	if (
		disposition === "create-candidate" &&
		pattern &&
		pattern.status !== "candidate"
	) {
		errors.push(`${path}: create-candidate target must have candidate status`);
	}
	if (disposition === "gap") {
		if (!GAP_ID.test(target) || !gaps.includes(target)) {
			errors.push(`${path}: gap requires an existing knowledge gap ID`);
		}
	}
	if (disposition === "no-change" && target !== "none") {
		errors.push(`${path}: no-change requires Knowledge target "none"`);
	}

	return { errors, legacy: false };
}
