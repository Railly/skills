# API oracle and review boundaries

Retrieved September 17, 2026 from official Browser Use documentation:
- https://docs.browser-use.com/llms.txt
- https://docs.browser-use.com/llms-full.txt
- https://docs.browser-use.com/cloud/openapi/v4.json

Saved full source documents in this directory. The OpenAPI POST /browsers returns 201 BrowserSessionItemView; its id is required and cdpUrl is nullable and optional. PATCH /browsers/{session_id} with action stop is the stop operation. Request fields profileId, proxyCountryCode (null disables; omitted defaults us) and enableRecording are supported. The official lifecycle guidance says CDP disconnect does not immediately stop an owned browser or its billing. These facts independently challenge the assumption that the current cleanup helper may ignore failed stops.

Live successful creation, remote profile persistence, recording artifacts, and billing changes were not measured. BROWSER_USE_API_KEY was absent from the review environment. Dummy credentials were used only with a localhost proxy; no paid session was created.

Confirmed source-flow concern with incomplete producer evidence: after a successful create returns an id with absent/null cdpUrl, parse_browser_use_connection returns only a String error. The caller cannot stop that id. The response schema allows this shape, but no live active-browser response with null cdpUrl was observed; preserve as a verification gap rather than a confirmed production incident.

The primary exact worktree remained frozen. A second detached worktree appends one test to actions.rs only, seeds the production-owned provider session shape, and routes the production execute_command(close) call through a localhost CONNECT proxy returning 502. It shows command success and loss of ownership despite failed stop transport. It does not impersonate the real API or demonstrate remote billing on a real account.

The real binary dogfood drives a separate named daemon with its binary SHA256 and process path recorded. A loopback proxy accepts CONNECT and does not respond. Open remains blocked beyond 36s, close beyond 5s, and the 1s idle budget does not kill the daemon. Releasing the proxy allows close to complete. This is a real user-boundary observation of the missing timeout, not a proof of all network failure partitions.
