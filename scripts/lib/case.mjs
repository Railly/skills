// A case is a public evidence ledger. The Enforcer field is the point:
// either the check that now fails on the mistake, or why none can exist.
const REQUIRED = [
	"Status",
	"Validation",
	"Human review",
	"Delivery",
	"Visibility",
	"Repository",
	"Source",
	"Enforcer",
];
const ENFORCER = /^(check: \S.*|none: \S.{9,})$/;

function fieldValues(text, field) {
	return [...text.matchAll(new RegExp(`^${field}:\\s*(.+)$`, "gm"))].map(
		(match) => match[1].trim(),
	);
}

export function validateCase({ path, text }) {
	const errors = [];
	for (const field of REQUIRED) {
		if (fieldValues(text, field).length === 0)
			errors.push(`${path}: missing case field "${field}"`);
	}
	const enforcers = fieldValues(text, "Enforcer");
	if (enforcers.length > 1) errors.push(`${path}: Enforcer must appear exactly once`);
	if (enforcers.length === 1 && !ENFORCER.test(enforcers[0])) {
		errors.push(
			`${path}: Enforcer must be "check: <path or command>" or "none: <reason>"`,
		);
	}
	if (!/^Visibility: public$/m.test(text))
		errors.push(`${path}: published cases must have public visibility`);
	if (/\/Users\/|\/home\/|approved-private|internal review/i.test(text))
		errors.push(`${path}: contains local or private-case material`);
	return errors;
}
