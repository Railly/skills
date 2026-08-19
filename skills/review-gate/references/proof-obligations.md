# Proof obligations

Use this ledger for every material property changed or claimed by the diff.

## Claim inventory

Inventory four sources separately:

- contract or issue;
- design gate and carried assumptions;
- user-facing prose such as the PR body, docs, help, and errors;
- implementation diff, names, and behavior.

Each source maps to property IDs or states why it supplies none.

## Property and proxy

Distinguish the property itself from the convenient observable exposed by the implementation. Permissions are not confidentiality. A successful write is not durability. A PID is not capability. Final state equality is not atomic visibility.

Name an oracle that observes the property at its own layer and list every substrate or environment on which the claim is made.

State the proxy, then construct and execute a counterexample where the proxy is true while the property is false. A proxy that separates from the property cannot close it. If a supported substrate is unavailable, narrow the claim or record a gap.

## Commit-point map

Map every durable or externally visible commit point. Examples include file publication, database writes, alias registration, process spawn, cache mutation, message acknowledgement, and remote API effects.

Enumerate every fallible stage after each commit point. Partition stages by ownership region, force one representative failure per region, and record:

- residual state;
- cleanup owner;
- immediate retry of the same user operation.

Writer-local cleanup does not prove caller-level rollback. A retry that requires undocumented manual deletion, state repair, or process cleanup has failed.

## Assumptions

Carry every assumption from Solution Gate, the issue contract, the implementation trail, and the subsystem model into the report. Verify it at its own layer, refute it into a finding, or leave an explicit gap.

## High-risk independence

Classify work as high risk when it handles secrets, authentication or authorization, destructive operations, durable state, externally visible partial state, concurrency, process lifecycle, cross-platform guarantees, or remote side effects.

High-risk work needs an independent challenge source: a different model family, a human reviewer, a normative reference implementation, or a substrate corpus whose oracle was defined independently of the implementation. Save the challenge as a non-empty local artifact beside the report or at another stable local path. An unchecked URL is not evidence.

## Behavioral coverage strength

Run `test-strength` when the diff implements or changes a protocol, parser, serializer, state machine, lifecycle, browser or OS event translation, adapter, or compatibility layer.

Record:

- the explicit behavioral dimensions, values, and externally justified exclusions;
- an oracle whose expected results are not derived from the production implementation;
- fixture or generator provenance proving each lifecycle event is semantically valid;
- fix-absent mutations that fail for the intended reason and restored green evidence;
- the real input producer and user-visible boundary exercised.

Selected examples do not prove a matrix. A type-valid synthetic object does not prove a reachable event. If a real producer or independent oracle is unavailable, leave the Review Gate run incomplete.
