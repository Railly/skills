# Sibling gate disposition

- CHANGELOG.md: historical release entries remain unchanged; their readiness, no-navigate, and encryption statements are still accurate.
- README.md: all existing auth-login passages were read. They remain accurate; the new exact-control behavior is documented adjacent to them.
- agent-browser.schema.json: the match is a credential-provider name description; schema shape and provider behavior are unchanged.
- cli/src/commands.rs: parser and flag definitions only. Selection, insertion, and failure semantics do not live here.
- cli/src/native/actions.rs: all untouched auth-login passages were read; they are dispatch, existing lifecycle, or tests and do not contradict the new behavior.
- cli/src/output.rs: existing mentions format auth results and contain no field-selection claim.
- docs/public/schema.json: generated public copy of the unchanged credential-provider schema description.
- docs/src/app/changelog/page.mdx: historical release entries are immutable and do not describe the new fix.
- docs/src/app/commands/page.mdx: all existing command passages remain accurate; the safety behavior is added to the canonical command page.
- docs/src/app/configuration/page.mdx: configuration keys and examples only; no selection or insertion semantics.
- docs/src/app/plugins/page.mdx: credential-provider configuration only; providers still feed the same auth action.
- docs/src/app/security/page.mdx: all existing security passages remain accurate; the fail-closed behavior is documented there.
- skill-data/core/SKILL.md: terse command inventory only; no behavioral claim.
- skill-data/core/references/authentication.md: existing passages remain accurate and the exact-node rule is added.
- skill-data/core/references/commands.md: existing passages remain accurate and the exact-node rule is added.
- skill-data/core/templates/authenticated-session.sh: command invocation template only; no assumptions about duplicate-control selection.
