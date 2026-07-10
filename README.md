# skills

Agent skills that encode how I work. Drop them into any setup.

Each skill is a method, not a utility. It helps you avoid common failures when you code with agents: you do not understand the code, you claim without proof, your tests pass while the code is still wrong. Works in any repo and stack. No hardcoded paths.

Inspired by [mattpocock/skills](https://github.com/mattpocock/skills) and [Anthropic agent skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills).

## Philosophy

How these skills work:

- agnostic: works in any repo, language, editor. If it assumes your stack, it does not belong
- you think, agent checks: skills make you rebuild ideas, not read answers. Understanding lets you change a system, checking output does not
- check before you claim: use filesystem, api, git. Say unknown when you cannot prove it
- opinionated: these reflect how I work. Fork them to match how you work

## Skills

| skill | what it does |
|---|---|
| [pick-an-issue](skills/pick-an-issue) | filter a backlog you do not own, confirm a bug is real, ship a clean PR with credit |
| [repro-an-issue](skills/repro-an-issue) | build a signal that goes red on the bug before you theorize or fix it |
| [prove-the-test](skills/prove-the-test) | prove a test fails when the code is wrong before you trust it green |
| [guided-contribution](skills/guided-contribution) | learn a codebase by shipping a change with a tutor, you predict and rebuild, agent checks |

## Install

A skill is a folder with `SKILL.md`. Link it where your agent loads skills.

Claude Code:

```bash
git clone https://github.com/Railly/skills.git ~/railly-skills
ln -s ~/railly-skills/skills/guided-contribution ~/.claude/skills/guided-contribution
```

Cursor, Codex, others:

Copy the folder to your skills directory or paste `SKILL.md` as a rule. The file is plain prose, so it works anywhere.

Trigger is the `description` in frontmatter. Keep it close to user intent.

## How a skill is built

```
skills/<name>/
└── SKILL.md
```

## Contributing

Fork, add `skills/<name>/SKILL.md`, keep it agnostic, open a PR. CI checks frontmatter.

## License

MIT (c) Railly Hugo
