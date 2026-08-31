# Vercel Desktop CLI runtime resolution: Big Picture

**Selected shape:** A, direct CLI execution with a deterministic runtime-inclusive PATH

## Frame

### Problem

- Vercel Desktop accepts an executable Vercel CLI file without proving that Finder-launched macOS can execute its interpreter.
- A Bun-installed CLI using `#!/usr/bin/env node` fails with status `127` when Node exists only under NVM.
- The app collapses that launch failure into `.signedOut` and tells an already-authenticated user to log in.

### Outcome

- Common PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, and NVM installations can be executed from a graphical app environment.
- Missing, unusable, signed-out, ready, and later API failure remain distinct.
- Onboarding and every later command use one validated launch plan without shell-profile execution or persistent resolver state.

## Shape

### Fit check: R × A

| Req | Requirement | Status | A |
|---|---|---|:---:|
| R0 | If a supported Vercel CLI and its required runtime are installed in a common user-level macOS layout, Vercel Desktop can execute the CLI from a normal Finder/LaunchServices environment. | Core goal | ✅ |
| R1 | An authenticated CLI is recognized as authenticated without requiring relogin or user-created symlinks. | Must-have | ✅ |
| R2 | CLI absence, unusable CLI installation/runtime, signed-out CLI, and authenticated-session/API failure remain distinguishable in product state and UI guidance. | Must-have | ✅ |
| R3 | Runtime discovery is deterministic, bounded, and independent of interactive or user shell startup files. | Must-have | ✅ |
| R4 | The selected CLI and runtime pairing is validated by actual execution, not file existence alone. | Must-have | ✅ |
| R5 | A broken higher-priority candidate does not hide a later usable candidate. | Must-have | ✅ |
| R6 | Current working PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, and NVM layouts preserve their existing behavior. | Must-not-change | ✅ |
| R7 | Every Vercel CLI command in the app uses the same resolved executable/runtime environment as onboarding. | Must-have | ✅ |
| R8 | Resolution and authentication checks do not invoke shell profiles, prompt plugins, package-manager activation hooks, or network installation. | Must-have | ✅ |
| R9 | Paths containing spaces and symlinked CLI entrypoints are launched without shell-string interpolation. | Must-have | ✅ |
| R10 | On failure, diagnostics retain the attempted executable, launch category, exit status, and sanitized stderr needed for actionable UI and support. | Must-have | ✅ |
| R11 | Resolution does not mutate the user's filesystem, PATH, shell configuration, CLI authentication, or installed runtimes. | Must-not-change | ✅ |
| R12 | Unit tests can cover candidate ordering, runtime pairing, retry, and state classification without depending on the developer's machine. | Must-have | ✅ |
| R13 | At least one packaged-app or sanitized-environment integration test proves the shipped process boundary against a script using `#!/usr/bin/env node`. | Must-have | ✅ |
| R14 | Existing successful CLI commands retain current arguments, noninteractive behavior, timeout behavior, output capture, and working directory. | Must-not-change | ✅ |
| R15 | The fix remains scoped to Vercel CLI discovery/execution and onboarding diagnostics; it does not become a general shell-environment emulation system. | Must-have | ✅ |
| R16 | Any cached launch plan is in-process derived state, is cleared by Recheck, is invalidated after a launch failure, permits one bounded re-resolution, and does not survive app restart. | Derived must-have | ✅ |

### Parts

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Preserve ordered CLI candidates and compose one bounded, normalized, deduplicated runtime-inclusive PATH. | |
| A2 | Store executable plus environment as `LaunchPlan`; launch the CLI URL directly with argument arrays. | |
| A3 | Validate candidates in order with status/output inspection and retry later candidates after unusable results. | |
| A4 | Use a controlled `--version` launchability probe, then structured `whoami` authentication classification. | |
| A5 | Cache only in process; clear on Recheck and invalidate after launch-level failure. | |
| A6 | Route every `VercelCLI.run` consumer through the selected plan while preserving command contracts. | |
| A7 | Add `.unusable` and structured bounded sanitized diagnostics. | |
| A8 | Add injected unit coverage and a hermetic sanitized-environment process-boundary test. | |

