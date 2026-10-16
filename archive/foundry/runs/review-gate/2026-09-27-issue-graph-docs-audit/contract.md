# Docs coherence audit

User authorization: audit current main after docs PR26 merged, update coverage and simplify language.

Base: 44a9e181367e42a7e0c1955c9eb75d34b4089c1e.

- A1: docs and bundled guidance match shipped commands, formats, scopes, defaults, and writes.
- A2: machine schema lists every CLI command and matches actual parser defaults.
- A3: public repository links work; private capture guidance remains intact.
- A4: simplify language without changing live collection or dashboard behavior.

Scope excludes unmerged Linear/Jira/Health work, dirty principal checkout, release publication, and merging the audit PR.
