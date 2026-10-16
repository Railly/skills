# Round 015: register verify-setup

## Candidate

`verify-setup`, a kit that gives a repository its own executable verification under `.agents/verify/`: `doctor.sh`, `check.sh`, `observe.sh <feature>` over per-feature drivers, `fresh.sh`, feature files, and an enforcer table.

## Origin

An audit of this repo found that verification was described in prose and enforced by nothing. Review Gate was the only skill that ran real checks, and no target repo had a way for a cold agent to prove a change on the surface a user touches. Prose instructions for a per-repo check tend to be skipped, so this kit ships scripts and a check that a hook can call.

The butaca recon is the motivating failure: eight indirect instruments (network, bundles, fibers, DOM) concluded a flow did not exist when it was behind a login panel that produced no traffic. A driver that screenshots the screen would have seen it.

## Ownership

Verify Setup owns the kit and its proof: every driver must be seen failing on a broken state and passing on a fixed one before handoff. Review Gate consumes evidence from `observe.sh`. The vault Stop hook calls `fresh.sh` and blocks a done claim when no passing observation matches the current HEAD and tree digest.

## Evaluation

Not evaluated. Admission requires a pilot in one real repo and a replay of past cases with and without the kit, measuring false done claims and defects caught before push.

## Known limits

`fresh.sh` accepts a passing observation of any feature, not the feature the change touched. Mapping changed paths to features is deferred until the pilot shows whether it is needed.
