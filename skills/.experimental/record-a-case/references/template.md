# Case schema

Use this schema when materializing a case. Preserve every status axis even when its value remains pending or unknown.

```markdown
# Case: <short name>

Status: observed | candidate | evaluated | reviewed | promoted | rejected
Validation: unvalidated | contributor-validated | independently-validated
Human review: pending | contributor-complete | independent-complete
Maintainer acceptance: pending | changes-requested | approved | not-applicable
Delivery: local | PR open | merged | released | artifact verified
Upstream status checked: <YYYY-MM-DD or not-applicable>
Visibility: public | approved-private
Repository: <owner/repo or private>
Role: contributor | maintainer
Source: <retrieval handles>

> <unvalidated or review note when applicable>

## Observed condition or claim

## Red signal

## Method used

## Outcome

## Evidence

- Source:
- Runtime:
- Tests:
- Review:
- Artifact:

## Transferable lesson

## Exceptions

## Candidate changes

- Skill method:
- Reference rule:
- Exemplar:
- Deterministic check:
- Eval:
- Coverage gap:
- No change:

## Confidentiality review
```

Record unavailable evidence as unknown. Keep only the selected candidate classification when the destination format permits it.
