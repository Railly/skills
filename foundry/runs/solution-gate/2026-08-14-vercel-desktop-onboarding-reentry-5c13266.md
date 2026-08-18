# Solution gate: Vercel Desktop onboarding re-entry

- Date: 2026-08-14
- Target: `vercel-labs/vercel-desktop`
- Neutral base: `5c13266c5aa6db9a9e896010573309e9e160e0b6`, tag `v0.0.9`
- Proposer A: Claude Fable 5, high effort
- Proposer B: GPT-5.5 High through Cursor Agent
- Synthesizer: Codex root runtime, which proposed neither candidate
- Proposal record: `2026-08-14-vercel-desktop-onboarding-reentry-5c13266-proposals.md`
- Visual: `2026-08-14-vercel-desktop-onboarding-reentry-5c13266.html`

## 0. Trigger

Greenfield mode. The defect admits multiple solution shapes that differ in state ownership: repair only the re-entry transition, formalize a new onboarding step state machine, add a render guard, or reset onboarding to account selection. This is not mechanical.

## 1. Neutral contract

**Violated property:** Every rendered onboarding step must correspond to an initialized model state that can either accept its valid primary action or visibly explain why it cannot.

**Observable that must change:** After every supported entry or re-entry into incomplete onboarding, an authenticated user sees account selection, agent selection, or an initialized create-key draft. Visible create-key with a valid default name implies selected scope, enabled monthly $1,000 spend management, and enabled primary action.

**Must not change:**

- First-time CLI sign-in explicitly asks for account scope, including one-account users.
- Account selection leads to coding-agent selection before create-key.
- Finishing or skipping agent selection initializes the current team, username-derived name, $1,000 monthly budget, and editing phase.
- Completed-onboarding Settings creation remains a dialog with a team chooser.
- Key creation, Keychain saving, inventory reconciliation, and agent configuration remain unchanged.

## 2. Proposals

Both proposals are preserved verbatim in the proposal record.

- Proposal A: one re-entry reconciler owns incomplete-onboarding resume; preserve valid progress, repair invalid draft state, and guard create-key rendering.
- Proposal B: a model-owned onboarding step state machine plus one normalization path; the view renders only the declared step.

## 3. Forward chains

### Proposal A: reconciler plus render invariant

Main chain:

1. Re-entry calls one reconciler instead of unconditional draft and agent reset. **Proposed.**
2. The reconciler inspects live session, selected team, agent-step state, and draft validity. **Inferred from existing model fields.**
3. Team picker remains when already active; agent selection and valid drafts survive reopen; absent or invalid drafts are rebuilt through `beginCreateKeyDraft`. **Inferred.**
4. `beginCreateKeyDraft` supplies current team scope, username name, monthly $1,000 budget, and editing phase. **Observed from `src/app.zig:2345-2360`.**
5. Visible create-key has an initialized form and enabled action when its inputs are valid. **Inferred, implementation test target.**

Harmful branches:

- Preserving a draft without comparing its scope to the current selected team keeps stale team data. **Inferred.** Design out with a current-scope equality predicate.
- Preserving agent state changes today's reopen-reset behavior. **Observed current reset, inferred UX change.** Accepted because window close should not destroy progress.
- A new entry path that bypasses the reconciler can recreate the class. **Inferred.** Design down with one helper and transition coverage for every caller.

Helpful branch:

- The view guard turns future invalid-state regressions into an earlier recoverable surface instead of a dead form. **Inferred.**

### Proposal B: explicit onboarding step machine

Main chain:

1. Add an explicit onboarding step owner separate from window visibility. **Proposed.**
2. Render booleans derive from that owner instead of independent fallback conditions. **Inferred.**
3. Re-entry normalization advances or repairs state according to the declared step. **Inferred.**
4. The view and action state cannot disagree if all old booleans are removed or derived. **Inferred.**

Harmful branches:

- Keeping `phase`, `onboarding_agents_step`, `create_key_phase`, and a new step field creates four partially overlapping sources of truth. **Inferred.**
- Persisting or migrating the new step would expand the contract beyond this runtime-only defect. **Inferred.**
- Replacing the current state representation touches initial sign-in, Settings, and successful creation paths that already work. **Inferred S1 risk.**

Helpful branch:

- A single named step makes future onboarding additions easier to reason about. **Guessed.** This is not required to close the current defect.

## 4. Probe log

All probes ran in an isolated clone at `5c13266`; the target checkout remained clean.

| # | Weak link or prediction | Command or observation | Result |
|---|---|---|---|
| 1 | Reopening can render create-key with hidden draft | Added a model test driving `.dismiss_onboarding` then `.show_setup` from an authenticated incomplete agent step; `pnpm test` | **Observed.** 148/148 passed, including assertions that onboarding is open, no picker or agent step is active, phase is hidden, name and team are empty, budget is off, and action disabled |
| 2 | The failure affects every onboarding step | Added variants for picker, agents, and initialized create-key; `pnpm test` | **Partially refuted.** 149/149 passed. Team picker survives reopen because `phase == .selecting_team` is preserved. Agent selection and create-key draft are explicitly destroyed |
| 3 | Existing suite detects the class | `pnpm test` in the target checkout | **Refuted.** Original 147/147 pass without a reopen-at-intermediate-step assertion |
| 4 | Spend Management is independently default-off | Read `beginCreateKeyDraft` and the reset path | **Refuted as a separate cause.** `beginCreateKeyDraft` enables monthly $1,000; it appears off only because re-entry cancels or never initializes the draft |
| 5 | A view-only enablement fix could work | Read `createKeyDisabled` and create command construction | **Refuted.** Hidden phase, empty scope slug, and absent budget are real missing model state; relaxing the button would allow an invalid submission |
| 6 | A new persistent onboarding field is required | Read boot and vault persistence | **Refuted.** Boot already restarts incomplete onboarding and no observable requires exact cross-process step restoration |
| 7 | Baseline remains healthy | `pnpm test` in target checkout | **Survived.** 147/147 pass at `5c13266` |

