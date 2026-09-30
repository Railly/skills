# 2027 audit: wait --download at head e671415d

- Verdict: pass (post-hoc gate; PR never had a pre-review run).
- Deterministic: fmt ok; 1400 tests pass; 3 clippy errors from rust 1.98 on lines outside the diff (browser.rs `for i in 0u64..` not in diff).
- Surfaces: README and core commands.md do not mention `wait --download`; exempt.
- Dogfood: click + `wait --download <path>` moves the file (#561, #1300).
- Pre-existing, routed to #1683: download in a `window new` context. Merge base times out; head reports `Download was canceled`. Cause: `Browser.setDownloadBehavior` sent without `browserContextId` (browser.rs enable_download_events), so only the default context allows downloads.
