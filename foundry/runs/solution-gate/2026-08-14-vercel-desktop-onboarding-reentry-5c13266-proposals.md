# Blind proposals: Vercel Desktop onboarding re-entry

- Date: 2026-08-14
- Isolated base: `5c13266c5aa6db9a9e896010573309e9e160e0b6`
- Proposal A: Claude Fable 5, high effort
- Proposal B: GPT-5.5 High through Cursor Agent
- Neither proposer saw the other's output.

## Neutral contract

**Property violated:** Every rendered onboarding step must correspond to an initialized model state that can either accept its valid primary action or visibly explain why it cannot. The create-key step currently renders whenever onboarding is open and neither team selection nor agent selection is active (`src/setup.native:96-145`), while its primary action is disabled whenever the create-key phase is hidden, the selected scope slug is empty, the name is invalid, creation is active, or the budget is invalid (`src/app.zig:1340-1342`).

**Observable that must change:** After any supported entry or re-entry into incomplete onboarding, an authenticated user must see the account selection step, agent selection step, or an initialized create-key draft. If the create-key step is visible with a valid default name, its model must contain a selected scope and enabled default monthly $1,000 spend management, and its primary action must be enabled. Measure with model-transition tests that drive initial sign-in, dismiss/reopen at each onboarding step, and restored or stale intermediate states.

**Must not change:**

- First-time CLI sign-in must still force explicit account selection even for one account (`src/app.zig:4518-4527`; `src/tests.zig:2503-2516`).
- Selecting an account must still lead to explicit coding-agent selection before key creation (`src/app.zig:3901-3912`; `src/tests.zig:2516-2534`).
- Finishing or skipping agent selection must still initialize the current team, username-derived name, $1,000 monthly budget, and editable create-key phase (`src/app.zig:2345-2387`).
- Settings key creation after completed onboarding must retain its dialog behavior and team chooser (`src/app.zig:1316-1342`; `src/app.zig:4739-4753`).
- Existing successful key creation, Keychain saving, and agent configuration behavior must remain unchanged.

## Proposal A, verbatim

### Shape

The bug is a state-ownership hole: the create-key onboarding step is the fallback branch of the view (`src/setup.native:119-207` renders it whenever `onboardingWindow` is true and neither `showTeamSelection` nor `onboardingAgentsStep` holds), while the draft it renders is owned by a separate enum, `create_key_phase`, that only `beginCreateKeyDraft` (`src/app.zig:2345-2361`) initializes. Two re-entry paths break the pairing: `dismiss_onboarding` closes the window but preserves `phase == .ready`, and `showSignedOutOnboarding` (`src/app.zig:4662-4677`), the re-entry path used by `show_setup` at `src/app.zig:4919-4922`, sets `onboarding_agents_step = false` and calls `cancelCreateKeyDraft`, which forces `create_key_phase = .hidden`. The result is a rendered create-key step whose model asserts nothing: empty name, empty scope slug, `createKeyDisabled()` permanently true (`src/app.zig:1340-1342`), no error text.

Proposed architecture: make the onboarding step a positively derived value with a single writer, not a fallback.

1. One resume transition owns re-entry. Introduce a `resumeOnboarding(model, fx)` transition that becomes the only path into an open incomplete-onboarding window. It re-derives the step from invariants, in order: no session means sign-in; session but no committed team for this run, or `team_count == 0`, means team selection; an active agent step stays active; otherwise create-key preserves an existing valid draft and repairs any absent or invalid draft by calling `beginCreateKeyDraft`.
2. `dismiss_onboarding` stops being lossy-asymmetric. It keeps the draft; reset responsibility moves into the resume transition, so re-entry no longer blindly calls `cancelCreateKeyDraft` or clears the agent step for a live session.
3. The view asserts instead of defaults. The create-key branch becomes conditional on an initialized draft. If the model regresses, the view does not render a dead form.
4. Settings dialog, initial team selection, agent selection, and successful key creation remain on their current paths.

### Predictions

1. Current code exhibits the dead-end. Add a model-transition test driving team selection, agent completion, dismiss, and reopen. It will observe onboarding open, no team picker, no agent step, `create_key_phase == .hidden`, and `createKeyDisabled() == true`. Falsify with `pnpm test` if any assertion fails on unmodified code.
2. After the change, dismiss/reopen at team, agents, create-key, and stale restored states ends at team selection, agent selection, or a valid editing draft with scope, monthly $1,000 budget, and enabled primary action. Falsify with new model-transition tests under `pnpm test`.
3. Existing onboarding tests at `src/tests.zig:2491-2549`, skip-selection coverage, and signed-out window tests continue passing unmodified. Falsify with `pnpm test`.
4. Settings create-key remains a dialog with team switching. Falsify with its model tests plus `pnpm check`.

### Cost

One resume transition, edits to re-entry callers, one view condition, and four to six model-transition tests. No persistence, CLI, Keychain, or agent-configuration changes.

### What it makes worse

- Draft and agent choices may survive a window close where current behavior resets them.
- A syntactically valid but stale draft needs a scope-equality check before preservation.
- Every future onboarding entry path must route through the reconciler.

### Rejected alternatives

- View-only explanation leaves the user stuck.
- Getter-side lazy initialization breaks pure view derivation.
- Resetting every reopen to team selection discards progress and adds forced steps.
- Persisting the onboarding step adds migration surface without a needed observable.

## Proposal B, verbatim

### Shape

Move onboarding progress ownership into the model, not `setup.native`. Treat window visibility as separate from step progress.

Use a model-owned onboarding step/state machine with derived render booleans:

`account selection -> agent selection -> create-key draft -> complete`

All supported onboarding entry points call one normalization/resume path:

- Authenticated but no explicitly selected team: show account selection.
- Team selected but agents not completed: show agent selection.
- Agents completed and onboarding incomplete: ensure `beginCreateKeyDraft`-equivalent state exists, with selected scope, default name, enabled monthly $1,000 budget, then show create-key.

`setup.native` renders only the step the model says is current. It does not infer create-key from the absence of other booleans.

### Predictions

1. The disabled visible create-key case closes without relaxing `createKeyDisabled`. Falsify with dismiss/reopen model-transition tests under `pnpm test` that assert visible create-key implies editing phase, non-empty scope, valid budget, and enabled action.
2. First-time CLI sign-in still forces explicit account selection even for one team. Falsify with `pnpm test`, especially the existing single-team onboarding test.
3. Selecting an account still cannot jump straight to key creation. Falsify with a model test asserting agent step true, create-key hidden, and `begin_create_key` ignored until agent completion.
4. Settings create-key remains separate. Falsify with the existing alternate-team settings test and dialog markup tests.

### Cost

Medium-small, concentrated in model transition ownership and tests. No Keychain or persisted-vault migration if the step remains runtime-only.

### What it makes worse

- Adds an explicit state concept alongside `phase`, `onboarding_agents_step`, and `create_key_phase`.
- A competing source of truth is possible unless old booleans become derived or are collapsed.
- Over-eager normalization could reset a partially edited valid draft.

### Rejected alternatives

- Hiding the create-key block when the form is absent leaves no owned next step.
- Ignoring `.hidden` in `createKeyDisabled` permits submission of uninitialized scope and budget.
- Initializing from the view layer violates state ownership.
