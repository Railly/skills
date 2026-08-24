# Railly Skills landing page slices

| # | Slice | Mechanism | Affordances | Demo | Status |
|---|---|---|---|---|---|
| V1 | Evidence frame | B1, B2, B6 | U1, U2, U12, N1, N4, S1, S4 | Release facts and install command render from repository data and can be copied | Complete |
| V2 | Inspectable catalog | B3, B4 | U4-U11, N2-N4, S2-S4 | Search and filters update the visible skill set and shareable URL | Complete |
| V3 | Workflow and finish | B5, B7 | U3, U13, U14, N5, S5 | Workflow trace, responsive theme-aware finish, and source links work as one product surface | Complete |
| V4 | Production delivery | B8 | Production URL | Merged `main` deploys from `www/` and serves `skills.railly.dev` over HTTPS | Pending until deployment |

## Slice boundaries

```mermaid
flowchart LR
  subgraph V1["V1: Evidence frame"]
    Source["Repository registry"] --> Hero["Release + install"]
    Source --> Key["Evidence key"]
  end
  subgraph V2["V2: Inspectable catalog"]
    Filters["URL-backed filters"] --> Cards["Skill evidence rows"]
    Cards --> Copy["Per-skill install"]
  end
  subgraph V3["V3: Workflow and finish"]
    Flow["Workflow trace"] --> Surface["Responsive accessible surface"]
    Surface --> GitHub["Source links"]
  end
  subgraph V4["V4: Production delivery"]
    Main["Merged main"] --> Vercel["Vercel root: www"]
    Vercel --> Domain["skills.railly.dev"]
  end
  V1 --> V2 --> V3 --> V4

  style V1 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
  style V2 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
  style V3 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
  style V4 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
```
