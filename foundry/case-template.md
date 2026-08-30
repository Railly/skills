# Maintenance case template

Use this after a real issue, pull request, review, or incident. Complete only fields supported by evidence.

```markdown
# Case: <short name>

Case schema: 2
Status: observed | candidate | evaluated | reviewed | promoted | rejected
Validation: unvalidated | contributor-validated | independently-validated
Human review: pending | contributor-complete | independent-complete
Maintainer acceptance: pending | changes-requested | approved | not-applicable
Delivery: local | PR open | merged | released | artifact verified
Visibility: public | approved-private
Repository: <owner/repo or private>
Role: contributor | maintainer
Issue or PR: <public URL or approved private reference>
Upstream status checked: <YYYY-MM-DD or not-applicable>
Knowledge disposition: link-existing | create-candidate | gap | no-change
Knowledge target: pattern.<id> | gap.<id> | none

## Observed failure

What happened, in the reporter's language?

## Red signal

What deterministic signal reproduced the problem?

## Method used

What ordered method changed the outcome?

## Outcome

What was fixed, reviewed, shipped, or disproven?

## Evidence

- Source:
- Runtime:
- Tests:
- Review:
- Artifact:

## Transferable lesson

What remains true outside this repository?

## Exceptions

When should an agent not apply this lesson?

## Candidate changes

- Skill method:
- Reference rule:
- Exemplar:
- Deterministic check:
- Eval:
- Coverage gap:
- No change:

## Confidentiality review

What can be public, what must remain private, and who approved that boundary?
```

Do not replace unavailable evidence with plausible reconstruction. Mark it unknown.

These fields are independent. A merged change is not automatically validated, and contributor validation is not maintainer acceptance.

Schema 2 requires exactly one compiled-knowledge disposition. Existing-pattern and candidate-pattern targets must link back to the case, candidate creation remains non-promoted, gap targets must already exist in compiled provenance, and no-change uses `none`.

An agent-generated or synthetic backfill defaults to `Status: observed`, `Validation: unvalidated`, and `Human review: pending`. Upgrade those fields only after explicit review of the underlying evidence.
