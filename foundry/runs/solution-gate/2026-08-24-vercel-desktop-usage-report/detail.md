# Detail H: usage-report migration

## Places

| # | Place | Description |
|---|---|---|
| P1 | Desktop spend surface | Menu and settings views showing managed-key usage. |
| P2 | Vercel session transport | CLI-owned or OAuth-owned authorized request execution. |
| P3 | Reporting state | Parser, window derivation, generation guard and last-good persistence. |

## UI affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U1 | P1 | overview | Today spend, requests and tokens | render | → N7 | — |
| U2 | P1 | ranges | 7-day and 30-day totals and charts | render | → N7 | — |
| U3 | P1 | models | model rows | render | → N7 | — |
| U4 | P1 | top spenders | team key ranking | render | → N8 | — |
| U5 | P1 | overview | stale indicator | render | → S4 | — |

## Code affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| N1 | P3 | report dispatcher | build 30-day key-filtered path and generation target | call | → N2 or N3, → N4, → N8 | — |
| N2 | P2 | CLI adapter | `vercel api <path> --raw --scope <slug>` | spawn | → N5 | → N1 |
| N3 | P2 | OAuth adapter | fetch `api.vercel.com` with access token | fetch | → N5 | → N1 |
| N4 | P3 | hourly decoration | legacy key-authenticated Today request | fetch | → N6 | → N1 |
| N5 | P3 | usage-report parser | validate totals and daily rows | parse | → N7 | — |
| N6 | P3 | hourly parser | extract chart buckets only | parse | → N7 | — |
| N7 | P3 | report publisher | verify generation and key target, derive windows, atomically replace last-good state | transition | → S1, S2, S3, S4 | → U1, U2, U3, U5 |
| N8 | P3 | top-spender path | unchanged team legacy request and parser | fetch | → S5 | → U4 |
| N9 | P2 | OAuth refresh | retry one failed usage-report request after token refresh | transition | → N3 | — |

## Stores

| # | Place | Store | Description |
|---|---|---|---|
| S1 | P3 | report target | durable `keyId` plus generation. |
| S2 | P3 | last-good report | Today, week, month metrics and UTC daily buckets. |
| S3 | P3 | model breakdown cache | unchanged range-specific model rows. |
| S4 | P3 | freshness | last-good timestamp and stale state. |
| S5 | P3 | top-spender cache | unchanged team ranking. |

## Slices

| Slice | Observable outcome | Scope | Validation |
|---|---|---|---|
| V1 | Both auth modes obtain and parse one managed-key 30-day snapshot. | N1, N2, N3, N5 | transport fixtures, optional-field and empty-report tests. |
| V2 | Today, week, month and models publish atomically without losing last-good state. | N7, S1-S4 | derivation, stale, out-of-order and key-switch tests. |
| V3 | Hourly chart and top spenders remain compatible decoration. | N4, N6, N8, S5 | legacy request and failure-isolation tests. |
