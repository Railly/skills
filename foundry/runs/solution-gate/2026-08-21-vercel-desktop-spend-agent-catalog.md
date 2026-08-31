# Vercel Desktop: personal spend and CLI-owned coding agents

Date: 2026-08-21
Mode: greenfield for spend, candidate audit for the Desktop agent-catalog WIP
Base: `vercel-labs/vercel-desktop` `1c3d4c76dd47043945ae3362cc7f7dc05533d84e`
Proposers: Claude Fable 5 Thinking XHigh and Cursor Grok 4.6 XHigh
Synthesizer: Codex GPT-5

## Verdict

- Spend P0: **Reshape, upstream dependency.** Do not ship `scope=user` as the `fx` OAuth fix. The endpoint currently attributes people through API-key ownership; keyless app-token/PAT/OIDC traffic remains `(unattributed)`. Add a server-derived actor user id to Gateway facts and the usage cube, then consume caller-scoped `usage-report` in Desktop.
- Coding agents: **Reshape. Candidate verdict: absorb and recreate.** Keep the WIP's stable-id persistence, validation, fallback, successful-empty distinction, and unknown-agent setup delegation. Recreate on current main after the CLI exposes a read-only catalog plus a non-mutating warning preflight. Do not rebase and ship the current WIP.

Neither workstream passes to implementation yet. Both require an upstream CLI/API contract first.

## Frozen contract

### A. Personal spend

Property: the signed-in user sees their own spend in the selected team, including attributable `fx` OAuth traffic, without receiving another member's spend.

Requirements:

| ID | Requirement | Status |
| --- | --- | --- |
| A-R0 | Headline reports the signed-in user's attributable spend in the selected team, including `fx` OAuth | Core goal |
| A-R1 | Team-wide unattributed spend is never presented as one user's spend | Must-have |
| A-R2 | Team changes invalidate and refetch the personal number, including when no Desktop-managed key exists | Must-have |
| A-R3 | Key creation, key budget read/write, sign-in/out, and team selection keep working | Must-have |
| A-R4 | Personal aggregate spend and managed-key budget/spend remain separate UI semantics | Must-have |
| A-R5 | Date/timezone semantics stay explicit; no local-day precision is claimed from UTC daily buckets | Must-have |
| A-R6 | Desktop may use its existing OAuth access token to call `api.vercel.com` | External constraint |

### B. CLI-owned coding agents

Property: Desktop renders the installed CLI's supported agent surface and delegates compatibility behavior to the CLI instead of copying each integration.

Requirements:

| ID | Requirement | Status |
| --- | --- | --- |
| B-R0 | New CLI agents appear without a Desktop release or Desktop config recipe | Core goal |
| B-R1 | CLI owns config writes, detection, consent, warnings, secret storage, and compatibility | Must-have |
| B-R2 | Stable id and display name come from a machine-readable CLI contract | Must-have |
| B-R3 | Hold or ineligible agents are not normal setup options | Must-have |
| B-R4 | Old/missing/failing CLI does not erase prior selection and fails clearly | Must-have |
| B-R5 | Existing Claude Code, Codex, OpenCode, and Pi setup remains usable | Must-have |
| B-R6 | Discovery and warning preflight are non-interactive and write-free | Must-have |
| B-R7 | Material warnings appear and receive consent before setup writes | Must-have |
| B-R8 | Capacity covers the planned 25-agent surface with headroom; overflow is explicit, never silent fallback | Must-have |

## Blind shaping results

Both reviewers independently selected:

1. A caller-scoped `GET /ai-gateway/usage-report?scope=user` personal headline, with managed-key spend/budget left separate.
2. A dedicated read-only CLI catalog, never parsed from help or inferred from `setup --dry-run`.

They disagreed only on warning delivery. The returned evidence resolved it: catalog data identifies eligibility; a separate CLI-owned preflight computes machine-specific warnings before setup.

## Probe log

### P1: current caller scope works for key-attributed usage

```sh
vercel api '/ai-gateway/usage-report?scope=user&start=2026-08-20&end=2026-08-20' \
  --scope vercel-labs --raw
```

Exit 0. Returned `$38.015967625`, 535 requests, and one user bucket for the caller.

### P2: Rauch's user slice is empty

```sh
vercel api '/ai-gateway/usage-report?scope=user&userId=R6eUCJQ2HKXywuBOPDc0FOWB&start=2026-08-19&end=2026-08-21' \
  --scope vercel-labs --raw
```

Exit 0. Returned spend 0, requests 0, and no users.

Interpretation correction: the endpoint's `userId` query selects a Vercel user whose owned keys are folded into the report. It is distinct from raw fact `userId`, which is caller-supplied end-user data. Rauch's result is empty because his `fx` OAuth traffic has no key owner bucket.

