# skills

Opinionated, **agnostic** agent skills: the way I actually work with coding agents, packaged so anyone can drop them into their own setup.

These are not utilities. Each skill encodes a *methodology*, a repeatable way of working that fights the failure modes of agent-assisted coding (cognitive debt, unverified assertions, green-but-wrong code). Portable across repos, tools, and stacks. No personal paths, no per-project assumptions.

Inspired by [`mattpocock/skills`](https://github.com/mattpocock/skills) and Anthropic's [Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills).

## Philosophy

- **Agnostic.** A skill here works in any repo, any language, any editor. If it hardcodes a path or assumes a stack, it doesn't belong.
- **Generation over consumption.** The best skills make *you* think, not the agent think for you. Understanding is what lets you evolve a system; verifying an agent's output is not the same as understanding it.
- **Verify before asserting.** Skills push the agent to check reality (filesystem, API, git) before claiming a fact, and to say "unknown" rather than guess.
- **Opinionated.** These reflect how I work. Fork and bend them to how *you* work.

## Skills

| Skill | What it does |
|---|---|
| [`pick-an-issue`](skills/pick-an-issue) | Choose what's worth fixing in someone else's issue backlog, verify it's real before investing, and ship it as a clean PR with credit. Contributor-side selection: quality filter, virgin-vs-has-PR cross-reference, verify-before-invest, PR hygiene. Pairs with `guided-contribution` for the fix. |
| [`guided-contribution`](skills/guided-contribution) | Learn an unfamiliar codebase by shipping a real change: the agent tutors you (you reconstruct, predict, and write the tests) instead of doing it for you. Full arc: recon, mental model, guided trace, ship, verify behavior, document. |

## Install

A skill is a folder with a `SKILL.md`. Make it discoverable to your agent by linking or copying it into your agent's skills directory.

**Claude Code**
```bash
git clone https://github.com/Railly/skills.git ~/railly-skills
ln -s ~/railly-skills/skills/guided-contribution ~/.claude/skills/guided-contribution
```

**Cursor / Codex / others**
Copy or symlink the skill folder into wherever your tool loads skills, or paste the `SKILL.md` body as a rule or instruction. The content is tool-agnostic prose, so it works anywhere an agent reads instructions.

Then invoke by name (`guided-contribution`) or just describe the intent; the `description` frontmatter drives discovery.

## Anatomy of a skill

```
skills/<name>/
└── SKILL.md        # frontmatter (name, description) + the methodology
```

`description` is the most important line. It is what the agent matches on to decide relevance, so it carries explicit trigger phrases.

## Contributing

Fork, add a skill under `skills/<name>/SKILL.md`, keep it agnostic, open a PR. CI validates that every skill has well-formed frontmatter.

## License

MIT © Railly Hugo
