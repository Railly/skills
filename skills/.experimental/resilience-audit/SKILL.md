---
name: resilience-audit
description: "Pressure a system's failure paths. Use to audit or verify timeouts, cancellation, cleanup, retries, idempotency, partial writes, recovery, leaks, bounded queues or caches, overload, backpressure, dependency failure, malformed upstream data, cross-platform lifecycle behavior, or concurrent state transitions."
compatibility: Requires a runnable target or test harness. Fault injection and source edits require user authorization and safe isolation.
---

# Resilience audit

A happy-path pass says nothing about failure behavior. Force each material failure and observe the invariant directly.

Read the work-item manifest first when one exists. Verify the current head, contract digest, relevant paths, environment, and executing `skill_revision`. Reuse prior evidence only when its fingerprint proves the later diff cannot affect the failure boundary.

## 1. Map failure boundaries

Trace critical operations across process, network, storage, queue, cache, filesystem, browser, and third-party boundaries. For each, name the owner, timeout, cancellation path, retry policy, idempotency key, cleanup duty, durable state, and user-visible outcome.

**Complete when:** each critical path has explicit failure and recovery invariants.

## 2. Build a pressure matrix

Select applicable faults:

- timeout before, during, and after side effects;
- cancellation and shutdown while work is active;
- retry after ambiguous success or partial write;
- dependency refusal, delay, disconnect, or malformed response;
- queue, cache, memory, descriptor, or process growth;
- overload and backpressure;
- restart, reconnect, stale state, and recovery;
- concurrent check-then-act or conflicting transitions;
- supported operating-system and filesystem differences.

For every durable side effect, split the path at the commit point. Force failures before it and at each later fallible stage, then retry the same operation immediately. Writer-local cleanup is not evidence for caller-level rollback.

For confidentiality properties, define the oracle in terms of effective access. Mode bits, ownership metadata, or an API success response are proxies unless the supported substrate has no additional access mechanism. Exercise ACLs, inherited permissions, alternate principals, and equivalent platform controls where applicable.

Define expected state, observable signal, cleanup deadline, and safe retry outcome for each cell.

**Complete when:** every selected fault has an oracle that can distinguish safe degradation from silent corruption.

## 3. Force one fault at a time

Use bounded fault injection, controlled clocks, disposable state, test doubles at real boundaries, process signals, resource limits, or platform matrices. Capture before, during, and after state. Do not wait for rare failures to occur naturally.

**Complete when:** each executed cell has a reproducible trace and cleanup observation.

## 4. Classify the result

Classify outcomes as preserved invariant, graceful rejection, recoverable degradation, corrupted or duplicated state, leak, unbounded growth, retry storm, deadlock, or verification gap. A missing environment or unavailable dependency is a gap, not a pass.

**Complete when:** every matrix cell has evidence or an explicit reason it remains unverified.

## 5. Fix narrowly when authorized

Choose the smallest change that restores the violated invariant. Preserve retry budgets, cancellation propagation, atomicity, bounded resource ownership, and idempotency. Add a deterministic regression test that forces the same path.

**Complete when:** the forced failure is red before the fix, green after it, and normal behavior remains green.

## 6. Re-run under repetition and load

Repeat the failure, combine it with realistic concurrency or load, and inspect process, descriptor, memory, queue, cache, and durable-state cleanup.

**Complete when:** resource use returns to its declared bound and recovery remains deterministic.

## 7. Report and gate

Report the pressure matrix, traces, violated invariants, fixes, remaining gaps, operational signals, and rollback. Run the repository review gate when available.

Emit a stage receipt containing status, head, command, relevant paths, contract digest, environment digest, skill revision, elapsed time, report path, commit points, forced partitions, cleanup owners, retries, and a reusable flag with dependency-cone evidence. Update the manifest atomically.

**Complete when:** the report separates forced evidence from inference, no unexecuted cell is described as safe, and the manifest points to the exact receipt.
