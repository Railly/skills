export function applyPrefix(name: string, prefix: string | null) {
	return prefix ? `${prefix}.${name}` : name;
}

export function namesForApps(names: string[], prefix: string | null) {
	return names.map((name) => applyPrefix(name, prefix));
}
