# Independent review evidence: Factory Loop

Date: 2026-08-25
Repository: Railly/skills
Base: dc2ab9752e1398fae7c16cf153c0c3304ff11a62
Head: f957cb19f8bbaebe17d1d20887fd222a635cf925
Tree: 8674c78f1cc92f0c15670741633e673f49621633

Claude Opus 5 independently reviewed the original tree and returned six Standards findings: an unguarded external `ship` dependency, an unsynchronized workflow footer width, false fixture-verification credit, weak contract tests, mixed graph vocabulary, and a stale public release string.

The successor tree added an explicit unavailable-workflow stop, synchronized both workflow widths at 1595 px, scoped fixture evidence honestly, strengthened the contract tests, changed the graph field to a role-note taxonomy, and derived release evidence from the registry.

The reviewer verified all six findings closed at their own layers and reran fresh-seam, boundary-pipeline, invariant-ownership, docs-behavior, deliberate-default, complexity, release, exact-state-authority, and stale-evidence lenses. Six representative mutants changed the expected predicate from green to red and the restored tree returned green: swapped harden/strengthen table rows, removed Admit, restored a seven-column grid, restored the 1015 px footer width, restored the hardcoded 0.0.5 release, and removed the unavailable-workflow stop.

Final independent verdict: STANDARDS PASS for tree 8674c78f.

An independent Spec review separately returned SPEC PASS for A1-A6 and I1-I5 on the same tree.
