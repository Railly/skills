function stripInlineCode(line) {
	let output = "";

	for (let index = 0; index < line.length; ) {
		if (line[index] !== "`") {
			output += line[index];
			index += 1;
			continue;
		}

		let runEnd = index;
		while (line[runEnd] === "`") runEnd += 1;
		const delimiter = line.slice(index, runEnd);
		const close = line.indexOf(delimiter, runEnd);

		if (close === -1) {
			output += delimiter;
			index = runEnd;
			continue;
		}

		index = close + delimiter.length;
	}

	return output;
}

export function markdownLinkTargets(text) {
	const targets = [];
	let fence = null;

	for (const line of text.split("\n")) {
		const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
		if (fence) {
			if (
				fenceMatch &&
				fenceMatch[1][0] === fence.character &&
				fenceMatch[1].length >= fence.length
			) {
				fence = null;
			}
			continue;
		}

		if (fenceMatch) {
			fence = {
				character: fenceMatch[1][0],
				length: fenceMatch[1].length,
			};
			continue;
		}

		const visible = stripInlineCode(line);
		for (const match of visible.matchAll(/(?<!\\)\[[^\]]+\]\(([^)]+)\)/g)) {
			targets.push(match[1]);
		}
	}

	return targets;
}
