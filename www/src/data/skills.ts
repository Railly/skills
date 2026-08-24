import registry from "../../../foundry/maturity.json";

export type Channel = "stable" | "candidate" | "experimental";
export type Maturity = "experimental" | "dogfooded" | "evaluated" | "validated" | "deprecated";

type RegistryEntry = {
	type: string;
	channel: Channel;
	maturity: Maturity;
	summary: string;
	decision: string;
};

export type Skill = RegistryEntry & {
	name: string;
	sourcePath: string;
	sourceUrl: string;
	decisionUrl: string;
	installCommand: string;
};

const entries = registry.skills as Record<string, RegistryEntry>;

export const skills: Skill[] = Object.entries(entries)
	.map(([name, entry]) => {
		const sourcePath = entry.channel === "stable" ? `skills/${name}` : `skills/.experimental/${name}`;
		return {
			name,
			...entry,
			sourcePath,
			sourceUrl: `https://github.com/Railly/skills/tree/main/${sourcePath}`,
			decisionUrl: `https://github.com/Railly/skills/tree/main/foundry/${entry.decision}`,
			installCommand: `bunx skills add Railly/skills --skill ${name}`,
		};
	})
	.sort((a, b) => {
		const order: Record<Channel, number> = { stable: 0, candidate: 1, experimental: 2 };
		return order[a.channel] - order[b.channel] || a.name.localeCompare(b.name);
	});

export const release = registry.release;
export const collectionInstallCommand = "bunx skills add Railly/skills";
export const types = [...new Set(skills.map((skill) => skill.type))].sort();
export const channelCounts = Object.fromEntries(
	(["stable", "candidate", "experimental"] as const).map((channel) => [
		channel,
		skills.filter((skill) => skill.channel === channel).length,
	]),
) as Record<Channel, number>;
export const evaluatedCount = skills.filter(
	(skill) => skill.maturity === "evaluated" || skill.maturity === "validated",
).length;
