# 1683: closed to restart in slices

- PR vercel-labs/agent-browser#1683 (BrowserContext isolation) closed 2026-09-30 by Hunter's decision, to redo from scratch in parts.
- Open maintainer findings at close: downloads ignore the isolated browserContextId (Browser.setDownloadBehavior, also seen in #2027 audit), and Fetch/auth handlers served foreign targets (reproduced credential leak across contexts).
- Unverified WIP preserved locally: branch `archive/1683-wip-20260930` (635ac4cf) in ~/Programming/vercel/agent-browser-1683, a TargetOwnershipRegistry for context-gated Fetch/auth. Reference only; not reviewed.
