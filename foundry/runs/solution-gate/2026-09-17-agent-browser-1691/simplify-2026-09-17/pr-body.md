Browser Use's discovery WebSocket cannot be used directly as a CDP endpoint. This switches the provider to Cloud V4: create a browser with `POST /browsers`, attach to its returned `cdpUrl`, and stop the same browser with `PATCH /browsers/{id}`.

Both explicit and automatic launch paths retain the browser ID until stop is acknowledged. Failed or canceled close can retry the same browser, and failed setup restores configuration. Create, attachment, setup and stop have bounded timeouts. Existing profile, proxy-country and recording options are passed to V4.

Pending IDs live in the daemon. If it exits before a successful stop, recovery is through the Browser Use Cloud dashboard.

Validation: 1395 Rust tests passed, plus real Chrome continuity and a built-CLI smoke test. The PR adds 8 regression tests; they rejected 8 deliberately broken implementations. Production Clippy, formatting and the documentation build passed. Independent review found no blockers.

Live Cloud creation, attachment, stop, profiles and recording passed on the preceding commit `427d7a4`. This simplified revision was validated locally; the live credential was no longer available.

Based on #1691 by @MagMueller, with Magnus Müller credited as coauthor.
