# Deprecated and absorbed methods

These names shipped in earlier catalog versions. They are not installable skills. Git history, archived sources, and Foundry rounds preserve their original contracts.

| Former skill | Status | Current destination | Reason |
|---|---|---|---|
| `guided-contribution` | deprecated, absorbed | Normal task collaboration policy | Human-agent control is a policy, not a maintenance skill. |
| `repro-an-issue` | deprecated, absorbed | Issue Contract reproduction phase, pending prospective eval | Reproduction is an evidence gate. The lifecycle audit does not justify restoring a public skill yet. |
| `prove-the-test` | deprecated, absorbed | `test-strength` candidate plus `review-gate`, pending baseline | Test falsification is one proof obligation, not a complete review protocol. |
| [`unfold`](unfold/SKILL.md) | deprecated, archived | Issue Contract workflow plus phase-specific methods | The umbrella had no explicit Vercel issue use, no baseline run, and a broad trigger surface that overlapped clearer units. |
| [`pick-an-issue`](pick-an-issue/SKILL.md) | deprecated, archived | No successor; use direct issue selection under normal task authority | Hunter no longer uses it (1 SkillKit invocation in 90 days); retired on his direct call rather than a fresh evidence round. |

[Round 004](../rounds/004-skill-lifecycle-audit/README.md) records the evidence, human approval, decomposition, and active migration path for the first four rows. [Round 007](../rounds/007-human-override-promotions/README.md) records the `pick-an-issue` retirement.
