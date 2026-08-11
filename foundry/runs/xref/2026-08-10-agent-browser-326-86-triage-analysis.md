# Triage: agent-browser #326 and #86

Checked: 2026-08-10

## Verdict

Close both issues as resolved or split into dedicated follow-ups. Neither should remain the session-isolation tracking issue.

| Issue | Heat | Verdict | Why |
|---|---:|---|---|
| #86 | 48.9 | close as resolved/answered | Multi-session runtime isolation already uses `--session`. The latest reported failure uses `--session-name`, which names persisted auth state rather than the daemon session. |
| #326 | 48.4 | close as resolved/split | Its reports combine same-default-session sharing, shared-CDP tab identity, shared-profile Chrome ownership, and cookie isolation. The first is answered by unique named sessions, the second shipped in #1589, and the remaining mechanisms have dedicated issues. |

## Main-binary verification

Verified on 2026-08-10 against a release build of `origin/main`:

- Commit: `861e76ddf48ea48f4ce5fe0e79dc725b084d0e8b`
- CLI version: `0.33.2`
- System Chrome: `151.0.7922.109`
- Globally installed npm CLI was still `0.31.2`, so every command below used the freshly built binary directly.

The literal reproduction from @w32zhong still fails:

```bash
agent-browser --session-name twitter open https://twitter.com
agent-browser --session-name discord open https://discord.com
agent-browser --session-name twitter tab
agent-browser --session-name discord tab
```

Observed:

- Both commands use the daemon session `default`.
- `session list` returns only `default`.
- Changing `--session-name` changes the restore key and causes browser relaunches.
- The later `tab` calls each returned one `about:blank` target in this run.

This is expected from the current implementation: `restore_key_from_flags` maps `--session-name` to the restore persistence key, and the published help calls it a legacy restore alias.

The correct independent-browser form passes:

```bash
agent-browser --session twitter open https://twitter.com
agent-browser --session discord open https://discord.com
```

`session list` returned `twitter` and `discord`; each retained its own target id and URL. This launches two Chrome processes.

The requested one-Chromium form also passes on main:

```bash
agent-browser --session twitter --cdp 60854 --pin-tab open https://twitter.com
agent-browser --session discord --cdp 60854 --pin-tab open https://discord.com
```

Both sessions attached to the same external Chrome process. Twitter retained target `A64C20B1693C128EDB8BF148436294D4` at `https://x.com/`; Discord retained target `1C637C913B84FB50AE3464209E7CC7CA` at `https://discord.com/`.

## What #1589 resolved

- Named-session guidance now appears in the skill so parallel agents do not silently converge on `default`.
- Shared-browser sessions can persist their selected CDP target.
- `--pin-tab` prevents a destroyed binding from adopting a neighboring tab.
- CDP target ids are stable tab references.

## What remains, with canonical owners

| Mechanism | Canonical issue | State |
|---|---|---|
| Multiple daemons share one Chrome because they use the same `--profile` directory | #896, PR #899 | open |
| Separate sessions in one Chrome need isolated cookies and storage | #1068, PRs #1117/#1340 | open |
| Headed/profile commands can fall back to `about:blank` | #1211, PRs #1258/#1525 | open |
| An external Chrome restart leaves the daemon attached to a stale CDP websocket | #1272, PR #1274 | open |
| Sessions intentionally sharing cookies need an explicit contract | #1352 | open |
| `window new` needs explicit current-context semantics | #1624 | open |

## Proposed closing note for #86

Thanks @w32zhong. I re-ran your exact commands against a release build of current `main` (`861e76d`, CLI `0.33.2`).

The reproduction still collides because `--session-name` is not the runtime session selector. It is a legacy alias for the restore persistence key, so both commands still use the `default` daemon session.

For separate browser processes, use `--session`:

```bash
agent-browser --session twitter open https://twitter.com
agent-browser --session discord open https://discord.com
```

I verified that both sessions retain separate URLs and target ids.

For your specific requirement of one Chromium process, start Chrome with remote debugging and attach each named session with `--pin-tab`:

```bash
agent-browser --session twitter --cdp 9222 --pin-tab open https://twitter.com
agent-browser --session discord --cdp 9222 --pin-tab open https://discord.com
```

I verified this against one Chrome 151 process: both sessions kept distinct target ids and URLs. This behavior is on `main` through #1589 but is not in the currently installed `0.31.2` npm release used for the baseline.

This isolates tabs, commands, and target selection. Cookies and storage still belong to the shared Chrome BrowserContext; separate identities inside one Chrome remain tracked by #1068.

Closing this broad request as resolved. Remaining distinct work is tracked by #896 for shared profile directories and #1068 for cookie-isolated BrowserContexts.

## Proposed closing note for #326

The reports collected here now map to separate mechanisms:

- Multiple agents accidentally using the same default daemon: give each agent a unique `--session`. PR #1589 also updated the agent skill to require this up front.
- Multiple named sessions sharing one Chrome and navigating each other's active tab: fixed by #1589 through persistent target binding and opt-in `--pin-tab`.
- Multiple sessions sharing one `--profile` directory and therefore one Chrome process: tracked by #896.
- Multiple sessions in one Chrome needing separate cookies and storage: tracked by #1068.
- Headed/profile sessions falling back to `about:blank`: tracked by #1211.
- Reconnecting after an external Chrome restart: tracked by #1272.

Closing this umbrella issue as resolved and split. The dedicated issues above should remain the source of truth for their mechanisms.

## Cleanup

- Close #86 as resolved/answered.
- Close #326 as resolved/split.
- Do not close #896, #1068, #1211, or #1272.
- Do not treat #1117 and #1340 as interchangeable with #1589; they add BrowserContext storage isolation, which #1589 intentionally does not provide.

## Artifacts

- `2026-08-10-agent-browser-326-86-triage.json`
- `2026-08-10-agent-browser-326-86-triage.html`
