# Behavior eval protocol

The JSON files under `skills/*/evals/` are fixture definitions. They are not proof that a skill works until an eval run records outcomes for the required variants.

## Run matrix

Run every fixture in three conditions with the same repository snapshot, model, tools, permissions, and user prompt.

| Variant | Purpose |
|---|---|
| No skill | Measure the model's baseline behavior |
| Released skill | Protect the current public behavior |
| Candidate skill | Test whether the proposed change is better |

Use at least one originating case and one transfer holdout from another repository or stack. Keep near-miss prompts in the suite to measure false invocation.

## Scorecard

Score observable behavior as pass or fail. Do not grade writing style or require exact wording.

```json
{
  "fixture": "unfold-003",
  "variant": "candidate",
  "environment": {
    "repository": "owner/repo@sha",
    "agent": "agent-name",
    "model": "model-name",
    "tools": ["shell", "ask-user"]
  },
  "assertions": [
    {
      "id": "one-question-only",
      "result": "pass",
      "evidence": "turn:4"
    }
  ],
  "outcome": "pass",
  "reviewer": "human-or-judge-version"
}
```

Every assertion needs a retrieval handle such as a turn, file, command output, test result, or artifact path.

Separate three kinds of evidence instead of letting one substitute for another:

- Agent-demonstrated evidence: the run preserved the command, exit code, output, mutation, and restoration.
- Artifact evidence: the final repository or file has the expected state.
- Grader reconstruction: an independent grader can reproduce a claim after the run.

A grader reconstruction can validate the artifact. It cannot prove that the evaluated agent performed or recorded the method. Agent-authored prose is a summary, not a raw command record.

## Evaluation layers

### 1. Trigger

- Positive prompt invokes the intended skill.
- Near-miss prompt does not invoke it.
- A journey invokes its owned primitives only when their preconditions exist.

### 2. Method

- Required gates occur in order.
- The agent does not skip a deterministic signal or invent evidence.
- Handoffs preserve the artifacts produced by the previous method.

### 3. Outcome

- The claimed repro actually fails for the reported reason.
- The claimed test is red-capable.
- The architecture or failure map has source anchors.
- The built, installed, or deployed artifact is verified when relevant.

### 4. Transfer

- The method passes outside the source repository.
- The prompt changes names and incidental details.
- The holdout contains at least one tempting but irrelevant path.

## Promotion threshold

A candidate is promotable when:

- all safety, provenance, and confidentiality assertions pass;
- no required method or outcome assertion regresses from the released skill;
- it improves at least one target failure against the released skill;
- it beats the no-skill baseline on the intended behavior;
- positive and negative trigger cases pass;
- one transfer holdout passes;
- a human reviews the evidence handles.

If a candidate only changes prose while observable behavior remains equal, do not promote it.

## Judge discipline

Use deterministic checks wherever possible. Use a separate judge only for contextual behavior that cannot be reduced to commands or artifacts. The judge must receive the rubric and evidence, not the candidate's intended answer.
