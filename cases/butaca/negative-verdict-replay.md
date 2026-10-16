# Case: negative verdict without its preconditions

Status: candidate
Validation: replayed
Human review: pending
Maintainer acceptance: pending
Delivery: local branch
Upstream status checked: 2026-10-16
Visibility: public
Repository: Railly/butaca
Role: owner
Source: butaca surface recon, 2026-07-27 (eight anonymous probes reported "no seat flow" for a flow behind a login)
Enforcer: check: bash cases/butaca/replay-negative-verdict/replay.sh

## Observed condition or claim

The recon report said the purchase flow "produced nothing". The flow existed behind a login. The report already listed `/api/auth/providers` and `BuyAsGuest:false`, and no screenshot was taken after the click.

## Rule

`## Negative verdicts` in loop: a claim of absence carries its preconditions, the user-visible surface is looked at directly, and an unobserved precondition that would change the verdict makes it `needs-human`.

Setup: `claude -p --tools ""`, system prompt = loop SKILL.md without (A) or with (B) the rule, fixture as the user message. Runs in `replay-negative-verdict/runs/`.

| fixture | arm | runs | headline verdict negative | headline `needs-human` | names the unchecked screen |
|---|---|---|---|---|---|
| fx-butaca (notes say "no account used") | A | 3 | 0 | 0 | 0 |
| fx-butaca | B | 3 | 0 | 2 | 2 |
| fx-butaca2 (closer to the original notes) | A | 5 | 3 | 0 | 0 |
| fx-butaca2 | B | 5 | 0 | 5 | 4 |
| fx-control (removal fully supported) | A | 3 | concludes remove 3/3 | - | - |
| fx-control | B | 3 | concludes remove 3/3 | - | - |

Reading: every A run mentions the auth gate somewhere, so the current model rarely repeats the original error outright. The difference is the headline: without the rule, 3 of 5 lead with "not reachable / out of scope", which is the sentence downstream docs copy. With the rule, all 5 lead with `needs-human` and most name the screenshot that was never taken. The control shows no over-hedging on a supported removal.

Limits: synthetic fixtures, small n, one model, no tools. One B control run claimed the console was viewed "logged in", which the notes do not say.

The enforcer matches the token `needs-human`, which only the rule introduces, so it proves the rule is applied, not that the reasoning improved. Fixtures and the original runs live next to `replay.sh`.
