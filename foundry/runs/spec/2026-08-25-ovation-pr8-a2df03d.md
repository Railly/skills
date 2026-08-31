# Ovation PR #8 Spec gate

Status: pass

Base: `6eadae7ca5d6121cf0990dabea36ed351ee9c331`

Head: `a2df03dac1315e975ed320fb6aa7f5f19b482436`

Active contract: the live PR #8 body and Hunter's 2026-08-25 promotion authorization select a repository Triage tab and item-level triage. This supersedes only the 2026-08-21 Shape E prohibition on a dedicated repository-analysis pane. The remaining authority, compatibility, failure-preservation, reset, and coherent-publication requirements still apply.

## Acceptance review

| ID | Requirement | Verdict | Evidence |
| --- | --- | --- | --- |
| S1 | A repository Triage tab ranks the open backlog and preserves a dedicated route. | Pass | `/github/[scope]/[repo]/triage` builds, `RepositoryTriage` renders ranked work, and the production build lists the route. |
| S2 | Item Triage updates only the selected open issue or pull request. | Pass | The POST contract validates item kind and number, fetches the authoritative GitHub item, and publishes through `publishTriageItem`. |
| S3 | Partial and complete coverage are reported truthfully. | Pass | Migration 0049 adds `coverage_state`; PostgreSQL tests verify partial extension and complete preservation only when an existing complete item is updated. |
| S4 | Concurrent item publications preserve all accepted rankings. | Pass | Real PostgreSQL concurrency test starts from one accepted row and ends with all three identities. Removing the row lock returns two and fails. |
| S5 | Stale repository work cannot publish after reset or after losing active authority. | Pass | Generation and active-calculation tests pass. Removing both publication fences makes the old-generation test publish and fail. |
| S6 | A failed rerun preserves the last accepted report. | Pass | The PostgreSQL store suite forces provider failure and reads the prior generated report unchanged. |
| S7 | Consumers see coherent reports and richer pull-request display data cannot be overwritten by a stale issue page. | Pass | The page compare-and-set test passes; removing its continuation fence erases the branch and fails. |
| S8 | GitHub remains authoritative and optional enrichment cannot replace or hide native work. | Pass | Item input is constructed from live GitHub issue or pull data, report items merge into native workspace items, and a live GitHub REST item was published and read through PostgreSQL. |
| S9 | Updated, Created, Number, existing filters, routes, GitHub actions, run flows, and Agents remain available. | Pass | The filter dialog retains all four sorts; repository and item routes compile; `OvationWorkspace` still renders `Agents` on desktop and mobile. |
| S10 | Reset remains the only clear boundary. | Pass | Existing reset owns projection deletion; ordinary item publication replaces one accepted report transactionally and GET remains read-only. |
| S11 | The database change applies on current main and defaults legacy reports to complete. | Pass | All 49 migrations apply; `coverage_state` is non-null with default `complete`. |
| S12 | The branch is current with live main and contains no unresolved conflicts. | Pass | Head `a2df03d` merges live `origin/main` `6eadae7`; `git diff --check` passes. |

## Must-not-change review

- GitHub authority: pass.
- Existing sorts and filters: pass.
- Existing routes, GitHub actions, run workflows, and Agents: pass.
- Failed-rerun preservation: pass.
- Concurrent item-write serialization: pass.
- Reset-only clearing: pass.
- Coherent report publication: pass.

## Superseded clause

The old R22 statement that a dedicated repository-analysis pane was out of the first production shape is not marked pass. It is superseded by the current selected behavior and explicit promotion authority.
