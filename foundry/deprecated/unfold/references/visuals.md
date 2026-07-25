# Visual selection

Use this reference when more than one diagram type seems plausible.

## Architecture Map

Use for stable topology: components, state stores, contracts, external systems, and ownership boundaries.

```mermaid
flowchart LR
  CLI[CLI Router] --> Store[(Route Store)]
  Proxy[Proxy Daemon] --> Store
  Proxy --> App[Local App]
```

The edges mean structural dependency or communication, not necessarily temporal order.

## Flow Trace

Use for one operation when the main question is how data or control reaches an outcome.

```mermaid
flowchart LR
  Command[User command] --> Parse[CLI parses flags]
  Parse --> Register[Register route]
  Register --> Spawn[Spawn app]
```

Add a decision diamond when alternatives matter. Split the diagram when branches make edges cross.

## Sequence Diagram

Use when timing, actor ownership, or request/response order is the point. Include only participants active in the same concrete scenario.

```mermaid
sequenceDiagram
  actor User
  participant CLI
  participant Store as Route Store
  participant App
  User->>CLI: run myapp
  CLI->>Store: add hostname and port
  CLI->>App: spawn with PORT
  App-->>CLI: ready
```

Give setup, manual repair, and per-request runtime separate sequences or lifecycle lanes even when they share a component.

## Lifecycle Map

Use separate lanes for independent phases.

```mermaid
flowchart TB
  subgraph Setup
    Start[Proxy start] --> Ensure[Ensure certificates]
  end
  subgraph Repair
    Trust[portless trust] --> Install[Install CA]
  end
  subgraph PerApp[Per app launch]
    Run[runApp] --> Child[Child process receives CA path]
  end
```

## State Map

Use for ownership, mutation, invalidation, persistence, and rehydration. Name both the mutator and the state.

```mermaid
stateDiagram-v2
  [*] --> Missing
  Missing --> Persisted: CLI adds route
  Persisted --> Cached: daemon reloads
  Cached --> Removed: owner exits
```

## Contract Map

Use when the important insight is what crosses a boundary. Label payloads, invariants, errors, and consumers. Avoid turning a contract map into a call graph.

## Failure Map

Start at the observed symptom and work backward through falsifiable hypotheses. Mark proven edges as evidence and unproven edges as inference in the surrounding explanation.

## Change Surface

Show the smallest set of contracts, state, callers, implementations, tests, and docs that a proposed change touches. A file belongs only when its responsibility or dependency justifies it.
