# PR #20 correctness review

Reviewed September 26, 2026. Base: `55714fa1d45642d00451bc0170aae54de87a966a`. Head: `24d9e7d2b211e6eb6bf9bc1ec54f6792bd3bb475`.

Scope: source review of the shared traversal, Jira normalization, CLI, transport, public exports, changed tests, and Jira documentation. Benign local fixtures ran against the source with Bun. No target source files were edited, external services queried, or GitHub messages posted by this reviewer. Authored tests were inspected but not executed.

## Confirmed findings

### P2: Preserve the site when resolving Jira remote links

Location: `src/jira.ts:291-293`, with the fetch dispatch at `src/jira-cli.ts:134`.

The remote-link matcher extracts only the issue key from any URL containing `/browse/KEY`. It discards the remote hostname and turns that reference into `jira:KEY`. The CLI then fetches every resulting key using the seed's selected site.

A benign reader fixture ran `runJira(["PROJ-1", "--site", "source", "--depth", "1", "--json"], reader, io)`. The seed payload contained a remote link to `https://other.atlassian.net/browse/PROJ-2`. Observed reader calls were:

```json
[
  {"key": "PROJ-1", "site": "source"},
  {"key": "PROJ-2", "site": "source"}
]
```

The report joined the remote link to the unrelated local issue at `https://source.atlassian.net/browse/PROJ-2` and returned `coverageComplete: true`. When that local key does not exist, it instead records a failed read for the wrong site. Same-key links to a different site are also dropped as apparent self-links.

Preserve external-site references as external links unless the transport and node identity explicitly support fetching the referenced site. A host check needs to use the resolved issue site because the CLI's `--site` also accepts a cloud ID.

### P2: Restrict comment and remote-link collection to the selected issue

Locations: `src/jira.ts:222` and `src/jira.ts:227`.

`findIssue` selects the requested issue from a batch envelope, but `commentBodies` and `remoteUrls` independently scan the entire original payload. Comments and remote links belonging to other items are therefore attributed to the selected issue.

A benign two-item envelope contained a `PROJ-1` issue with no relationships and an `OTHER-1` issue whose comment mentioned `PROJ-99` and whose remote link referenced `PROJ-88`. Calling `normalizeJiraPayload(payload, "PROJ-1", 0)` returned:

```json
{
  "key": "jira:PROJ-1",
  "edges": [
    {"to": "jira:PROJ-99", "via": "text"},
    {
      "to": "jira:PROJ-88",
      "via": "remote-link",
      "url": "https://demo.atlassian.net/browse/PROJ-88"
    }
  ]
}
```

This invents graph relationships and can spend the node budget on unrelated issues. The normalizer is publicly exported, and its existing batch-envelope test explicitly exercises selecting the requested issue but checks only the title. Preserve the selected item's enclosing payload context, including its own auxiliary comments and remote links, rather than traversing sibling items.

## Traversal and limitations

The pending-depth traversal is consistent with the built-in same-project/same-repository and boundary policies: strictly increasing depths, minimum-depth admission, deduplication, and cap handling appear coherent. No introduced shared-traversal regression was confirmed.

The installed customer TWG producer was unavailable. Real output-envelope compatibility, pagination/completeness of `--full`, and failure-mode output-file behavior were not independently verified. Synthetic fixtures establish the two normalization defects, not full TWG compatibility.

Security classification and exact-state gate completion belong to the parent review. This isolated review does not establish cross-family independence because the contributor's authoring model is unknown.
