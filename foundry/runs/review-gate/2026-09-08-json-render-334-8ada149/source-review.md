Focused read-only source pass for bfab0c4..8ada149.

No new blocking defect found in the two corrective commits.

StartErrorBoundary invokes router.invalidate before resetting the React boundary. Both promise outcomes call reset, preserving recovery for loader failures and render exceptions. Its documented use is inside TanStack Router, so useRouter is available. Actual compiled browser recovery confirms that a failed loader is rerun.

compileRoute normalizes pattern text for matching while retaining the original pattern key for spec.routes lookup. Both the regex root special case and segment compilation use the normalized key. Incoming paths share the same normalization. This closes the trailing-slash mismatch without losing original route identity.

normalizePathname shields %25 before decodeURI. The reserved escaped slash remains encoded through decodeURI, and per-parameter decodeURIComponent owns the final escape layer. Current tests and browser probes cover 100%25 and %2525. Malformed decoding still falls back to the undecoded pathname, after which malformed dynamic params fail matching. No new code-execution, HTML, filesystem, or authorization sink is introduced.

The new tests exercise a real TanStack Router failure/retry and include static-path round trips. Dedicated README, API reference and skill prose are updated. The metadata image-array issue is unchanged and remains a follow-up.

Independence limitation: attempts to resume the prior reviewer and launch a fresh native reviewer returned only generic acknowledgements, not a current review. No independent model review is credited. This is a sequential source pass by the orchestrator, with frozen diff.log as input and independently defined TanStack/DOM/SSR oracles as behavioral evidence.
