# GitHub publishing

Use this protocol only after the local before/after package is complete and the user wants it shared on GitHub.

## 1. Freeze the destination and draft

Resolve the exact repository and issue or pull request number. Draft a compact block that leads with the visible claim:

```markdown
## Before / after

The changed state makes the result visible without reproducing the branch locally.

### Before

![Before: concise description](./before.png)

### After

![After: concise description](./after.png)
```

Keep the image paths relative and run the eventual `gh` command from the artifact directory so GitHub CLI can rewrite those references in place. Include `diff.png` or a video only when it materially improves the proof.

The standalone HTML report remains a local review artifact. GitHub CLI attachments support images and videos, not the HTML package.

## 2. Ask once before writing

Ask the user to choose:

1. Post as a new comment.
2. Add or replace the before/after section in the pull request description.
3. Do not publish.

State the repository and pull request number in the question. The choice authorizes one write to that exact target. A request to generate or open the artifact is not publishing approval.

If the user chooses a comment, show the final comment draft before posting unless they already supplied or approved its wording.

If the user chooses the description, first fetch and preserve the current body. Add or replace only this bounded section:

```markdown
<!-- before-after:start -->
## Before / after

...
<!-- before-after:end -->
```

Never replace the whole description with only the visual proof.

Use the bundled helper to perform the bounded update:

```bash
gh pr view "$pr_number" --repo "$repo" --json body --jq .body > ./github-pr-body-current.md
bun <skill-root>/scripts/upsert-github-section.mjs \
  --body ./github-pr-body-current.md \
  --section ./github-before-after.md \
  --out ./github-pr-body.md
```

Inspect the resulting body before asking for final approval or running `gh pr edit`.

## 3. Check the CLI and access

Attachment uploads require GitHub CLI 2.99.0 or newer:

```bash
gh --version
gh auth status
gh repo view OWNER/REPO --json viewerPermission
```

Continue only when the installed version supports `--attach`, authentication is valid, and `viewerPermission` is `WRITE`, `MAINTAIN`, or `ADMIN`. If any check fails, leave the Markdown draft and local files intact and report the exact gap. Do not fall back to browser drag-and-drop.

GitHub Enterprise Server is not supported by this attachment flow. Respect GitHub's current file type and size limits before attempting the upload.

## 4. Publish the approved destination

Run from the artifact directory so the body paths and attachment paths match.

For a new pull request comment:

```bash
cd "$proof_dir"
# Requires GitHub CLI 2.99.0 or newer for native --attach.
gh pr comment "$pr_number" \
  --repo "$repo" \
  --body-file ./github-before-after.md \
  --attach './before.png#Before: concise description' \
  --attach './after.png#After: concise description'
```

For a pull request description, fetch the current body, upsert the delimited section into a temporary body file, inspect the resulting diff, and then:

```bash
cd "$proof_dir"
# Requires GitHub CLI 2.99.0 or newer for native --attach.
gh pr edit "$pr_number" \
  --repo "$repo" \
  --body-file ./github-pr-body.md \
  --attach './before.png#Before: concise description' \
  --attach './after.png#After: concise description'
```

`--attach` is repeatable. A referenced local path is rewritten in place and retains its Markdown alt text. An attached file that is not referenced in the body is appended automatically.

## 5. Verify the write

Read the resulting comment or pull request body through `gh` and confirm:

- Both assets render in the chosen destination.
- Alt text describes the visible state rather than repeating the filename.
- The existing pull request description remains intact.
- Only one before/after section exists.

Return the resulting GitHub URL and the local evidence paths. Do not post a second time to repair wording without another explicit approval.