### P3: usage-report attribution mechanism

- API PR #84931: `scope=user` folds `keyId -> createdBy`; `keyId=''` app-token/PAT/OIDC traffic is `(unattributed)`.
- API PR #87091: the daily cube groups by owner, date, project, key, model, coding agent, provider, BYOK, auth method, and spend attribution. It has no authenticated human actor dimension.
- API PR #82820: keyless rows have team owner, auth method, and app name. `appName=fx` identifies the app, not the person.

### P4: raw fact and `fx`

- Raw v3 has `userId`, explicitly documented as caller-supplied end-user identity, not the authenticated Vercel principal.
- Local `fx` sends its OAuth bearer, selected-team header, and `X-Title: fx`. It does not send a user identity.
- Even if `fx` supplied raw `userId`, it would be spoofable and unsuitable as the personal-spend trust boundary.

### P5: CLI surface and CSV

- Current CLI source registers 9 agents and already models stable `id`, `displayName`, `experimental`, `detect()`, and optional `warnings()`.
- `/Users/raillyhugo/Downloads/coding-agents.csv` has 16 additional queued agents.
- Combined planned surface is 25 before future additions.
- `deepagents` and `grok` are Hold; OpenHands, Kimi, and ForgeCode persist keys in config/plaintext; Zed still needs GUI verification.
- Machine setup output already returns structured warnings.

### P6: old CLI capability

```sh
vercel ai-gateway coding-agents list --format json
```

CLI 58.4.4 exits 2: `setup` is the only valid subcommand. Old-CLI fallback is required.

### P7: candidate reveal

Candidate: `/tmp/vercel-desktop-agent-catalog.5K0FYN`, branch `feat/dynamic-coding-agent-catalog`.

- Based on `d16a354`; main is `1c3d4c7`, two commits ahead with Native SDK 0.9.5 changes overlapping `src/app.zig`, `src/setup.native`, and tests.
- 566 additions, 114 deletions.
- Catalog schema is only `{id,name}`.
- Capacity is 12, so a valid 25-agent catalog is rejected and falls back to four.
- New agents default selected and flow directly to real setup. Machine setup can return warnings after proceeding, so Desktop does not obtain consent before writes.
- Useful pieces: stable-id persistence, id validation, old/failure fallback, successful-empty distinction, and setup delegation for unknown ids.

## Selected shapes

### A1′: authenticated-actor personal spend

Upstream:

1. Gateway authentication derives `actorUserId` from the authenticated Vercel principal where a real human exists.
2. The emitted request fact stores that server-derived value separately from caller-supplied `userId`.
3. The daily usage cube groups by `actorUserId` and preserves historical unattributed rows as unattributed.
4. `usage-report?scope=user` combines keys created by the caller with keyless rows whose `actorUserId` is the caller.
5. PAT/OIDC/app credentials without a trustworthy human principal remain unattributed.

Desktop after upstream lands:

1. Caller-scoped usage-report becomes the personal headline for the selected team.
2. Team switching refetches even without a managed key.
3. Managed-key report and quota remain the key-specific budget card and percent limit.
4. API failure renders unavailable, never a confident `$0.00`.
5. Keep UTC-day wording until a timezone-aware contract exists.

### B1′: catalog plus warning preflight

CLI catalog, read-only and write-free:

```json
{
  "version": 1,
  "agents": [
    {
      "id": "openhands",
      "name": "OpenHands",
      "status": "experimental",
      "setupEligible": true,
      "detected": true
    }
  ]
}
```

Required semantics:

- Exact ids accepted by the same CLI build's `setup --agent`.
- Status distinguishes stable, experimental, hold, or unavailable.
- Hold/unavailable rows cannot be normal setup targets.
- Unknown JSON fields are forward-compatible.
- Successful empty differs from unsupported command or failed discovery.

Before writes, Desktop invokes a non-mutating CLI preflight for the selected ids. `setup --dry-run` is the likely vehicle if its machine JSON is stabilized. Desktop renders CLI-authored warnings, asks consent, and invokes real setup only after acceptance.

Desktop is rebuilt on current main with id-keyed persistence, last-good catalog behavior, explicit overflow, and no copied CSV/list. The candidate's reusable mechanisms are reimplemented rather than rebased.

## Updated fit checks

### Spend

| Requirement | Current `scope=user` in Desktop | A1′ |
| --- | --- | --- |
| A-R0 | ❌ | ✅ after upstream actor field ships |
| A-R1 | ✅ only by excluding all unattributed traffic | ✅ |
| A-R2 | ✅ with Desktop refresh change | ✅ |
| A-R3 | ✅ | ✅ |
| A-R4 | ✅ with split surfaces | ✅ |
| A-R5 | ✅ with explicit UTC wording | ✅ |
| A-R6 | ✅ | ✅ |

