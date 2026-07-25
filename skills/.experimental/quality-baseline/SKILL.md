---
name: quality-baseline
description: "Baseline a repository before quality work. Use when asked to audit maintainability, reliability, performance, security, test quality, technical debt, or code health across a codebase; to identify and rank gaps before fixing them; or to compare quality state over time. Remain read-only on target source."
compatibility: Requires repository read access and its normal version-control and verification tools.
---

# Quality baseline

Build an evidence ledger, not a generic score. A missing checked-in control is a gap in visible repository evidence, not proof that no organization-level control exists.

## 1. Freeze repository identity

Record repository path, remote identity, HEAD, branch, working-tree state, stack, package manager, instruction files, CI workflows, and exact verification commands. Preserve unrelated changes.

**Complete when:** another reader can reproduce the inspected state and commands.

## 2. Map critical paths and controls

Trace the user-visible and operational paths whose failure would matter. For each path, map:

- functional contracts and external specifications;
- test layers and whether they exercise the real boundary;
- latency, throughput, memory, or size observability;
- timeout, retry, cancellation, cleanup, recovery, and overload behavior;
- dependency, secret, trust-boundary, and release controls;
- supported runtimes, operating systems, renderers, or protocol surfaces.

Use history, churn, and change coupling only as prioritization evidence. A large or frequently edited file is not a defect by itself.

**Complete when:** every critical path has an evidence-backed control map or an explicit verification gap.

## 3. Prove or reject findings

For every candidate gap, capture:

- exact evidence and affected contract;
- plausible failure and impact;
- confidence and important unknowns;
- smallest useful verification;
- fix effort and regression risk.

Reject code-smell findings that do not connect to a failure, change-safety cost, measurable bottleneck, or violated repository rule. Reject optimization claims without a workload and measurable symptom. Reject "add tests" without naming what the test must detect.

**Complete when:** every retained finding has a verification story and every investigated rejection has a reason.

## 4. Rank pilot work

Rank by impact, evidence strength, verification cost, fix risk, and reversibility. Prefer one bounded pilot whose result can be measured. Route:

- measured bottlenecks to `performance-proof`;
- weak regression protection to `test-strength`;
- failure-path exposure to `resilience-audit`;
- a selected defect to the repository's triage workflow.

**Complete when:** the top recommendation names the contract, evidence, first experiment, stop condition, and expected proof.

## 5. Deliver the baseline

Return a quality matrix, critical-path map, ranked findings, rejected findings, verification gaps, and next pilot. Include a machine-readable representation when the user requests a persistent or repeatable baseline. Do not change target source under this skill.

**Complete when:** the report distinguishes evidence, inference, and unknowns, and contains no synthetic global quality score.