### Breadboard

```mermaid
flowchart TB
    subgraph P1["P1: Onboarding requirements"]
        U2["U2: Install CLI"]
        U3["U3: Fix CLI runtime"]
        U4["U4: Log in"]
        U5["U5: Failed check"]
        U6["U6: Recheck"]
        N3["N3: boot / poll"]
        N11["N11: state mapper"]
        S2["S2: cliState"]
    end

    subgraph P2["P2: Onboarding scopes"]
        U8["U8: Scope chooser"]
    end

    subgraph P3["P3: Running desktop app"]
        U9["U9: Existing CLI-backed UI"]
        N12["N12: VercelCLI.run"]
    end

    subgraph P4["P4: CLI process boundary"]
        N2["N2: invalidate"]
        N4["N4: resolve"]
        N5["N5: candidates"]
        N6["N6: compose PATH"]
        N7["N7: controlled --version"]
        N8["N8: ProcessRunner.run"]
        N9["N9: cache plan"]
        N10["N10: whoami"]
        N13["N13: get plan or resolve"]
        N15["N15: launch-failure handler"]
        S1["S1: LaunchPlanStore"]
    end

    U6 --> N2
    U6 --> N3
    N2 --> S1
    N3 --> N4
    N4 --> N5
    N4 --> N6
    N4 --> N7
    N7 --> N8
    N4 --> N9
    N9 --> S1
    N4 -.-> N10
    N10 --> N8
    N10 --> N11
    N11 --> S2
    S2 -.-> U2
    S2 -.-> U3
    S2 -.-> U4
    S2 -.-> U5
    N11 --> P2
    U9 --> N12
    N12 --> N13
    N13 --> S1
    N13 --> N4
    N12 --> N8
    N12 --> N15
    N15 --> N2
    N15 --> N4

    classDef ui fill:#ffb6c1,stroke:#d87093,color:#000
    classDef nonui fill:#d3d3d3,stroke:#808080,color:#000
    classDef store fill:#e6e6fa,stroke:#9370db,color:#000
    class U2,U3,U4,U5,U6,U8,U9 ui
    class N2,N3,N4,N5,N6,N7,N8,N9,N10,N11,N12,N13,N15 nonui
    class S1,S2 store
```

Legend:

- Pink nodes are user-visible affordances.
- Grey nodes are code affordances.
- Purple nodes are stores.
- Solid arrows are calls or writes. Dashed arrows are returned data.

## Slices

```mermaid
flowchart LR
    subgraph V1["V1: Finder launch works"]
        A1["Candidates + PATH"] --> A2["Controlled --version"] --> A3["Authenticated whoami"]
    end
    subgraph V2["V2: Accurate recovery"]
        B1["Retry candidates"] --> B2["Distinct state"] --> B3["Safe diagnostics"]
    end
    subgraph V3["V3: Shared lifecycle"]
        C1["Shared plan"] --> C2["Recheck invalidation"] --> C3["No command replay"]
    end
    V1 --> V2 --> V3

    style V1 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style V2 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style V3 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
```

|  |  |  |
|:--|:--|:--|
| **[V1: Finder launch works](./v1-plan.md)**<br>⏳ PENDING<br><br>• Bounded composed PATH<br>• Direct process launch<br>• Controlled version probe<br>• Authenticated whoami<br><br>*Demo: Finder-like onboarding reaches scopes* | **[V2: Accurate recovery](./v2-plan.md)**<br>⏳ PENDING<br><br>• Candidate retry<br>• `.unusable` state<br>• Runtime guidance<br>• Sanitized diagnostics<br><br>*Demo: Broken runtime is not reported as signed out* | **[V3: Shared lifecycle](./v3-plan.md)**<br>⏳ PENDING<br><br>• Every command reuses plan<br>• Recheck invalidates<br>• One bounded re-resolution<br>• No mutating command replay<br><br>*Demo: Onboarding and service action use identical plan* |