## 5. Failure-shape scoring

S1 and S2 receive the highest weight because the next commit will be a fix.

### Proposal A

| Shape | Verdict |
|---|---|
| S1 over-reach | Low if reconciliation is limited to incomplete-onboarding entry and Settings stays untouched |
| S2 under-reach | Risk unless tests cover picker, agents, draft, stale hidden draft, missing team list, and changed scope |
| S3 direction inheritance | Clear. It treats both destroyed agent state and destroyed/absent draft state |
| S4 proxy property | Clear if readiness checks actual draft invariants, not only `create_key_phase != hidden` |
| S5 unregistered peer | Clear. No new persistent state |
| S6 peer-version blindness | Clear. No cross-process protocol |
| S7 wrong layer | Clear. State transition owns repair; the render guard is only a tripwire |
| S8 guard-derived cells | Risk. Derive test cells from supported entry/re-entry states, not from branches added by the fix |
| S9 test pins wrong thing | Risk unless each reset mechanism has a distinct failing test and valid edited draft preservation is asserted |
| S10 claim from prose | Clear. Load-bearing reset and initialization behavior was read and executed |
| S11 asymmetric validation | Clear. Settings and onboarding continue using the same draft validity predicate |
| S12 primitive mismatch | Clear. Existing model update primitives support the required transition |

### Proposal B

| Shape | Verdict |
|---|---|
| S1 over-reach | **Risk.** Replacing state ownership can disturb initial sign-in, Settings, and creation completion |
| S2 under-reach | Lower conceptually, but only if old booleans are actually removed or derived |
| S3 direction inheritance | Clear |
| S4 proxy property | Clear if the step is defined by invariants rather than another loose enum |
| S5 unregistered peer | Clear only if runtime-only; a persisted step would hit S5 |
| S6 peer-version blindness | Clear |
| S7 wrong layer | Clear |
| S8 guard-derived cells | Same transition-domain requirement |
| S9 test pins wrong thing | Risk unless deleting each normalization arm fails a distinct test |
| S10 claim from prose | Clear |
| S11 asymmetric validation | Risk if onboarding step validity diverges from Settings draft validity |
| S12 primitive mismatch | Clear |

## 6. Synthesis

**Kind: graft, dominated by Proposal A.**

Chosen shape:

1. Introduce one runtime-only incomplete-onboarding entry/re-entry reconciler.
2. Preserve the existing team picker when `phase == .selecting_team`.
3. Preserve an active agent-selection step across window close and reopen.
4. Preserve an existing editable or failed create-key draft only when its selected team id and slug still match the current selected account and its name is not truncated. Do not require the budget to be valid to preserve a user-editable draft, because an invalid edited amount must remain visible and correctable.
5. If the current account is selected and no valid current-scope draft exists after agent completion, initialize it with the existing `beginCreateKeyDraft`.
6. If no current account is selected, reuse the cached picker when available or refresh teams when it is not.
7. Stop using the signed-out helper as the generic incomplete-onboarding opener. Separate opening/reconciling incomplete authenticated onboarding from the actual signed-out reset path.
8. Add a render invariant from Proposal A and the state-ownership principle from Proposal B: onboarding create-key renders only when `createKeyFormVisible()` is true. The view never initializes state.
9. Do not add a new persisted onboarding-step enum. Existing fields are sufficient once entry transitions are reconciled.
10. Do not relax `createKeyDisabled`.

What Proposal B contributed:

- Window visibility and onboarding progress must remain separate concepts.
- The view must render declared model state, not infer create-key from absence.

Rejected material:

- A broad new state-machine migration. It adds overlapping state and S1 surface without being required by the probes.
- Always restarting at team selection. It fixes the defect but unnecessarily destroys progress.
- Preserving a draft solely because its phase is editing. Scope equality is required.
- View-only hiding or button enablement. Neither repairs the missing model state.

## 7. Carried assumptions and implementation verification targets

1. Add force-red tests for:
   - reopen while team picker is active;
   - reopen while agent selection is active;
   - reopen with a valid current-scope edited draft;
   - reopen with hidden draft after agent completion;
   - reopen with a draft for a different team;
   - reopen authenticated with no cached teams;
   - true signed-out opening still resets stale draft and agent state.
2. Assert the create-key render predicate cannot be true while `create_key_phase == .hidden`.
3. Assert a preserved invalid budget remains visible and disabled rather than being silently reset.
4. Assert rebuilt drafts contain current team id and slug, username-derived name, monthly $1,000 budget, and enabled action.
5. Existing initial sign-in, one-team explicit selection, agent skip, Settings alternate-team creation, successful key creation, Keychain, and configuration tests remain unchanged.
6. Mutation targets:
   - remove agent-step preservation;
   - remove draft initialization;
   - remove scope equality;
   - remove create-key render guard;
   - route signed-out opening through the authenticated reconciler.
   Each must fail a distinct test.
7. Run `pnpm check` and `pnpm test`.

## 8. Review handoff

Review Gate must drive every must-not-change item from section 1. Highest-risk checks:

- signed-out versus authenticated-incomplete entry separation;
- current-scope draft preservation versus stale-scope repair;
- team picker and agent-step progress preservation;
- Settings dialog isolation;
- no button-validation weakening;
- no persistence-format change.

No Vercel Desktop source files were changed by this gate.
