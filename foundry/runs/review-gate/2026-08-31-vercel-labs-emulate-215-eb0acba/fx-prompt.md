Review external PR vercel-labs/emulate#215 read-only at frozen head eb0acba6ea8852a77d0176bb68188161914b0267 against base e4d665715f2b6ccdd28dc3f1dccd2be5ea223caa.

Repository: /Users/raillyhugo/Programming/vercel/emulate-next

Do not modify files or GitHub. Inspect with absolute paths or git -C only.

High-risk triggers:
- installation-token metadata
- authorization reset
- secret/confidentiality boundary
- adapter cold-start persistence
- durable emulator state

Review the full diff and relevant callers/substrates. Prioritize confirmed correctness, security, confidentiality, reset, atomicity, persistence, cold-start, compatibility, and built-artifact issues. Verify that:
- the inspection endpoint never exposes installation token strings, GitHub App private keys, webhook secrets, or other secret material
- reset clears minted installation authorization and inspection metadata while preserving seeded tokens and App identity
- durable Next/Nuxt snapshots restore metadata and authorization consistently
- legacy snapshots remain compatible without fabricating metadata
- a successful mint has consistent metadata and authorization commit behavior
- docs match behavior

Return concise findings ordered by severity with exact file:line evidence. Distinguish confirmed defects from gaps or hardening observations. If no defect is found, say so explicitly and list residual risks.