### Coding agents

| Requirement | Candidate WIP | B1′ |
| --- | --- | --- |
| B-R0 | ❌ 12-agent cap | ✅ |
| B-R1 | ❌ retains Desktop-owned behavior | ✅ |
| B-R2 | ✅ | ✅ |
| B-R3 | ❌ no eligibility | ✅ |
| B-R4 | ✅ | ✅ |
| B-R5 | ✅ | ✅ |
| B-R6 | ✅ for discovery only | ✅ |
| B-R7 | ❌ warnings arrive too late | ✅ |
| B-R8 | ❌ silent fallback at 13+ | ✅ |

## Forward effects

### A1′

`fx` OAuth authenticates [observed] -> Gateway derives human actor from auth, not request payload [proposed] -> fact and cube preserve actor [proposed] -> caller scope includes keyless actor rows [inferred] -> Desktop headline includes Rauch without teammate spend [predicted].

Harmful branch: credentials without human principal [observed possibility] -> actor remains empty [proposed] -> spend stays unattributed [inferred] -> headline is lower than total team spend [predicted, accepted and labeled].

### B1′

CLI registry owns id/status/detection [observed] -> catalog publishes that contract [proposed] -> Desktop renders only eligible ids [inferred] -> new integrations appear without Desktop releases [predicted].

Selected ids enter dry-run preflight [proposed] -> CLI computes machine-specific warnings [observed capability] -> Desktop collects consent before real setup [inferred] -> plaintext-key integrations do not write silently [predicted].

Harmful branch: old CLI lacks catalog [observed] -> Desktop preserves last-good/fallback surface [proposed] -> new agents remain unavailable until CLI upgrade [predicted, accepted].

## Failure-shape scoring

| Failure shape | A1′ | B1′ |
| --- | --- | --- |
| S1 over-reach | Designed out: only authenticated human actors enter personal spend | Designed out: CLI owns agent truth |
| S2 under-reach | OAuth, app-token, PAT, OIDC discriminator cases required | Stable, experimental, hold, plaintext, old CLI, and overflow cases required |
| S3 direction inheritance | Clear | Clear |
| S4 proxy property | Avoids `appName=fx` as human identity | Avoids detection/help text as setup eligibility |
| S5 unregistered peer | Cube and report must both register actor dimension | Persistence and capacity explicitly cover dynamic ids |
| S6 peer-version blindness | Desktop waits for endpoint contract | Old CLI and downgrade behavior designed in |
| S7 wrong layer | Actor emitted at auth layer, consumed through report | Warning reaches Desktop before write process |
| S8 guard-derived cells | Test two users plus unattributed team traffic | Matrix derived from full CSV states, not candidate fields |
| S9 wrong test | `fx`-only real traffic must fail before upstream and pass after | Delete eligibility/preflight/capacity mechanisms independently |
| S10 prose claim | Live report and schema evidence required | Never parse help or CSV as runtime truth |
| S11 asymmetric validation | Server-derived identity is stronger than caller payload | Validate ids/status before UI and argv |
| S12 primitive mismatch | Raw caller `userId` explicitly rejected as principal | Catalog answers capability; dry-run answers per-machine warning plan |
| S13 invocation-state collapse | Not stateful across commands | Failed discovery preserves selection; explicit clear remains separate |

## Remaining probes before implementation

1. Samarth/API: confirm Gateway auth exposes a trustworthy human principal for `fx` OAuth and agree on `actorUserId` naming/semantics.
2. API: add fact, cube, fold, ACL, and two-user tests. Verify live `fx` traffic appears only for its actor.
3. CLI: agree on catalog JSON, status semantics, capacity expectations, and minimum version.
4. CLI: stabilize machine `setup --dry-run` warnings as a write-free preflight.
5. Desktop: recreate after contracts land, then run old CLI, 25+ catalog, hold, plaintext consent, failed discovery, downgrade, and Finder DMG tests.

## Relevant URLs

- Desktop: https://github.com/vercel-labs/vercel-desktop
- API endpoint: https://github.com/vercel/api/pull/84931
- Per-user daily grain: https://github.com/vercel/api/pull/86212
- Keyless team rows: https://github.com/vercel/api/pull/82820
- Cube v2: https://github.com/vercel/api/pull/87091
- Filters draft: https://github.com/vercel/api/pull/87131
- Front consumer draft: https://github.com/vercel/front/pull/81755
- CLI docs: https://vercel.com/docs/cli/ai-gateway#setup
