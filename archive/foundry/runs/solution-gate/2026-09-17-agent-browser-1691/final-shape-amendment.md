# Final shape amendment

This supersedes the 22-second setup value in timing-correction.md and timing-feedback.md. The final setup deadline is 18 seconds, covering auto and explicit setup, with 10 seconds for create/read, 8 seconds for attachment, and at most 4 seconds for cleanup after the setup deadline. A separate restore-transition stop is bounded at 4 seconds. The budget is 4 + 18 + 4 = 26 seconds, leaving room for the existing 3-second liveness check; optional state saving and later page operations retain their existing timing. These are client deadlines, not measured Cloud latency guarantees.

Any failed explicit Browser Use launch restores the previous domain filter, proxy credentials and plugin initialization scripts, including cancellation during receipt preflight. Ownership is installed in daemon state before awaiting receipt writing and borrowed until stop acknowledgment. Cancellation never takes the ID away from its cleanup owner.

Valid CDP endpoint schemes match the existing consumer: ws, wss, http and https. Receipt deletion after an acknowledged stop is best effort, so documents explicitly allow stale receipts. A 404 does not prove stop; after independently confirming the remote browser is stopped, users can select a fresh --session. No new persisted retry subsystem, queue, worker or daemon restart guarantee is added.

Evidence: final-focused.log (21 passed), final-scoped-diff.patch, and forthcoming mutation-results.json and scoped-independent-review.md. The earlier independent review's filesystem-read claims were not supported by its tools-disabled execution, and handler.rs does not exist. Its domain-filter claim was reproduced and fixed; the 404 dashboard behavior was not verified.

The final independent-review follow-up extends configuration restoration to automatic Browser Use launch (proxy credentials and plugin scripts). Local close bookkeeping and stream detachment are completed before awaiting browser/provider cleanup so cancellation cannot preserve stale launch state. The existing canceled-stop test now reaches close_current_browser, and a dedicated automatic-launch configuration regression test covers the added rollback.
