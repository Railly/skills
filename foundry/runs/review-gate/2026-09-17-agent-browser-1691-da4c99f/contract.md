# Review contract: agent-browser #1691

Authorization: local read-only review, builds, isolated checks, and reports requested with $review-gate. No source fixes or GitHub writes requested.

Source: PR body and five-file diff at da4c99fa1c781b6bd6a440348c147287f0cdb603. No pre-existing admitted manifest or specialist receipts located. This records the contributor claims for review, not an approved solution.

- A1: Create a Browser Use Cloud V4 browser with POST /api/v4/browsers, attach to returned cdpUrl, and retain its id.
- A2: Profile, managed proxy country/direct mode, and recording configuration reach V4 request.
- A3: Existing close, relaunch, shutdown, and failure cleanup stop the managed browser; documented close must not silently leave billing running.
- A4: CLI help, README, web provider docs, and bundled references describe behavior accurately.

Scope: external-pr, high risk due to remote resource creation, process lifecycle, retained browser sessions, and API credentials. Live paid provider smoke unavailable without an authorized test credential.
