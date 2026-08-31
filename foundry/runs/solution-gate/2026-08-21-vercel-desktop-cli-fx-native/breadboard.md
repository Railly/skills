# Breadboard

## Places

| # | Place | Description |
|---|---|---|
| P1 | Settings | Account-scoped Desktop settings. |
| P2 | Coding-agent review dialog | Blocking preview and confirmation. |
| P3 | fx install dialog | Blocking install disclosure. |
| P4 | Terminal | Visible owner of fx install and OAuth. |

## UI affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U1 | P1 | Coding Agents card | Review Setup | click | N1 | |
| U2 | P2 | Review dialog | CLI plan | render | | N2 |
| U3 | P2 | Review dialog | Apply | click | N3 | |
| U4 | P2 | Review dialog | Retry or Cancel | click | N1 or P1 | |
| U5 | P1 | fx card | status and team/provider | render | | N6 |
| U6 | P1 | fx card | Sign In or Sign In Again | click | N7 | |
| U7 | P1 | fx card | Install fx | click | P3 | |
| U8 | P3 | fx install dialog | Open Terminal | click | N8 | |
| U9 | P1 | fx card | Check Again | click | N5 | |

## Code affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| N1 | P1 | app | start agentless CLI dry-run | call | N2 | |
| N2 | P2 | parser | validate and format machine plan | exit | P2 | U2 |
| N3 | P2 | app | start agentless CLI apply | call | N4 | |
| N4 | P2 | app | validate success, persist association | exit | P1 | U1 |
| N5 | P1 | app | run `fx status --json` | call | N6 | |
| N6 | P1 | parser | classify fx status | exit | | U5 |
| N7 | P1 | app | open Terminal with `fx login` | call | P4 | |
| N8 | P3 | app | open Terminal with pinned verified installer | call | P4 | |

## Data stores

| # | Place | Store | Description |
|---|---|---|---|
| S1 | P2 | agent preview buffer | Whitelisted human-readable plan, never raw output. |
| S2 | P1 | agents key association | Existing persisted key ID, replaced only after apply success. |
| S3 | P1 | fx status fields | Ephemeral state, provider label, and team. |
