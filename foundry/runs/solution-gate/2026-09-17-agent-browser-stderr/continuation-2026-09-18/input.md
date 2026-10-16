# Continuation: narrow post-readiness validation

Source: user replied `continue` after the recommendation to reuse Simon Ellefsen's #1527, add a regression and verify resource release across relaunch, keeping startup/fallback separate. Interpretation: continue that local, nonpublishing validation. No authorization to commit, push, merge, modify the contributor branch or discard any user work.

This is a post-reveal evidence update, not a second blind audit. Preserve all earlier contracts, shapes, decisions and receipts. Main still aff6125c023b810ea3f2e5deec5379e9a4270bdc, PR still f89be85ca5f9960c178270ff8145ff3829fac64f, OPEN/REVIEW_REQUIRED. xref depth 2 has only #1527; external vendor/preview links left unread and no preview authorized. Original user checkout is dirty and stays untouched. Prior candidate source copy remains the exact +19/-0 patch for reference.

## Scope clarification

R0a: After primary readiness succeeds, browser stderr volume must not block later commands, including long unterminated output and invalid bytes.
R0b: Pre-readiness output and existing stderr fallback redesign are separate follow-up work. Do not improve, worsen, or claim them fixed here.

R1: Preserve primary readiness and fallback detection/status/diagnostics. No new bounded-diagnostic promise for the untouched fallback.
R2: Preserve existing owned-vs-attached process/group/Job/profile cleanup, retries, idle policy and platform interfaces.
R3: Omitted launch flags preserve PID/target/URL/application state. Explicit close/relaunch resets browser state according to existing semantics.
R4: Post-ready output consumption retains bounded bytes and no default durable logs or stdout pollution.
R5: Measure worker/fd release during repeated launch/kill/drop, including a quiet writer in the owned process group. Do not infer a leak from detached-thread syntax alone, or confuse an unjoined worker with a blocked caller. Any retention by writers outside that ownership boundary must be disclosed, not silently scoped out or accepted by implication.
R6: Windows runtime and Linux runtime cannot be claimed from macOS. No Unix-only production implementation hidden behind a common API.
R7: A maintainable regression must exercise the production launch path and fail if the consumption mechanism is removed. No new runtime abstraction merely to make tests possible.

## Evidence handles

Parent ../decision.md and ../verification.json; candidate at /Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/candidate; pristine source archive at /Users/raillyhugo/Programming/vercel/agent-browser-1371-source.tar. Prior CLI proof has three corrected successful candidate sessions and failing base, plus unchanged preburst/quiet-writer startup cases. Existing source shows try_launch_chrome called by launch_chrome retry loop; ChromeProcess::kill terminates child and group, Drop calls kill. Candidate io::copy is only after primary readiness and follows EOF.

## Budget and stop boundary

Add regression/probe code only in a new isolated source copy, run focused differential and lifecycle tests, obtain two independent post-reveal fit-check updates, then decide. No new production design before Pass to detail. If the existing shape fails the narrowed contract, report the concrete failing case and preserve the probe rather than silently widening to a general collector.
