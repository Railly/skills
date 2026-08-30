# Decision: reject autonomous disposition candidate

Outcome: rejected
Authority: deterministic-gate
Target: `record-a-case`

The candidate added an explicit disposition decision order. It tied the released skill on all initial assertions and did not improve the transfer holdout. In the origin eval it weakened the evidence boundary by assigning `independently-validated` without an independent rerun or reviewer. The released skill used `contributor-validated` and kept independent validation unknown.

The promotion threshold requires a candidate to improve the released procedure without weakening status, confidentiality, or retrieval boundaries. This candidate does not meet that threshold. The active `skills/record-a-case/SKILL.md` remains byte-identical at `sha256:f6936a7f48ec672adfd7c888cb484e815ebd32416493ef62d371cf56547340ed`.

The eval also exposed a separate measurement gap. The initial assertions accepted invalid schema spellings and a non-canonical evidence relationship in no-skill outputs. That gap belongs in future eval-contract work, not in this procedural candidate.
