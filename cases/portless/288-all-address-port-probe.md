# 288: free-port probe missed listeners on specific addresses

- PR: vercel-labs/portless#447 (recreates #441 by @Knat-Dev, builds on #302 by @EfeDurmaz16; both credited). Head 47e2cc9.
- Gate run: `foundry/runs/review-gate/2026-10-01-portless-441/` (pass, cross-family FX review, forced-failure Resilience receipt).

## Defect
`findFreePort` bound hostless. On macOS that succeeds while 127.0.0.1, ::1 or 0.0.0.0 already holds the port, so an occupied port was assigned and the proxy dialed the old listener.

## Fix
Probe each candidate on 127.0.0.1, ::1, 0.0.0.0, :: sequentially. EADDRNOTAVAIL/EAFNOSUPPORT mean the family is absent, not busy.

## Evidence
- Built CLI holding 4000-4999 per address: main assigned a port for three of four; fix refused all four.
- CI run 36934544913: ubuntu with IPv6 disabled (EADDRNOTAVAIL) still found a free port; linux and windows green.

## Lesson
A unit test for an OS-level probe is platform-shaped: on Linux the old dual-stack bind already caught IPv4 holders, so the regression only shows on macOS. Verify an absent-family branch on a host that actually lacks the family. Supersedes the narrower 127.0.0.1-only probe in [288-downstream-address](288-downstream-address.md).
