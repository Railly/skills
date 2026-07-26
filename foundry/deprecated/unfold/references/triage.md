# Triage mode

Start from an observable symptom and remain read-only until the user requests a patch.

## 1. Establish the red signal

Before root-cause analysis, name and run one command that:

- drives the real code path the report uses
- asserts the exact user-visible symptom
- returns a deterministic verdict
- completes fast enough to rerun while probing

Match the reported config, build, entry point, environment, and lifecycle. A green result on a nearby path does not disprove the issue.

If a deterministic signal already exists, verify it once and continue. Do not rebuild it for ceremony.

## 2. Minimize

Remove inputs, callers, configuration, and steps one at a time. Rerun after every cut. Stop when removing any remaining element turns the signal green.

## 3. Map the failure

Work backward from the symptom through boundaries that can produce it. Build a Failure Map with proven edges marked `E` and unproven edges marked `I`.

Produce three to five ranked, falsifiable hypotheses. For each, state the observation that would distinguish it. Probe one variable at a time.

Use definitions to explain capacity and call sites or runtime output to prove participation in this failure.

## 4. Produce the Change Surface

Name the smallest justified set of contracts, state, callers, implementations, tests, and documentation that a fix may affect. Do not include a file only because it is adjacent.

## Complete when

The exact symptom is red, the repro is minimal, one hypothesis survives a distinguishing probe, and the likely Change Surface is grounded in evidence. Transition to Change only after the user requests implementation.
