# Slices

| # | Slice | Mechanism | Demo |
|---|---|---|---|
| V1 | CLI-owned coding-agent setup | E1-E5 | Review detected CLI changes, confirm, and apply without a Desktop agent ID. |
| V2 | Native fx status and OAuth entry | E6-E7 | Distinguish signed-out, expired, Gateway-connected, and direct-provider fx, then open login in Terminal. |
| V3 | Safe fx install entry | E8 | Confirm and open a pinned checksum-verified install in Terminal without editing shell rc files. |

Each slice is independently testable. They ship together because the requested product outcome is one integrations update, but no slice changes Gateway reporting or IAM.
