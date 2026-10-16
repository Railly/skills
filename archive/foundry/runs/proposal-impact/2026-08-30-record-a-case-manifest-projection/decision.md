# Decision: accept manifest projection for Record a Case

Date: 2026-08-30
Outcome: accepted
Authority: human
Target: `record-a-case`

Hunter approved implementing the Codex session-friction recommendations. This candidate keeps the existing evidence, confidentiality, review, and delivery boundaries while removing repeated state reconstruction at case closure.

The candidate is accepted because it:

- uses the work-item manifest as the primary stable inventory after compaction;
- verifies only drift-prone external state;
- projects closed mission state into both the Issue Contract and manifest;
- emits a fixed close-cycle receipt;
- generates SkillKit annotations from reviewed evidence without inventing missing proof;
- packages the canonical source resolver instead of referring to an unavailable repository-root script.

The deterministic three-variant contract evaluation passed 8 of 8 candidate assertions, compared with 3 of 8 for the released skill and 0 of 8 without a skill. Real cycle-time and outcome deltas remain prospective evidence and do not justify a maturity promotion in this change.
