# PR 340 conflict resolution

Authorization: Hunter requested "fix conflicts and merge it" on September 23, 2026.

A1: Incorporate current main without altering approved migration behavior or main package changes.
A2: Refresh only the core documentation baseline hashes against the exact upstream source.
A3: Require passing docs production/preview CI, tests, type checks and reviews at the new head before squash merge.

Mechanical follow-up review covers fdb8982792fa05332a6846c9d00df0edeb9d7685..1710ae6a07babfa23be54e12fb5931a2dd6c4e28. The preceding merge imports origin/main 3709614 unchanged, including its core implementation and tests; the original migration had human approval at 9f43f071. No new dependency, runtime, routing or rendering implementation is authored by this maintenance.
