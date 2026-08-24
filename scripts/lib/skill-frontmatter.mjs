export function parseSkillFrontmatter(text) {
	if (!text.startsWith("---")) return null;
	const end = text.indexOf("\n---", 3);
	if (end === -1) return null;
	const block = text.slice(3, end).trim();
	const keys = {};
	for (const line of block.split("\n")) {
		const match = line.match(/^([a-zA-Z0-9_-]+):/);
		if (!match) continue;
		const value = line.slice(match[0].length).trim();
		if (!/^["'|>]/.test(value) && /:\s/.test(value)) return null;
		keys[match[1]] = value;
	}
	return keys;
}
