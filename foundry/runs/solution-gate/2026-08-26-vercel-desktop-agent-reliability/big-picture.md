# Coding-agent reliability: Big Picture

**Selected shape:** G, CLI-owned merge with truthful Desktop compatibility

## Frame

### Problem

- One managed shell block is shared by several agents, but per-agent CLI previews regenerate its lines in selection order and compare full text.
- Vercel Desktop maps that order-only shared update to a red agent row.
- Fixing one row can therefore make a peer look broken after recheck or relaunch.

### Outcome

- Stable, truthful row status across repeated checks, repairs, and relaunches.
- One repair preserves peers and produces no second effective change.
- CLI remains the configuration and credential authority.

## Shape

### Fit check

| Req | Requirement | Status | G |
|---|---|---|---|
| R0 | Repeated checks without external change are stable. | Core goal | ✅ |
| R1 | Repairing one agent cannot make a configured peer require repair. | Must-have | ✅ |
| R2 | Relaunch cannot change effective configuration or status. | Must-have | ✅ |
| R3 | Green means the required current configuration is usable. | Must-have | ✅ |
| R4 | Red is a row-owned actionable defect. | Must-have | ✅ |
| R5 | Credential and Keychain guarantees remain. | Must-have | ✅ |
| R6 | Supported agents and working files remain preserved. | Must-have | ✅ |
| R7 | Standalone CLI configures one or several selected agents. | Must-have | ✅ |
| R8 | Omission preserves peer exports. | Must-have | ✅ |
| R9 | Repair is idempotent. | Must-have | ✅ |
| R10 | Order-only differences never become row failures. | Derived | ✅ |

### Parts

| Part | Mechanism | Flag |
|---|---|:---:|
| G1-G3 | Ownership-aware in-place CLI merge, ambiguity guard, and byte-equality no-write gate. | |
| G4-G5 | Explicit CLI capability in setup JSON and one truthful Desktop legacy-CLI compatibility state. | |
| G6 | CLI labels warning ownership and whether it blocks configuration; Desktop renders advisories separately and only blocking row-owned warnings can make red. | |
| G7 | One Desktop CLI-agent repair at a time, followed by explicit supported-row refresh. | |
| G8 | Temporal tests cover both peer orders, permutations, repeated apply, malformed variants, and reconstructed Desktop state. | |

### Breadboard

See [detail-g.md](./detail-g.md) for complete tables and wiring.

## Slices

| # | Slice | Observable demo |
|---|---|---|
| V1 | CLI stable shared block | CLI stdout stays unchanged across peer orders and repeated apply leaves hash/mtime stable. |
| V2 | Desktop truthful compatibility | Legacy CLI shows one update message; capable CLI shows truthful rows and separate advisories after reconstruction. |
| V3 | Repair refresh continuity | One Fix serializes the shared write, refreshes explicit supported rows, and never calls `--all`. |

See [slices.md](./slices.md) for slice affordances and acceptance.
