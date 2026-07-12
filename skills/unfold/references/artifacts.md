# Artifact contract

Persist artifacts only when the user authorizes repository writes or explicitly asks for an `.unfold` knowledge base.

## Layout

```text
.unfold/
  manifest.json
  architecture.md
  subsystems/
    <subsystem>.md
  flows/
    <mission>.md
  evidence/
    <mission>.md
  quizzes/
    <topic>.json
```

## Manifest

Record:

```json
{
  "version": 1,
  "repository": "owner/repo",
  "commit": "full-sha",
  "generatedAt": "ISO-8601",
  "missions": []
}
```

## Markdown artifact header

Every map or trace begins with:

```yaml
---
mission: How does X reach Y?
commit: full-sha
verified_at: ISO-8601
status: verified | partial | stale
---
```

## Evidence entries

Store anchors, not copied source or model conclusions:

```markdown
- E `src/router.ts:42` `routeRequest()` reads the Host header.
- I The stale cache may explain the reported symptom; runtime confirmation is still missing.
- ? Whether shutdown always calls `removeRoute()` on forced termination.
```

An artifact may accelerate navigation but cannot certify current behavior after the commit changes. Reverify the decisive anchors before teaching or proposing a patch.

## Quiz artifact

Keep the answer and reveal separate from the pre-answer prompt so a renderer can enforce non-leakage:

```json
{
  "question": "Which component chooses the target port?",
  "options": [
    { "id": "A", "label": "DNS resolver" },
    { "id": "B", "label": "Proxy route matcher" }
  ],
  "correctIds": ["B"],
  "reveal": {
    "causalChain": "Host header -> route lookup -> target port",
    "evidence": ["src/proxy.ts:87"]
  }
}
```

Keep `correctIds`, reveal text, and decisive evidence exclusively in the private reveal artifact. Send the generative renderer only the question and neutral options before the answer.
