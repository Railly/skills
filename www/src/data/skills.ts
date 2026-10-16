import registry from "../../../foundry/maturity.json";

type Entry = { channel: "stable" | "candidate" | "experimental"; maturity: string };

const entries = registry.skills as Record<string, Entry>;

const core = [
	{
		name: "contract",
		step: "Contract",
		line: "Write what done means before any code changes. Every criterion names the driver that will observe it.",
	},
	{
		name: "loop",
		step: "Loop",
		line: "Run the change. Ceremony scales with size, and each step ends on command output, never on a claim.",
	},
	{
		name: "verify-setup",
		step: "Verify",
		line: "Give a repo its own drivers that touch the real surface and keep evidence tied to the exact tree.",
	},
	{
		name: "gate",
		step: "Gate",
		line: "Review one exact diff: deterministic checks first, then only the lenses the change triggers.",
	},
	{
		name: "correct",
		step: "Correct",
		line: "Record the work, then turn each escaped mistake into a check that fails on it.",
	},
];

export const skills = core.map((skill) => {
	const entry = entries[skill.name];
	const path = entry.channel === "stable" ? `skills/${skill.name}` : `skills/.experimental/${skill.name}`;
	return {
		...skill,
		maturity: entry.maturity,
		sourceUrl: `https://github.com/Railly/skills/tree/main/${path}`,
	};
});

export const release = registry.release;
export const collectionInstallCommand = "bunx skills add Railly/skills";
